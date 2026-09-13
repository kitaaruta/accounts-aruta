import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';

  // Handle preflight OPTIONS requests immediately
  if (request.method === 'OPTIONS') {
    const preflightHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
      'Access-Control-Max-Age': '86400',
    };
    if (origin !== '*') {
      preflightHeaders['Access-Control-Allow-Credentials'] = 'true';
    }
    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  const response = NextResponse.next();
  response.headers.set('Access-Control-Allow-Origin', origin === 'null' ? '*' : origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  if (origin !== '*') {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  return response;
}

export const config = {
  matcher: ['/api/oauth/:path*', '/.well-known/:path*'],
};
