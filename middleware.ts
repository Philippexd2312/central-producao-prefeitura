import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'central_session';
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/webhooks/whatsapp'];

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - normalized.length % 4) % 4);
  const binary = atob(normalized + padding);
  const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
  return toArrayBuffer(bytes);
}

function continueRequest(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-central-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

async function isValidToken(token: string, secret: string) {
  const [body, signature] = token.split('.');
  if (!body || !signature) return false;

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(encoder.encode(secret)),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    const valid = await crypto.subtle.verify(
      'HMAC',
      key,
      decodeBase64Url(signature),
      toArrayBuffer(encoder.encode(body)),
    );
    if (!valid) return false;

    const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(body)));
    return Boolean(payload?.userId && payload?.exp && payload.exp > Date.now());
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const secret = process.env.AUTH_SECRET || process.env.SESSION_SECRET;
  const pathname = request.nextUrl.pathname;

  if (PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
    return continueRequest(request);
  }

  if (!secret) return continueRequest(request);

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (token && await isValidToken(token, secret)) return continueRequest(request);

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = '/login';
  loginUrl.search = '';
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
