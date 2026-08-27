'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const ACTIONS: Record<string, { next: string; label: string; icon: string }> = {
  NEW: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
  BRIEFING_READY: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
  WAITING_ASSIGNEE: { next: 'IN_PRODUCTION', label: 'Começar produção', icon: '▶' },
  IN_PRODUCTION: { next: 'WAITING_APPROVAL', label: 'Enviar para aprovação', icon: '✓' },
  CHANGES_REQUESTED: { next: 'IN_PRODUCTION', label: 'Retomar alteração', icon: '↻' },
  APPROVED: { next: 'DELIVERED', label: 'Concluir entrega', icon: '✓' },
};

export default function DesignerQuickAction({ demandId, status }: { demandId: string; status: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const action = ACTIONS[status];
  if (!action) return null;

  async function run() {
    if (saving) return;
    setSaving(true);
    const res = await fetch(`/api/demands/${demandId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: action.next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'Não foi possível atualizar a demanda.');
      return;
    }
    router.refresh();
  }

  return <button type="button" className="designerQuickAction" onClick={run} disabled={saving}><span>{action.icon}</span>{saving ? 'Atualizando...' : action.label}</button>;
}
