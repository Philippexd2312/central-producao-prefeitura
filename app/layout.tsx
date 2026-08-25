import './globals.css';
import './claim.css';
import './demand-workspace.css';
import './team.css';
import './auth.css';
import './reports.css';
import './mobile.css';
import AppChrome from '@/components/AppChrome';
import { getCurrentUser, isManagerRole } from '@/lib/session';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Central de Produção da Comunicação',
  description: 'Gestão de demandas de Design, Vídeo e Comunicação',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b3c29',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get('x-central-pathname') || '/';
  const publicRoute = pathname === '/login' || pathname.startsWith('/login/');

  const user = await getCurrentUser();

  if (!user && !publicRoute) {
    redirect(`/login?next=${encodeURIComponent(pathname)}`);
  }

  const current = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    : null;

  return (
    <html lang="pt-BR">
      <body>
        <AppChrome current={current} manager={current ? isManagerRole(current.role) : false}>
          {children}
        </AppChrome>
      </body>
    </html>
  );
}
