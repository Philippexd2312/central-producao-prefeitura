import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createSessionToken, SESSION_COOKIE } from '@/lib/session';

export async function POST(request: Request) {
  const form = await request.formData();
  const email = String(form.get('email') || '').trim().toLowerCase();
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return NextResponse.redirect(new URL('/login?erro=campos', request.url), 303);
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.redirect(new URL('/login?erro=credenciais', request.url), 303);
  }

  let token: string;
  try {
    token = createSessionToken(user.id, user.role);
  } catch {
    return NextResponse.redirect(new URL('/login?erro=config', request.url), 303);
  }

  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const response = NextResponse.redirect(new URL('/meu-painel', request.url), 303);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}
