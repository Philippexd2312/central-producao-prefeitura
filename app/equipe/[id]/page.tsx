import Link from 'next/link';
import { DemandStatus, UserRole } from '@prisma/client';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { STATUS_LABELS } from '@/types/demand';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gestão',
  DESIGNER: 'Designer',
  EDITOR: 'Editor de vídeo',
  COPYWRITER: 'Redação',
  SOCIAL_MEDIA: 'Social media',
  REQUESTER: 'Solicitante',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
};

const TYPE_LABELS: Record<string, string> = {
  DESIGN: 'Design',
  VIDEO: 'Vídeo',
  PHOTO: 'Fotografia',
  COPY: 'Redação',
  SOCIAL: 'Social media',
  OTHER: 'Outros',
};

const CLOSED_STATUSES: DemandStatus[] = [DemandStatus.DELIVERED, DemandStatus.ARCHIVED];

function formatDue(value: Date | null) {
  if (!value) return 'Sem prazo';
  return value.toLocaleString('pt-BR');
}

export default async function PersonDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const user = await db.user.findUnique({
    where: { id },
    include: {
      assignedDemands: {
        include: { department: true },
        orderBy: { updatedAt: 'desc' },
      },
    },
  });

  if (!user || !user.active) notFound();

  const available = await db.demand.findMany({
    where: {
      assigneeId: null,
      status: {
        in: [DemandStatus.NEW, DemandStatus.BRIEFING_READY, DemandStatus.WAITING_ASSIGNEE],
      },
    },
    include: { department: true },
    orderBy: { createdAt: 'asc' },
    take: 8,
  });

  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  const active = user.assignedDemands.filter(d => !CLOSED_STATUSES.includes(d.status));
  const production = active.filter(d => d.status === DemandStatus.IN_PRODUCTION);
  const approval = active.filter(d => d.status === DemandStatus.WAITING_APPROVAL);
  const changes = active.filter(d => d.status === DemandStatus.CHANGES_REQUESTED);
  const late = active.filter(d => d.dueAt !== null && d.dueAt < now);
  const delivered30 = user.assignedDemands.filter(
    d => d.status === DemandStatus.DELIVERED && d.updatedAt >= monthAgo,
  );

  return (
    <div className="page personDashboardPage">
      <div className="personDashboardHeader">
        <div className="personDashboardIdentity">
          <Link href="/equipe" className="backTeamLink">← Equipe</Link>
          <div className="personProfileRow">
            <div className="personProfileAvatar">{user.name.charAt(0).toUpperCase()}</div>
            <div>
              <span className="eyebrow">PAINEL INDIVIDUAL</span>
              <h1>{user.name}</h1>
              <p>{ROLE_LABELS[user.role]} · {user.email}</p>
            </div>
          </div>
        </div>
        <div className="personStatusCard">
          <span className="onlineDot" />
          <div><strong>Ativo</strong><span>{active.length} demanda(s) na fila</span></div>
        </div>
      </div>

      <div className="personStatsGrid">
        <div className="personStatCard"><span className="personStatIcon">▦</span><div><strong>{active.length}</strong><span>fila ativa</span></div></div>
        <div className="personStatCard blue"><span className="personStatIcon">▶</span><div><strong>{production.length}</strong><span>em produção</span></div></div>
        <div className="personStatCard gold"><span className="personStatIcon">✓</span><div><strong>{approval.length}</strong><span>em aprovação</span></div></div>
        <div className="personStatCard purple"><span className="personStatIcon">↻</span><div><strong>{changes.length}</strong><span>com alteração</span></div></div>
        <div className="personStatCard red"><span className="personStatIcon">!</span><div><strong>{late.length}</strong><span>atrasadas</span></div></div>
        <div className="personStatCard green"><span className="personStatIcon">✓</span><div><strong>{delivered30.length}</strong><span>entregues / 30 dias</span></div></div>
      </div>

      <div className="personDashboardGrid">
        <section className="personWorkPanel">
          <div className="personPanelHeader">
            <div><span className="sectionKicker">MINHA PRODUÇÃO</span><h2>Demandas atribuídas</h2></div>
            <span>{active.length} ativa(s)</span>
          </div>

          {active.length === 0 ? (
            <div className="personPanelEmpty">Nenhuma demanda atribuída neste momento.</div>
          ) : (
            <div className="personDemandList">
              {active.map(demand => {
                const isLate = demand.dueAt !== null && demand.dueAt < now;
                return (
                  <Link href={`/demandas/${demand.id}`} className="personDemandRow" key={demand.id}>
                    <span className={`personDemandStripe status-${demand.status}`} />
                    <div className="personDemandMain">
                      <div className="personDemandTopline">
                        <span>{demand.protocol}</span>
                        <span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span>
                      </div>
                      <strong>{demand.title}</strong>
                      <div className="personDemandMeta">
                        <span>{demand.department?.code || 'Sem secretaria'}</span>
                        <span>{TYPE_LABELS[demand.type] ?? demand.type}</span>
                        <span>{STATUS_LABELS[demand.status] ?? demand.status}</span>
                      </div>
                    </div>
                    <div className={isLate ? 'personDemandDue late' : 'personDemandDue'}>
                      <span>Prazo</span>
                      <strong>{formatDue(demand.dueAt)}</strong>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <aside className="availablePanel">
          <div className="personPanelHeader">
            <div><span className="sectionKicker">FILA LIVRE</span><h2>Disponíveis</h2></div>
            <span>{available.length}</span>
          </div>
          <p className="availableIntro">Demandas sem responsável que podem ser assumidas pela equipe.</p>

          {available.length === 0 ? (
            <div className="personPanelEmpty compact">Nenhuma demanda livre.</div>
          ) : (
            <div className="availableDemandList">
              {available.map(demand => (
                <Link href={`/demandas/${demand.id}`} className="availableDemandCard" key={demand.id}>
                  <div><span>{demand.protocol}</span><span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span></div>
                  <strong>{demand.title}</strong>
                  <small>{demand.department?.code || 'Sem secretaria'} · {TYPE_LABELS[demand.type] ?? demand.type}</small>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
