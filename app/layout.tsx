import './globals.css';
import './claim.css';
import './demand-workspace.css';
import './team.css';
import './auth.css';
import './reports.css';
import './mobile.css';
import './ios.css';
import './premium-workspace.css';
import './mobile-performance.css';
import './mobile-polish.css';
import './new-demand.css';
import './kanban-drag.css';
import './designer-dashboard.css';
import './integrations.css';
import './calendar.css';
import './calendar-birthday.css';
import './calendar-alerts.css';
import './delivery.css';
import './delivery-shortcut.css';
import './attention.css';
import './departments.css';
import AppChrome from '@/components/AppChrome';
import IOSStandaloneDetector from '@/components/IOSStandaloneDetector';
import CalendarFloatingShortcut from '@/components/CalendarFloatingShortcut';
import { getCurrentUser, isManagerRole } from '@/lib/session';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Central de Produção da Comunicação',
  description: 'Gestão de demandas de Design, Vídeo e Comunicação',
  applicationName: 'Central Comunicação',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Central Comunicação',
    statusBarStyle: 'default' as const,
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0b3c29',
  colorScheme: 'light',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get('x-central-pathname') || '/';
  const publicRoute = pathname === '/login' || pathname.startsWith('/login/');

  const user = await getCurrentUser();
  if (!user && !publicRoute) redirect(`/login?next=${encodeURIComponent(pathname)}`);

  const current = user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
  const manager = current ? isManagerRole(current.role) : false;

  return (
    <html lang="pt-BR">
      <body>
        <IOSStandaloneDetector />
        <AppChrome current={current} manager={manager}>
          {children}
        </AppChrome>
        {manager ? <CalendarFloatingShortcut /> : null}
      </body>
    </html>
  );
}
