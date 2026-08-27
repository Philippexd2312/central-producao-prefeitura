'use client';

import { useEffect } from 'react';
import { recoverClientBundle } from '@/components/ClientRecovery';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('CENTRAL_GLOBAL_ERROR', error);
    recoverClientBundle(error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, fontFamily: 'Arial, Helvetica, sans-serif', background: '#f3f8f5', color: '#10281e' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <section style={{ width: 'min(520px, 100%)', background: '#fff', border: '1px solid #d9e6df', borderRadius: 22, padding: 28, boxShadow: '0 18px 45px rgba(13,55,38,.10)', textAlign: 'center' }}>
            <div style={{ width: 54, height: 54, borderRadius: 16, margin: '0 auto 14px', display: 'grid', placeItems: 'center', background: '#e7f7ef', color: '#118a52', fontSize: 26, fontWeight: 900 }}>C</div>
            <h1 style={{ margin: '0 0 8px', fontSize: 25 }}>Central de Produção</h1>
            <p style={{ margin: '0 0 20px', color: '#6d7f76', lineHeight: 1.5 }}>A interface precisa ser recarregada. Nenhuma demanda foi apagada.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={reset} style={{ border: 0, borderRadius: 12, padding: '12px 18px', background: '#178f57', color: '#fff', fontWeight: 800, cursor: 'pointer' }}>Tentar novamente</button>
              <button onClick={() => window.location.reload()} style={{ border: '1px solid #cbdcd3', borderRadius: 12, padding: '12px 18px', background: '#f7faf8', color: '#143a2b', fontWeight: 800, cursor: 'pointer' }}>Recarregar sistema</button>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
