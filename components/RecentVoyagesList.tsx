'use client';

import Link from 'next/link';
import { ArrowRight, AlertTriangle, CheckCircle } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { formatCurrency, cn } from '@/lib/utils';
import { calculatePnL } from '@/lib/pnl';
import type { Voyage } from '@/types';

interface Props {
  voyages: Voyage[];
}

export function RecentVoyagesList({ voyages }: Props) {
  const recent = voyages.slice().reverse().slice(0, 8);

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
          No voyages yet.{' '}
          <Link href="/voyages/new" className="text-primary hover:underline">Create your first voyage</Link>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {recent.map((v) => {
            const pnl = calculatePnL(v);
            const threshold = v.deviationThreshold ?? 5;
            const devAbs = Math.abs(pnl.costVariancePercent);
            const hasCosts = pnl.totalProformaCosts > 0;
            const devStatus = !hasCosts ? 'none' : devAbs <= threshold ? 'ok' : devAbs <= threshold * 2 ? 'warning' : 'danger';
            const routeSummary = v.portRotation.length > 0
              ? `${v.portRotation[0]?.portName ?? '?'} → ${v.portRotation[v.portRotation.length - 1]?.portName ?? '?'}`
              : 'No ports defined';

            return (
              <Link
                key={v.id}
                href={`/voyages/${v.id}`}
                className="flex items-center gap-3 py-3 hover:bg-background/30 transition-colors group px-2 -mx-2 rounded-lg"
              >
                {/* Deviation indicator dot */}
                <div className={cn('w-2 h-2 rounded-full shrink-0',
                  devStatus === 'danger' ? 'bg-red-400' :
                  devStatus === 'warning' ? 'bg-amber-400' :
                  devStatus === 'ok' ? 'bg-green-400' :
                  'bg-border'
                )} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-foreground truncate">{v.vesselName}</span>
                    <StatusBadge status={v.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{routeSummary}</p>
                </div>

                {/* Cost deviation badge */}
                {hasCosts && devStatus !== 'none' && (
                  <div className={cn('flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border shrink-0',
                    devStatus === 'danger' ? 'text-red-400 bg-red-400/10 border-red-400/20' :
                    devStatus === 'warning' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    'text-green-400 bg-green-400/10 border-green-400/20'
                  )}>
                    {devStatus === 'ok'
                      ? <CheckCircle className="h-3 w-3" />
                      : <AlertTriangle className="h-3 w-3" />}
                    {pnl.costVariancePercent >= 0 ? '+' : ''}{pnl.costVariancePercent.toFixed(1)}%
                  </div>
                )}

                <div className="flex items-center gap-2 shrink-0">
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
