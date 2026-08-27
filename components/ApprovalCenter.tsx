'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type ApprovalDemand = {
  id: string;
  protocol: string;
  title: string;
  priority: string;
  dueAt: string | null;
  department: { code: string; name: string } | null;
  assignee: { name: string } | null;
  latestVersion: {
    id: string;
    number: number;
    name: string;
    url: string;
    mimeType: string | null;
    note: string | null;
    createdAt: string;
    submittedBy: { name: string } | null;
  } | null;
};

function fmt(value: string | null) {
  if (!value) return 'Sem prazo';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ApprovalCenter({ initialDemands }: { initialDemands: ApprovalDemand[] }) {
  const router = useRouter();
  const [demands, setDemands] = useState(initialDemands);
  const [selected, setSelected] = useState<ApprovalDemand | null>(initialDemands[0] ?? null);
  const [changeNote, setChangeNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function act(action: 'approve' | 'request_changes') {
    if (!selected || busy) return;
    if (action === 'request_changes' && !changeNote.trim()) {
      alert('Escreva o que precisa ser alterado.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/demands/${selected.id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: changeNote }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível concluir a aprovação.');
      const remaining = demands.filter(item => item.id !== selected.id);
      setDemands(remaining);
      setSelected(remaining[0] ?? null);
      setChangeNote('');
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="approvalCenter">
      <div className="approvalHeader">
        <div><span className="sectionKicker">CENTRAL DE APROVAÇÃO</span><h1>Trabalhos aguardando decisão</h1><p>Revise a última versão enviada, aprove ou devolva com uma orientação clara.</p></div>
        <div className="approvalCounter"><span>Pendentes</span><strong>{demands.length}</strong></div>
      </div>

      {demands.length === 0 ? (
        <div className="approvalEmpty"><span>✓</span><h2>Nada pendente</h2><p>Todas as versões enviadas pela equipe já foram revisadas.</p></div>
      ) : (
        <div className="approvalLayout">
          <aside className="approvalQueue">
            <div className="approvalQueueTitle"><strong>Fila de aprovação</strong><span>{demands.length}</span></div>
            {demands.map(item => (
              <button key={item.id} className={`approvalQueueItem${selected?.id === item.id ? ' active' : ''}`} onClick={() => { setSelected(item); setChangeNote(''); }}>
                <div><span>{item.protocol}</span><b>{item.latestVersion ? `V${item.latestVersion.number}` : 'Sem versão'}</b></div>
                <strong>{item.title}</strong>
                <small>{item.department?.code || 'Sem secretaria'} · {item.assignee?.name || 'Sem responsável'}</small>
              </button>
            ))}
          </aside>

          {selected && (
            <main className="approvalReview">
              <div className="approvalReviewHead">
                <div><span>{selected.protocol}</span><h2>{selected.title}</h2><p>{selected.department?.name || 'Sem secretaria'} · Prazo {fmt(selected.dueAt)}</p></div>
                <Link href={`/demandas/${selected.id}`} className="approvalOpenDemand">Abrir demanda ↗</Link>
              </div>

              <div className="approvalPreview">
                {selected.latestVersion ? (
                  selected.latestVersion.mimeType?.startsWith('image/') ? (
                    <img src={selected.latestVersion.url} alt={`Versão ${selected.latestVersion.number}`} />
                  ) : selected.latestVersion.mimeType?.startsWith('video/') ? (
                    <video controls src={selected.latestVersion.url} />
                  ) : (
                    <a className="approvalFilePreview" href={selected.latestVersion.url} target="_blank" rel="noreferrer"><span>▤</span><strong>{selected.latestVersion.name}</strong><small>Abrir arquivo ↗</small></a>
                  )
                ) : <div className="approvalNoVersion">Nenhuma versão encontrada.</div>}
              </div>

              {selected.latestVersion && (
                <div className="approvalVersionMeta">
                  <div><span>Versão</span><strong>V{selected.latestVersion.number}</strong></div>
                  <div><span>Enviado por</span><strong>{selected.latestVersion.submittedBy?.name || 'Equipe'}</strong></div>
                  <div><span>Enviado em</span><strong>{fmt(selected.latestVersion.createdAt)}</strong></div>
                  <div><span>Arquivo</span><strong>{selected.latestVersion.name}</strong></div>
                  {selected.latestVersion.note && <p>{selected.latestVersion.note}</p>}
                </div>
              )}

              <div className="approvalDecision">
                <label>Orientação para alteração
                  <textarea value={changeNote} onChange={e => setChangeNote(e.target.value)} placeholder="Se precisar devolver, explique exatamente o que o designer deve corrigir..." />
                </label>
                <div className="approvalButtons">
                  <button className="requestChangesButton" disabled={busy} onClick={() => act('request_changes')}>↻ Pedir alteração</button>
                  <button className="approveButton" disabled={busy || !selected.latestVersion} onClick={() => act('approve')}>{busy ? 'Salvando...' : '✓ Aprovar versão'}</button>
                </div>
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
}
