import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface Props {
  title: string;
  value: string;
  change?: string;
  changePositive?: boolean;
  icon: ReactNode;
  accent?: 'blue' | 'green' | 'amber' | 'purple';
  subtitle?: string;
}

const accentMap = {
  blue: 'text-blue-400 bg-blue-400/10',
  green: 'text-green-400 bg-green-400/10',
  amber: 'text-amber-400 bg-amber-400/10',
  purple: 'text-purple-400 bg-purple-400/10',
};

export function KpiCard({ title, value, change, changePositive, icon, accent = 'blue', subtitle }: Props) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        <div className={cn('p-2.5 rounded-lg', accentMap[accent])}>
          {icon}
        </div>
      </div>
      {change && (
        <div className="flex items-center gap-1">
          <span className={cn('text-xs font-medium', changePositive ? 'text-green-400' : 'text-red-400')}>
            {change}
          </span>
          <span className="text-xs text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
