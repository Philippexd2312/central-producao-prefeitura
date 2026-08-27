import Link from 'next/link';

type AttentionItem = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  dueAt: string | null;
  department: { code: string; name: string } | null;
  assignee: { name: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  WAITING_APPROVAL: 'Precisa aprovação',
  CHANGES_REQUESTED: 'Alteração solicitada',
  IN_PRODUCTION: 'Em produção',
  WAITING_ASSIGNEE: 'Sem responsável',
};

function dueLabel(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  const now = new Date();
  const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return `Atrasada ${Math.abs(diff)} dia(s)`;
  if (diff === 0) return 'Vence hoje';
  if (diff === 1) return 'Vence amanhã';
  return null;
}

export default function ManagerAttention({ items, approvalCount, lateCount, changesCount }: { items: AttentionItem[]; approvalCount: number; lateCount: number; changesCount: number }) {
  if (!approvalCount && !lateCount && !changesCount) return null;

  return (
    <section className="managerAttention">
      <div className="managerAttentionHead">
        <div><span className="sectionKicker">GESTÃO</span><h2>Precisa da minha atenção</h2></div>
        <div className="attentionCounters">
          <Link href="/aprovacoes"><b>{approvalCount}</b><span>Aprovações</span></Link>
          <div className="attentionCounter danger"><b>{lateCount}</b><span>Atrasadas</span></div>
          <div className="attentionCounter purple"><b>{changesCount}</b><span>Alterações</span></div>
        </div>
      </div>

      <div className="attentionList">
        {items.map(item => {
          const due = dueLabel(item.dueAt);
          return (
            <Link href={item.status === 'WAITING_APPROVAL' ? '/aprovacoes' : `/demandas/${item.id}`} className={`attentionItem status-${item.status}`} key={item.id}>
              <span className="attentionDot" />
              <div className="attentionMain">
                <div><span>{item.protocol}</span><b>{STATUS_LABELS[item.status] || item.status}</b></div>
                <strong>{item.title}</strong>
                <small>{item.department?.code || 'Sem secretaria'} · {item.assignee?.name || 'Sem responsável'}</small>
              </div>
              {due && <span className={`attentionDue${due.startsWith('Atrasada') ? ' late' : ''}`}>{due}</span>}
              <span className="attentionArrow">→</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
