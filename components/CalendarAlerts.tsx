'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type Alert = {
  id: string;
  title: string;
  type: string;
  personName: string | null;
  personRole: string | null;
  occurrence: string;
  daysUntil: number;
  leadDays: number;
  department: { code: string; name: string } | null;
};

const ICONS: Record<string, string> = {
  BIRTHDAY: '🎂',
  COMMEMORATIVE: '✦',
  INSTITUTIONAL: '◆',
  CAMPAIGN: '◎',
  OTHER: '◷',
};

function label(days: number) {
  if (days === 0) return 'É hoje';
  if (days === 1) return 'Amanhã';
  return `Faltam ${days} dias`;
}

export default function CalendarAlerts({ alerts }: { alerts: Alert[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!alerts.length) return null;

  async function createDemand(id: string) {
    if (busyId) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/calendar/${id}/create-demand`, { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível criar a demanda.');
      router.push(`/demandas/${data.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao criar demanda.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="calendarAlertsSection">
      <div className="calendarAlertsHeader">
        <div><span className="sectionKicker">PRÓXIMAS DATAS</span><h2>Prepare antes de virar urgência</h2></div>
        <Link href="/calendario">Ver calendário →</Link>
      </div>
      <div className="calendarAlertsRow">
        {alerts.map(item => (
          <article className={`calendarAlert type-${item.type}`} key={item.id}>
            <span className="calendarAlertIcon">{ICONS[item.type] || '◷'}</span>
            <div className="calendarAlertMain">
              <div><b>{label(item.daysUntil)}</b><span>{new Date(item.occurrence).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}</span></div>
              <strong>{item.type === 'BIRTHDAY' && item.personName ? `Aniversário — ${item.personName}` : item.title}</strong>
              <small>{item.personRole || item.department?.code || 'Comunicação institucional'}</small>
            </div>
            <button onClick={() => createDemand(item.id)} disabled={busyId === item.id}>{busyId === item.id ? 'Criando...' : '＋ Criar arte'}</button>
          </article>
        ))}
      </div>
    </section>
  );
}
