'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import type { Voyage } from '@/types';
import { calculatePnL } from '@/lib/pnl';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO, startOfMonth } from 'date-fns';

interface Props {
  voyages: Voyage[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      <p className={`font-semibold ${payload[0].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
        {formatCurrency(payload[0].value, 0)}
      </p>
    </div>
  );
}

export function NetFreightTrendChart({ voyages }: Props) {
  const monthly: Record<string, number> = {};

  voyages.forEach((v) => {
    if (!v.createdAt) return;
    const month = format(startOfMonth(parseISO(v.createdAt)), 'MMM yyyy');
    const pnl = calculatePnL(v);
    monthly[month] = (monthly[month] ?? 0) + pnl.netFreight;
  });

  const data = Object.entries(monthly)
    .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
    .map(([month, value]) => ({ month, value }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Net Freight Trend</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="netFreightGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#22c55e"
              strokeWidth={2}
              fill="url(#netFreightGradient)"
              dot={{ fill: '#22c55e', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#22c55e' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
