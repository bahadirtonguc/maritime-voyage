import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, decimals = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function deviationStatus(deviationPercent: number, threshold: number): 'ok' | 'warning' | 'danger' {
  if (Math.abs(deviationPercent) <= threshold) return 'ok';
  if (Math.abs(deviationPercent) <= threshold * 2) return 'warning';
  return 'danger';
}

export function statusColor(status: string): string {
  switch (status) {
    case 'planned': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
    case 'active': return 'text-green-400 bg-green-400/10 border-green-400/30';
    case 'completed': return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
    case 'closed': return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
  }
}
