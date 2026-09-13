import { NextRequest, NextResponse } from 'next/server';
import { getAppByClientId } from '@/lib/services/firestore-service';
import { createAuthorizationCode } from '@/lib/auth/jwt';

export const runtime = 'nodejs';

// Store authorization codes in memory for the edge/serverless runtime lifecycle
const codeStore = new Map<string, {
  code: string;
  clientId: string;
  userId: string;
  userEmail: string;
  userName: string;
  userRole: string;
  redirectUri: string;
  expiresAt: number;
}>();

export function getStoredAuthCode(code: string) {
  const item = codeStore.get(code);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    codeStore.delete(code);
    return null;
  }
  return item;
}

export function consumeStoredAuthCode(code: string) {
  const item = getStoredAuthCode(code);
  if (item) codeStore.delete(code);
  return item;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const clientId = searchParams.get('client_id');
  const redirectUri = searchParams.get('redirect_uri');
  const state = searchParams.get('state') || '';
  const scope = searchParams.get('scope') || 'openid profile email';

  const formatParam = searchParams.get('response_mode') || searchParams.get('format');
  const acceptHeader = request.headers.get('accept') || '';
  const wantsJson = (formatParam === 'json') || (acceptHeader.includes('application/json') && !acceptHeader.includes('text/html'));

  function handleOAuthError(error: string, errorDescription: string, status = 400) {
    if (wantsJson) {
      return NextResponse.json({ error, error_description: errorDescription }, { status });
    }

    const errorUrl = new URL('/oauth/error', request.url);
    errorUrl.searchParams.set('error', error);
    errorUrl.searchParams.set('error_description', errorDescription);
    if (clientId) errorUrl.searchParams.set('client_id', clientId);
    if (redirectUri) errorUrl.searchParams.set('redirect_uri', redirectUri);
    const display = searchParams.get('display');
    if (display) errorUrl.searchParams.set('display', display);

    return NextResponse.redirect(errorUrl.toString());
  }

  if (!clientId || !redirectUri) {
    return handleOAuthError(
      'invalid_request',
      'Parameter client_id dan redirect_uri wajib disertakan dalam permintaan otorisasi',
      400
    );
  }

  // Check client application in registered apps
  const app = await getAppByClientId(clientId);
  if (!app || !app.isActive) {
    return handleOAuthError(
      'unauthorized_client',
      'Aplikasi klien tidak terdaftar di SSO Aruta atau sedang dinonaktifkan',
      401
    );
  }

  // Verify redirect URI matches registered whitelist
  const isAllowedUri = app.redirectUris.some((uri) =>
    redirectUri.startsWith(uri) || uri.startsWith(redirectUri) || redirectUri.includes('localhost')
  );

  if (!isAllowedUri) {
    return handleOAuthError(
      'invalid_grant',
      'URL pengalihan (redirect_uri) tidak terdaftar di daftar aman (whitelist) aplikasi ini',
      400
    );
  }

  // Check if consent has already been granted by the user
  const consentApproved = searchParams.get('consent_approved');
  const userId = searchParams.get('user_id');
  const userEmail = searchParams.get('user_email');
  const userName = searchParams.get('user_name');
  const userRole = searchParams.get('user_role');

  if (consentApproved !== 'true' || !userId) {
    // Redirect browser to interactive Consent Screen
    const consentUrl = new URL('/oauth/consent', request.url);
    searchParams.forEach((val, key) => consentUrl.searchParams.set(key, val));
    return NextResponse.redirect(consentUrl.toString());
  }

  // Generate cryptographically signed stateless authorization code (valid across all serverless isolates)
  const code = await createAuthorizationCode({
    clientId,
    userId,
    userEmail: userEmail || '',
    userName: userName || 'User',
    userRole: userRole || 'Member',
    redirectUri,
  });

  // Also store in memory for same-isolate fallback
  codeStore.set(code, {
    code,
    clientId,
    userId,
    userEmail: userEmail || '',
    userName: userName || 'User',
    userRole: userRole || 'Member',
    redirectUri,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  // Construct callback URL
  const callbackUrl = new URL(redirectUri);
  callbackUrl.searchParams.set('code', code);
  if (state) callbackUrl.searchParams.set('state', state);

  const responseMode = searchParams.get('response_mode');
  if (responseMode === 'json' || request.headers.get('accept')?.includes('application/json')) {
    return NextResponse.json({
      success: true,
      code,
      state: state || null,
      redirect_uri: callbackUrl.toString(),
    });
  }

  return NextResponse.redirect(callbackUrl.toString());
}
