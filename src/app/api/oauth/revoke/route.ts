import { NextRequest, NextResponse } from 'next/server';
import { getAppByClientId, logSSOEvent } from '@/lib/services/firestore-service';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, string> = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      formData.forEach((val, key) => {
        body[key] = val.toString();
      });
    }

    // Client credentials can be sent in body or Authorization: Basic header
    let clientId = body.client_id;
    let clientSecret = body.client_secret;

    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Basic ')) {
      const creds = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8').split(':');
      if (creds.length === 2) {
        clientId = creds[0];
        clientSecret = creds[1];
      }
    }

    const token = body.token;
    const tokenTypeHint = body.token_type_hint || 'access_token';

    if (!token) {
      return NextResponse.json(
        { error: 'invalid_request', error_description: 'Parameter "token" is required' },
        { status: 400 }
      );
    }

    // Validate client if provided
    if (clientId) {
      const app = await getAppByClientId(clientId);
      if (app && clientSecret && app.clientSecret !== clientSecret) {
        return NextResponse.json(
          { error: 'invalid_client', error_description: 'Client secret mismatch' },
          { status: 401 }
        );
      }
    }

    // Log the revocation event
    await logSSOEvent(
      'logout',
      clientId || 'anonymous_client',
      `OAuth Token dicabut (${tokenTypeHint}): ${token.substring(0, 15)}...`,
      'system'
    );

    // RFC 7009: The authorization server responds with HTTP status code 200 if the token has been revoked successfully or if the client submitted an invalid token.
    return NextResponse.json(
      {
        success: true,
        message: 'Token has been revoked successfully',
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'server_error', error_description: error.message || 'Gagal memproses pencabutan token' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
