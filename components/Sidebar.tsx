'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Ship, LayoutDashboard, Plus, ChevronLeft, ChevronRight,
  FileText, LogOut, BookTemplate, Search, X, TrendingUp,
} from 'lucide-react';
import { cn, statusColor, formatCurrency } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import type { Voyage, VoyageStatus } from '@/types';
import { calculatePnL } from '@/lib/pnl';

interface Props {
  voyages: Voyage[];
  loading: boolean;
}

const STATUS_FILTERS: { label: string; value: VoyageStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Planned', value: 'planned' },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'Closed', value: 'closed' },
];

export function Sidebar({ voyages, loading }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VoyageStatus | 'all'>('all');

  const filtered = voyages.filter((v) => {
    const matchSearch =
      !search ||
      v.vesselName.toLowerCase().includes(search.toLowerCase()) ||
      v.voyageNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <aside
      className={cn(
        'flex flex-col bg-card border-r border-border transition-all duration-300 shrink-0',
        collapsed ? 'w-16' : 'w-72'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Ship className="h-5 w-5 text-primary shrink-0" />
            <span className="font-bold text-sm text-foreground">Voyage Manager</span>
          </div>
        )}
        {collapsed && <Ship className="h-5 w-5 text-primary mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg hover:bg-border/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="p-2 border-b border-border space-y-0.5">
        <NavItem href="/" icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" collapsed={collapsed} active={pathname === '/'} />
        <NavItem href="/voyages/new" icon={<Plus className="h-4 w-4" />} label="New Voyage" collapsed={collapsed} active={pathname === '/voyages/new'} />
        <NavItem href="/templates" icon={<BookTemplate className="h-4 w-4" />} label="Templates" collapsed={collapsed} active={pathname === '/templates'} />
        <NavItem href="/variance" icon={<TrendingUp className="h-4 w-4" />} label="Variance Analysis" collapsed={collapsed} active={pathname === '/variance'} />
      </nav>

      {/* Voyage list */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search voyages..."
                className="w-full pl-8 pr-7 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            {/* Status filter */}
            <div className="flex gap-1 mt-2 flex-wrap">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs transition-colors border',
                    statusFilter === f.value
                      ? 'bg-primary/20 border-primary/40 text-primary'
                      : 'bg-transparent border-border text-muted-foreground hover:border-border-light'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voyage items */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 bg-background/50 rounded-lg animate-pulse" />
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-8">
                {voyages.length === 0 ? 'No voyages yet' : 'No matches'}
              </div>
            ) : (
              filtered.map((v) => <VoyageItem key={v.id} voyage={v} active={pathname === `/voyages/${v.id}`} />)
            )}
          </div>
        </div>
      )}

      {/* Logout */}
      <div className="p-2 border-t border-border">
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href, icon, label, collapsed, active,
}: {
  href: string; icon: React.ReactNode; label: string; collapsed: boolean; active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
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

function VoyageItem({ voyage, active }: { voyage: Voyage; active: boolean }) {
  const pnl = calculatePnL(voyage);
  const routeSummary = voyage.portRotation.length > 0
    ? `${voyage.portRotation[0]?.portName ?? '?'} → ${voyage.portRotation[voyage.portRotation.length - 1]?.portName ?? '?'}`
    : 'No ports';

  return (
    <Link
      href={`/voyages/${voyage.id}`}
      className={cn(
        'block p-2.5 rounded-lg border transition-colors',
        active
          ? 'bg-primary/10 border-primary/20'
          : 'bg-background/30 border-border/50 hover:border-border hover:bg-background/60'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-xs font-semibold text-foreground truncate">{voyage.vesselName}</span>
        <StatusBadge status={voyage.status} className="shrink-0" />
      </div>
      <p className="text-xs text-muted-foreground truncate">{routeSummary}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-muted-foreground font-mono">{voyage.voyageNumber}</span>
        <span className={cn('text-xs font-medium', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
          {formatCurrency(pnl.netVoyageResult, 0)}
        </span>
      </div>
    </Link>
  );
}
