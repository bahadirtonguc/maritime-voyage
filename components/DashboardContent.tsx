'use client';

import { useVoyages } from '@/hooks/useVoyages';
import { KpiCard } from './KpiCard';
import { ProformaVsFinalChart } from './charts/ProformaVsFinalChart';
import { CargoDonutChart } from './charts/CargoDonutChart';
import { NetFreightTrendChart } from './charts/NetFreightTrendChart';
import { TransitFlagsWidget } from './TransitFlagsWidget';
import { RecentVoyagesList } from './RecentVoyagesList';
import { calculatePnL } from '@/lib/pnl';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DollarSign, Ship, AlertTriangle, TrendingUp } from 'lucide-react';

export function DashboardContent() {
  const { voyages, loading } = useVoyages();

  const activeVoyages = voyages.filter((v) => v.status === 'active');
  const completedVoyages = voyages.filter((v) => v.status === 'completed' || v.status === 'closed');

  const totalNetResult = voyages.reduce((s, v) => s + calculatePnL(v).netVoyageResult, 0);
  const totalBrokerage = voyages.reduce((s, v) => s + calculatePnL(v).totalBrokerage, 0);
  const avgVariance = voyages.length > 0
    ? voyages.reduce((s, v) => s + Math.abs(calculatePnL(v).costVariancePercent), 0) / voyages.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {voyages.length} voyages · {activeVoyages.length} active
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-card border border-border rounded-xl animate-pulse" />
          ))
        ) : (
          <>
            <KpiCard
              title="Net Voyage Result"
              value={formatCurrency(totalNetResult, 0)}
              icon={<DollarSign className="h-5 w-5" />}
              accent="green"
              subtitle="All voyages combined"
            />
            <KpiCard
              title="Active Voyages"
              value={String(activeVoyages.length)}
              icon={<Ship className="h-5 w-5" />}
              accent="blue"
              subtitle={`${completedVoyages.length} completed`}
            />
            <KpiCard
              title="Avg Cost Variance"
              value={`${avgVariance.toFixed(1)}%`}
              icon={<AlertTriangle className="h-5 w-5" />}
              accent={avgVariance > 10 ? 'amber' : 'blue'}
              subtitle="vs proforma budget"
            />
            <KpiCard
              title="Total Brokerage"
              value={formatCurrency(totalBrokerage, 0)}
              icon={<TrendingUp className="h-5 w-5" />}
              accent="purple"
              subtitle="Across all voyages"
            />
          </>
        )}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <ProformaVsFinalChart voyages={voyages} />
        </div>
        <CargoDonutChart voyages={voyages} />
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <NetFreightTrendChart voyages={voyages} />
        </div>
        <TransitFlagsWidget voyages={voyages} />
      </div>

      {/* Recent voyages */}
      <RecentVoyagesList voyages={voyages} />
    </div>
  );
}
