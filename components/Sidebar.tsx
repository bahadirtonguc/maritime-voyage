'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ship, LayoutDashboard, Plus, ChevronLeft, ChevronRight,
  LogOut,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { useVoyages } from '@/hooks/useVoyages';
import { calculatePnL } from '@/lib/pnl';

type Filter = 'all' | 'planned' | 'active' | 'completed';

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All',       value: 'all' },
  { label: 'Planned',   value: 'planned' },
  { label: 'Active',    value: 'active' },
  { label: 'Done',      value: 'completed' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const { voyages, loading } = useVoyages();

  const filtered = voyages.filter(
    (v) => filter === 'all' || v.status === filter
  );

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0',
        collapsed ? 'w-12' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        {!collapsed && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src="https://core-shipping.com/uploads/logo.png"
            alt="Core Shipping"
            style={{ maxHeight: 24, width: 'auto', filter: 'brightness(0) invert(1)' }}
          />
        )}
        {collapsed && <Ship className="h-4 w-4 text-primary mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-0.5 rounded hover:bg-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="px-1.5 py-1.5 border-b border-border space-y-0.5">
        <NavItem href="/" icon={<LayoutDashboard className="h-3.5 w-3.5" />} label="Dashboard" collapsed={collapsed} active={pathname === '/'} />
        <NavItem href="/voyages/new" icon={<Plus className="h-3.5 w-3.5" />} label="New Voyage" collapsed={collapsed} active={pathname === '/voyages/new'} />
      </nav>

      {/* Compact voyage list */}
      {!collapsed && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Filter tabs */}
          <div className="flex border-b border-border">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={cn(
                  'flex-1 py-1 text-[10px] font-semibold transition-colors',
                  filter === f.value
                    ? 'text-primary border-b-2 border-primary -mb-px'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-9 border-b border-border/30 animate-pulse bg-background/20" />
              ))
            ) : filtered.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-4">No voyages</p>
            ) : (
              filtered.map((v) => {
                const pnl = calculatePnL(v);
                const from = v.portRotation[0]?.portName;
                const to   = v.portRotation[v.portRotation.length - 1]?.portName;
                const route = from && to && from !== to ? `${from}→${to}` : from ?? '—';
                const isActive = pathname === `/voyages/${v.id}`;
                return (
                  <Link
                    key={v.id}
                    href={`/voyages/${v.id}`}
                    className={cn(
                      'flex items-center justify-between px-2.5 py-1.5 border-b border-border/30 transition-colors',
                      isActive ? 'bg-primary/10' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="min-w-0 mr-1.5">
                      <p className="text-[12px] font-bold text-foreground truncate leading-tight">{v.vesselName}</p>
                      <p className="text-[11px] text-muted-foreground truncate leading-tight">{route}</p>
                    </div>
                    <span className={cn(
                      'text-[11px] font-bold tabular-nums shrink-0',
                      pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {formatCurrency(pnl.netVoyageResult, 0)}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* World Clock */}
      {!collapsed && <WorldClock />}

      {/* Copyright */}
      {!collapsed && (
        <p className="text-[10px] text-muted-foreground/50 text-center py-1.5 select-none">© Bero 2026</p>
      )}

      {/* Footer */}
      <div className="px-1.5 py-1.5 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

function NavItem({ href, icon, label, collapsed, active }: {
  href: string; icon: React.ReactNode; label: string; collapsed: boolean; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors',
        active
          ? 'bg-primary/15 text-primary border border-primary/20'
          : 'text-muted-foreground hover:text-foreground hover:bg-border/50',
        collapsed && 'justify-center'
      )}
    >
      <span className="shrink-0">{icon}</span>
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

const CLOCKS = [
  { label: 'London',    tz: 'Europe/London' },
  { label: 'Istanbul',  tz: 'Europe/Istanbul' },
  { label: 'Dubai',     tz: 'Asia/Dubai' },
  { label: 'Singapore', tz: 'Asia/Singapore' },
  { label: 'Rotterdam', tz: 'Europe/Amsterdam' },
  { label: 'New York',  tz: 'America/New_York' },
];

function WorldClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="mx-2 mb-1.5 px-2.5 py-2 rounded bg-background/40 border border-border/50">
      <p className="text-[9px] uppercase tracking-widest font-semibold text-muted-foreground/60 mb-1.5">World Clock</p>
      <div className="space-y-1">
        {CLOCKS.map(({ label, tz }) => {
          const time = now.toLocaleTimeString('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit' });
          return (
            <div key={tz} className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">{label}</span>
              <span className="text-[10px] font-mono text-foreground/80 tabular-nums">{time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
