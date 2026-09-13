import { NextRequest, NextResponse } from 'next/server';
import { getAppByClientId, getUserProfile } from '@/lib/services/firestore-service';
import { 
  createSSOAccessToken, 
  createSSOIdToken, 
  verifyAuthorizationCode, 
  AuthCodeData 
} from '@/lib/auth/jwt';
import { consumeStoredAuthCode } from '../authorize/route';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        body = await request.json();
      } catch (err) {
        console.warn('Failed to parse JSON body:', err);
      }
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      try {
        const formData = await request.formData();
        formData.forEach((val, key) => {
          body[key] = val.toString();
        });
      } catch (err) {
        console.warn('Failed to parse form data:', err);
      }
    } else {
      // Fallback: try raw text
      try {
        const rawText = await request.text();
        if (rawText) {
          try {
            body = JSON.parse(rawText);
          } catch {
            const params = new URLSearchParams(rawText);
            params.forEach((val, key) => {
              body[key] = val;
            });
          }
        }
      } catch {}
    }

    // Also extract from query parameters just in case client sent via GET-style query
    const { searchParams } = new URL(request.url);
    searchParams.forEach((val, key) => {
      if (!body[key]) body[key] = val;
    });

    let { grant_type, code, client_id, client_secret, redirect_uri } = body;

    // Check HTTP Basic Auth header: Authorization: Basic <base64(client_id:client_secret)>
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      try {
        const credentials = atob(authHeader.substring(6));
        const [basicId, basicSecret] = credentials.split(':');
        if (basicId && !client_id) client_id = basicId;
        if (basicSecret && !client_secret) client_secret = basicSecret;
      } catch (err) {
        console.warn('Failed to parse Basic Auth header:', err);
      }
    }

    if (!client_id || !code) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'client_id and code are required' },
        { status: 400 }
      );
    }

    // Verify registered client app in Firestore
    const app = await getAppByClientId(client_id);
    if (!app) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Registered app not found or inactive' },
        { status: 401 }
      );
    }

    // Validate client secret if configured on the registered app
    if (app.clientSecret && client_secret && app.clientSecret.trim() !== client_secret.trim()) {
      return NextResponse.json(
        { error: 'invalid_client', error_description: 'Invalid client_secret' },
        { status: 401 }
      );
    }

    let authData: AuthCodeData | null = null;

    // 1. Interactive Playground / Docs Simulation code support
    if (code.startsWith('sso_code_simulation_')) {
      authData = {
        clientId: client_id,
        userId: 'usr_simulation_demo',
        userEmail: 'demo@aruta.id',
        userName: 'Pengembang Aruta Demo',
        userRole: 'Member',
        redirectUri: redirect_uri || 'https://aruta.id/auth/callback',
      };
    }

    // 2. Stateless cryptographically signed authorization code (Edge / Serverless runtime)
    if (!authData) {
      authData = await verifyAuthorizationCode(code, client_id);
    }

    // 3. Fallback to in-memory codeStore (for same-isolate requests)
    if (!authData) {
      const storedCode = consumeStoredAuthCode(code);
      if (storedCode && storedCode.clientId === client_id) {
        authData = {
          clientId: storedCode.clientId,
          userId: storedCode.userId,
          userEmail: storedCode.userEmail,
          userName: storedCode.userName,
          userRole: storedCode.userRole,
          redirectUri: storedCode.redirectUri,
        };
      }
    }

    if (!authData) {
      return NextResponse.json(
        { error: 'invalid_grant', error_description: 'Authorization code is invalid or has expired' },
        { status: 400 }
      );
    }

    const uid = authData.userId;
    const email = authData.userEmail;
    const role = authData.userRole;

    // Fetch freshest user profile details
    const userProfile = await getUserProfile(uid);
    const displayName = userProfile?.displayName || authData.userName || 'User';
    const username = userProfile?.username || email.split('@')[0] || uid;

    const tokenPayload = {
      uid,
      sub: uid,
      email,
      displayName,
      username,
      role: userProfile?.role || role,
      clientId: client_id,
      scope: 'openid profile email',
    };

    // Generate JWT Access Token and OpenID Connect ID Token
    const [accessToken, idToken] = await Promise.all([
      createSSOAccessToken(tokenPayload, '24h'),
      createSSOIdToken(tokenPayload, '24h'),
    ]);

    const userPayload = {
      sub: uid,
      id: uid,
      uid,
      email,
      name: displayName,
      displayName,
      preferred_username: username,
      username,
      role: userProfile?.role || role,
      status: userProfile?.status || 'active',
      company: userProfile?.company || '',
      title: userProfile?.title || '',
    };

    return NextResponse.json({
      access_token: accessToken,
      token: accessToken,
      id_token: idToken,
      token_type: 'Bearer',
      expires_in: 86400, // 24 hours
      scope: 'openid profile email',
      user: userPayload,
      data: userPayload,
    }, { status: 200 });
  } catch (error) {
    console.error('OAuth token exchange error:', error);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Internal SSO token exchange failure' },
      { status: 500 }
    );
  }
}
