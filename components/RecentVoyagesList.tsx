'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatCurrency } from '@/lib/utils';
import { calculatePnL } from '@/lib/pnl';
import type { Voyage } from '@/types';
import { cn } from '@/lib/utils';

interface Props {
  voyages: Voyage[];
}

export function RecentVoyagesList({ voyages }: Props) {
  const recent = voyages.slice().reverse().slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Voyages</h3>
        <Link href="/voyages/new" className="text-xs text-primary hover:text-primary-hover transition-colors">
          + New voyage
        </Link>
      </div>

      {recent.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No voyages yet. <Link href="/voyages/new" className="text-primary hover:underline">Create your first voyage</Link>
        </div>
      ) : (
        <div className="space-y-2">
          {recent.map((v) => {
            const pnl = calculatePnL(v);
            const routeSummary = v.portRotation.length > 0
              ? `${v.portRotation[0]?.portName ?? '?'} → ${v.portRotation[v.portRotation.length - 1]?.portName ?? '?'}`
              : 'No ports defined';

            return (
              <Link
                key={v.id}
                href={`/voyages/${v.id}`}
                className="flex items-center justify-between p-3 rounded-lg bg-background/40 border border-border/50 hover:border-border hover:bg-background/70 transition-colors group"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">{v.vesselName}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{routeSummary}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  <span className={cn('text-sm font-semibold', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                    {formatCurrency(pnl.netVoyageResult, 0)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
