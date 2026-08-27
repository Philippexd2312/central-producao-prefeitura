'use client';

import { useEffect } from 'react';

const RECOVERY_KEY = 'central_client_recovery_at';

function messageFrom(value: unknown) {
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  if (typeof value === 'string') return value;
  try { return JSON.stringify(value); } catch { return String(value ?? ''); }
}

function isStaleBundleError(value: unknown) {
  const text = messageFrom(value);
  return /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Failed to load module script|Importing a module script failed|module script.*MIME|Unexpected token\s*[<'"]|Cannot find module.*_next/i.test(text);
}

function recoverOnce() {
  try {
    const now = Date.now();
    const last = Number(sessionStorage.getItem(RECOVERY_KEY) || 0);
    if (last && now - last < 20000) return;
    sessionStorage.setItem(RECOVERY_KEY, String(now));
    window.location.reload();
  } catch {
    window.location.reload();
  }
}

export function recoverClientBundle(error: unknown) {
  if (typeof window === 'undefined' || !isStaleBundleError(error)) return false;
  recoverOnce();
  return true;
}

export default function ClientRecovery() {
  useEffect(() => {
    const clearTimer = window.setTimeout(() => {
      try { sessionStorage.removeItem(RECOVERY_KEY); } catch {}
    }, 12000);

    const onError = (event: ErrorEvent) => {
      recoverClientBundle(event.error || event.message);
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      recoverClientBundle(event.reason);
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection);
    };
  }, []);

  return null;
}
