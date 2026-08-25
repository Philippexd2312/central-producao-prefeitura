'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const LABELS: Record<string, string> = {
  AVAILABLE: 'Disponível',
  BUSY: 'Ocupado',
  AWAY: 'Ausente',
};

export default function AvailabilityControl({ initial }: { initial: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);
    try {
      const response = await fetch('/api/me/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: next }),
      });
      if (!response.ok) throw new Error();
      router.refresh();
    } catch {
      setValue(initial);
      alert('Não foi possível atualizar seu status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <select
      className="availabilitySelect"
      value={value}
      onChange={event => change(event.target.value)}
      disabled={saving}
      aria-label="Status de disponibilidade"
    >
      {Object.entries(LABELS).map(([key, label]) => (
        <option key={key} value={key}>{label}</option>
      ))}
    </select>
  );
}
