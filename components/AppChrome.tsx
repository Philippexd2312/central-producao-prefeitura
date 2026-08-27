'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export type AppUser = { id: string; name: string; email: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador', MANAGER: 'Gestão', DESIGNER: 'Designer', EDITOR: 'Editor de vídeo', COPYWRITER: 'Redação', SOCIAL_MEDIA: 'Social media', REQUESTER: 'Solicitante',
};

function activeClass(pathname: string, href: string) {
  const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
  return active ? ' navItemActive' : '';
}

export default function AppChrome({ children, current, manager }: { children: React.ReactNode; current: AppUser | null; manager: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const publicRoute = pathname === '/login' || pathname.startsWith('/login/');
  const isNewDemandPage = pathname === '/demandas/nova' || pathname.startsWith('/demandas/nova/');

  useEffect(() => { setMobileMenuOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    document.documentElement.classList.toggle('mobileMenuIsOpen', mobileMenuOpen);
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('mobileMenuIsOpen');
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (publicRoute || !current) return;
    if (manager) {
      router.prefetch('/');
      router.prefetch('/demandas/nova');
      router.prefetch('/equipe');
      router.prefetch('/calendario');
      router.prefetch('/aprovacoes');
      router.prefetch('/relatorios');
      router.prefetch('/equipe/novo');
      router.prefetch('/secretarias');
      router.prefetch('/configuracoes/whatsapp');
    } else {
      router.prefetch('/meu-painel');
    }
  }, [current, manager, publicRoute, router]);

  function openMobileMenu() {
    setMobileMenuOpen(true);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
    document.body.style.overflow = '';
  }

  if (publicRoute) return <div className="publicRouteOnly">{children}</div>;

  return (
    <div className={`appShell${isNewDemandPage ? ' newDemandRoute' : ''}${manager ? '' : ' designerShell'}`}>
      {mobileMenuOpen && <button type="button" className="mobileSidebarBackdrop" aria-label="Fechar menu" onClick={closeMobileMenu} onTouchStart={closeMobileMenu} />}

      <aside className={`sidebar${mobileMenuOpen ? ' mobileOpen' : ''}`} aria-hidden={!mobileMenuOpen && typeof window !== 'undefined' && window.innerWidth <= 900}>
        <div className="brandBlock">
          <div className="brandMark">C</div>
          <div><strong>COMUNICAÇÃO</strong><span>Central de Produção</span></div>
          <button type="button" className="mobileCloseButton" aria-label="Fechar menu" onClick={closeMobileMenu} onTouchStart={closeMobileMenu}>×</button>
        </div>

        <nav className="sideNav" aria-label="Navegação principal">
          <div className="navSectionLabel">PRODUÇÃO</div>

          {!manager && current && (
            <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/meu-painel')}`} href="/meu-painel"><span className="navIcon">◎</span><span>Minha produção</span></Link>
          )}

          {manager && (
            <>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/')}`} href="/"><span className="navIcon">▦</span><span>Painel de produção</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/demandas/nova')}`} href="/demandas/nova"><span className="navIcon">＋</span><span>Nova demanda</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/aprovacoes')}`} href="/aprovacoes"><span className="navIcon">◫</span><span>Aprovações</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/equipe')}`} href="/equipe"><span className="navIcon">◉</span><span>Equipe</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/calendario')}`} href="/calendario"><span className="navIcon">◷</span><span>Calendário</span></Link>

              <div className="navSectionLabel navSectionGap">GESTÃO</div>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/equipe/novo')}`} href="/equipe/novo"><span className="navIcon">＋</span><span>Cadastrar profissional</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/secretarias')}`} href="/secretarias"><span className="navIcon">⌂</span><span>Secretarias</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/relatorios')}`} href="/relatorios"><span className="navIcon">▤</span><span>Relatórios</span></Link>
              <Link onClick={closeMobileMenu} className={`navItem${activeClass(pathname, '/configuracoes/whatsapp')}`} href="/configuracoes/whatsapp"><span className="navIcon">⚡</span><span>WhatsApp & IA</span></Link>
            </>
          )}
        </nav>

        <div className="sidebarFooter"><div className="onlineDot" /><div><strong>Sistema online</strong><span>{current ? `${current.name} conectado` : 'Produção conectada'}</span></div></div>
      </aside>

      <div className="workspace">
        <header className="workspaceTopbar">
          <button
            type="button"
            className="mobileMenuButton"
            aria-label="Abrir menu"
            aria-expanded={mobileMenuOpen}
            onClick={openMobileMenu}
            onTouchStart={openMobileMenu}
          ><span /><span /><span /></button>
          <div className="mobileBrand"><strong>Central de Produção</strong><span>Comunicação</span></div>
          <div className="topbarContext"><span className="breadcrumb">Comunicação / Produção</span><strong>{manager ? 'Gestão de demandas' : 'Minha produção'}</strong></div>
          <div className="topbarActions">
            {manager && <div className="notificationBtn" title="Notificações">●</div>}
            {manager && !isNewDemandPage && <Link className="primaryLink" href="/demandas/nova">＋ Nova demanda</Link>}
            {current ? (
              <div className="topbarUserActions">
                {manager ? (
                  <div className="userChip" title="Usuário administrador"><div className="avatar">{current.name.charAt(0).toUpperCase()}</div><div><strong>{current.name}</strong><span>{ROLE_LABELS[current.role] ?? current.role}</span></div></div>
                ) : (
                  <div className="userChip" title="Perfil do profissional"><div className="avatar">{current.name.charAt(0).toUpperCase()}</div><div><strong>{current.name}</strong><span>{ROLE_LABELS[current.role] ?? current.role}</span></div></div>
                )}
                <Link prefetch={false} className="logoutLink" href="/sair">Sair</Link>
              </div>
            ) : (
              <Link className="userChip" href="/login" title="Entrar no sistema"><div className="avatar">↪</div><div><strong>Entrar</strong><span>Acesso da equipe</span></div></Link>
            )}
          </div>
        </header>

        <main className="mainContent">{children}</main>
      </div>

      <nav className={`mobileBottomNav${manager ? '' : ' designerBottomNav'}`} aria-label="Atalhos móveis">
        {!manager && current ? (
          <Link href="/meu-painel" className="active"><span>◎</span><small>Minha produção</small></Link>
        ) : (
          <>
            <Link href="/" className={pathname === '/' ? 'active' : ''}><span>▦</span><small>Painel</small></Link>
            <Link href="/aprovacoes" className={pathname.startsWith('/aprovacoes') ? 'active' : ''}><span>◫</span><small>Aprovar</small></Link>
            <Link href="/demandas/nova" className={`mobileBottomPrimary ${pathname.startsWith('/demandas/nova') ? 'active' : ''}`}><span>＋</span><small>Nova</small></Link>
            <Link href="/calendario" className={pathname.startsWith('/calendario') ? 'active' : ''}><span>◷</span><small>Agenda</small></Link>
          </>
        )}
      </nav>
    </div>
  );
}
