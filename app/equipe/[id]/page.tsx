import Link from 'next/link';
import { DemandStatus, UserRole } from '@prisma/client';
import { notFound, redirect } from 'next/navigation';
import AvailabilityControl from '@/components/AvailabilityControl';
import DesignerQuickAction from '@/components/DesignerQuickAction';
import { db } from '@/lib/db';
import { STATUS_LABELS } from '@/types/demand';
import { authEnforced, getCurrentUser, isManagerRole } from '@/lib/session';

export const dynamic = 'force-dynamic';

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrador', MANAGER: 'Gestão', DESIGNER: 'Designer', EDITOR: 'Editor de vídeo', COPYWRITER: 'Redação', SOCIAL_MEDIA: 'Social media', REQUESTER: 'Solicitante',
};
const PRIORITY_LABELS: Record<string, string> = { URGENT: 'Urgente', HIGH: 'Alta', NORMAL: 'Normal', LOW: 'Baixa' };
const TYPE_LABELS: Record<string, string> = { DESIGN: 'Design', VIDEO: 'Vídeo', PHOTO: 'Fotografia', COPY: 'Redação', SOCIAL: 'Social media', OTHER: 'Outros' };
const AVAILABILITY_LABELS: Record<string, string> = { AVAILABLE: 'Disponível', BUSY: 'Ocupado', AWAY: 'Ausente' };
const CLOSED_STATUSES: DemandStatus[] = [DemandStatus.DELIVERED, DemandStatus.ARCHIVED];

function formatDue(value: Date | null) {
  if (!value) return 'Sem prazo';
  return value.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function checklistProgress(items: { completed: boolean }[]) {
  if (!items.length) return null;
  const done = items.filter(item => item.completed).length;
  return { done, total: items.length, percent: Math.round((done / items.length) * 100) };
}

export default async function PersonDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const current = await getCurrentUser();
  if (authEnforced() && !current) redirect('/login');
  if (current && !isManagerRole(current.role) && current.id !== id) redirect('/meu-painel');

  const user = await db.user.findUnique({
    where: { id },
    include: {
      assignedDemands: {
        include: {
          department: true,
          labels: { orderBy: { createdAt: 'asc' } },
          checklistItems: { orderBy: { position: 'asc' } },
          assets: { select: { id: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { updatedAt: 'desc' }],
      },
    },
  });
  if (!user || !user.active) notFound();

  const available = await db.demand.findMany({
    where: { assigneeId: null, status: { in: [DemandStatus.NEW, DemandStatus.BRIEFING_READY, DemandStatus.WAITING_ASSIGNEE] } },
    include: { department: true, labels: { orderBy: { createdAt: 'asc' } }, assets: { select: { id: true } } },
    orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    take: 8,
  });

  const now = new Date();
  const endToday = new Date(now); endToday.setHours(23, 59, 59, 999);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);
  const active = user.assignedDemands.filter(d => !CLOSED_STATUSES.includes(d.status));
  const production = active.filter(d => d.status === DemandStatus.IN_PRODUCTION);
  const approval = active.filter(d => d.status === DemandStatus.WAITING_APPROVAL);
  const changes = active.filter(d => d.status === DemandStatus.CHANGES_REQUESTED);
  const late = active.filter(d => d.dueAt !== null && d.dueAt < now);
  const todayFocus = active.filter(d => d.priority === 'URGENT' || (d.dueAt && d.dueAt <= endToday));
  const delivered30 = user.assignedDemands.filter(d => d.status === DemandStatus.DELIVERED && d.updatedAt >= monthAgo);
  const backHref = current && !isManagerRole(current.role) ? '/' : '/equipe';
  const backLabel = current && !isManagerRole(current.role) ? '← Painel de produção' : '← Equipe';
  const isOwnPanel = current?.id === user.id;

  return (
    <div className="page personDashboardPage designerDashboardV2">
      <div className="personDashboardHeader">
        <div className="personDashboardIdentity">
          <Link href={backHref} className="backTeamLink">{backLabel}</Link>
          <div className="personProfileRow">
            <div className="personProfileAvatar">{user.name.charAt(0).toUpperCase()}</div>
            <div><span className="eyebrow">PAINEL DE PRODUÇÃO</span><h1>{user.name}</h1><p>{ROLE_LABELS[user.role]} · {user.email}</p></div>
          </div>
        </div>
        <div className="personStatusCard">
          <span className="onlineDot" />
          <div>{isOwnPanel ? <AvailabilityControl initial={user.availability} /> : <strong>{AVAILABILITY_LABELS[user.availability] ?? user.availability}</strong>}<span>{active.length} demanda(s) na fila</span></div>
        </div>
      </div>

      <div className="personStatsGrid compactStats">
        <div className="personStatCard"><span className="personStatIcon">▦</span><div><strong>{active.length}</strong><span>fila ativa</span></div></div>
        <div className="personStatCard blue"><span className="personStatIcon">▶</span><div><strong>{production.length}</strong><span>produzindo</span></div></div>
        <div className="personStatCard gold"><span className="personStatIcon">✓</span><div><strong>{approval.length}</strong><span>em aprovação</span></div></div>
        <div className="personStatCard purple"><span className="personStatIcon">↻</span><div><strong>{changes.length}</strong><span>alterações</span></div></div>
        <div className="personStatCard red"><span className="personStatIcon">!</span><div><strong>{late.length}</strong><span>atrasadas</span></div></div>
        <div className="personStatCard green"><span className="personStatIcon">✓</span><div><strong>{delivered30.length}</strong><span>entregues / 30d</span></div></div>
      </div>

      {todayFocus.length > 0 && (
        <section className="designerTodayPanel">
          <div className="personPanelHeader"><div><span className="sectionKicker">FOCO DE HOJE</span><h2>Prioridades primeiro</h2></div><span>{todayFocus.length}</span></div>
          <div className="designerFocusStrip">
            {todayFocus.slice(0, 4).map(demand => (
              <Link href={`/demandas/${demand.id}`} className="designerFocusCard" key={demand.id}>
                <span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority]}</span>
                <strong>{demand.title}</strong>
                <small>{demand.department?.code || 'Sem secretaria'} · {formatDue(demand.dueAt)}</small>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="personDashboardGrid">
        <section className="personWorkPanel">
          <div className="personPanelHeader"><div><span className="sectionKicker">MINHA PRODUÇÃO</span><h2>Trabalhos atribuídos</h2></div><span>{active.length} ativa(s)</span></div>
          {active.length === 0 ? <div className="personPanelEmpty">Nenhuma demanda atribuída neste momento.</div> : (
            <div className="designerDemandGrid">
              {active.map(demand => {
                const isLate = demand.dueAt !== null && demand.dueAt < now;
                const progress = checklistProgress(demand.checklistItems);
                return (
                  <article className={`designerWorkCard${demand.coverUrl ? ' hasCover' : ''}`} key={demand.id}>
                    {demand.coverUrl && <Link href={`/demandas/${demand.id}`} className="designerCardCover" style={{ backgroundImage: `url(${demand.coverUrl})` }} />}
                    <div className="designerWorkBody">
                      <div className="personDemandTopline"><span>{demand.protocol}</span><span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority]}</span></div>
                      {demand.labels.length > 0 && <div className="designerLabels">{demand.labels.slice(0, 3).map(label => <span key={label.id} className={`projectLabel label-${label.color}`}>{label.name}</span>)}</div>}
                      <Link href={`/demandas/${demand.id}`} className="designerWorkTitle">{demand.title}</Link>
                      <div className="personDemandMeta"><span>{demand.department?.code || 'Sem secretaria'}</span><span>{TYPE_LABELS[demand.type]}</span><span>{STATUS_LABELS[demand.status]}</span></div>
                      {progress && <div className="designerChecklistProgress"><div><span>Checklist</span><b>{progress.done}/{progress.total}</b></div><i><span style={{ width: `${progress.percent}%` }} /></i></div>}
                      <div className="designerCardBottom"><div className={isLate ? 'personDemandDue late' : 'personDemandDue'}><span>Prazo</span><strong>{formatDue(demand.dueAt)}</strong></div><div className="designerMiniMetrics"><span>⌁ {demand.assets.length}</span></div></div>
                      {isOwnPanel && <DesignerQuickAction demandId={demand.id} status={demand.status} />}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="availablePanel">
          <div className="personPanelHeader"><div><span className="sectionKicker">FILA LIVRE</span><h2>Para assumir</h2></div><span>{available.length}</span></div>
          <p className="availableIntro">Demandas sem responsável. Abra o card e assuma quando estiver disponível.</p>
          {available.length === 0 ? <div className="personPanelEmpty compact">Nenhuma demanda livre.</div> : (
            <div className="availableDemandList">
              {available.map(demand => (
                <Link href={`/demandas/${demand.id}`} className="availableDemandCard richAvailable" key={demand.id}>
                  <div><span>{demand.protocol}</span><span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority]}</span></div>
                  {demand.labels.length > 0 && <div className="designerLabels">{demand.labels.slice(0, 2).map(label => <span key={label.id} className={`projectLabel label-${label.color}`}>{label.name}</span>)}</div>}
                  <strong>{demand.title}</strong><small>{demand.department?.code || 'Sem secretaria'} · {TYPE_LABELS[demand.type]} · ⌁ {demand.assets.length}</small>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
