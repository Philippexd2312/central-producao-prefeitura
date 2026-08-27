import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/session';

const PRODUCTION_DOMAIN = 'central-producao-prefeitura-production.up.railway.app';

function publicOrigin(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  const proto = forwardedProto || 'https';

  if (host && !/^localhost(?::|$)/i.test(host) && !/^127\.0\.0\.1(?::|$)/i.test(host)) {
    return `${proto}://${host}`;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return `https://${PRODUCTION_DOMAIN}`;
}

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL('/login', publicOrigin(request)), 303);
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}
