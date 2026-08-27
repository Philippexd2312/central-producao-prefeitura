import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, SESSION_COOKIE, isManagerRole } from '@/lib/session';

function publicOrigin(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || request.headers.get('host');
  const proto = forwardedProto || 'https';

  if (host && !/^localhost(?::|$)/i.test(host)) {
    return `${proto}://${host}`;
  }

  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }

  return new URL(request.url).origin;
}

function redirectTo(request: Request, path: string) {
  const response = NextResponse.redirect(new URL(path, publicOrigin(request)), 303);
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  return response;
}

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return redirectTo(request, '/login?erro=campos');
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return redirectTo(request, '/login?erro=credenciais');
  }

  let token: string;
  try {
    token = createSessionToken(user.id, user.role);
  } catch {
    return redirectTo(request, '/login?erro=config');
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const destination = isManagerRole(user.role) ? '/' : `/equipe/${user.id}`;
  const response = redirectTo(request, destination);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
