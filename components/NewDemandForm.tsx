'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export default function NewDemandForm({ departments }: { departments: { id: string; name: string; code: string }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const form = new FormData(event.currentTarget);

    const payload = {
      requesterName: form.get('requesterName'),
      requesterPhone: form.get('requesterPhone'),
      departmentId: form.get('departmentId') || null,
      originalText: form.get('originalText'),
      dueAt: form.get('dueAt') || null,
      source: 'WEB',
    };

    const res = await fetch('/api/demands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      setError('Não foi possível registrar a demanda.');
      setSaving(false);
      return;
    }

    const data = await res.json();
    router.push(`/demandas/${data.id}`);
    router.refresh();
  }

  return (
    <form className="panel" onSubmit={submit}>
      <div className="formGrid">
        <div className="field">
          <label>Solicitante</label>
          <input name="requesterName" placeholder="Nome de quem pediu" required />
        </div>
        <div className="field">
          <label>WhatsApp</label>
          <input name="requesterPhone" placeholder="(94) 99999-9999" />
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
        <div className="field full">
          <label>Mensagem / demanda original</label>
          <textarea name="originalText" placeholder="Cole ou escreva exatamente o pedido recebido..." required />
        </div>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button className="btn btnPrimary" disabled={saving}>{saving ? 'Organizando...' : 'Registrar e organizar com IA'}</button>
      </div>
    </form>
  );
}
