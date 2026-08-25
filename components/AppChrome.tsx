'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestão',
  DESIGNER: 'Designer',
  EDITOR: 'Editor de vídeo',
  COPYWRITER: 'Redação',
  SOCIAL_MEDIA: 'Social media',
  REQUESTER: 'Solicitante',
};

export default function AppChrome({
  children,
  current,
  manager,
}: {
  children: React.ReactNode;
  current: AppUser | null;
  manager: boolean;
}) {
  const pathname = usePathname();
  const publicRoute = pathname === '/login' || pathname.startsWith('/login/');

  if (publicRoute) {
    return <div className="publicRouteOnly">{children}</div>;
  }

  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brandBlock">
          <div className="brandMark">C</div>
          <div>
            <strong>COMUNICAÇÃO</strong>
            <span>Central de Produção</span>
          </div>
        </div>

        <nav className="sideNav" aria-label="Navegação principal">
          <div className="navSectionLabel">TRABALHO</div>
          <Link className="navItem" href="/">
            <span className="navIcon">▦</span>
            <span>Painel de produção</span>
          </Link>

          {current && !manager && (
            <Link className="navItem" href="/meu-painel">
              <span className="navIcon">◎</span>
              <span>Meu painel</span>
            </Link>
          )}

          <Link className="navItem" href="/demandas/nova">
            <span className="navIcon">＋</span>
            <span>Nova demanda</span>
          </Link>

          <div className="navItem navItemMuted">
            <span className="navIcon">◫</span>
            <span>Aprovações</span>
            <small>em breve</small>
          </div>

          <Link className="navItem" href="/equipe">
            <span className="navIcon">◉</span>
            <span>Equipe</span>
          </Link>

          <div className="navSectionLabel navSectionGap">GESTÃO</div>

          {manager && (
            <Link className="navItem" href="/equipe/novo">
              <span className="navIcon">＋</span>
              <span>Cadastrar profissional</span>
            </Link>
          )}

          <div className="navItem navItemMuted">
            <span className="navIcon">⌂</span>
            <span>Secretarias</span>
          </div>

          {manager ? (
            <Link className="navItem" href="/relatorios">
              <span className="navIcon">▤</span>
              <span>Relatórios</span>
            </Link>
          ) : (
            <div className="navItem navItemMuted">
              <span className="navIcon">▤</span>
              <span>Relatórios</span>
            </div>
          )}
        </nav>

        <div className="sidebarFooter">
          <div className="onlineDot" />
          <div>
            <strong>Sistema online</strong>
            <span>{current ? `${current.name} conectado` : 'Produção conectada'}</span>
          </div>
        </div>
      </aside>

      <div className="workspace">
        <header className="workspaceTopbar">
          <div className="mobileBrand">
            <strong>COMUNICAÇÃO</strong>
            <span>Central de Produção</span>
          </div>

          <div className="topbarContext">
            <span className="breadcrumb">Comunicação / Produção</span>
            <strong>Gestão de demandas</strong>
          </div>

          <div className="topbarActions">
            <div className="notificationBtn" title="Notificações">●</div>
            <Link className="primaryLink" href="/demandas/nova">＋ Nova demanda</Link>

            {current ? (
              <div className="topbarUserActions">
                {manager ? (
                  <div className="userChip" title="Usuário administrador">
                    <div className="avatar">{current.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{current.name}</strong>
                      <span>{ROLE_LABELS[current.role] ?? current.role}</span>
                    </div>
                  </div>
                ) : (
                  <Link className="userChip" href="/meu-painel" title="Abrir meu painel">
                    <div className="avatar">{current.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <strong>{current.name}</strong>
                      <span>{ROLE_LABELS[current.role] ?? current.role}</span>
                    </div>
                  </Link>
                )}
                <Link className="logoutLink" href="/sair">Sair</Link>
              </div>
            ) : (
              <Link className="userChip" href="/login" title="Entrar no sistema">
                <div className="avatar">↪</div>
                <div><strong>Entrar</strong><span>Acesso da equipe</span></div>
              </Link>
            )}
          </div>
        </header>

        <main className="mainContent">{children}</main>
      </div>
    </div>
  );
}
