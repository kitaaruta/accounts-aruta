import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  // Aruta SSO currently uses symmetric HS256 JWT tokens.
  // Standard JWKS endpoint returns the active key definitions for compliant OIDC clients.
  return NextResponse.json(
    {
      keys: [],
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
