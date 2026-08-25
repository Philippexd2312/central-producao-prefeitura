'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ClaimDemandButton({
  demandId,
  compact = false,
  onClaimed,
}: {
  demandId: string;
  compact?: boolean;
  onClaimed?: (demand: any) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function claimDemand() {
    if (loading) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/demands/${demandId}/claim`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data?.error || 'Não foi possível assumir a demanda.');
        return;
      }

      onClaimed?.(data);
      router.refresh();
    } catch {
      alert('Não foi possível assumir a demanda.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      className={`claimButton${compact ? ' claimButtonCompact' : ''}`}
      onClick={claimDemand}
      disabled={loading}
    >
      <span>{loading ? '…' : '✓'}</span>
      {loading ? 'Assumindo...' : 'Assumir demanda'}
    </button>
  );
}
