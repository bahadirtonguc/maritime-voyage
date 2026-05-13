'use client';

import type { Voyage } from '@/types';
import { calculateTotalProformaCosts, calculateTotalFinalCosts } from '@/lib/pnl';
import { formatCurrency, cn } from '@/lib/utils';

interface Props {
  voyages: Voyage[];
}

export function ProformaVsFinalChart({ voyages }: Props) {
  const data = voyages.slice(-10).map((v) => {
    const proforma = calculateTotalProformaCosts(v);
    const final = calculateTotalFinalCosts(v);
    const threshold = v.deviationThreshold ?? 5;
    const deviation = proforma > 0 ? ((final - proforma) / proforma) * 100 : 0;
    const status = Math.abs(deviation) <= threshold ? 'ok' : Math.abs(deviation) <= threshold * 2 ? 'warning' : 'danger';
    return { name: v.vesselName, proforma, final, deviation, status };
  });

  const hasData = data.some((d) => d.proforma > 0 || d.final > 0);
  const max = Math.max(...data.map((d) => Math.max(d.proforma, d.final)), 1);

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-5">Proforma vs Final Costs</h3>

      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center text-muted-foreground text-sm gap-1">
          <span>No cost data entered yet</span>
          <span className="text-xs opacity-60">Add costs in Step 4 of a voyage</span>
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((d, i) => (
            <div key={i} className="space-y-1.5">
              {/* Vessel name + deviation */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground truncate max-w-[160px]">{d.name}</span>
                {d.proforma > 0 && (
                  <span className={cn('font-bold',
                    d.status === 'ok' ? 'text-green-400' :
                    d.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                  )}>
                    {d.deviation >= 0 ? '+' : ''}{d.deviation.toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Proforma bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Proforma</span>
                <div className="flex-1 h-5 bg-background/60 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-500/70 rounded transition-none flex items-center justify-end pr-2"
                    style={{ width: `${(d.proforma / max) * 100}%`, minWidth: d.proforma > 0 ? '2px' : '0' }}
                  >
                    {d.proforma > 0 && (
                      <span className="text-[10px] text-white font-medium whitespace-nowrap">
                        {formatCurrency(d.proforma, 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Final bar */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground w-14 shrink-0">Final</span>
                <div className="flex-1 h-5 bg-background/60 rounded overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded transition-none flex items-center justify-end pr-2',
                      d.status === 'ok' ? 'bg-green-500/70' :
                      d.status === 'warning' ? 'bg-amber-500/70' : 'bg-red-500/70'
                    )}
                    style={{ width: `${(d.final / max) * 100}%`, minWidth: d.final > 0 ? '2px' : '0' }}
                  >
                    {d.final > 0 && (
                      <span className="text-[10px] text-white font-medium whitespace-nowrap">
                        {formatCurrency(d.final, 0)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
