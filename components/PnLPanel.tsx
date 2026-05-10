'use client';

import { calculatePnL } from '@/lib/pnl';
import { formatCurrency, cn } from '@/lib/utils';
import type { Voyage } from '@/types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  voyage: Partial<Voyage>;
}

export function PnLPanel({ voyage }: Props) {
  const pnl = calculatePnL(voyage);
  const threshold = voyage.deviationThreshold ?? 5;

  const varianceOk = Math.abs(pnl.costVariancePercent) <= threshold;
  const varianceWarning = Math.abs(pnl.costVariancePercent) > threshold && Math.abs(pnl.costVariancePercent) <= threshold * 2;

  return (
    <div className="sticky top-6">
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">P&L Summary</h3>
        </div>

        <div className="space-y-2.5">
          <Row label="Gross Freight" value={pnl.grossFreight} accent />
          <Row label="Total Brokerage" value={-pnl.totalBrokerage} negative />
          <div className="border-t border-border pt-2">
            <Row label="Net Freight" value={pnl.netFreight} bold />
          </div>
          <div className="border-t border-border pt-2 space-y-1.5">
            <Row label="Proforma Costs" value={-pnl.totalProformaCosts} negative />
            <Row label="Final Costs" value={-pnl.totalFinalCosts} negative />
          </div>

          {/* Cost variance */}
          {pnl.totalProformaCosts > 0 && (
            <div className={cn(
              'flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs',
              varianceOk && 'bg-green-400/10 text-green-400',
              varianceWarning && 'bg-amber-400/10 text-amber-400',
              !varianceOk && !varianceWarning && 'bg-red-400/10 text-red-400'
            )}>
              <span>Cost Variance</span>
              <span className="font-semibold">{pnl.costVariancePercent >= 0 ? '+' : ''}{pnl.costVariancePercent.toFixed(1)}%</span>
            </div>
          )}

          <div className="border-t border-border pt-2">
            <div className={cn(
              'flex items-center justify-between p-3 rounded-xl border',
              pnl.netVoyageResult >= 0
                ? 'bg-green-400/10 border-green-400/20'
                : 'bg-red-400/10 border-red-400/20'
            )}>
              <div className="flex items-center gap-1.5">
                {pnl.netVoyageResult >= 0
                  ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                }
                <span className="text-xs font-semibold text-foreground">Net Result</span>
              </div>
              <span className={cn('text-base font-bold', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatCurrency(pnl.netVoyageResult, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  label, value, negative, bold, accent,
}: {
  label: string; value: number; negative?: boolean; bold?: boolean; accent?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-xs', bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={cn(
        'text-xs font-mono',
        bold ? 'font-bold text-foreground text-sm' : '',
        accent ? 'text-blue-400' : '',
        negative && value < 0 ? 'text-red-400' : '',
      )}>
        {value < 0 ? '-' : value > 0 && negative ? '-' : ''}{formatCurrency(Math.abs(value), 0)}
      </span>
    </div>
  );
}
