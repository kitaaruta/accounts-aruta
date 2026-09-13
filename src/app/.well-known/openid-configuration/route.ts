import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Dynamically determine issuer base URL from request or environment
  const origin = request.nextUrl.origin || `https://${request.headers.get('host') || 'accounts.aruta.id'}`;

  const openidConfig = {
    issuer: origin,
    authorization_endpoint: `${origin}/api/oauth/authorize`,
    token_endpoint: `${origin}/api/oauth/token`,
    userinfo_endpoint: `${origin}/api/oauth/userinfo`,
    revocation_endpoint: `${origin}/api/oauth/revoke`,
    jwks_uri: `${origin}/.well-known/jwks.json`,
    response_types_supported: ['code'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['HS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    claims_supported: [
      'sub',
      'name',
      'username',
      'email',
      'email_verified',
      'role',
      'avatar',
      'picture',
      'updated_at',
    ],
    code_challenge_methods_supported: ['S256', 'plain'],
    service_documentation: `${origin}/docs`,
  };

  return NextResponse.json(openidConfig, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
