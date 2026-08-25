'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { KANBAN_STATUSES, STATUS_LABELS } from '@/types/demand';

type DemandCard = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  dueAt: string | null;
  department?: { name: string; code: string } | null;
  assignee?: { name: string } | null;
};

const TYPE_LABELS: Record<string, string> = {
  DESIGN: 'Design',
  VIDEO: 'Vídeo',
  PHOTO: 'Fotografia',
  COPY: 'Redação',
  SOCIAL: 'Social media',
  OTHER: 'Outros',
};

const TYPE_ICONS: Record<string, string> = {
  DESIGN: '✦',
  VIDEO: '▶',
  PHOTO: '◉',
  COPY: 'T',
  SOCIAL: '#',
  OTHER: '•',
};

const PRIORITY_LABELS: Record<string, string> = {
  URGENT: 'Urgente',
  HIGH: 'Alta',
  NORMAL: 'Normal',
  LOW: 'Baixa',
};

export default function KanbanBoard({ initialDemands }: { initialDemands: DemandCard[] }) {
  const [demands, setDemands] = useState(initialDemands);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const filteredDemands = useMemo(() => {
    const term = search.trim().toLowerCase();
    return demands.filter(d => {
      const matchesSearch = !term || [
        d.title,
        d.protocol,
        d.department?.name,
        d.department?.code,
        d.assignee?.name,
      ].some(value => value?.toLowerCase().includes(term));
      const matchesType = typeFilter === 'ALL' || d.type === typeFilter;
      const matchesPriority = priorityFilter === 'ALL' || d.priority === priorityFilter;
      return matchesSearch && matchesType && matchesPriority;
    });
  }, [demands, search, typeFilter, priorityFilter]);

  const grouped = useMemo(() => {
    return Object.fromEntries(KANBAN_STATUSES.map(status => [status, filteredDemands.filter(d => d.status === status)]));
  }, [filteredDemands]);

  async function moveDemand(id: string, status: string) {
    const before = demands;
    setDemands(current => current.map(d => d.id === id ? { ...d, status } : d));
    try {
      const res = await fetch(`/api/demands/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar');
    } catch {
      setDemands(before);
      alert('Não foi possível mover a demanda.');
    }
  }

  return (
    <div>
      <div className="boardToolbar">
        <label className="searchBox">
          <span>⌕</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar protocolo, campanha, secretaria ou responsável..."
          />
        </label>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} aria-label="Filtrar por tipo">
          <option value="ALL">Todos os tipos</option>
          <option value="DESIGN">Design</option>
          <option value="VIDEO">Vídeo</option>
          <option value="PHOTO">Fotografia</option>
          <option value="COPY">Redação</option>
          <option value="SOCIAL">Social media</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} aria-label="Filtrar por prioridade">
          <option value="ALL">Todas as prioridades</option>
          <option value="URGENT">Urgente</option>
          <option value="HIGH">Alta</option>
          <option value="NORMAL">Normal</option>
          <option value="LOW">Baixa</option>
        </select>
        <span className="resultCount">{filteredDemands.length} demanda(s)</span>
      </div>

      <div className="board" id="board">
        {KANBAN_STATUSES.map(status => (
          <section
            key={status}
            className={`column status-${status}`}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (draggedId) moveDemand(draggedId, status);
              setDraggedId(null);
            }}
          >
            <div className="columnHeader">
              <div className="columnTitle">
                <span className="statusDot" />
                <span>{STATUS_LABELS[status]}</span>
              </div>
              <span className="count">{grouped[status]?.length ?? 0}</span>
            </div>

            <div className="cardList">
              {(grouped[status] ?? []).map(demand => (
                <Link
                  href={`/demandas/${demand.id}`}
                  key={demand.id}
                  draggable
                  onDragStart={() => setDraggedId(demand.id)}
                  className="card"
                >
                  <div className="cardAccent" />
                  <div className="cardTop">
                    <span className="protocol">{demand.protocol}</span>
                    <span className={`badge priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span>
                  </div>
                  <h3>{demand.title}</h3>
                  {demand.department && (
                    <div className="departmentLine">
                      <span className="departmentCode">{demand.department.code}</span>
                      <span>{demand.department.name}</span>
                    </div>
                  )}
                  <div className="meta">
                    <span className="typeBadge"><b>{TYPE_ICONS[demand.type] ?? '•'}</b>{TYPE_LABELS[demand.type] ?? demand.type}</span>
                    {demand.assignee ? (
                      <span className="assigneeBadge"><span className="miniAvatar">{demand.assignee.name.charAt(0)}</span>{demand.assignee.name}</span>
                    ) : (
                      <span className="unassignedBadge">Sem responsável</span>
                    )}
                  </div>
                  {demand.dueAt && (
                    <div className="due">◷ Prazo: {new Date(demand.dueAt).toLocaleString('pt-BR')}</div>
                  )}
                </Link>
              ))}
              {!grouped[status]?.length && (
                <div className="empty">
                  <span className="emptyIcon">✓</span>
                  <strong>Sem demandas</strong>
                  <span>Nada nesta etapa por enquanto.</span>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
