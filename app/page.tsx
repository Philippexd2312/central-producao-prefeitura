import KanbanBoard from '@/components/KanbanBoard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const demands = await db.demand.findMany({
    include: { department: true, assignee: true },
    orderBy: { createdAt: 'desc' },
  });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start); end.setDate(end.getDate() + 1);

  const stats = {
    new: demands.filter(d => d.status === 'NEW' || d.status === 'BRIEFING_READY').length,
    production: demands.filter(d => d.status === 'IN_PRODUCTION').length,
    approval: demands.filter(d => d.status === 'WAITING_APPROVAL').length,
    late: demands.filter(d => d.dueAt && d.dueAt < new Date() && !['DELIVERED', 'ARCHIVED'].includes(d.status)).length,
    today: demands.filter(d => d.dueAt && d.dueAt >= start && d.dueAt < end).length,
  };

  return (
    <div className="page">
      <div className="pageTitle">
        <div>
          <h1>Fila de Produção</h1>
          <p>Design, vídeo, fotografia e comunicação em um único fluxo.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><strong>{stats.new}</strong><span>novas / briefing</span></div>
        <div className="stat"><strong>{stats.production}</strong><span>em produção</span></div>
        <div className="stat"><strong>{stats.approval}</strong><span>aguardando aprovação</span></div>
        <div className="stat"><strong>{stats.today}</strong><span>entregas hoje</span></div>
        <div className="stat"><strong>{stats.late}</strong><span>atrasadas</span></div>
      </div>

      <KanbanBoard initialDemands={demands.map(d => ({ ...d, dueAt: d.dueAt?.toISOString() ?? null }))} />
    </div>
  );
}
