'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import ClaimDemandButton from '@/components/ClaimDemandButton';
import { KANBAN_STATUSES, STATUS_LABELS } from '@/types/demand';

type DemandCard = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueAt: string | null;
  coverUrl?: string | null;
  department?: { name: string; code: string } | null;
  assignee?: { name: string } | null;
  members?: { name: string }[];
  labels?: { id: string; name: string; color: string }[];
  checklistTotal?: number;
  checklistDone?: number;
  assetCount?: number;
};

const TYPE_LABELS: Record<string, string> = {
  DESIGN: 'Design', VIDEO: 'Vídeo', PHOTO: 'Fotografia', COPY: 'Redação', SOCIAL: 'Social media', OTHER: 'Outros',
};
const TYPE_ICONS: Record<string, string> = { DESIGN: '✦', VIDEO: '▶', PHOTO: '◉', COPY: 'T', SOCIAL: '#', OTHER: '•' };
const PRIORITY_LABELS: Record<string, string> = { URGENT: 'Urgente', HIGH: 'Alta', NORMAL: 'Normal', LOW: 'Baixa' };

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U';
}

export default function KanbanBoard({ initialDemands }: { initialDemands: DemandCard[] }) {
  const [demands, setDemands] = useState(initialDemands);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filteredDemands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return demands.filter(d => {
      const matchesSearch = !term || [d.title, d.protocol, d.department?.name, d.department?.code, d.assignee?.name, ...(d.labels ?? []).map(label => label.name)]
        .some(value => value?.toLowerCase().includes(term));
      return matchesSearch && (typeFilter === 'ALL' || d.type === typeFilter) && (priorityFilter === 'ALL' || d.priority === priorityFilter);
    });
  }, [demands, search, typeFilter, priorityFilter]);

  const grouped = useMemo(() => Object.fromEntries(KANBAN_STATUSES.map(status => [status, filteredDemands.filter(d => d.status === status)])), [filteredDemands]);

  async function moveDemand(id: string, status: string) {
    const before = demands;
    setDemands(current => current.map(d => d.id === id ? { ...d, status } : d));
    try {
      const res = await fetch(`/api/demands/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
    } catch {
      setDemands(before);
      alert('Não foi possível mover a demanda.');
    }
  }

  function applyClaimedDemand(updated: any) {
    setDemands(current => current.map(d => d.id === updated.id ? {
      ...d,
      status: updated.status,
      assignee: updated.assignee ? { name: updated.assignee.name } : null,
    } : d));
  }

  return (
    <div>
      <div className="boardToolbar">
        <label className="searchBox"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar protocolo, campanha, etiqueta ou responsável..." /></label>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo">
          <option value="ALL">Todos os tipos</option><option value="DESIGN">Design</option><option value="VIDEO">Vídeo</option><option value="PHOTO">Fotografia</option><option value="COPY">Redação</option><option value="SOCIAL">Social media</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} aria-label="Filtrar por prioridade">
          <option value="ALL">Todas as prioridades</option><option value="URGENT">Urgente</option><option value="HIGH">Alta</option><option value="NORMAL">Normal</option><option value="LOW">Baixa</option>
        </select>
        <span className="resultCount">{filteredDemands.length} demanda(s)</span>
      </div>

      <div className="board" id="board">
        {KANBAN_STATUSES.map(status => (
          <section key={status} className={`column status-${status}`} onDragOver={e => e.preventDefault()} onDrop={() => { if (draggedId) moveDemand(draggedId, status); setDraggedId(null); }}>
            <div className="columnHeader">
              <div className="columnTitle"><span className="statusDot" /><span>{STATUS_LABELS[status]}</span></div>
              <span className="count">{grouped[status]?.length ?? 0}</span>
            </div>

            <div className="cardList">
              {(grouped[status] ?? []).map(demand => {
                const people = [demand.assignee, ...(demand.members ?? [])].filter(Boolean) as { name: string }[];
                const checklistTotal = demand.checklistTotal ?? 0;
                const checklistDone = demand.checklistDone ?? 0;
                return (
                  <article key={demand.id} draggable onDragStart={() => setDraggedId(demand.id)} className={`card premiumCard${demand.coverUrl ? ' hasCover' : ''}`}>
                    <div className="cardAccent" />
                    <Link href={`/demandas/${demand.id}`} className="cardMainLink" prefetch={false}>
                      {demand.coverUrl && (
                        <div className="cardCover" style={{ backgroundImage: `linear-gradient(180deg, rgba(5,26,18,.02), rgba(5,26,18,.28)), url(${JSON.stringify(demand.coverUrl).slice(1, -1)})` }}>
                          <span className="cardCoverBadge">Prévia</span>
                        </div>
                      )}

                      <div className="premiumCardBody">
                        {(demand.labels?.length ?? 0) > 0 && (
                          <div className="cardLabels">
                            {demand.labels!.slice(0, 4).map(label => <span key={label.id} className={`projectLabel label-${label.color}`}>{label.name}</span>)}
                            {demand.labels!.length > 4 && <span className="labelMore">+{demand.labels!.length - 4}</span>}
                          </div>
                        )}

                        <div className="cardTop">
                          <span className="protocol">{demand.protocol}</span>
                          <span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span>
                        </div>
                        <h3>{demand.title}</h3>
                        {demand.department && <div className="departmentLine"><span className="departmentCode">{demand.department.code}</span><span>{demand.department.name}</span></div>}

                        <div className="premiumMetaRow">
                          <span className="typeBadge"><b>{TYPE_ICONS[demand.type] ?? '•'}</b>{TYPE_LABELS[demand.type] ?? demand.type}</span>
                          {demand.dueAt && <span className="compactMetric">◷ {new Date(demand.dueAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>}
                        </div>

                        <div className="premiumCardFooter">
                          <div className="cardMetrics">
                            {(demand.assetCount ?? 0) > 0 && <span title="Anexos">⌕ {demand.assetCount}</span>}
                            {checklistTotal > 0 && <span className={checklistDone === checklistTotal ? 'metricDone' : ''} title="Checklist">✓ {checklistDone}/{checklistTotal}</span>}
                          </div>
                          <div className="avatarStack" aria-label="Equipe da demanda">
                            {people.length ? people.slice(0, 3).map((person, index) => <span key={`${person.name}-${index}`} className="stackAvatar" title={person.name}>{initials(person.name)}</span>) : <span className="unassignedDot" title="Sem responsável">+</span>}
                            {people.length > 3 && <span className="stackAvatar morePeople">+{people.length - 3}</span>}
                          </div>
                        </div>
                      </div>
                    </Link>

                    {!demand.assignee && !['DELIVERED', 'ARCHIVED'].includes(demand.status) && <div className="cardActions"><ClaimDemandButton demandId={demand.id} compact onClaimed={applyClaimedDemand} /></div>}
                  </article>
                );
              })}
              {!grouped[status]?.length && <div className="empty"><span className="emptyIcon">✓</span><strong>Sem demandas</strong><span>Nada nesta etapa por enquanto.</span></div>}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
