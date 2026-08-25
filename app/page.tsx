import KanbanBoard from '@/components/KanbanBoard';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const demands = await db.demand.findMany({
    select: {
      id: true,
      protocol: true,
      title: true,
      status: true,
      priority: true,
      type: true,
      dueAt: true,
      coverUrl: true,
      createdAt: true,
      department: { select: { name: true, code: true } },
      assignee: { select: { name: true } },
      members: { select: { user: { select: { name: true } } } },
      labels: {
        select: { id: true, name: true, color: true },
        orderBy: { createdAt: 'asc' },
      },
      checklistItems: {
        select: { completed: true },
        orderBy: { position: 'asc' },
      },
      _count: { select: { assets: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const stats = {
    new: demands.filter(d => d.status === 'NEW' || d.status === 'BRIEFING_READY').length,
    production: demands.filter(d => d.status === 'IN_PRODUCTION').length,
    approval: demands.filter(d => d.status === 'WAITING_APPROVAL').length,
    late: demands.filter(d => d.dueAt && d.dueAt < new Date() && !['DELIVERED', 'ARCHIVED'].includes(d.status)).length,
    today: demands.filter(d => d.dueAt && d.dueAt >= start && d.dueAt < end).length,
  };

  const totalOpen = demands.filter(d => !['DELIVERED', 'ARCHIVED'].includes(d.status)).length;

  return (
    <div className="page dashboardPage">
      <section className="dashboardHero">
        <div>
          <div className="eyebrow">CENTRAL DE COMUNICAÇÃO</div>
          <h1>Fila de Produção</h1>
          <p>Acompanhe as demandas, responsáveis e aprovações da equipe em um único lugar.</p>
        </div>
        <div className="heroSummary">
          <span>Demandas abertas</span>
          <strong>{totalOpen}</strong>
        </div>
      </section>

      <section className="stats" aria-label="Resumo da produção">
        <div className="stat statNew"><div className="statIcon">＋</div><div><strong>{stats.new}</strong><span>Novas / briefing</span></div></div>
        <div className="stat statProduction"><div className="statIcon">◆</div><div><strong>{stats.production}</strong><span>Em produção</span></div></div>
        <div className="stat statApproval"><div className="statIcon">✓</div><div><strong>{stats.approval}</strong><span>Aguardando aprovação</span></div></div>
        <div className="stat statToday"><div className="statIcon">◷</div><div><strong>{stats.today}</strong><span>Entregas hoje</span></div></div>
        <div className="stat statLate"><div className="statIcon">!</div><div><strong>{stats.late}</strong><span>Atrasadas</span></div></div>
      </section>

      <section className="boardSection">
        <div className="sectionHeading">
          <div><span className="sectionKicker">FLUXO DE TRABALHO</span><h2>Quadro de produção</h2></div>
          <span className="dragHint">Arraste os cards para mudar o status</span>
        </div>

        <KanbanBoard
          initialDemands={demands.map(d => ({
            id: d.id,
            protocol: d.protocol,
            title: d.title,
            status: d.status,
            priority: d.priority,
            type: d.type,
            dueAt: d.dueAt?.toISOString() ?? null,
            coverUrl: d.coverUrl,
            department: d.department ? { name: d.department.name, code: d.department.code } : null,
            assignee: d.assignee ? { name: d.assignee.name } : null,
            members: d.members.map(member => ({ name: member.user.name })),
            labels: d.labels.map(label => ({ id: label.id, name: label.name, color: label.color })),
            checklistTotal: d.checklistItems.length,
            checklistDone: d.checklistItems.filter(item => item.completed).length,
            assetCount: d._count.assets,
          }))}
        />
      </section>
    </div>
  );
}
