'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
} from 'recharts';
import type { Voyage } from '@/types';
import { calculateTotalProformaCosts, calculateTotalFinalCosts } from '@/lib/pnl';
import { formatCurrency } from '@/lib/utils';

interface Props {
  voyages: Voyage[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-3 shadow-xl text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="font-mono text-foreground">{formatCurrency(p.value, 0)}</span>
        </div>
      ))}
    </div>
  );
}

export function ProformaVsFinalChart({ voyages }: Props) {
  const data = voyages.slice(-10).map((v) => {
    const proforma = calculateTotalProformaCosts(v);
    const final = calculateTotalFinalCosts(v);
    const threshold = v.deviationThreshold ?? 5;
    const deviation = proforma > 0 ? ((final - proforma) / proforma) * 100 : 0;
    return {
      name: v.vesselName.length > 10 ? v.vesselName.slice(0, 10) + '…' : v.vesselName,
      proforma,
      final,
      overThreshold: Math.abs(deviation) > threshold,
    };
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Proforma vs Final Costs</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No voyage data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barCategoryGap="30%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
            <Bar dataKey="proforma" name="Proforma" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill="#3b82f6" fillOpacity={entry.overThreshold ? 0.5 : 1} />
              ))}
            </Bar>
            <Bar dataKey="final" name="Final" radius={[3, 3, 0, 0]}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.overThreshold ? '#f59e0b' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
