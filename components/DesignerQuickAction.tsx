'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const STATUS_ACTIONS: Record<string, { next: string; label: string; icon: string }> = {
  NEW: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
  BRIEFING_READY: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
  WAITING_ASSIGNEE: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
};

const DELIVERY_ACTIONS: Record<string, { label: string; icon: string }> = {
  IN_PRODUCTION: { label: 'Enviar versão', icon: '↑' },
  CHANGES_REQUESTED: { label: 'Enviar nova versão', icon: '↻' },
  APPROVED: { label: 'Concluir entrega', icon: '✓' },
};

export default function DesignerQuickAction({ demandId, status }: { demandId: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const statusAction = STATUS_ACTIONS[status];
  const deliveryAction = DELIVERY_ACTIONS[status];

  if (!statusAction && !deliveryAction) return null;

  async function run() {
    if (saving) return;

    if (deliveryAction) {
      router.push(`/demandas/${demandId}/entrega`);
      return;
    }

    if (!statusAction) return;
    setSaving(true);
    const res = await fetch(`/api/demands/${demandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: statusAction.next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Não foi possível atualizar a demanda.');
      return;
    }
    router.refresh();
  }

  const action = deliveryAction || statusAction;
  return <button type="button" className="designerQuickAction" onClick={run} disabled={saving}><span>{action.icon}</span>{saving ? 'Atualizando...' : action.label}</button>;
}
