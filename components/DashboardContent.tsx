'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement, Filler,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Doughnut, Radar } from 'react-chartjs-2';
import { useVoyages } from '@/hooks/useVoyages';
import { calculatePnL } from '@/lib/pnl';
import { formatCurrency, cn } from '@/lib/utils';
import {
  Ship, Plus, Anchor, ArrowUpRight, ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import type { Voyage, PortCall } from '@/types';

ChartJS.register(
  CategoryScale, LinearScale, BarElement,
  ArcElement, RadialLinearScale, PointElement, LineElement, Filler,
  Title, Tooltip, Legend,
);

/* ─── palette ──────────────────────────────────────────────────── */
const C = {
  bg:    '#0a1628',
  card:  '#0d1f3c',
  deep:  '#071120',
  bd:    'rgba(255,255,255,0.08)',
  teal:  '#1d9e75',
  amber: '#ef9f27',
  coral: '#d85a30',
  blue:  '#378add',
  red:   '#e05252',
  green: '#22c55e',
  muted: '#475569',
  text:  '#e2e8f0',
};

const RADAR_COLORS = [C.teal, C.blue, C.amber, C.coral, '#8b5cf6', '#ec4899'];

const ttBase = {
  backgroundColor: C.card,
  borderColor: C.bd,
  borderWidth: 1,
  titleColor: C.text,
  bodyColor: C.muted,
};

/* ─── helpers ──────────────────────────────────────────────────── */
function pc(p: PortCall, k: keyof PortCall): number { return (p[k] as number) ?? 0; }


const PORT_COST_KEYS: [keyof PortCall, keyof PortCall][] = [
  ['finalDa',                   'proformaDa'],
  ['lashingFinal',              'lashingProforma'],
  ['finalFacilitation',         'proformaFacilitation'],
  ['finalArmedGuards',          'proformaArmedGuards'],
  ['finalEwri',                 'proformaEwri'],
  ['finalAdditionalInsurance',  'proformaAdditionalInsurance'],
  ['finalSurveyInspection',     'proformaSurveyInspection'],
  ['finalOther',                'proformaOther'],
];

function portTotal(p: PortCall): number {
  return PORT_COST_KEYS.reduce((s, [fin, pro]) => s + (pc(p, fin) || pc(p, pro)), 0);
}

/* ─── Card wrapper ─────────────────────────────────────────────── */
function Card({ title, children, className, style }: {
  title?: string; children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div className={cn('rounded-xl border flex flex-col overflow-hidden', className)}
      style={{ background: C.card, borderColor: C.bd, ...style }}>
      {title && (
        <p className="shrink-0 px-3 py-1.5 text-[9px] uppercase tracking-widest font-semibold border-b"
          style={{ color: C.muted, borderColor: C.bd }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

/* ─── KPI Tile ─────────────────────────────────────────────────── */
function KpiTile({ icon, label, value, sub, valueColor, trend }: {
  icon: React.ReactNode; label: string; value: string;
  sub?: string; valueColor?: string; trend?: 'up' | 'down' | null;
}) {
  return (
    <div className="flex flex-col gap-0.5 px-4 py-3 rounded-xl border"
      style={{ background: C.card, borderColor: C.bd }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: C.muted }}>{label}</span>
        <span style={{ color: C.muted }}>{icon}</span>
      </div>
      <div className="flex items-end gap-1.5">
        <span className="text-xl font-black tabular-nums leading-none" style={{ color: valueColor ?? C.text }}>
          {value}
        </span>
        {trend === 'up'   && <ArrowUpRight   className="h-3.5 w-3.5 mb-0.5 text-green-400" />}
        {trend === 'down' && <ArrowDownRight className="h-3.5 w-3.5 mb-0.5 text-red-400"   />}
      </div>
      {sub && <span className="text-[9px]" style={{ color: C.muted }}>{sub}</span>}
    </div>
  );
}

/* ─── Compact SVG Gauge ────────────────────────────────────────── */
function NetResultGauge({ value, loading }: { value: number; loading: boolean }) {
  const MIN = -500_000, MAX = 500_000;
  const cx = 110, cy = 100, OR = 80, IR = 54;

  function polar(r: number, deg: number) {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) };
  }

  function arcSeg(r1: number, r2: number, a1: number, a2: number, color: string) {
    const p1 = polar(r1, a1), p2 = polar(r1, a2);
    const p3 = polar(r2, a2), p4 = polar(r2, a1);
    const lg = Math.abs(a1 - a2) > 180 ? 1 : 0;
    return (
      <path key={color} fill={color} opacity={0.85} d={[
        `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`,
        `A ${r1} ${r1} 0 ${lg} 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`,
        `L ${p3.x.toFixed(1)} ${p3.y.toFixed(1)}`,
        `A ${r2} ${r2} 0 ${lg} 0 ${p4.x.toFixed(1)} ${p4.y.toFixed(1)} Z`,
      ].join(' ')} />
    );
  }

  const pct = Math.max(0, Math.min(1, (value - MIN) / (MAX - MIN)));
  const needleAngle = 180 - pct * 180;
  const np = polar(OR - 10, needleAngle);
  const nc = value >= 0 ? C.green : Math.abs(value) > 200_000 ? C.coral : C.amber;

  return (
    <svg viewBox="0 0 220 120" className="w-full" style={{ maxHeight: 120 }}>
      {arcSeg(OR, IR, 180, 0, 'rgba(255,255,255,0.05)')}
      {arcSeg(OR, IR, 180, 120, C.coral)}
      {arcSeg(OR, IR, 120, 60, C.amber)}
      {arcSeg(OR, IR, 60, 0, C.teal)}
      {!loading && (
        <>
          <line x1={cx} y1={cy} x2={np.x.toFixed(1)} y2={np.y.toFixed(1)}
            stroke={nc} strokeWidth={2.5} strokeLinecap="round" />
          <circle cx={cx} cy={cy} r={5} fill={C.card} stroke={nc} strokeWidth={2} />
        </>
      )}
      <text x={cx} y={cy + 20} fill={loading ? C.muted : nc}
        fontSize="12" textAnchor="middle" fontWeight="800" fontFamily="monospace">
        {loading ? '—' : formatCurrency(value, 0)}
      </text>
      <text x={cx} y={cy + 31} fill={C.muted} fontSize="7" textAnchor="middle">Net Result</text>
    </svg>
  );
}

/* ─── 2×2 Mini Stats ───────────────────────────────────────────── */
function MiniStats({ voyages, pnlMap }: {
  voyages: Voyage[];
  pnlMap: Map<string, ReturnType<typeof calculatePnL>>;
}) {
  const { totalDa, totalCanals, highPort, highPortCost, avgGmPct } = useMemo(() => {
    let da = 0, canals = 0, highCost = 0, highName = '—';
    const gmPcts: number[] = [];

    for (const v of voyages) {
      for (const p of v.portRotation ?? []) {
        da += pc(p, 'finalDa') || pc(p, 'proformaDa');
        const ptotal = portTotal(p);
        if (ptotal > highCost) { highCost = ptotal; highName = p.portName; }
      }
      for (const cc of v.canalCosts ?? []) {
        canals += cc.finalCost || cc.proformaCost;
      }
      const pnl = pnlMap.get(v.id);
      if (pnl && pnl.freightIn > 0) gmPcts.push(pnl.grossMargin / pnl.freightIn * 100);
    }

    return {
      totalDa: da,
      totalCanals: canals,
      highPort: highName,
      highPortCost: highCost,
      avgGmPct: gmPcts.length > 0 ? gmPcts.reduce((s, x) => s + x, 0) / gmPcts.length : null,
    };
  }, [voyages, pnlMap]);

  function Cell({ label, val, sub, color }: { label: string; val: string; sub?: string; color: string }) {
    return (
      <div className="flex flex-col justify-center px-3 py-2 border-b border-r last:border-r-0"
        style={{ borderColor: C.bd }}>
        <p className="text-[9px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: C.muted }}>{label}</p>
        <p className="text-sm font-black tabular-nums leading-none truncate" style={{ color }}>{val}</p>
        {sub && <p className="text-[9px] mt-0.5 truncate" style={{ color: C.muted }}>{sub}</p>}
      </div>
    );
  }

  return (
    <div className="flex-1 grid grid-cols-2 grid-rows-2" style={{ minHeight: 0 }}>
      <Cell label="Total D/A"   val={formatCurrency(totalDa, 0)}     color={C.coral} />
      <Cell label="Canal Costs" val={formatCurrency(totalCanals, 0)}  color={C.amber} />
      <Cell label="Highest Cost Port"
        val={highPortCost > 0 ? `${highPort} — ${formatCurrency(highPortCost, 0)}` : '—'}
        color={C.blue} />
      <Cell label="Avg GM %"    val={avgGmPct !== null ? `${avgGmPct.toFixed(1)}%` : '—'}
        color={avgGmPct !== null && avgGmPct >= 0 ? C.teal : C.coral} />
    </div>
  );
}

/* ─── Cost Donut ───────────────────────────────────────────────── */
function CostDonut({ voyages }: { voyages: Voyage[] }) {
  const entries = useMemo(() => {
    let da = 0, securing = 0, canals = 0, facilitation = 0, other = 0;
    for (const v of voyages) {
      for (const p of v.portRotation ?? []) {
        da           += pc(p, 'finalDa')                   || pc(p, 'proformaDa');
        securing     += pc(p, 'lashingFinal')               || pc(p, 'lashingProforma');
        facilitation += pc(p, 'finalFacilitation')          || pc(p, 'proformaFacilitation');
        other        += (pc(p, 'finalOther')                || pc(p, 'proformaOther'))
                      + (pc(p, 'finalEwri')                 || pc(p, 'proformaEwri'))
                      + (pc(p, 'finalArmedGuards')          || pc(p, 'proformaArmedGuards'))
                      + (pc(p, 'finalAdditionalInsurance')  || pc(p, 'proformaAdditionalInsurance'))
                      + (pc(p, 'finalSurveyInspection')     || pc(p, 'proformaSurveyInspection'));
      }
      for (const cc of v.canalCosts ?? []) canals += cc.finalCost || cc.proformaCost;
    }
    return [
      { label: 'D/A',        value: da,           color: C.blue },
      { label: 'Securing',   value: securing,     color: C.teal },
      { label: 'Canals',     value: canals,       color: C.amber },
      { label: 'Facil.',     value: facilitation, color: C.coral },
      { label: 'Other',      value: other,        color: '#8b5cf6' },
    ].filter((e) => e.value > 0);
  }, [voyages]);

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px]" style={{ color: C.muted }}>No cost data</p>
      </div>
    );
  }

  const data = {
    labels: entries.map((e) => e.label),
    datasets: [{
      data: entries.map((e) => e.value),
      backgroundColor: entries.map((e) => e.color + 'bb'),
      borderColor: entries.map((e) => e.color),
      borderWidth: 1,
      hoverOffset: 4,
    }],
  };

  return (
    <Doughnut data={data} options={{
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: C.muted, font: { size: 9 }, boxWidth: 8, padding: 6 } },
        tooltip: { ...ttBase, callbacks: { label: (ctx: { label: string; parsed: number }) => `${ctx.label}: ${formatCurrency(ctx.parsed, 0)}` } },
      },
    }} />
  );
}

/* ─── Radar Chart ──────────────────────────────────────────────── */
function RadarChart({ voyages, pnlMap }: {
  voyages: Voyage[];
  pnlMap: Map<string, ReturnType<typeof calculatePnL>>;
}) {
  const display = voyages.slice(-6);

  const datasets = display.map((v, i) => {
    const pnl = pnlMap.get(v.id)!;
    const fi = pnl.freightIn;
    const safeDiv = (n: number, d: number) => d > 0 ? Math.max(0, Math.min(100, (n / d) * 100)) : 0;

    const portCosts = (v.portRotation ?? []).reduce((s, p) => s + portTotal(p), 0);
    const canalCosts = (v.canalCosts ?? []).reduce((s, cc) => s + (cc.finalCost || cc.proformaCost), 0);

    const color = RADAR_COLORS[i % RADAR_COLORS.length];
    return {
      label: v.vesselName.length > 12 ? v.vesselName.slice(0, 12) + '…' : v.vesselName,
      data: [
        safeDiv(pnl.grossMargin, fi),                         // Freight Margin %
        safeDiv(pnl.netVoyageResult, fi),                     // Net Score %
        Math.min(100, safeDiv(portCosts, fi)),                // Port Cost Ratio %
        Math.min(100, safeDiv(canalCosts, fi)),               // Canal %
        Math.max(0, 100 - Math.min(100, Math.abs(pnl.costVariancePercent) * 2)), // Cost Accuracy %
      ],
      backgroundColor: color + '18',
      borderColor: color,
      pointBackgroundColor: color,
      pointRadius: 2.5,
      borderWidth: 1.5,
    };
  });

  if (datasets.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-[10px]" style={{ color: C.muted }}>No voyages</p>
      </div>
    );
  }

  return (
    <Radar
      data={{
        labels: ['Freight\nMargin%', 'Net\nScore%', 'Port Cost\nRatio%', 'Canal\n%', 'Cost\nAccuracy%'],
        datasets,
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 0,
            max: 100,
            ticks: { display: false, stepSize: 25 },
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: C.muted, font: { size: 10 }, padding: 12 },
          },
        },
        plugins: {
          legend: { position: 'bottom', labels: { color: C.muted, font: { size: 9 }, boxWidth: 8, padding: 6 } },
          tooltip: { ...ttBase },
        },
      }}
    />
  );
}

/* ─── BDI Ticker bar ───────────────────────────────────────────── */
interface BdiIndex { symbol: string; price: number; change: number; changePercent: number }

const BDI_PLACEHOLDER: BdiIndex[] = [
  { symbol: 'BDI', price: 0, change: 0, changePercent: 0 },
  { symbol: 'BCI', price: 0, change: 0, changePercent: 0 },
  { symbol: 'BSI', price: 0, change: 0, changePercent: 0 },
  { symbol: 'BHSI', price: 0, change: 0, changePercent: 0 },
];

function BdiBar() {
  const [indices, setIndices] = useState<BdiIndex[]>([]);

  useEffect(() => {
    fetch('/api/bdi')
      .then((r) => r.json())
      .then((d) => { if (d.data?.length) setIndices(d.data); })
      .catch(() => {});
  }, []);

  const items = indices.length > 0 ? indices : BDI_PLACEHOLDER;
  const hasData = indices.length > 0;

  function Item({ d }: { d: BdiIndex }) {
    const pos = d.change >= 0;
    const clr = pos ? '#22c55e' : '#e05252';
    const arrow = pos ? '▲' : '▼';
    const sign  = pos ? '+' : '';
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ color: '#94a3b8', fontSize: 11 }}>⚓</span>
        <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 12, letterSpacing: '0.02em' }}>
          {d.symbol}
        </span>
        <span style={{ color: '#e2e8f0', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
          {d.price > 0 ? d.price.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
        </span>
        {d.price > 0 && (
          <span style={{ color: clr, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
            {arrow} {sign}{Math.round(d.change)} ({sign}{d.changePercent.toFixed(2)}%)
          </span>
        )}
      </span>
    );
  }

  const doubled = [...items, ...items];

  return (
    <div
      style={{
        height: 36,
        background: '#0d1f3c',
        borderTop:    `1px solid ${C.bd}`,
        borderBottom: `1px solid ${C.bd}`,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes bdiRTL {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes bdiDot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
      `}</style>

      {/* Static LIVE badge */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '0 14px',
        borderRight: `1px solid ${C.bd}`,
        flexShrink: 0, height: '100%',
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: C.amber,
          display: 'inline-block',
          animation: 'bdiDot 1.2s ease-in-out infinite',
        }} />
        <span style={{ color: C.amber, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em' }}>
          LIVE
        </span>
      </div>

      {/* Scrolling strip */}
      <div style={{ flex: 1, overflow: 'hidden', height: '100%', display: 'flex', alignItems: 'center' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          whiteSpace: 'nowrap',
          animation: hasData ? 'bdiRTL 40s linear infinite' : 'none',
          gap: 0,
        }}>
          {doubled.map((d, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
              <Item d={d} />
              <span style={{ color: 'rgba(255,255,255,0.18)', margin: '0 1.8rem', fontSize: 10 }}>◆</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Time helper ──────────────────────────────────────────────── */
function timeAgo(date: Date): string {
  const diffMs   = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)  return 'just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  const diffHrs  = Math.floor(diffMins / 60);
  if (diffHrs  < 24) return `${diffHrs} hr${diffHrs > 1 ? 's' : ''} ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/* ─── News Ticker ──────────────────────────────────────────────── */
interface NewsItem { title: string; link: string }

function NewsTicker() {
  const [feed, setFeed]           = useState<'dry' | 'africa'>('dry');
  const [items, setItems]         = useState<NewsItem[]>([]);
  const [loadingNews, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/news?feed=${feed}`)
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [feed]);

  /* 4 s per headline, minimum 20 s total */
  const duration = Math.max(20, (items.length || 5) * 4);

  return (
    <div
      className="flex flex-col gap-0.5 px-4 py-3 rounded-xl border overflow-hidden"
      style={{ background: C.card, borderColor: C.bd }}
    >
      <style>{`
        @keyframes tickerRTL {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* Label + feed tabs — mirrors KpiTile header row */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] uppercase tracking-widest font-semibold" style={{ color: C.muted }}>
          Shipping News
        </span>
        <div className="flex gap-1 shrink-0">
          {(['dry', 'africa'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFeed(f)}
              className="px-2 py-0.5 rounded text-[9px] font-semibold uppercase transition-colors"
              style={{ background: feed === f ? C.blue : C.deep, color: feed === f ? '#fff' : C.muted }}
            >
              {f === 'dry' ? 'Dry' : 'Africa'}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal RTL ticker — single row, clips at edges */}
      <div className="overflow-hidden" style={{ flex: '1 1 auto' }}>
        {loadingNews ? (
          <p className="text-[11px] leading-none mt-1" style={{ color: C.muted }}>Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-[11px] leading-none mt-1" style={{ color: C.muted }}>No news available</p>
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
              animation: `tickerRTL ${duration}s linear infinite`,
              height: '100%',
            }}
          >
            {[...items, ...items].map((item, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] hover:underline"
                  style={{ color: C.text, cursor: 'pointer' }}
                >
                  {item.title}
                </a>
                <span style={{ color: C.muted, margin: '0 1.5rem', fontSize: 10 }}>◆</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ Dashboard ════════════════════════════════════════════════════ */
export function DashboardContent() {
  const { voyages, loading } = useVoyages();
  const [selectedId, setSelectedId] = useState('');

  const pnlMap = useMemo(
    () => new Map(voyages.map((v) => [v.id, calculatePnL(v)])),
    [voyages]
  );

  const activeVoyages   = voyages.filter((v) => v.status === 'active');
  const trackable       = voyages.filter((v) => v.status === 'active' || v.status === 'planned');
  const totalNet        = voyages.reduce((s, v) => s + (pnlMap.get(v.id)?.netVoyageResult ?? 0), 0);

  const deviating = voyages.filter((v) => (pnlMap.get(v.id)?.totalProformaCosts ?? 0) > 0);
  const avgDev = deviating.length > 0
    ? deviating.reduce((s, v) => s + (pnlMap.get(v.id)?.costVariancePercent ?? 0), 0) / deviating.length
    : null;

  const lastUpdated = useMemo(() => {
    if (voyages.length === 0) return null;
    const ts = voyages.map((v) => v.updatedAt ? new Date(v.updatedAt).getTime() : 0);
    return new Date(Math.max(...ts));
  }, [voyages]);

  const selected = trackable.find((v) => v.id === selectedId) ?? null;
  const imo = selected?.imoNumber?.replace(/\D/g, '') || null;

  const sorted = [...voyages].reverse();

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: C.bg }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-5 py-2.5 border-b"
        style={{ borderColor: C.bd, background: C.card }}>
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4" style={{ color: C.blue }} />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-wide">Fleet Overview</span>
            {!loading && lastUpdated && (
              <span className="text-[9px]" style={{ color: C.muted }}>
                Last updated: {timeAgo(lastUpdated)}
              </span>
            )}
          </div>
          {!loading && <span className="text-xs ml-1" style={{ color: C.muted }}>· {voyages.length} voyages</span>}
        </div>
        <Link href="/voyages/new"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: C.blue }}>
          <Plus className="h-3.5 w-3.5" /> New Voyage
        </Link>
      </div>

      <div className="flex-1 flex flex-col p-4 gap-3 min-h-0 overflow-hidden">

        {/* ── Row 1: KPI tiles (3, full width) ── */}
        <div className="shrink-0 grid grid-cols-3 gap-3">
          <KpiTile icon={<Ship className="h-3.5 w-3.5" />} label="Active Voyages"
            value={loading ? '—' : String(activeVoyages.length)}
            sub={`${trackable.length} active+planned`} valueColor={C.blue} />
          <NewsTicker />
          <KpiTile icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Avg Cost Deviation"
            value={loading || avgDev === null ? '—' : `${avgDev >= 0 ? '+' : ''}${avgDev.toFixed(1)}%`}
            sub="− = under budget · + = over budget"
            valueColor={avgDev === null ? C.muted : avgDev < 0 ? C.green : avgDev <= 5 ? C.amber : C.coral} />
        </div>

        {/* ── BDI / Freight Indices ticker — full bleed ── */}
        <div className="-mx-4">
          <BdiBar />
        </div>

        {/* ── Row 2: 4 columns, 190px ── */}
        <div className="shrink-0 grid gap-3" style={{ gridTemplateColumns: '1fr 1fr 1fr 2fr', height: 280 }}>

          {/* Gauge */}
          <Card title="Net Result" className="overflow-hidden">
            <div className="flex-1 flex items-center justify-center px-2 pb-1">
              <NetResultGauge value={totalNet} loading={loading} />
            </div>
          </Card>

          {/* 2×2 stats */}
          <Card title="Cost Summary" className="overflow-hidden">
            {loading
              ? <div className="flex-1 animate-pulse m-2 rounded" style={{ background: C.deep }} />
              : <MiniStats voyages={voyages} pnlMap={pnlMap} />
            }
          </Card>

          {/* Donut */}
          <Card title="Cost Mix" className="overflow-hidden">
            <div className="flex-1 relative p-2 pt-1">
              {loading
                ? <div className="h-full animate-pulse rounded" style={{ background: C.deep }} />
                : <CostDonut voyages={voyages} />
              }
            </div>
          </Card>

          {/* Radar */}
          <Card title="Voyage Performance Radar" className="overflow-hidden">
            <div className="flex-1 relative p-2 pt-1">
              {loading
                ? <div className="h-full animate-pulse rounded" style={{ background: C.deep }} />
                : <RadarChart voyages={sorted} pnlMap={pnlMap} />
              }
            </div>
          </Card>

        </div>

        {/* ── Row 3: AIS + Windy ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

          {/* AIS */}
          <div style={{ background: C.card, borderRadius: '8px', border: `1px solid ${C.bd}`, overflow: 'hidden' }}>
            <div style={{ padding: '8px' }}>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', outline: 'none', background: C.deep, border: `1px solid ${C.bd}`, color: C.text }}
              >
                <option value="">🌍 World map — select vessel</option>
                {trackable.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vesselName} · {v.voyageNumber}{v.imoNumber ? '' : ' (no IMO)'}
                  </option>
                ))}
              </select>
              {selected && !selected.imoNumber && (
                <p style={{ fontSize: '9px', marginTop: '4px', color: C.amber }}>
                  No IMO — showing world map.{' '}
                  <Link href={`/voyages/${selected.id}/edit`} style={{ textDecoration: 'underline' }}>Add IMO</Link>
                </p>
              )}
            </div>
            <div style={{ height: 'calc(100vh - 444px)', overflow: 'hidden' }}>
              <iframe
                key={imo ?? 'world'}
                src={imo
                  ? `https://www.vesselfinder.com/aismap?zoom=8&imo=${imo}&show_track=true`
                  : `https://www.vesselfinder.com/aismap?zoom=3&lat=10&lon=20`}
                title="AIS"
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          </div>

          {/* Windy */}
          <div style={{ height: 'calc(100vh - 400px)', overflow: 'hidden', background: C.card, borderRadius: '8px', border: `1px solid ${C.bd}` }}>
            <iframe
              src="https://embed.windy.com/embed2.html?lat=5&lon=15&zoom=4&level=surface&overlay=waves&menu=&message=true&marker=&calendar=&pressure=&type=map&location=coordinates&detail=&metricWind=kt&metricTemp=%C2%B0C&radarRange=-1"
              title="Windy"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
            />
          </div>

        </div>

      </div>
    </div>
  );
}
