'use client';

import { useRouter } from 'next/navigation';
import { ChangeEvent, DragEvent, FormEvent, useMemo, useRef, useState } from 'react';

type AttachmentDraft = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  url: string;
};

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_TOTAL_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 8;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Falha ao ler arquivo'));
    reader.readAsDataURL(file);
  });
}

export default function NewDemandForm({ departments }: { departments: { id: string; name: string; code: string }[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [savingMode, setSavingMode] = useState<'manual' | 'ai' | null>(null);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<AttachmentDraft[]>([]);
  const [dragging, setDragging] = useState(false);

  const totalBytes = useMemo(() => attachments.reduce((sum, item) => sum + item.size, 0), [attachments]);

  async function addFiles(files: FileList | File[]) {
    setError('');
    const incoming = Array.from(files);
    if (!incoming.length) return;

    if (attachments.length + incoming.length > MAX_FILES) {
      setError(`Você pode anexar até ${MAX_FILES} arquivos por demanda.`);
      return;
    }

    if (incoming.some(file => file.size > MAX_FILE_BYTES)) {
      setError('Cada arquivo pode ter no máximo 4 MB nesta versão.');
      return;
    }

    const incomingTotal = incoming.reduce((sum, file) => sum + file.size, 0);
    if (totalBytes + incomingTotal > MAX_TOTAL_BYTES) {
      setError('O total dos anexos pode ter no máximo 12 MB nesta versão.');
      return;
    }

    try {
      const mapped = await Promise.all(incoming.map(async file => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        url: await readFile(file),
      })));
      setAttachments(current => [...current, ...mapped]);
    } catch {
      setError('Não foi possível preparar um dos arquivos.');
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) addFiles(event.target.files);
    event.target.value = '';
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
  }

  async function submit(event: FormEvent<HTMLFormElement>, mode: 'manual' | 'ai') {
    event.preventDefault();
    if (savingMode) return;

    setSavingMode(mode);
    setError('');
    const form = new FormData(event.currentTarget);

    const payload = {
      mode,
      title: form.get('title'),
      requesterName: form.get('requesterName'),
      requesterPhone: form.get('requesterPhone'),
      departmentId: form.get('departmentId') || null,
      type: form.get('type'),
      priority: form.get('priority'),
      originalText: form.get('originalText'),
      dueAt: form.get('dueAt') || null,
      source: 'WEB',
      attachments: attachments.map(item => ({
        name: item.name,
        mimeType: item.mimeType,
        url: item.url,
      })),
    };

    try {
      const res = await fetch('/api/demands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Não foi possível registrar a demanda.');
        setSavingMode(null);
        return;
      }

      router.push(`/demandas/${data.id}`);
      router.refresh();
    } catch {
      setError('Falha de conexão ao registrar a demanda.');
      setSavingMode(null);
    }
  }

  return (
    <form className="panel newDemandPanel" onSubmit={event => submit(event, 'manual')}>
      <div className="newDemandModeNotice">
        <div>
          <strong>Cadastro manual ou com IA</strong>
          <span>Anexe os materiais agora. Você decide se a IA organiza o briefing ou se o card entra direto na produção.</span>
        </div>
      </div>

      <div className="formGrid">
        <div className="field full">
          <label>Título da demanda <span className="fieldHint">opcional com IA</span></label>
          <input name="title" placeholder="Ex.: Arte para campanha de vacinação" />
        </div>

        <div className="field">
          <label>Solicitante</label>
          <input name="requesterName" placeholder="Nome de quem pediu" />
        </div>
        <div className="field">
          <label>WhatsApp</label>
          <input name="requesterPhone" inputMode="tel" placeholder="(94) 99999-9999" />
        </div>
        <div className="field">
          <label>Secretaria</label>
          <select name="departmentId" defaultValue="">
            <option value="">Não informada</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.code} — {d.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Prazo</label>
          <input name="dueAt" type="datetime-local" />
        </div>
        <div className="field">
          <label>Tipo <span className="fieldHint">usado no modo manual</span></label>
          <select name="type" defaultValue="DESIGN">
            <option value="DESIGN">Design</option>
            <option value="VIDEO">Vídeo</option>
            <option value="PHOTO">Fotografia</option>
            <option value="COPY">Redação</option>
            <option value="SOCIAL">Social media</option>
            <option value="OTHER">Outro</option>
          </select>
        </div>
        <div className="field">
          <label>Prioridade <span className="fieldHint">usada no modo manual</span></label>
          <select name="priority" defaultValue="NORMAL">
            <option value="LOW">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
        </div>
        <div className="field full">
          <label>Mensagem / briefing original</label>
          <textarea name="originalText" placeholder="Cole ou escreva exatamente o pedido recebido..." />
        </div>
      </div>

      <section className="newDemandAttachments">
        <div className="newDemandSectionHeader">
          <div>
            <span className="newDemandSectionIcon">⌁</span>
            <div>
              <strong>Anexos e referências</strong>
              <small>Imagens, PDF, vídeo, áudio, PSD, CDR, AI e outros materiais.</small>
            </div>
          </div>
          <span className="attachmentCounter">{attachments.length}/{MAX_FILES}</span>
        </div>

        <div
          className={`attachmentDropZone${dragging ? ' dragging' : ''}`}
          onDragOver={event => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click(); }}
        >
          <span className="dropZoneIcon">＋</span>
          <strong>Adicionar arquivos</strong>
          <span>Toque para escolher ou arraste os arquivos aqui</span>
          <small>Até 4 MB por arquivo · 12 MB no total</small>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            onChange={onFileChange}
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.psd,.ai,.cdr,.svg,.eps"
          />
        </div>

        {attachments.length > 0 && (
          <div className="attachmentDraftGrid">
            {attachments.map(item => (
              <div className="attachmentDraft" key={item.id}>
                <div className="attachmentDraftPreview">
                  {item.mimeType.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.url} alt="" />
                  ) : (
                    <span>{item.mimeType.startsWith('video/') ? '▶' : item.mimeType.startsWith('audio/') ? '♪' : '▤'}</span>
                  )}
                </div>
                <div className="attachmentDraftInfo">
                  <strong title={item.name}>{item.name}</strong>
                  <small>{formatBytes(item.size)}</small>
                </div>
                <button
                  type="button"
                  className="attachmentRemove"
                  aria-label={`Remover ${item.name}`}
                  onClick={() => setAttachments(current => current.filter(file => file.id !== item.id))}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      <div className="newDemandActions">
        <button
          type="submit"
          className="btn manualCreateButton"
          disabled={Boolean(savingMode)}
        >
          <span>＋</span>
          <div><strong>{savingMode === 'manual' ? 'Criando...' : 'Criar sem IA'}</strong><small>Entra direto na fila</small></div>
        </button>
        <button
          type="button"
          className="btn btnPrimary aiCreateButton"
          disabled={Boolean(savingMode)}
          onClick={event => {
            const form = event.currentTarget.closest('form');
            if (form) submit({ preventDefault: () => undefined, currentTarget: form } as unknown as FormEvent<HTMLFormElement>, 'ai');
          }}
        >
          <span>✦</span>
          <div><strong>{savingMode === 'ai' ? 'Organizando...' : 'Organizar com IA'}</strong><small>Corrige e monta o briefing</small></div>
        </button>
      </div>
    </form>
  );
}
