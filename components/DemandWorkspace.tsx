'use client';

import ClaimDemandButton from '@/components/ClaimDemandButton';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

type Asset = { id: string; name: string; url: string; mimeType: string | null; kind: string; createdAt: string };
type Comment = { id: string; text: string; createdAt: string; author: { name: string } | null };
type History = { id: string; action: string; fromValue: string | null; toValue: string | null; createdAt: string; actor: { name: string } | null };

type DemandData = {
  id: string;
  protocol: string;
  title: string;
  status: string;
  statusLabel: string;
  priority: string;
  type: string;
  briefing: string | null;
  revisedText: string | null;
  missingInfo: string | null;
  originalText: string | null;
  requesterName: string | null;
  requesterPhone: string | null;
  source: string;
  dueAt: string | null;
  createdAt: string;
  department: { code: string; name: string } | null;
  assignee: { name: string } | null;
  assets: Asset[];
  comments: Comment[];
  history: History[];
};

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nova', AI_TRIAGE: 'IA organizando', BRIEFING_READY: 'Briefing pronto', WAITING_ASSIGNEE: 'Aguardando responsável',
  IN_PRODUCTION: 'Em produção', INTERNAL_REVIEW: 'Revisão interna', WAITING_APPROVAL: 'Aguardando aprovação',
  CHANGES_REQUESTED: 'Alteração solicitada', APPROVED: 'Aprovado', DELIVERED: 'Entregue', ARCHIVED: 'Arquivado',
};

const PRIORITY_LABELS: Record<string, string> = { URGENT: 'Urgente', HIGH: 'Alta', NORMAL: 'Normal', LOW: 'Baixa' };
const TYPE_LABELS: Record<string, string> = { DESIGN: 'Design', VIDEO: 'Vídeo', PHOTO: 'Fotografia', COPY: 'Redação', SOCIAL: 'Social media', OTHER: 'Outros' };
const TABS = ['Visão geral', 'Materiais', 'Comentários', 'Histórico', 'Aprovação'] as const;

function fmt(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

function historyLabel(action: string) {
  const map: Record<string, string> = {
    DEMAND_CLAIMED: 'Demanda assumida', STATUS_CHANGED: 'Status alterado', CREATED: 'Demanda criada',
  };
  return map[action] ?? action.replaceAll('_', ' ').toLowerCase();
}

export default function DemandWorkspace({ demand }: { demand: DemandData }) {
  const router = useRouter();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Visão geral');
  const [status, setStatus] = useState(demand.status);
  const [updating, setUpdating] = useState(false);

  const images = useMemo(() => demand.assets.filter(a => a.mimeType?.startsWith('image/') || ['IMAGE','LOGO','REFERENCE','PREVIEW','FINAL'].includes(a.kind)), [demand.assets]);
  const otherAssets = useMemo(() => demand.assets.filter(a => !images.some(i => i.id === a.id)), [demand.assets, images]);

  async function updateStatus(nextStatus: string) {
    if (updating || nextStatus === status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/demands/${demand.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error();
      setStatus(nextStatus);
      router.refresh();
    } catch {
      alert('Não foi possível atualizar o status.');
    } finally {
      setUpdating(false);
    }
  }

  const canClaim = !demand.assignee && !['DELIVERED', 'ARCHIVED'].includes(status);

  return (
    <div className="demandWorkspace">
      <div className="demandHero">
        <div className="demandHeroMain">
          <div className="demandEyebrow">{demand.protocol}</div>
          <h1>{demand.title}</h1>
          <div className="demandHeroMeta">
            {demand.department && <span className="heroPill">{demand.department.code}</span>}
            <span className="heroPill">{TYPE_LABELS[demand.type] ?? demand.type}</span>
            <span className={`heroPill priorityPill priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span>
            <span className="heroPill statusPill">{STATUS_LABELS[status] ?? status}</span>
            {demand.dueAt && <span className="heroPill duePill">Prazo: {fmt(demand.dueAt)}</span>}
          </div>
        </div>
        <div className="demandHeroActions">
          {canClaim && <ClaimDemandButton demandId={demand.id} />}
          <select value={status} onChange={e => updateStatus(e.target.value)} disabled={updating} className="statusSelect">
            {Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
          </select>
          <button className="actionBtn actionBtnGold" onClick={() => updateStatus('WAITING_APPROVAL')} disabled={updating}>Enviar para aprovação</button>
          <button className="actionBtn actionBtnDark" onClick={() => updateStatus('DELIVERED')} disabled={updating}>Concluir</button>
        </div>
      </div>

      <div className="demandTabs">
        {TABS.map(item => (
          <button key={item} className={tab === item ? 'demandTab active' : 'demandTab'} onClick={() => setTab(item)}>
            {item}
            {item === 'Materiais' && demand.assets.length > 0 && <span>{demand.assets.length}</span>}
            {item === 'Comentários' && demand.comments.length > 0 && <span>{demand.comments.length}</span>}
          </button>
        ))}
      </div>

      <div className="demandLayout">
        <section className="demandMainCard">
          {tab === 'Visão geral' && (
            <div className="overviewStack">
              <section className="contentSection aiSection">
                <div className="sectionIcon">✦</div>
                <div>
                  <span className="sectionOverline">RESUMO DA IA</span>
                  <h2>Briefing organizado</h2>
                  <p className="richText">{demand.briefing || 'Ainda não organizado pela IA.'}</p>
                </div>
              </section>

              {demand.missingInfo && (
                <section className="missingInfoBox">
                  <strong>⚠ Informação pendente</strong>
                  <p>{demand.missingInfo}</p>
                </section>
              )}

              <section className="contentSection">
                <span className="sectionOverline">TEXTO REVISADO</span>
                <h2>Conteúdo pronto para produção</h2>
                <p className="richText">{demand.revisedText || demand.briefing || 'Sem texto revisado.'}</p>
              </section>

              <section className="contentSection originalSection">
                <span className="sectionOverline">SOLICITAÇÃO ORIGINAL</span>
                <h2>Mensagem recebida</h2>
                <p className="richText mutedText">{demand.originalText || 'Sem mensagem original.'}</p>
              </section>

              <section className="quickMaterials">
                <div className="sectionTitleRow"><div><span className="sectionOverline">MATERIAIS</span><h2>Arquivos recebidos</h2></div><button onClick={() => setTab('Materiais')} className="textButton">Ver todos</button></div>
                {demand.assets.length === 0 ? <div className="emptyState">Nenhum material anexado ainda.</div> : (
                  <div className="assetMiniGrid">
                    {demand.assets.slice(0, 4).map(asset => <div className="assetMini" key={asset.id}><span>▣</span><div><strong>{asset.name}</strong><small>{asset.kind}</small></div></div>)}
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === 'Materiais' && (
            <div>
              <div className="sectionTitleRow"><div><span className="sectionOverline">ARQUIVOS DA DEMANDA</span><h2>Materiais recebidos</h2></div><button className="actionBtn actionBtnGreen" disabled>+ Adicionar arquivos</button></div>
              {demand.assets.length === 0 ? <div className="bigEmptyState"><span>▣</span><strong>Nenhum arquivo anexado</strong><p>Fotos, vídeos, áudios, PDFs e logos recebidos aparecerão aqui.</p></div> : (
                <>
                  {images.length > 0 && <div className="assetGallery">{images.map(asset => <a href={asset.url} target="_blank" rel="noreferrer" className="imageAsset" key={asset.id}><div className="imagePreview">Imagem</div><strong>{asset.name}</strong><small>{asset.kind}</small></a>)}</div>}
                  {otherAssets.length > 0 && <div className="fileList">{otherAssets.map(asset => <a href={asset.url} target="_blank" rel="noreferrer" className="fileRow" key={asset.id}><span className="fileIcon">▤</span><div><strong>{asset.name}</strong><small>{asset.mimeType || asset.kind}</small></div><span>↗</span></a>)}</div>}
                </>
              )}
            </div>
          )}

          {tab === 'Comentários' && (
            <div>
              <div className="sectionTitleRow"><div><span className="sectionOverline">EQUIPE</span><h2>Comentários</h2></div></div>
              {demand.comments.length === 0 ? <div className="bigEmptyState"><span>◌</span><strong>Sem comentários</strong><p>As observações da equipe aparecerão aqui.</p></div> : (
                <div className="commentList">{demand.comments.map(comment => <div className="commentItem" key={comment.id}><div className="commentAvatar">{comment.author?.name?.charAt(0) || 'C'}</div><div><div className="commentMeta"><strong>{comment.author?.name || 'Equipe'}</strong><span>{fmt(comment.createdAt)}</span></div><p>{comment.text}</p></div></div>)}</div>
              )}
              <div className="commentComposer"><textarea placeholder="Escrever um comentário..." disabled/><button disabled>Enviar</button></div>
            </div>
          )}

          {tab === 'Histórico' && (
            <div>
              <div className="sectionTitleRow"><div><span className="sectionOverline">RASTREABILIDADE</span><h2>Linha do tempo</h2></div></div>
              <div className="timeline">
                <div className="timelineItem"><span className="timelineDot"/><div><strong>Demanda recebida</strong><p>{fmt(demand.createdAt)}</p></div></div>
                {demand.history.map(item => <div className="timelineItem" key={item.id}><span className="timelineDot"/><div><strong>{historyLabel(item.action)}</strong><p>{item.actor?.name ? `${item.actor.name} · ` : ''}{fmt(item.createdAt)}</p>{item.fromValue && item.toValue && <small>{STATUS_LABELS[item.fromValue] ?? item.fromValue} → {STATUS_LABELS[item.toValue] ?? item.toValue}</small>}</div></div>)}
              </div>
            </div>
          )}

          {tab === 'Aprovação' && (
            <div>
              <div className="sectionTitleRow"><div><span className="sectionOverline">APROVAÇÃO</span><h2>Prévia para aprovação</h2></div></div>
              <div className="approvalBox">
                <div className="approvalPreview">{images.length ? <span>{images.length} imagem(ns) disponível(is)</span> : <span>Nenhuma prévia enviada ainda</span>}</div>
                <div className="approvalActions"><button className="actionBtn actionBtnGold" onClick={() => updateStatus('WAITING_APPROVAL')}>Enviar para aprovação</button><button className="actionBtn actionBtnGreen" onClick={() => updateStatus('APPROVED')}>Marcar como aprovado</button><button className="actionBtn actionBtnPurple" onClick={() => updateStatus('CHANGES_REQUESTED')}>Registrar alteração</button></div>
              </div>
            </div>
          )}
        </section>

        <aside className="demandSidebarCard">
          <div className="sidebarCardSection">
            <span className="sectionOverline">PRODUÇÃO</span>
            <h3>Dados da demanda</h3>
          </div>
          <div className="detailInfoRows">
            <div><span>Status</span><strong>{STATUS_LABELS[status] ?? status}</strong></div>
            <div><span>Responsável</span><strong>{demand.assignee?.name || 'Livre'}</strong></div>
            <div><span>Secretaria</span><strong>{demand.department?.code || '—'}</strong></div>
            <div><span>Tipo</span><strong>{TYPE_LABELS[demand.type] ?? demand.type}</strong></div>
            <div><span>Prioridade</span><strong>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</strong></div>
            <div><span>Prazo</span><strong>{fmt(demand.dueAt)}</strong></div>
          </div>
          <div className="sidebarDivider"/>
          <div className="sidebarCardSection"><span className="sectionOverline">SOLICITANTE</span><h3>{demand.requesterName || 'Não informado'}</h3><p>{demand.requesterPhone || 'Telefone não informado'}</p><p>Origem: {demand.source}</p></div>
          <div className="sidebarDivider"/>
          <div className="sidebarCardSection"><span className="sectionOverline">ENTRADA</span><h3>{fmt(demand.createdAt)}</h3></div>
        </aside>
      </div>
    </div>
  );
}
