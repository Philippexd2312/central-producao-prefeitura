import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';

export const SESSION_COOKIE = 'central_session';
const SESSION_DAYS = 7;

type SessionPayload = {
  userId: string;
  role: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV !== 'production') return 'central-producao-dev-secret-change-me';
  return null;
}

function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url');
}

export function createSessionToken(userId: string, role: string) {
  const secret = getSecret();
  if (!secret) throw new Error('AUTH_SECRET não configurado.');
  const payload: SessionPayload = {
    userId,
    role,
    exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function readSessionToken(token?: string | null): SessionPayload | null {
  const secret = getSecret();
  if (!secret || !token) return null;
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = Buffer.from(sign(body, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.userId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const store = await cookies();
  const payload = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return db.user.findFirst({
    where: { id: payload.userId, active: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      availability: true,
      active: true,
    },
  });
}

export function isManagerRole(role?: string | null) {
  return role === 'ADMIN' || role === 'MANAGER';
}

export function authEnforced() {
  return Boolean(getSecret());
}
