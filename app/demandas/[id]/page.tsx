import { db } from '@/lib/db';
import { STATUS_LABELS } from '@/types/demand';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function DemandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const demand = await db.demand.findUnique({
    where: { id },
    include: {
      department: true,
      assignee: true,
      assets: true,
      comments: { include: { author: true }, orderBy: { createdAt: 'desc' } },
      history: { orderBy: { createdAt: 'desc' } },
    },
  });

  if (!demand) notFound();

  return (
    <div className="page detail">
      <div className="detailHeader">
        <div>
          <span className="protocol">{demand.protocol}</span>
          <h1>{demand.title}</h1>
        </div>
        <span className={`badge priority-${demand.priority}`}>{demand.priority}</span>
      </div>

      <div className="detailGrid">
        <div className="panel">
          <h2 className="sectionTitle">Briefing organizado</h2>
          <div className="copyBox">{demand.briefing || 'Ainda não organizado.'}</div>
          {demand.missingInfo && <p className="error">{demand.missingInfo}</p>}

          <h2 className="sectionTitle" style={{ marginTop: 24 }}>Mensagem original</h2>
          <div className="copyBox">{demand.originalText || 'Sem texto.'}</div>
        </div>

        <aside className="panel">
          <h2 className="sectionTitle">Dados da produção</h2>
          <div className="infoList">
            <div className="infoRow"><span>Status</span><strong>{STATUS_LABELS[demand.status] || demand.status}</strong></div>
            <div className="infoRow"><span>Secretaria</span><strong>{demand.department?.code || '—'}</strong></div>
            <div className="infoRow"><span>Tipo</span><strong>{demand.type}</strong></div>
            <div className="infoRow"><span>Responsável</span><strong>{demand.assignee?.name || 'Livre'}</strong></div>
            <div className="infoRow"><span>Solicitante</span><strong>{demand.requesterName || '—'}</strong></div>
            <div className="infoRow"><span>Origem</span><strong>{demand.source}</strong></div>
            <div className="infoRow"><span>Prazo</span><strong>{demand.dueAt ? demand.dueAt.toLocaleString('pt-BR') : '—'}</strong></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
