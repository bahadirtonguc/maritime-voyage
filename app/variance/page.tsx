'use client';

import { useVoyages } from '@/hooks/useVoyages';
import { AppShell } from '@/components/AppShell';
import { VarianceTable } from '@/components/VarianceTable';
import { buildVarianceItems } from '@/lib/pnl';
import { useState } from 'react';

export default function VariancePage() {
  const { voyages, loading } = useVoyages();
  const [selectedId, setSelectedId] = useState<string>('all');

  const selectedVoyages = selectedId === 'all' ? voyages : voyages.filter((v) => v.id === selectedId);
  const allItems = selectedVoyages.flatMap((v) =>
    buildVarianceItems(v).map((item) => ({ ...item, voyageName: v.vesselName }))
  );
  const threshold = selectedVoyages[0]?.deviationThreshold ?? 5;

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Variance Analysis</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Compare proforma vs final costs across voyages</p>
          </div>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Voyages</option>
            {voyages.map((v) => (
              <option key={v.id} value={v.id}>{v.vesselName} — {v.voyageNumber}</option>
            ))}
          </select>
        </div>

        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-card border border-border rounded-xl animate-pulse" />
          ))
        ) : (
          <VarianceTable items={allItems} threshold={threshold} />
        )}
      </div>
      </div>
    </AppShell>
  );
}
