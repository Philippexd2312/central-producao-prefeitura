import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'Central de Produção da Comunicação',
  description: 'Gestão de demandas de Design, Vídeo e Comunicação',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <header className="topbar">
          <div>
            <strong>COMUNICAÇÃO</strong>
            <span>Central de Produção</span>
          </div>
          <nav>
            <Link href="/">Painel</Link>
            <Link className="primaryLink" href="/demandas/nova">+ Nova demanda</Link>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
