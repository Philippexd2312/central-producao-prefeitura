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

export default function KanbanBoard({ initialDemands }: { initialDemands: DemandCard[] }) {
  const [demands, setDemands] = useState(initialDemands);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return Object.fromEntries(KANBAN_STATUSES.map(status => [status, demands.filter(d => d.status === status)]));
  }, [demands]);

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
    <div className="board">
      {KANBAN_STATUSES.map(status => (
        <section
          key={status}
          className="column"
          onDragOver={e => e.preventDefault()}
          onDrop={() => {
            if (draggedId) moveDemand(draggedId, status);
            setDraggedId(null);
          }}
        >
          <div className="columnHeader">
            <span>{STATUS_LABELS[status]}</span>
            <span className="count">{grouped[status]?.length ?? 0}</span>
          </div>

          {(grouped[status] ?? []).map(demand => (
            <Link
              href={`/demandas/${demand.id}`}
              key={demand.id}
              draggable
              onDragStart={() => setDraggedId(demand.id)}
              className="card"
            >
              <div className="cardTop">
                <span className="protocol">{demand.protocol}</span>
                <span className={`badge priority-${demand.priority}`}>{demand.priority}</span>
              </div>
              <h3>{demand.title}</h3>
              {demand.department && <div className="department">{demand.department.code} · {demand.department.name}</div>}
              <div className="meta">
                <span className="badge">{demand.type}</span>
                {demand.assignee && <span className="badge">👤 {demand.assignee.name}</span>}
              </div>
              {demand.dueAt && <div className="due">Prazo: {new Date(demand.dueAt).toLocaleString('pt-BR')}</div>}
            </Link>
          ))}
          {!grouped[status]?.length && <div className="empty">Sem demandas</div>}
        </section>
      ))}
    </div>
  );
}
