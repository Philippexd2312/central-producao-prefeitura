'use client';

import ClaimDemandButton from '@/components/ClaimDemandButton';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

type Asset = { id: string; name: string; url: string; mimeType: string | null; kind: string; createdAt: string };
type Comment = { id: string; text: string; createdAt: string; author: { name: string } | null };
type History = { id: string; action: string; fromValue: string | null; toValue: string | null; createdAt: string; actor: { name: string } | null };
type ProjectLabel = { id: string; name: string; color: string };
type ChecklistItem = { id: string; text: string; completed: boolean };
type Person = { id: string; name: string; role: string };
type TeamPerson = Person & { availability: string };

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
  startAt: string | null;
  dueAt: string | null;
  coverUrl: string | null;
  createdAt: string;
  department: { code: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  members: Person[];
  labels: ProjectLabel[];
  checklistItems: ChecklistItem[];
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
const LABEL_COLORS = [
  { value: 'green', label: 'Verde' }, { value: 'gold', label: 'Dourado' }, { value: 'orange', label: 'Laranja' },
  { value: 'red', label: 'Vermelho' }, { value: 'purple', label: 'Roxo' }, { value: 'blue', label: 'Azul' },
  { value: 'teal', label: 'Turquesa' }, { value: 'pink', label: 'Rosa' },
];

function fmt(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}
function localInputValue(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}
function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'U';
}
function historyLabel(action: string) {
  const map: Record<string, string> = {
    DEMAND_CLAIMED: 'Demanda assumida', STATUS_CHANGED: 'Status alterado', CREATED: 'Demanda criada',
    LABEL_ADDED: 'Etiqueta adicionada', LABEL_REMOVED: 'Etiqueta removida', CHECKLIST_ITEM_ADDED: 'Item de checklist criado',
    CHECKLIST_ITEM_DONE: 'Item concluído', CHECKLIST_ITEM_REOPENED: 'Item reaberto', CHECKLIST_ITEM_REMOVED: 'Item removido',
    MEMBER_ADDED: 'Membro adicionado', MEMBER_REMOVED: 'Membro removido', COVER_SET: 'Capa alterada', COVER_REMOVED: 'Capa removida',
    ASSET_ADDED: 'Anexo adicionado',
  };
  return map[action] ?? action.replaceAll('_', ' ').toLowerCase();
}
function safeBackground(url: string) {
  return url.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export default function DemandWorkspace({ demand, team, manager }: { demand: DemandData; team: TeamPerson[]; manager: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState(demand.status);
  const [updating, setUpdating] = useState(false);
  const [sheet, setSheet] = useState<null | 'label' | 'checklist' | 'member' | 'asset' | 'cover'>(null);
  const [labels, setLabels] = useState(demand.labels);
  const [checklist, setChecklist] = useState(demand.checklistItems);
  const [members, setMembers] = useState(demand.members);
  const [assets, setAssets] = useState(demand.assets);
  const [comments, setComments] = useState(demand.comments);
  const [coverUrl, setCoverUrl] = useState(demand.coverUrl);
  const [labelName, setLabelName] = useState('');
  const [labelColor, setLabelColor] = useState('green');
  const [checkText, setCheckText] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [referenceName, setReferenceName] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [commentText, setCommentText] = useState('');
  const [busyAction, setBusyAction] = useState(false);

  const images = useMemo(() => assets.filter(a => a.mimeType?.startsWith('image/') || ['IMAGE', 'LOGO', 'REFERENCE', 'PREVIEW', 'FINAL'].includes(a.kind)), [assets]);
  const checklistDone = checklist.filter(item => item.completed).length;
  const progress = checklist.length ? Math.round((checklistDone / checklist.length) * 100) : 0;
  const people = useMemo(() => {
    const list: Person[] = [];
    if (demand.assignee) list.push({ id: demand.assignee.id, name: demand.assignee.name, role: 'RESPONSÁVEL' });
    for (const member of members) if (!list.some(item => item.id === member.id)) list.push(member);
    return list;
  }, [demand.assignee, members]);

  async function updateStatus(nextStatus: string) {
    if (updating || nextStatus === status) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/demands/${demand.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }) });
      if (!res.ok) throw new Error();
      setStatus(nextStatus);
      router.refresh();
    } catch { alert('Não foi possível atualizar o status.'); } finally { setUpdating(false); }
  }

  async function updateDate(field: 'startAt' | 'dueAt', value: string) {
    setBusyAction(true);
    try {
      const payload = value ? new Date(value).toISOString() : '';
      const res = await fetch(`/api/demands/${demand.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [field]: payload }) });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch { alert('Não foi possível alterar a data.'); } finally { setBusyAction(false); }
  }

  async function extra(action: string, payload: Record<string, unknown> = {}) {
    const res = await fetch(`/api/demands/${demand.id}/extras`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || 'Não foi possível concluir a ação.');
    return data;
  }

  async function addLabel() {
    if (!labelName.trim()) return;
    setBusyAction(true);
    try {
      const label = await extra('label:add', { name: labelName, color: labelColor });
      setLabels(current => [...current, label]); setLabelName('');
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao criar etiqueta.'); } finally { setBusyAction(false); }
  }
  async function removeLabel(id: string) {
    try { await extra('label:remove', { labelId: id }); setLabels(current => current.filter(label => label.id !== id)); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); }
  }
  async function addChecklist() {
    if (!checkText.trim()) return;
    setBusyAction(true);
    try { const item = await extra('checklist:add', { text: checkText }); setChecklist(current => [...current, item]); setCheckText(''); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); } finally { setBusyAction(false); }
  }
  async function toggleChecklist(item: ChecklistItem) {
    try { const updated = await extra('checklist:toggle', { itemId: item.id }); setChecklist(current => current.map(value => value.id === updated.id ? updated : value)); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); }
  }
  async function removeChecklist(id: string) {
    try { await extra('checklist:remove', { itemId: id }); setChecklist(current => current.filter(item => item.id !== id)); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); }
  }
  async function addMember() {
    if (!selectedMember) return;
    setBusyAction(true);
    try { const person = await extra('member:add', { userId: selectedMember }); setMembers(current => current.some(item => item.id === person.id) ? current : [...current, person]); setSelectedMember(''); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); } finally { setBusyAction(false); }
  }
  async function removeMember(id: string) {
    try { await extra('member:remove', { userId: id }); setMembers(current => current.filter(item => item.id !== id)); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); }
  }
  async function chooseCover(url: string | null) {
    setBusyAction(true);
    try { await extra('cover:set', { url: url || '' }); setCoverUrl(url); setSheet(null); } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); } finally { setBusyAction(false); }
  }
  async function addReference() {
    if (!referenceName.trim() || !referenceUrl.trim()) return;
    setBusyAction(true);
    try {
      const asset = await extra('asset:add', { name: referenceName, url: referenceUrl, kind: 'REFERENCE' });
      setAssets(current => [asset, ...current]); setReferenceName(''); setReferenceUrl(''); setSheet(null);
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro.'); } finally { setBusyAction(false); }
  }
  async function addFile(file: File) {
    if (file.size > 4 * 1024 * 1024) { alert('Nesta versão, envie arquivos de até 4 MB.'); return; }
    setBusyAction(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file);
      });
      const kind = file.type.startsWith('image/') ? 'REFERENCE' : file.type.startsWith('video/') ? 'VIDEO' : file.type.startsWith('audio/') ? 'AUDIO' : 'DOCUMENT';
      const asset = await extra('asset:add', { name: file.name, url: dataUrl, mimeType: file.type || null, kind });
      setAssets(current => [asset, ...current]);
      if (!coverUrl && file.type.startsWith('image/')) { await extra('cover:set', { url: dataUrl }); setCoverUrl(dataUrl); }
      setSheet(null);
    } catch (error) { alert(error instanceof Error ? error.message : 'Não foi possível anexar.'); } finally { setBusyAction(false); if (fileRef.current) fileRef.current.value = ''; }
  }
  async function addComment() {
    if (!commentText.trim()) return;
    setBusyAction(true);
    try {
      const comment = await extra('comment:add', { text: commentText });
      setComments(current => [{ id: comment.id, text: comment.text, createdAt: comment.createdAt, author: comment.author ? { name: comment.author.name } : null }, ...current]); setCommentText('');
    } catch (error) { alert(error instanceof Error ? error.message : 'Erro ao comentar.'); } finally { setBusyAction(false); }
  }

  const canClaim = !demand.assignee && !['DELIVERED', 'ARCHIVED'].includes(status);

  return (
    <div className="premiumWorkspace">
      <section
        className={`projectHeroPremium${coverUrl ? ' hasProjectCover' : ''}`}
        style={coverUrl ? { backgroundImage: `linear-gradient(120deg, rgba(6,30,21,.92), rgba(6,30,21,.55)), url("${safeBackground(coverUrl)}")` } : undefined}
      >
        <div className="projectHeroGlow" />
        <div className="projectHeroContent">
          <div className="projectTopline">
            <span className="projectProtocol">{demand.protocol}</span>
            <span className={`projectPriority priority-${demand.priority}`}>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</span>
          </div>
          {labels.length > 0 && <div className="projectLabels">{labels.map(label => <span key={label.id} className={`projectLabel label-${label.color}`}>{label.name}</span>)}</div>}
          <h1>{demand.title}</h1>
          <div className="projectHeroMeta">
            <span>{demand.department?.code || 'SEM SECRETARIA'}</span><i>•</i><span>{TYPE_LABELS[demand.type] ?? demand.type}</span><i>•</i><span>{STATUS_LABELS[status] ?? status}</span>
          </div>
          <div className="projectHeroBottom">
            <div className="heroPeople">
              <div className="premiumAvatarStack">{people.slice(0, 4).map(person => <span key={person.id} title={person.name}>{initials(person.name)}</span>)}{people.length === 0 && <span>+</span>}</div>
              <div><small>Equipe</small><strong>{people.length ? people.map(person => person.name.split(' ')[0]).join(', ') : 'Sem responsável'}</strong></div>
            </div>
            <div className="heroProgress">
              <div><small>Checklist</small><strong>{checklist.length ? `${checklistDone}/${checklist.length}` : 'Sem itens'}</strong></div>
              <div className="progressTrack"><span style={{ width: `${progress}%` }} /></div>
            </div>
          </div>
        </div>
      </section>

      <section className="premiumQuickActions">
        <button onClick={() => setSheet('checklist')}><span className="quickIcon quickGreen">✓</span><strong>Checklist</strong><small>{checklist.length ? `${checklistDone}/${checklist.length} concluídos` : 'Criar etapas'}</small></button>
        <button onClick={() => setSheet('asset')}><span className="quickIcon quickBlue">⌕</span><strong>Anexar</strong><small>{assets.length ? `${assets.length} material(is)` : 'Arquivo ou referência'}</small></button>
        <button onClick={() => setSheet('member')}><span className="quickIcon quickPurple">◎</span><strong>Membros</strong><small>{people.length ? `${people.length} na demanda` : 'Adicionar equipe'}</small></button>
        <button onClick={() => setSheet('label')}><span className="quickIcon quickGold">◇</span><strong>Etiquetas</strong><small>{labels.length ? `${labels.length} ativa(s)` : 'Organizar por cor'}</small></button>
        <button onClick={() => setSheet('cover')}><span className="quickIcon quickTeal">▣</span><strong>Capa</strong><small>{coverUrl ? 'Alterar prévia' : 'Escolher imagem'}</small></button>
      </section>

      <div className="premiumProjectGrid">
        <main className="premiumProjectMain">
          <section className="premiumSection descriptionPremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">BRIEFING</span><h2>Direção da produção</h2></div><span className="aiBadge">✦ Organizado</span></div>
            {demand.missingInfo && <div className="premiumAlert"><strong>Informação pendente</strong><span>{demand.missingInfo}</span></div>}
            <p className="premiumRichText">{demand.briefing || demand.revisedText || 'Ainda não há briefing organizado.'}</p>
            {demand.revisedText && demand.revisedText !== demand.briefing && <div className="revisedBlock"><span>Texto revisado</span><p>{demand.revisedText}</p></div>}
          </section>

          <section className="premiumSection schedulePremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">CRONOGRAMA</span><h2>Início e entrega</h2></div></div>
            <div className="scheduleGrid">
              <label><span>Data de início</span><input type="datetime-local" defaultValue={localInputValue(demand.startAt)} disabled={busyAction} onBlur={e => updateDate('startAt', e.target.value)} /></label>
              <label><span>Data de entrega</span><input type="datetime-local" defaultValue={localInputValue(demand.dueAt)} disabled={busyAction} onBlur={e => updateDate('dueAt', e.target.value)} /></label>
            </div>
          </section>

          <section className="premiumSection checklistPremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">ETAPAS</span><h2>Checklist da produção</h2></div><button className="premiumTextAction" onClick={() => setSheet('checklist')}>+ Adicionar</button></div>
            {checklist.length ? <div className="premiumChecklistList">{checklist.map(item => <div key={item.id} className={`premiumChecklistItem${item.completed ? ' done' : ''}`}><button className="checkCircle" onClick={() => toggleChecklist(item)}>{item.completed ? '✓' : ''}</button><span>{item.text}</span><button className="removeMini" onClick={() => removeChecklist(item.id)}>×</button></div>)}</div> : <button className="premiumEmptyAction" onClick={() => setSheet('checklist')}><span>✓</span><strong>Crie as etapas desse trabalho</strong><small>Ex.: Feed, Story, revisão e arquivo final.</small></button>}
          </section>

          <section className="premiumSection materialsPremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">REFERÊNCIAS & ARQUIVOS</span><h2>Materiais da demanda</h2></div><button className="premiumTextAction" onClick={() => setSheet('asset')}>+ Anexar</button></div>
            {assets.length ? <div className="premiumAssetGrid">{assets.map(asset => <a key={asset.id} href={asset.url} target="_blank" rel="noreferrer" className={`premiumAssetCard${asset.mimeType?.startsWith('image/') ? ' image' : ''}`}>{asset.mimeType?.startsWith('image/') ? <div className="premiumAssetImage" style={{ backgroundImage: `url("${safeBackground(asset.url)}")` }} /> : <div className="premiumFileIcon">{asset.kind === 'VIDEO' ? '▶' : asset.kind === 'AUDIO' ? '♫' : '▤'}</div>}<div><strong>{asset.name}</strong><small>{asset.kind}</small></div></a>)}</div> : <button className="premiumEmptyAction" onClick={() => setSheet('asset')}><span>⌕</span><strong>Adicione referências e arquivos</strong><small>Imagem, PDF, áudio ou link de inspiração.</small></button>}
          </section>

          <section className="premiumSection commentsPremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">CONVERSA</span><h2>Comentários da equipe</h2></div><span className="commentCount">{comments.length}</span></div>
            <div className="premiumCommentComposer"><div className="commentSelfAvatar">C</div><textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Adicionar orientação, alteração ou observação..." /><button disabled={busyAction || !commentText.trim()} onClick={addComment}>Enviar</button></div>
            {comments.length > 0 && <div className="premiumComments">{comments.map(comment => <article key={comment.id}><span className="commentAvatarPremium">{comment.author?.name ? initials(comment.author.name) : 'C'}</span><div><header><strong>{comment.author?.name || 'Equipe'}</strong><time>{fmt(comment.createdAt)}</time></header><p>{comment.text}</p></div></article>)}</div>}
          </section>

          <section className="premiumSection historyPremium">
            <div className="premiumSectionHeader"><div><span className="premiumKicker">HISTÓRICO</span><h2>Atividade recente</h2></div></div>
            <div className="premiumTimeline"><div><span /><p><strong>Demanda criada</strong><small>{fmt(demand.createdAt)}</small></p></div>{demand.history.slice(0, 12).map(item => <div key={item.id}><span /><p><strong>{historyLabel(item.action)}</strong><small>{item.actor?.name ? `${item.actor.name} · ` : ''}{fmt(item.createdAt)}{item.toValue ? ` · ${item.toValue}` : ''}</small></p></div>)}</div>
          </section>
        </main>

        <aside className="premiumProjectAside">
          <section className="premiumControlCard">
            <div className="controlCardTop"><div><span className="premiumKicker">STATUS</span><h3>{STATUS_LABELS[status] ?? status}</h3></div><span className={`statusOrb statusOrb-${status}`} /></div>
            {canClaim && <ClaimDemandButton demandId={demand.id} />}
            <select value={status} onChange={e => updateStatus(e.target.value)} disabled={updating} className="premiumStatusSelect">{Object.entries(STATUS_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>
            <div className="approvalButtonGrid"><button onClick={() => updateStatus('WAITING_APPROVAL')} className="approvalSend">Enviar aprovação</button><button onClick={() => updateStatus('APPROVED')} className="approvalOk">Aprovar</button><button onClick={() => updateStatus('CHANGES_REQUESTED')} className="approvalChange">Pedir alteração</button><button onClick={() => updateStatus('DELIVERED')} className="approvalDone">Entregar</button></div>
          </section>

          <section className="premiumInfoCard">
            <div className="premiumInfoHeader"><span className="premiumKicker">PRODUÇÃO</span><h3>Dados do trabalho</h3></div>
            <dl><div><dt>Responsável</dt><dd>{demand.assignee?.name || 'Livre'}</dd></div><div><dt>Secretaria</dt><dd>{demand.department?.code || '—'}</dd></div><div><dt>Tipo</dt><dd>{TYPE_LABELS[demand.type] ?? demand.type}</dd></div><div><dt>Prioridade</dt><dd>{PRIORITY_LABELS[demand.priority] ?? demand.priority}</dd></div><div><dt>Início</dt><dd>{fmt(demand.startAt)}</dd></div><div><dt>Entrega</dt><dd>{fmt(demand.dueAt)}</dd></div></dl>
          </section>

          <section className="premiumInfoCard peopleAsideCard">
            <div className="premiumInfoHeader"><span className="premiumKicker">EQUIPE</span><h3>Membros</h3></div>
            <div className="asidePeople">{people.length ? people.map(person => <div key={person.id}><span>{initials(person.name)}</span><p><strong>{person.name}</strong><small>{person.role === 'RESPONSÁVEL' ? 'Responsável principal' : person.role}</small></p></div>) : <p className="asideEmpty">Nenhum profissional vinculado.</p>}</div>
            <button onClick={() => setSheet('member')} className="asideSecondaryButton">Gerenciar equipe</button>
          </section>

          <section className="premiumInfoCard requesterPremium"><div className="premiumInfoHeader"><span className="premiumKicker">SOLICITANTE</span><h3>{demand.requesterName || 'Não informado'}</h3></div><p>{demand.requesterPhone || 'Telefone não informado'}</p><small>Origem: {demand.source}</small></section>
        </aside>
      </div>

      {sheet && <div className="premiumSheetBackdrop" onMouseDown={e => { if (e.currentTarget === e.target) setSheet(null); }}><section className="premiumSheet">
        <header><div><span className="premiumKicker">AÇÕES DA DEMANDA</span><h2>{sheet === 'label' ? 'Etiquetas' : sheet === 'checklist' ? 'Checklist' : sheet === 'member' ? 'Membros' : sheet === 'asset' ? 'Anexos e referências' : 'Capa da demanda'}</h2></div><button onClick={() => setSheet(null)}>×</button></header>

        {sheet === 'label' && <div className="sheetBody"><div className="sheetForm"><label><span>Nome da etiqueta</span><input value={labelName} onChange={e => setLabelName(e.target.value)} placeholder="Ex.: MUITO URGENTE" /></label><div className="colorPicker">{LABEL_COLORS.map(color => <button key={color.value} type="button" onClick={() => setLabelColor(color.value)} className={`colorChoice color-${color.value}${labelColor === color.value ? ' selected' : ''}`} title={color.label} />)}</div><button className="sheetPrimary" disabled={busyAction || !labelName.trim()} onClick={addLabel}>Criar etiqueta</button></div><div className="sheetList">{labels.map(label => <div key={label.id} className="sheetLabelRow"><span className={`projectLabel label-${label.color}`}>{label.name}</span><button onClick={() => removeLabel(label.id)}>Remover</button></div>)}</div></div>}

        {sheet === 'checklist' && <div className="sheetBody"><div className="sheetInlineForm"><input value={checkText} onChange={e => setCheckText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addChecklist(); }} placeholder="Ex.: Criar versão Story" /><button disabled={busyAction || !checkText.trim()} onClick={addChecklist}>Adicionar</button></div><div className="sheetChecklist">{checklist.map(item => <div key={item.id} className={item.completed ? 'done' : ''}><button onClick={() => toggleChecklist(item)}>{item.completed ? '✓' : ''}</button><span>{item.text}</span><button className="sheetRemove" onClick={() => removeChecklist(item.id)}>×</button></div>)}</div></div>}

        {sheet === 'member' && <div className="sheetBody">{manager ? <div className="sheetInlineForm"><select value={selectedMember} onChange={e => setSelectedMember(e.target.value)}><option value="">Escolha um profissional</option>{team.filter(person => !people.some(member => member.id === person.id)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select><button disabled={busyAction || !selectedMember} onClick={addMember}>Adicionar</button></div> : <div className="sheetNotice">A gestão controla os membros extras da demanda.</div>}<div className="sheetPeopleList">{people.map(person => <div key={person.id}><span>{initials(person.name)}</span><p><strong>{person.name}</strong><small>{person.role === 'RESPONSÁVEL' ? 'Responsável principal' : person.role}</small></p>{manager && person.id !== demand.assignee?.id && <button onClick={() => removeMember(person.id)}>Remover</button>}</div>)}</div></div>}

        {sheet === 'asset' && <div className="sheetBody"><input ref={fileRef} type="file" hidden onChange={e => { const file = e.target.files?.[0]; if (file) addFile(file); }} /><button className="uploadDropzone" disabled={busyAction} onClick={() => fileRef.current?.click()}><span>＋</span><strong>Escolher arquivo</strong><small>Imagem, PDF, áudio ou documento · até 4 MB</small></button><div className="sheetDivider"><span>ou adicionar referência por link</span></div><div className="sheetForm"><label><span>Nome</span><input value={referenceName} onChange={e => setReferenceName(e.target.value)} placeholder="Ex.: Referência do certificado" /></label><label><span>Link</span><input value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)} placeholder="https://..." /></label><button className="sheetPrimary" disabled={busyAction || !referenceName.trim() || !referenceUrl.trim()} onClick={addReference}>Adicionar referência</button></div></div>}

        {sheet === 'cover' && <div className="sheetBody"><div className="coverChoiceGrid">{images.map(asset => <button key={asset.id} onClick={() => chooseCover(asset.url)} className={coverUrl === asset.url ? 'selected' : ''}><span style={{ backgroundImage: `url("${safeBackground(asset.url)}")` }} /><strong>{asset.name}</strong></button>)}</div>{images.length === 0 && <div className="sheetNotice">Adicione uma imagem em Anexos para usar como capa.</div>}{coverUrl && <button className="removeCoverButton" onClick={() => chooseCover(null)}>Remover capa</button>}</div>}
      </section></div>}
    </div>
  );
}
