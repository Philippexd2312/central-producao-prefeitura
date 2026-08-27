'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Department = { id: string; code: string; name: string };
type CalendarItem = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  eventDate: string;
  annual: boolean;
  leadDays: number;
  personName: string | null;
  personRole: string | null;
  department: Department | null;
  nextOccurrence: string;
  daysUntil: number;
};

const TYPE_LABELS: Record<string, string> = {
  COMMEMORATIVE: 'Data comemorativa',
  BIRTHDAY: 'Aniversário',
  INSTITUTIONAL: 'Institucional',
  CAMPAIGN: 'Campanha',
  OTHER: 'Outro',
};

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

function countdown(days: number) {
  if (days === 0) return 'É hoje';
  if (days === 1) return 'Amanhã';
  return `Faltam ${days} dias`;
}

export default function EditorialCalendar({ initialEvents, departments, manager }: { initialEvents: CalendarItem[]; departments: Department[]; manager: boolean }) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [type, setType] = useState('COMMEMORATIVE');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const upcoming = useMemo(() => [...events].sort((a, b) => a.daysUntil - b.daysUntil), [events]);

  async function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());
    payload.type = type;
    payload.annual = form.get('annual') === 'on' ? 'true' : 'false';

    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        annual: payload.annual === 'true',
        leadDays: Number(payload.leadDays || 3),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Não foi possível salvar.');
      return;
    }
    event.currentTarget.reset();
    setType('COMMEMORATIVE');
    setMessage('Data adicionada ao calendário.');
    router.refresh();
  }

  async function seedBase() {
    setSaving(true);
    setMessage('');
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'seed_base' }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Não foi possível importar.');
      return;
    }
    setMessage(`${data.created || 0} datas adicionadas ao calendário-base.`);
    router.refresh();
  }

  async function removeEvent(id: string) {
    if (!confirm('Remover esta data do calendário?')) return;
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' });
    if (!res.ok) return;
    setEvents(current => current.filter(item => item.id !== id));
  }

  async function createDemand(id: string) {
    const res = await fetch(`/api/calendar/${id}/create-demand`, { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || 'Não foi possível criar a demanda.');
      return;
    }
    router.push(`/demandas/${data.id}`);
  }

  return (
    <div className="editorialCalendar">
      <section className="calendarHero">
        <div>
          <span className="sectionKicker">PLANEJAMENTO DA COMUNICAÇÃO</span>
          <h1>Calendário Editorial</h1>
          <p>Datas comemorativas, aniversários e campanhas entram no radar da equipe antes de virar urgência.</p>
        </div>
        <div className="calendarHeroStat"><span>Próximas datas</span><strong>{upcoming.length}</strong></div>
      </section>

      {manager && (
        <div className="calendarTopGrid">
          <section className="calendarFormCard">
            <div className="calendarCardHeader">
              <div><span className="sectionKicker">NOVA DATA</span><h2>Adicionar ao calendário</h2></div>
              <button type="button" className="calendarBaseButton" onClick={seedBase} disabled={saving}>＋ Calendário-base</button>
            </div>
            <form onSubmit={createEvent} className="calendarForm">
              <div className="calendarTypeTabs">
                {Object.entries(TYPE_LABELS).map(([value, label]) => (
                  <button key={value} type="button" className={type === value ? 'active' : ''} onClick={() => setType(value)}>{label}</button>
                ))}
              </div>

              <div className="calendarFormGrid">
                <label className="full">Nome da data
                  <input name="title" required placeholder={type === 'BIRTHDAY' ? 'Ex.: Aniversário do Prefeito' : 'Ex.: Dia da Árvore'} />
                </label>
                {type === 'BIRTHDAY' && (
                  <>
                    <label>Nome da pessoa
                      <input name="personName" placeholder="Nome do prefeito ou secretário" />
                    </label>
                    <label>Cargo
                      <input name="personRole" placeholder="Ex.: Secretário Municipal de Saúde" />
                    </label>
                  </>
                )}
                <label>Data
                  <input name="eventDate" type="date" required />
                </label>
                <label>Antecedência
                  <select name="leadDays" defaultValue="3">
                    <option value="1">1 dia antes</option>
                    <option value="2">2 dias antes</option>
                    <option value="3">3 dias antes</option>
                    <option value="5">5 dias antes</option>
                    <option value="7">7 dias antes</option>
                    <option value="10">10 dias antes</option>
                    <option value="15">15 dias antes</option>
                  </select>
                </label>
                <label>Secretaria relacionada
                  <select name="departmentId" defaultValue="">
                    <option value="">Geral / Prefeitura</option>
                    {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.code} — {dep.name}</option>)}
                  </select>
                </label>
                <label className="calendarRepeat"><input name="annual" type="checkbox" defaultChecked /> Repetir todos os anos</label>
                <label className="full">Observação / briefing inicial
                  <textarea name="description" placeholder="Ex.: criar card institucional para feed e story, usar identidade da campanha..." />
                </label>
              </div>

              <button className="calendarSaveButton" disabled={saving}>{saving ? 'Salvando...' : '＋ Adicionar data'}</button>
            </form>
            {message && <div className="calendarMessage">{message}</div>}
          </section>

          <aside className="calendarInfoCard">
            <span className="calendarInfoIcon">◷</span>
            <h2>Aviso automático</h2>
            <p>Com antecedência de <strong>3 dias</strong>, a data aparece destacada no painel da produção.</p>
            <div className="calendarFlowMini"><span>Data cadastrada</span><i>→</i><span>Faltam 3 dias</span><i>→</i><span>Criar demanda</span></div>
          </aside>
        </div>
      )}

      <section className="calendarListCard">
        <div className="calendarCardHeader"><div><span className="sectionKicker">AGENDA</span><h2>Próximas datas</h2></div></div>
        <div className="calendarEventGrid">
          {upcoming.map(item => (
            <article className={`calendarEventCard type-${item.type}`} key={item.id}>
              <div className="calendarEventDate"><strong>{new Date(item.nextOccurrence).getDate().toString().padStart(2, '0')}</strong><span>{new Date(item.nextOccurrence).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span></div>
              <div className="calendarEventBody">
                <div className="calendarEventTop"><span>{TYPE_LABELS[item.type] || item.type}</span><b>{countdown(item.daysUntil)}</b></div>
                <h3>{item.type === 'BIRTHDAY' && item.personName ? item.personName : item.title}</h3>
                {item.type === 'BIRTHDAY' && item.personRole && <p>{item.personRole}</p>}
                {item.type !== 'BIRTHDAY' && item.description && <p>{item.description}</p>}
                <div className="calendarEventMeta"><span>{fmtDate(item.nextOccurrence)}</span>{item.department && <span>{item.department.code}</span>}<span>{item.leadDays} dias antes</span>{item.annual && <span>anual</span>}</div>
              </div>
              <div className="calendarEventActions">
                <button onClick={() => createDemand(item.id)}>Criar demanda</button>
                {manager && <button className="calendarDelete" onClick={() => removeEvent(item.id)}>×</button>}
              </div>
            </article>
          ))}
          {upcoming.length === 0 && <div className="calendarEmpty">Nenhuma data cadastrada ainda.</div>}
        </div>
      </section>
    </div>
  );
}
