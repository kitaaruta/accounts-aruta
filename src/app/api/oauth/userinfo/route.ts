import { NextRequest, NextResponse } from 'next/server';
import { verifySSOAccessToken } from '@/lib/auth/jwt';
import { getUserProfile } from '@/lib/services/firestore-service';

export const runtime = 'nodejs';

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

async function handleUserInfo(request: NextRequest) {
  let token: string | null = null;

  // 1. Authorization: Bearer <token>
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  // 2. Query param ?access_token=<token> fallback (RFC 6750)
  if (!token) {
    const { searchParams } = new URL(request.url);
    token = searchParams.get('access_token');
  }

  if (!token) {
    return NextResponse.json(
      { error: 'unauthorized', error_description: 'Bearer access token is missing or malformed' },
      { status: 401 }
    );
  }

  const payload = await verifySSOAccessToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'invalid_token', error_description: 'The access token is invalid or expired' },
      { status: 401 }
    );
  }

  // Fetch full user details from Firestore service if available
  const userProfile = await getUserProfile(payload.uid);

  const displayName = userProfile?.displayName || payload.displayName || 'Pengguna Aruta';
  const username = userProfile?.username || (payload.username as string) || payload.email?.split('@')[0] || payload.uid;
  const role = userProfile?.role || payload.role || 'Member';
  const emailVerified = userProfile?.emailVerified ?? true;

  // Standard OpenID Connect (OIDC) + Aruta Profile claims
  const userData = {
    sub: payload.uid,
    id: payload.uid,
    uid: payload.uid,
    name: displayName,
    displayName: displayName,
    preferred_username: username,
    username: username,
    email: payload.email,
    email_verified: emailVerified,
    emailVerified: emailVerified,
    role: role,
    status: userProfile?.status || 'active',
    company: userProfile?.company || '',
    title: userProfile?.title || '',
    aud: payload.clientId,
  };

  return NextResponse.json(userData, { status: 200 });
}

export async function GET(request: NextRequest) {
  return handleUserInfo(request);
}

export async function POST(request: NextRequest) {
  return handleUserInfo(request);
}
