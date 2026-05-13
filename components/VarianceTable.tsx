'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { VarianceItem } from '@/types';
import { formatCurrency, cn } from '@/lib/utils';

interface Props {
  items: VarianceItem[];
  threshold: number;
}

const STATUS_COLORS = {
  ok: '#22c55e',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const STATUS_CLASSES = {
  ok: 'text-green-400 bg-green-400/10 border-green-400/20',
  warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  danger: 'text-red-400 bg-red-400/10 border-red-400/20',
};

export function VarianceTable({ items, threshold }: Props) {
  const totalProforma = items.reduce((s, i) => s + i.proforma, 0);
  const totalFinal = items.reduce((s, i) => s + i.final, 0);
  const totalDeviation = totalProforma > 0 ? ((totalFinal - totalProforma) / totalProforma) * 100 : 0;
  const hasVoyageCol = items.some((i) => i.voyageName);

  const dangerCount = items.filter((i) => i.status === 'danger').length;
  const warningCount = items.filter((i) => i.status === 'warning').length;

  const top5 = items
    .filter((i) => i.status !== 'ok')
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 5);

  const chartData = items
    .filter((i) => i.proforma > 0)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 12)
    .map((i) => ({
      name: `${i.portName}: ${i.label}`.slice(0, 22),
      deviation: parseFloat(i.deviation.toFixed(1)),
      status: i.status,
    }));

  if (items.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground text-sm">
        No cost data to analyze. Enter proforma and final costs in your voyages.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Proforma</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(totalProforma, 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Final</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(totalFinal, 0)}</p>
        </div>
        <div className={cn('rounded-xl p-4 border', Math.abs(totalDeviation) > threshold ? 'bg-amber-400/10 border-amber-400/20' : 'bg-green-400/10 border-green-400/20')}>
          <p className="text-xs text-muted-foreground mb-1">Overall Deviation</p>
          <p className={cn('text-base font-bold', Math.abs(totalDeviation) > threshold ? 'text-amber-400' : 'text-green-400')}>
            {totalDeviation >= 0 ? '+' : ''}{totalDeviation.toFixed(1)}%
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Alerts</p>
          <div className="flex items-center gap-2 mt-1">
            {dangerCount > 0 && <span className="text-xs font-bold text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded">{dangerCount} critical</span>}
            {warningCount > 0 && <span className="text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">{warningCount} warn</span>}
            {dangerCount === 0 && warningCount === 0 && <span className="text-xs font-bold text-green-400">All OK</span>}
          </div>
        </div>
      </div>

      {/* Top deviations */}
      {top5.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Top Deviations</h4>
          <div className="space-y-2">
            {top5.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  {item.voyageName && (
                    <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded shrink-0">{item.voyageName}</span>
                  )}
                  <span className="text-xs text-foreground truncate">{item.portName}: {item.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground font-mono">{formatCurrency(item.proforma, 0)} → {formatCurrency(item.final, 0)}</span>
                  <span className={cn('text-xs font-bold px-2 py-0.5 rounded border', STATUS_CLASSES[item.status])}>
                    {item.deviation >= 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Deviation bar chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Deviation per Cost Item</h4>
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 28)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 24 }} style={{ background: 'transparent' }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={140} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: unknown) => [`${Number(value) >= 0 ? '+' : ''}${Number(value)}%`, 'Deviation']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#f1f5f9' }}
                cursor={{ fill: 'rgba(148,163,184,0.06)' }}
              />
              <Bar dataKey="deviation" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-background/30">
              {hasVoyageCol && <th className="text-left px-4 py-3 text-muted-foreground font-medium">Voyage</th>}
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Port / Area</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Item</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Proforma</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Final</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Δ Amount</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Deviation</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.map((item, i) => (
              <tr key={i} className={cn('transition-colors', item.status !== 'ok' ? 'hover:bg-background/30' : 'hover:bg-background/20')}>
                {hasVoyageCol && (
                  <td className="px-4 py-2.5 text-muted-foreground text-xs">{item.voyageName ?? '—'}</td>
                )}
                <td className="px-4 py-2.5 text-muted-foreground">{item.portName}</td>
                <td className="px-4 py-2.5 text-foreground">{item.label}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatCurrency(item.proforma, 0)}</td>
                <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatCurrency(item.final, 0)}</td>
                <td className={cn('px-4 py-2.5 text-right font-mono', item.final - item.proforma > 0 ? 'text-red-400' : item.final - item.proforma < 0 ? 'text-green-400' : 'text-muted-foreground')}>
                  {item.final - item.proforma > 0 ? '+' : ''}{formatCurrency(item.final - item.proforma, 0)}
                </td>
                <td className={cn('px-4 py-2.5 text-right font-semibold font-mono', STATUS_CLASSES[item.status].split(' ')[0])}>
                  {item.deviation >= 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                </td>
                <td className="px-4 py-2.5 text-center">
                  <span className={cn('px-1.5 py-0.5 rounded border text-xs capitalize', STATUS_CLASSES[item.status])}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
