import './globals.css';
import './claim.css';
import './demand-workspace.css';
import Link from 'next/link';

export const metadata = {
  title: 'Central de Produção da Comunicação',
  description: 'Gestão de demandas de Design, Vídeo e Comunicação',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
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
              <Link className="navItem navItemActive" href="/">
                <span className="navIcon">▦</span>
                <span>Painel de produção</span>
              </Link>
              <Link className="navItem" href="/demandas/nova">
                <span className="navIcon">＋</span>
                <span>Nova demanda</span>
              </Link>
              <div className="navItem navItemMuted">
                <span className="navIcon">◫</span>
                <span>Aprovações</span>
                <small>em breve</small>
              </div>
              <div className="navItem navItemMuted">
                <span className="navIcon">◉</span>
                <span>Equipe</span>
                <small>em breve</small>
              </div>

              <div className="navSectionLabel navSectionGap">GESTÃO</div>
              <div className="navItem navItemMuted">
                <span className="navIcon">⌂</span>
                <span>Secretarias</span>
              </div>
              <div className="navItem navItemMuted">
                <span className="navIcon">▤</span>
                <span>Relatórios</span>
              </div>
            </nav>

            <div className="sidebarFooter">
              <div className="onlineDot" />
              <div>
                <strong>Sistema online</strong>
                <span>Produção conectada</span>
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
                <div className="userChip">
                  <div className="avatar">P</div>
                  <div><strong>Equipe</strong><span>Comunicação</span></div>
                </div>
              </div>
            </header>
            <main className="mainContent">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
