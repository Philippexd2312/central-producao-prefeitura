import CalendarAlerts from '@/components/CalendarAlerts';
import KanbanBoard from '@/components/KanbanBoard';
import ManagerAttention from '@/components/ManagerAttention';
import { db } from '@/lib/db';
import { syncEditorialCalendarBase } from '@/lib/calendar-base';
import { calendarDaysUntil, nextOccurrence } from '@/lib/editorial-calendar';
import { getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  await syncEditorialCalendarBase();

  const [demands, calendarEvents, current] = await Promise.all([
    db.demand.findMany({
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
    }),
    db.calendarEvent.findMany({
      where: { active: true },
      include: { department: { select: { code: true, name: true } } },
      orderBy: { eventDate: 'asc' },
    }),
    getCurrentUser(),
  ]);

  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const stats = {
    new: demands.filter(d => d.status === 'NEW' || d.status === 'BRIEFING_READY').length,
    production: demands.filter(d => d.status === 'IN_PRODUCTION').length,
    approval: demands.filter(d => d.status === 'WAITING_APPROVAL').length,
    late: demands.filter(d => d.dueAt && d.dueAt < today && !['DELIVERED', 'ARCHIVED'].includes(d.status)).length,
    today: demands.filter(d => d.dueAt && d.dueAt >= start && d.dueAt < end).length,
  };

  const totalOpen = demands.filter(d => !['DELIVERED', 'ARCHIVED'].includes(d.status)).length;
  const manager = Boolean(current && isManagerRole(current.role));
  const changesCount = demands.filter(d => d.status === 'CHANGES_REQUESTED').length;

  const attentionItems = demands
    .filter(demand => {
      const overdue = Boolean(demand.dueAt && demand.dueAt < today && !['DELIVERED', 'ARCHIVED'].includes(demand.status));
      return demand.status === 'WAITING_APPROVAL' || demand.status === 'CHANGES_REQUESTED' || overdue;
    })
    .sort((a, b) => {
      const rank = (status: string) => status === 'WAITING_APPROVAL' ? 0 : status === 'CHANGES_REQUESTED' ? 1 : 2;
      const statusDiff = rank(a.status) - rank(b.status);
      if (statusDiff !== 0) return statusDiff;
      return (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) - (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER);
    })
    .slice(0, 6)
    .map(demand => ({
      id: demand.id,
      protocol: demand.protocol,
      title: demand.title,
      status: demand.status,
      dueAt: demand.dueAt?.toISOString() ?? null,
      department: demand.department,
      assignee: demand.assignee,
    }));

  const calendarAlerts = calendarEvents
    .map(event => {
      const occurrence = nextOccurrence(event, today);
      const daysUntil = calendarDaysUntil(occurrence, today);
      return {
        id: event.id,
        title: event.title,
        type: event.type,
        personName: event.personName,
        personRole: event.personRole,
        occurrence: occurrence.toISOString(),
        daysUntil,
        leadDays: event.leadDays,
        department: event.department,
      };
    })
    .filter(item => item.daysUntil >= 0 && item.daysUntil <= item.leadDays)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, 6);

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

      {manager && (
        <ManagerAttention
          items={attentionItems}
          approvalCount={stats.approval}
          lateCount={stats.late}
          changesCount={changesCount}
        />
      )}

      <CalendarAlerts alerts={calendarAlerts} />

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
