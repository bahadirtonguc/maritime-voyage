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
  const varianceOk   = Math.abs(pnl.costVariancePercent) <= threshold;
  const varianceWarn = Math.abs(pnl.costVariancePercent) > threshold && Math.abs(pnl.costVariancePercent) <= threshold * 2;

  const portCosts = (voyage.portRotation ?? []).reduce((sum, p) => {
    const fin = (p.finalDa ?? 0) + (p.finalPilotage ?? 0) + (p.finalTowage ?? 0) + (p.finalAgencyFee ?? 0)
      + (p.finalOther ?? 0) + (p.lashingFinal ?? 0) + (p.otherCostsFinal ?? 0)
      + (p.finalFacilitation ?? 0) + (p.finalArmedGuards ?? 0) + (p.finalEwri ?? 0)
      + (p.finalAdditionalInsurance ?? 0) + (p.finalSurveyInspection ?? 0);
    const pro = (p.proformaDa ?? 0) + (p.proformaPilotage ?? 0) + (p.proformaTowage ?? 0) + (p.proformaAgencyFee ?? 0)
      + (p.proformaOther ?? 0) + (p.lashingProforma ?? 0) + (p.otherCostsProforma ?? 0)
      + (p.proformaFacilitation ?? 0) + (p.proformaArmedGuards ?? 0) + (p.proformaEwri ?? 0)
      + (p.proformaAdditionalInsurance ?? 0) + (p.proformaSurveyInspection ?? 0);
    return sum + (fin > 0 ? fin : pro);
  }, 0);

  const canalCosts = (voyage.canalCosts ?? []).reduce((sum, c) =>
    sum + (c.finalCost > 0 ? c.finalCost : c.proformaCost), 0);

  return (
    <div className="sticky top-6">
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">P&L Summary</h3>
        </div>

        <div className="space-y-1.5 text-xs">
          <Row label="Freight In" value={pnl.freightIn} color="blue" />
          <Row label="Less: Freight Out" value={-pnl.freightOut} color={pnl.freightOut > 0 ? 'red' : 'muted'} />
          <div className="border-t border-border pt-1.5">
            <Row label="Gross Margin" value={pnl.grossMargin} bold color={pnl.grossMargin >= 0 ? 'green' : 'red'} />
          </div>

          {portCosts > 0 && (
            <Row label="Less: Port Costs" value={-portCosts} color="red" />
          )}
          {canalCosts > 0 && (
            <Row label="Less: Straits & Canals" value={-canalCosts} color="red" />
          )}

          {pnl.totalProformaCosts > 0 && (
            <div className={cn(
              'flex items-center justify-between px-2 py-1 rounded text-[10px] mt-1',
              varianceOk ? 'bg-green-400/10 text-green-400' : varianceWarn ? 'bg-amber-400/10 text-amber-400' : 'bg-red-400/10 text-red-400'
            )}>
              <span>Cost variance</span>
              <span className="font-semibold">{pnl.costVariancePercent >= 0 ? '+' : ''}{pnl.costVariancePercent.toFixed(1)}%</span>
            </div>
          )}

          <div className="border-t border-border pt-1.5">
            <div className={cn(
              'flex items-center justify-between p-2.5 rounded-lg border',
              pnl.netVoyageResult >= 0 ? 'bg-green-400/10 border-green-400/20' : 'bg-red-400/10 border-red-400/20'
            )}>
              <div className="flex items-center gap-1.5">
                {pnl.netVoyageResult >= 0
                  ? <TrendingUp className="h-3.5 w-3.5 text-green-400" />
                  : <TrendingDown className="h-3.5 w-3.5 text-red-400" />}
                <span className="font-semibold text-foreground">Net Result</span>
              </div>
              <span className={cn('font-mono font-bold text-sm', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                {formatCurrency(pnl.netVoyageResult, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, color }: { label: string; value: number; bold?: boolean; color?: string }) {
  const textColor = color === 'blue' ? 'text-blue-400' : color === 'green' ? 'text-green-400'
    : color === 'red' ? 'text-red-400' : 'text-muted-foreground';
  return (
    <div className="flex items-center justify-between">
      <span className={cn('text-xs', bold ? 'font-semibold text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={cn('text-xs font-mono', bold ? 'font-bold text-sm' : '', textColor)}>
        {value < 0 ? '-' : ''}{formatCurrency(Math.abs(value), 0)}
      </span>
    </div>
  );
}
