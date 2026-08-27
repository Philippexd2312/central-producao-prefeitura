'use client';

import Link from 'next/link';
import { ChangeEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Version = {
  id: string;
  number: number;
  name: string;
  url: string;
  mimeType: string | null;
  note: string | null;
  final: boolean;
  createdAt: string;
  submittedBy: { name: string } | null;
};

type DemandInfo = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  priority: string;
  dueAt: string | null;
  approvedAt: string | null;
  deliveredAt: string | null;
  department: { code: string; name: string } | null;
  assignee: { name: string } | null;
  versions: Version[];
};

const MAX_BYTES = 4 * 1024 * 1024;

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function fmt(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function ProductionDelivery({ demand, manager }: { demand: DemandInfo; manager: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const latest = demand.versions[0] ?? null;
  const canSubmitVersion = !manager && ['IN_PRODUCTION', 'CHANGES_REQUESTED'].includes(demand.status);
  const canDeliver = ['APPROVED'].includes(demand.status);

  const statusLabel = useMemo(() => ({
    IN_PRODUCTION: 'Em produção',
    CHANGES_REQUESTED: 'Alteração solicitada',
    WAITING_APPROVAL: 'Aguardando aprovação',
    APPROVED: 'Aprovado para entrega',
    DELIVERED: 'Entregue',
  } as Record<string, string>)[demand.status] || demand.status, [demand.status]);

  async function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const next = event.target.files?.[0] || null;
    if (!next) return;
    if (next.size > MAX_BYTES) {
      alert('Use um arquivo de até 4 MB nesta versão.');
      event.target.value = '';
      return;
    }
    setFile(next);
    if (next.type.startsWith('image/')) setPreview(URL.createObjectURL(next));
    else setPreview(null);
  }

  async function send(action: 'submit_version' | 'deliver') {
    if (busy) return;
    if (action === 'submit_version' && !file) {
      alert('Selecione o arquivo que será enviado para aprovação.');
      return;
    }
    setBusy(true);
    try {
      const payload: any = { action, note };
      if (file) {
        payload.file = {
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          url: await fileToDataUrl(file),
        };
      }
      const res = await fetch(`/api/demands/${demand.id}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
      setFile(null);
      setPreview(null);
      setNote('');
      router.refresh();
      if (action === 'submit_version') router.push('/meu-painel');
      if (action === 'deliver') router.push(`/demandas/${demand.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao salvar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="deliveryWorkspace">
      <div className="deliveryHeader">
        <div>
          <Link href={`/demandas/${demand.id}`} className="deliveryBack">← Voltar para a demanda</Link>
          <span className="sectionKicker">PRODUÇÃO & ENTREGA</span>
          <h1>{demand.title}</h1>
          <p>{demand.protocol} · {demand.department?.code || 'Sem secretaria'}</p>
        </div>
        <div className={`deliveryStatus status-${demand.status}`}>
          <span />
          <div><small>Status atual</small><strong>{statusLabel}</strong></div>
        </div>
      </div>

      <div className="deliverySummaryGrid">
        <div><span>Responsável</span><strong>{demand.assignee?.name || 'Sem responsável'}</strong></div>
        <div><span>Prazo</span><strong>{fmt(demand.dueAt)}</strong></div>
        <div><span>Aprovado em</span><strong>{fmt(demand.approvedAt)}</strong></div>
        <div><span>Entregue em</span><strong>{fmt(demand.deliveredAt)}</strong></div>
      </div>

      <div className="deliveryGrid">
        <section className="deliveryPanel">
          <div className="deliveryPanelTitle">
            <div><span className="sectionKicker">VERSÕES</span><h2>Histórico de arquivos</h2></div>
            <span>{demand.versions.length}</span>
          </div>

          {demand.versions.length === 0 ? (
            <div className="deliveryEmpty">Nenhuma versão enviada ainda.</div>
          ) : (
            <div className="versionList">
              {demand.versions.map(version => (
                <a href={version.url} target="_blank" rel="noreferrer" className={`versionCard${version.final ? ' finalVersion' : ''}`} key={version.id}>
                  <div className="versionPreview">
                    {version.mimeType?.startsWith('image/') ? <img src={version.url} alt="" /> : <span>{version.mimeType?.startsWith('video/') ? '▶' : '▤'}</span>}
                  </div>
                  <div className="versionInfo">
                    <div><strong>Versão {version.number}</strong>{version.final && <b>FINAL</b>}</div>
                    <span>{version.name}</span>
                    <small>{version.submittedBy?.name || 'Equipe'} · {fmt(version.createdAt)}</small>
                    {version.note && <p>{version.note}</p>}
                  </div>
                  <span className="versionOpen">↗</span>
                </a>
              ))}
            </div>
          )}
        </section>

        <aside className="deliveryActionPanel">
          {canSubmitVersion && (
            <>
              <span className="sectionKicker">ENVIAR PARA APROVAÇÃO</span>
              <h2>{latest ? `Enviar Versão ${latest.number + 1}` : 'Enviar Versão 1'}</h2>
              <p>O arquivo fica registrado e a demanda vai automaticamente para a Central de Aprovação.</p>
              <label className="deliveryUpload">
                <input type="file" onChange={chooseFile} accept="image/*,video/*,.pdf,.psd,.ai,.cdr,.svg,.zip" hidden />
                {preview ? <img src={preview} alt="Prévia" /> : <span className="deliveryUploadIcon">＋</span>}
                <strong>{file?.name || 'Selecionar arquivo'}</strong>
                <small>Imagem, vídeo, PDF, PSD, CDR, AI... até 4 MB</small>
              </label>
              <label className="deliveryNoteLabel">Observação da versão
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: Ajustei as cores e atualizei as logos..." />
              </label>
              <button className="deliveryPrimary" disabled={busy || !file} onClick={() => send('submit_version')}>{busy ? 'Enviando...' : '✓ Enviar para aprovação'}</button>
            </>
          )}

          {demand.status === 'WAITING_APPROVAL' && (
            <div className="waitingApprovalBox"><span>◷</span><div><strong>Aguardando decisão</strong><p>A versão mais recente já está na Central de Aprovação.</p></div></div>
          )}

          {canDeliver && (
            <>
              <span className="sectionKicker">ENTREGA FINAL</span>
              <h2>Concluir entrega</h2>
              <p>A peça já foi aprovada. Anexe o arquivo final ou use a última versão aprovada.</p>
              <label className="deliveryUpload compact">
                <input type="file" onChange={chooseFile} accept="image/*,video/*,.pdf,.psd,.ai,.cdr,.svg,.zip" hidden />
                {preview ? <img src={preview} alt="Prévia" /> : <span className="deliveryUploadIcon">✓</span>}
                <strong>{file?.name || 'Arquivo final (opcional)'}</strong>
                <small>Se não anexar, a última versão aprovada será marcada como final.</small>
              </label>
              <label className="deliveryNoteLabel">Comprovante / observação
                <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: Entregue no WhatsApp da SEMSA e publicado no Instagram." />
              </label>
              <button className="deliveryPrimary final" disabled={busy} onClick={() => send('deliver')}>{busy ? 'Concluindo...' : '✓ Marcar como entregue'}</button>
            </>
          )}

          {demand.status === 'DELIVERED' && (
            <div className="deliveryDoneBox"><span>✓</span><div><strong>Entrega concluída</strong><p>O arquivo final e o histórico ficaram registrados nesta demanda.</p></div></div>
          )}
        </aside>
      </div>
    </div>
  );
}
