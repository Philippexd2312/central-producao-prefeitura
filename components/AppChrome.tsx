'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

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

function activeClass(pathname: string, href: string) {
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  return active ? ' navItemActive' : '';
}

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
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicRoute = pathname === '/login' || pathname.startsWith('/login/');
  const isNewDemandPage = pathname === '/demandas/nova' || pathname.startsWith('/demandas/nova/');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (publicRoute || !current) return;
    router.prefetch('/');
    router.prefetch('/demandas/nova');
    router.prefetch('/equipe');
    if (manager) {
      router.prefetch('/relatorios');
      router.prefetch('/equipe/novo');
    } else {
      router.prefetch('/meu-painel');
    }
  }, [current, manager, publicRoute, router]);

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }

  if (publicRoute) {
    return <div className="publicRouteOnly">{children}</div>;
  }

  return (
    <div className={`appShell${isNewDemandPage ? ' newDemandRoute' : ''}`}>
      {mobileMenuOpen && (
        <button
          type="button"
          className="mobileSidebarBackdrop"
          aria-label="Fechar menu"
          onClick={closeMobileMenu}
        />
      )}

      <aside className={`sidebar${mobileMenuOpen ? ' mobileOpen' : ''}`}>
        <div className="brandBlock">
          <div className="brandMark">C</div>
          <div>
            <strong>COMUNICAÇÃO</strong>
            <span>Central de Produção</span>
          </div>
          <button
            type="button"
            className="mobileCloseButton"
            aria-label="Fechar menu"
            onClick={closeMobileMenu}
          >
            ×
          </button>
        </div>

        <nav className="sideNav" aria-label="Navegação principal">
          <div className="navSectionLabel">TRABALHO</div>
          <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/')}`} href="/">
            <span className="navIcon">▦</span>
            <span>Painel de produção</span>
          </Link>

          {current && !manager && (
            <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/meu-painel')}`} href="/meu-painel">
              <span className="navIcon">◎</span>
              <span>Meu painel</span>
            </Link>
          )}

          <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/demandas/nova')}`} href="/demandas/nova">
            <span className="navIcon">＋</span>
            <span>Nova demanda</span>
          </Link>

          <div className="navItem navItemMuted">
            <span className="navIcon">◫</span>
            <span>Aprovações</span>
            <small>em breve</small>
          </div>

          <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/equipe')}`} href="/equipe">
            <span className="navIcon">◉</span>
            <span>Equipe</span>
          </Link>

          <div className="navSectionLabel navSectionGap">GESTÃO</div>

          {manager && (
            <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/equipe/novo')}`} href="/equipe/novo">
              <span className="navIcon">＋</span>
              <span>Cadastrar profissional</span>
            </Link>
          )}

          <div className="navItem navItemMuted">
            <span className="navIcon">⌂</span>
            <span>Secretarias</span>
          </div>

          {manager ? (
            <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/relatorios')}`} href="/relatorios">
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
          <button
            type="button"
            className="mobileMenuButton"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(true)}
          >
            <span />
            <span />
            <span />
          </button>

          <div className="mobileBrand">
            <strong>Central de Produção</strong>
            <span>Comunicação</span>
          </div>

          <div className="topbarContext">
            <span className="breadcrumb">Comunicação / Produção</span>
            <strong>Gestão de demandas</strong>
          </div>

          <div className="topbarActions">
            <div className="notificationBtn" title="Notificações">●</div>
            {!isNewDemandPage && <Link className="primaryLink" href="/demandas/nova">＋ Nova demanda</Link>}

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
                <Link prefetch={false} className="logoutLink" href="/sair">Sair</Link>
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

      <nav className="mobileBottomNav" aria-label="Atalhos móveis">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          <span>▦</span>
          <small>Painel</small>
        </Link>

        {!manager && current ? (
          <Link href="/meu-painel" className={pathname.startsWith('/meu-painel') ? 'active' : ''}>
            <span>◎</span>
            <small>Meu painel</small>
          </Link>
        ) : (
          <Link href="/equipe" className={pathname.startsWith('/equipe') && pathname !== '/equipe/novo' ? 'active' : ''}>
            <span>◉</span>
            <small>Equipe</small>
          </Link>
        )}

        <Link href="/demandas/nova" className={`mobileBottomPrimary ${pathname.startsWith('/demandas/nova') ? 'active' : ''}`}>
          <span>＋</span>
          <small>Nova</small>
        </Link>

        {manager ? (
          <Link href="/relatorios" className={pathname.startsWith('/relatorios') ? 'active' : ''}>
            <span>▤</span>
            <small>Relatórios</small>
          </Link>
        ) : (
          <Link href="/equipe" className={pathname.startsWith('/equipe') ? 'active' : ''}>
            <span>◉</span>
            <small>Equipe</small>
          </Link>
        )}
      </nav>
    </div>
  );
}
