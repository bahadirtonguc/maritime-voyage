'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Voyage, CargoType } from '@/types';

interface Props {
  voyages: Voyage[];
}

const CARGO_COLORS: Record<CargoType | string, string> = {
  grain: '#22c55e',
  steel: '#3b82f6',
  coal: '#6366f1',
  fertilizer: '#f59e0b',
  cement: '#94a3b8',
  timber: '#84cc16',
  containers: '#0ea5e9',
  bulk: '#8b5cf6',
  other: '#64748b',
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { count: number } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-xs">
      <p className="font-semibold text-foreground capitalize">{item.name}</p>
      <p className="text-muted-foreground">{item.value}% · {item.payload.count} cargoes</p>
    </div>
  );
}

export function CargoDonutChart({ voyages }: Props) {
  const counts: Record<string, number> = {};
  voyages.forEach((v) => {
    v.cargoes.forEach((c) => {
      counts[c.cargoType] = (counts[c.cargoType] ?? 0) + 1;
    });
  });

  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const data = Object.entries(counts).map(([type, count]) => ({
    name: type,
    value: total > 0 ? Math.round((count / total) * 100) : 0,
    count,
  }));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Cargo Type Breakdown</h3>
      {data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No cargo data yet</div>
      ) : (
        <div className="relative">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                dataKey="value"
                paddingAngle={2}
              >
                {data.map((entry, i) => (
                  <Cell key={i} fill={CARGO_COLORS[entry.name] ?? '#64748b'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: 11, color: '#94a3b8' }}
                formatter={(value) => <span style={{ textTransform: 'capitalize' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-10px' }}>
            <span className="text-2xl font-bold text-foreground">{total}</span>
            <span className="text-xs text-muted-foreground">cargoes</span>
          </div>
        </div>
      )}
    </div>
  );
}
