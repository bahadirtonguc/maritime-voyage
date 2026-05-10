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

  const top3 = items
    .filter((i) => i.deviation > 0)
    .sort((a, b) => Math.abs(b.deviation) - Math.abs(a.deviation))
    .slice(0, 3);

  const chartData = items.map((i) => ({
    name: `${i.portName}: ${i.label}`.slice(0, 20),
    deviation: parseFloat(i.deviation.toFixed(1)),
    status: i.status,
  }));

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Proforma</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(totalProforma, 0)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Final</p>
          <p className="text-sm font-bold text-foreground">{formatCurrency(totalFinal, 0)}</p>
        </div>
        <div className={cn('rounded-xl p-4 border', totalDeviation > threshold ? 'bg-amber-400/10 border-amber-400/20' : 'bg-green-400/10 border-green-400/20')}>
          <p className="text-xs text-muted-foreground mb-1">Total Variance</p>
          <p className={cn('text-sm font-bold', totalDeviation > threshold ? 'text-amber-400' : 'text-green-400')}>
            {totalDeviation >= 0 ? '+' : ''}{totalDeviation.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Top deviations */}
      {top3.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Top Deviations</h4>
          <div className="space-y-1.5">
            {top3.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-foreground">{item.portName}: {item.label}</span>
                <span className={cn('font-semibold', STATUS_CLASSES[item.status].split(' ')[0])}>
                  +{item.deviation.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variance chart */}
      {chartData.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h4 className="text-sm font-semibold text-foreground mb-4">Deviation per Cost Item</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} width={120} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value: unknown) => [`${Number(value) >= 0 ? '+' : ''}${Number(value)}%`, 'Deviation']}
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: '#f1f5f9' }}
              />
              <Bar dataKey="deviation" radius={[0, 3, 3, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={STATUS_COLORS[entry.status]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-background/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Port</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Item</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Proforma</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Final</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Deviation</th>
              <th className="text-center px-4 py-3 text-muted-foreground font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-muted-foreground">No cost data</td>
              </tr>
            ) : (
              items.map((item, i) => (
                <tr key={i} className="hover:bg-background/30 transition-colors">
                  <td className="px-4 py-2.5 text-muted-foreground">{item.portName}</td>
                  <td className="px-4 py-2.5 text-foreground">{item.label}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatCurrency(item.proforma, 0)}</td>
                  <td className="px-4 py-2.5 text-right font-mono text-foreground">{formatCurrency(item.final, 0)}</td>
                  <td className={cn('px-4 py-2.5 text-right font-semibold font-mono', STATUS_CLASSES[item.status].split(' ')[0])}>
                    {item.deviation >= 0 ? '+' : ''}{item.deviation.toFixed(1)}%
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('px-1.5 py-0.5 rounded border text-xs capitalize', STATUS_CLASSES[item.status])}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
