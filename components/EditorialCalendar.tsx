'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
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
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEvents(initialEvents);
  }, [initialEvents]);

  const upcoming = useMemo(() => [...events].sort((a, b) => a.daysUntil - b.daysUntil), [events]);
  const birthdays = useMemo(() => upcoming.filter(item => item.type === 'BIRTHDAY').length, [upcoming]);
  const commemoratives = upcoming.length - birthdays;

  async function createBirthday(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setMessage('');
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, leadDays: Number(payload.leadDays || 3) }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setMessage(data.error || 'Não foi possível salvar o aniversário.');
      return;
    }
    formElement.reset();
    setMessage('Aniversário cadastrado. O aviso será repetido todos os anos.');
    router.refresh();
  }

  async function removeBirthday(id: string) {
    if (!confirm('Remover este aniversário do calendário?')) return;
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
          <p>As datas comemorativas já vêm cadastradas automaticamente. Você só precisa cadastrar os aniversários da gestão.</p>
        </div>
        <div className="calendarHeroStat"><span>Próximas datas</span><strong>{upcoming.length}</strong></div>
      </section>

      {manager && (
        <div className="calendarTopGrid">
          <section className="calendarFormCard birthdayOnlyCard">
            <div className="calendarCardHeader">
              <div><span className="sectionKicker">ANIVERSÁRIOS</span><h2>Cadastrar aniversário</h2></div>
              <span className="calendarAutoBadge">✓ Datas comemorativas automáticas</span>
            </div>
            <form onSubmit={createBirthday} className="calendarForm">
              <div className="calendarFormGrid">
                <label>Nome da pessoa
                  <input name="personName" required placeholder="Ex.: João da Silva" />
                </label>
                <label>Cargo
                  <input name="personRole" placeholder="Ex.: Prefeito, Vice-Prefeito, Secretário de Saúde" />
                </label>
                <label>Data do aniversário
                  <input name="eventDate" type="date" required />
                </label>
                <label>Antecedência do aviso
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
                <label className="full">Secretaria / órgão
                  <select name="departmentId" defaultValue="">
                    <option value="">Geral / Prefeitura</option>
                    {departments.map(dep => <option key={dep.id} value={dep.id}>{dep.code} — {dep.name}</option>)}
                  </select>
                </label>
                <label className="full">Observação para a arte
                  <textarea name="description" placeholder="Ex.: fazer card institucional de aniversário para feed e story, usar foto oficial..." />
                </label>
              </div>

              <button className="calendarSaveButton" disabled={saving}>{saving ? 'Salvando...' : '＋ Cadastrar aniversário'}</button>
            </form>
            {message && <div className="calendarMessage">{message}</div>}
          </section>

          <aside className="calendarInfoCard">
            <span className="calendarInfoIcon">◷</span>
            <h2>Calendário automático</h2>
            <p>O sistema já mantém <strong>{commemoratives} datas comemorativas futuras</strong> no radar e destaca cada uma conforme a antecedência configurada.</p>
            <div className="calendarFlowMini"><span>Data automática</span><i>→</i><span>Faltam 3 dias</span><i>→</i><span>Criar arte</span></div>
            <p className="calendarBirthdayCount">Aniversários cadastrados: <strong>{birthdays}</strong></p>
          </aside>
        </div>
      )}

      <section className="calendarListCard">
        <div className="calendarCardHeader"><div><span className="sectionKicker">AGENDA COMPLETA</span><h2>Próximas datas</h2></div><span className="calendarListHint">Datas comemorativas + aniversários</span></div>
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
                {manager && item.type === 'BIRTHDAY' && <button className="calendarDelete" onClick={() => removeBirthday(item.id)}>×</button>}
              </div>
            </article>
          ))}
          {upcoming.length === 0 && <div className="calendarEmpty">Nenhuma data encontrada.</div>}
        </div>
      </section>
    </div>
  );
}
