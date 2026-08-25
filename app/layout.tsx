import './globals.css';
import './claim.css';
import './demand-workspace.css';
import './team.css';
import './auth.css';
import './reports.css';
import AppChrome from '@/components/AppChrome';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const metadata = {
  title: 'Central de Produção da Comunicação',
  description: 'Gestão de demandas de Design, Vídeo e Comunicação',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
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
