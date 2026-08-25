import Link from 'next/link';
import { DemandStatus, UserRole } from '@prisma/client';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser, isManagerRole } from '@/lib/session';

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

const STATUS_LABELS: Record<DemandStatus, string> = {
  NEW: 'Nova',
  AI_TRIAGE: 'Triagem IA',
  BRIEFING_READY: 'Briefing pronto',
  WAITING_ASSIGNEE: 'Aguardando responsável',
  IN_PRODUCTION: 'Em produção',
  INTERNAL_REVIEW: 'Revisão interna',
  WAITING_APPROVAL: 'Aguardando aprovação',
  CHANGES_REQUESTED: 'Alteração solicitada',
  APPROVED: 'Aprovada',
  DELIVERED: 'Entregue',
  ARCHIVED: 'Arquivada',
};

function todayInBrazil() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function normalizeDate(value?: string) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return todayInBrazil();
}

function dayRange(date: string) {
  const start = new Date(`${date}T00:00:00-03:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function formatReportDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    dateStyle: 'full',
  }).format(new Date(`${date}T12:00:00-03:00`));
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function actionLabel(action: string, toValue: string | null) {
  if (action === 'DEMAND_CLAIMED') return 'Assumiu a demanda';
  if (action === 'STATUS_CHANGED') {
    switch (toValue) {
      case DemandStatus.IN_PRODUCTION:
        return 'Iniciou a produção';
      case DemandStatus.INTERNAL_REVIEW:
        return 'Enviou para revisão interna';
      case DemandStatus.WAITING_APPROVAL:
        return 'Enviou para aprovação';
      case DemandStatus.CHANGES_REQUESTED:
        return 'Solicitou alteração';
      case DemandStatus.APPROVED:
        return 'Aprovou a produção';
      case DemandStatus.DELIVERED:
        return 'Marcou como entregue';
      case DemandStatus.ARCHIVED:
        return 'Arquivou a demanda';
      default:
        return toValue && toValue in STATUS_LABELS
          ? `Moveu para ${STATUS_LABELS[toValue as DemandStatus]}`
          : 'Alterou o status';
    }
  }
  return action.replaceAll('_', ' ').toLowerCase();
}

function uniqueDemandCount(
  events: Array<{ demandId: string; action: string; toValue: string | null }>,
  statuses?: DemandStatus[],
) {
  const ids = new Set(
    events
      .filter(event => {
        if (!statuses) return true;
        return event.action === 'STATUS_CHANGED' && statuses.includes(event.toValue as DemandStatus);
      })
      .map(event => event.demandId),
  );
  return ids.size;
}

export default async function DailyReportPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string }>;
}) {
  const current = await getCurrentUser();
  if (!current) redirect('/login');
  if (!isManagerRole(current.role)) redirect('/meu-painel');

  const params = await searchParams;
  const selectedDate = normalizeDate(params.data);
  const { start, end } = dayRange(selectedDate);

  const events = await db.demandHistory.findMany({
    where: {
      createdAt: { gte: start, lt: end },
      actorId: { not: null },
    },
    include: {
      actor: true,
      demand: {
        include: { department: true, assignee: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  const productionUsers = await db.user.findMany({
    where: {
      active: true,
      role: {
        in: [
          UserRole.DESIGNER,
          UserRole.EDITOR,
          UserRole.COPYWRITER,
          UserRole.SOCIAL_MEDIA,
          UserRole.MANAGER,
          UserRole.ADMIN,
        ],
      },
    },
    orderBy: { name: 'asc' },
  });

  const totalWorked = uniqueDemandCount(events);
  const totalStarted = uniqueDemandCount(events, [DemandStatus.IN_PRODUCTION]);
  const totalApproval = uniqueDemandCount(events, [DemandStatus.WAITING_APPROVAL]);
  const totalDelivered = uniqueDemandCount(events, [DemandStatus.DELIVERED]);
  const totalChanges = uniqueDemandCount(events, [DemandStatus.CHANGES_REQUESTED]);

  const summaries = productionUsers
    .map(user => {
      const userEvents = events.filter(event => event.actorId === user.id);
      return {
        user,
        worked: uniqueDemandCount(userEvents),
        started: uniqueDemandCount(userEvents, [DemandStatus.IN_PRODUCTION]),
        approval: uniqueDemandCount(userEvents, [DemandStatus.WAITING_APPROVAL]),
        delivered: uniqueDemandCount(userEvents, [DemandStatus.DELIVERED]),
        changes: uniqueDemandCount(userEvents, [DemandStatus.CHANGES_REQUESTED]),
        actions: userEvents.length,
      };
    })
    .filter(summary => summary.actions > 0)
    .sort((a, b) => b.worked - a.worked || b.actions - a.actions);

  return (
    <div className="page dailyReportPage">
      <div className="reportHero">
        <div>
          <span className="eyebrow">GESTÃO DE PRODUÇÃO</span>
          <h1>Relatório diário de produção</h1>
          <p>{formatReportDate(selectedDate)}</p>
        </div>

        <form className="reportDateForm" method="get">
          <label htmlFor="report-date">Data do relatório</label>
          <div>
            <input id="report-date" name="data" type="date" defaultValue={selectedDate} />
            <button type="submit">Ver relatório</button>
          </div>
        </form>
      </div>

      <div className="reportStatsGrid">
        <div className="reportStatCard green"><span>▦</span><div><strong>{totalWorked}</strong><small>trabalhos movimentados</small></div></div>
        <div className="reportStatCard blue"><span>▶</span><div><strong>{totalStarted}</strong><small>iniciados</small></div></div>
        <div className="reportStatCard gold"><span>✓</span><div><strong>{totalApproval}</strong><small>enviados para aprovação</small></div></div>
        <div className="reportStatCard purple"><span>↻</span><div><strong>{totalChanges}</strong><small>com alteração</small></div></div>
        <div className="reportStatCard teal"><span>✓</span><div><strong>{totalDelivered}</strong><small>entregues</small></div></div>
      </div>

      <section className="reportPanel">
        <div className="reportPanelHeader">
          <div>
            <span className="sectionKicker">POR PROFISSIONAL</span>
            <h2>Produção da equipe</h2>
          </div>
          <span>{summaries.length} profissional(is) com atividade</span>
        </div>

        {summaries.length === 0 ? (
          <div className="reportEmpty">Nenhuma movimentação de produção registrada nesta data.</div>
        ) : (
          <div className="reportTeamTableWrap">
            <table className="reportTable reportTeamTable">
              <thead>
                <tr>
                  <th>Profissional</th>
                  <th>Trabalhados</th>
                  <th>Iniciados</th>
                  <th>Para aprovação</th>
                  <th>Alterações</th>
                  <th>Entregues</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map(summary => (
                  <tr key={summary.user.id}>
                    <td>
                      <Link href={`/equipe/${summary.user.id}`} className="reportPerson">
                        <span className="reportAvatar">{summary.user.name.charAt(0).toUpperCase()}</span>
                        <span><strong>{summary.user.name}</strong><small>{ROLE_LABELS[summary.user.role]}</small></span>
                      </Link>
                    </td>
                    <td><strong>{summary.worked}</strong></td>
                    <td>{summary.started}</td>
                    <td>{summary.approval}</td>
                    <td>{summary.changes}</td>
                    <td>{summary.delivered}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="reportPanel">
        <div className="reportPanelHeader">
          <div>
            <span className="sectionKicker">LINHA DO TEMPO</span>
            <h2>O que foi feito no dia</h2>
          </div>
          <span>{events.length} movimentação(ões)</span>
        </div>

        {events.length === 0 ? (
          <div className="reportEmpty">Ainda não há atividades registradas para este dia.</div>
        ) : (
          <div className="dailyTimeline">
            {events.map(event => (
              <Link href={`/demandas/${event.demandId}`} className="dailyTimelineRow" key={event.id}>
                <time>{formatTime(event.createdAt)}</time>
                <span className="reportAvatar small">{event.actor?.name?.charAt(0).toUpperCase() || '?'}</span>
                <div className="dailyTimelineMain">
                  <div>
                    <strong>{event.actor?.name || 'Sistema'}</strong>
                    <span>{actionLabel(event.action, event.toValue)}</span>
                  </div>
                  <b>{event.demand.title}</b>
                  <small>{event.demand.protocol} · {event.demand.department?.code || 'Sem secretaria'}</small>
                </div>
                <span className="timelineArrow">→</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
