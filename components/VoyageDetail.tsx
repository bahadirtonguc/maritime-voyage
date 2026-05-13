'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit, Trash2, Ship, Download, BookTemplate,
  FileSpreadsheet, Loader2, ArrowRight, MapPin, Package,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { RemarksSection } from './RemarksSection';
import { useToast } from './ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { useTemplates } from '@/hooks/useTemplates';
import { calculatePnL } from '@/lib/pnl';
import { formatCurrency, generateId, cn } from '@/lib/utils';
import type { Voyage, CostEntry } from '@/types';
import dynamic from 'next/dynamic';

const VoyageMap = dynamic(() => import('./wizard/VoyageMap').then((m) => m.VoyageMap), {
  ssr: false,
  loading: () => <div className="h-full bg-background/50 rounded-xl animate-pulse" />,
});

interface Props { voyage: Voyage }
type Tab = 'costs' | 'overview' | 'remarks';

const COST_LABELS: { proKey: keyof CostEntry; finKey: keyof CostEntry; label: string }[] = [
  { proKey: 'proformaDa', finKey: 'finalDa', label: 'Disbursement (D/A)' },
  { proKey: 'proformaPilotage', finKey: 'finalPilotage', label: 'Pilotage' },
  { proKey: 'proformaTowage', finKey: 'finalTowage', label: 'Towage' },
  { proKey: 'proformaAgencyFee', finKey: 'finalAgencyFee', label: 'Agency Fee' },
  { proKey: 'proformaOther', finKey: 'finalOther', label: 'Other' },
];

function deviationColor(dev: number, threshold: number) {
  if (Math.abs(dev) <= threshold) return 'ok';
  if (Math.abs(dev) <= threshold * 2) return 'warning';
  return 'danger';
}

export function VoyageDetail({ voyage }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('costs');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const { deleteVoyage } = useVoyages();
  const { saveTemplate } = useTemplates();
  const { toast } = useToast();
  const router = useRouter();

  const pnl = calculatePnL(voyage);
  const threshold = voyage.deviationThreshold ?? 5;
  const totalDev = pnl.totalProformaCosts > 0
    ? ((pnl.totalFinalCosts - pnl.totalProformaCosts) / pnl.totalProformaCosts) * 100
    : 0;
  const totalDevStatus = deviationColor(totalDev, threshold);
  const hasCostData = pnl.totalProformaCosts > 0 || pnl.totalFinalCosts > 0;

  async function handleDelete() {
    const ok = await deleteVoyage(voyage.id);
    if (ok) { toast('Voyage deleted', 'success'); router.push('/'); }
    else toast('Failed to delete voyage', 'error');
    setDeleteOpen(false);
  }

  async function handleExportPdf() {
    setExporting('pdf');
    try { const { exportVoyagePdf } = await import('@/lib/exportPdf'); await exportVoyagePdf(voyage); toast('PDF downloaded', 'success'); }
    catch { toast('Failed to generate PDF', 'error'); }
    finally { setExporting(null); }
  }

  async function handleExportExcel() {
    setExporting('excel');
    try { const { exportVoyageExcel } = await import('@/lib/exportExcel'); await exportVoyageExcel(voyage); toast('Excel downloaded', 'success'); }
    catch { toast('Failed to generate Excel', 'error'); }
    finally { setExporting(null); }
  }

  async function handleSaveTemplate() {
    const name = prompt('Template name:');
    if (!name) return;
    const ok = await saveTemplate({
      id: generateId(), name,
      voyage: {
        voyageNumber: voyage.voyageNumber, vesselName: voyage.vesselName,
        vesselType: voyage.vesselType, vesselSpeed: voyage.vesselSpeed,
        laydaysStart: voyage.laydaysStart, cancellingDate: voyage.cancellingDate,
        cargoes: voyage.cargoes, portRotation: voyage.portRotation,
        costs: voyage.costs, canalCosts: voyage.canalCosts,
        deviationThreshold: voyage.deviationThreshold, remarks: voyage.remarks, documents: voyage.documents,
      },
      createdAt: new Date().toISOString(),
    });
    if (ok) toast('Saved as template', 'success'); else toast('Failed to save template', 'error');
  }

  return (
    <div className="min-h-screen">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Ship className="h-5 w-5 text-primary shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">{voyage.vesselName}</h1>
                <StatusBadge status={voyage.status} />
              </div>
              <p className="text-xs text-muted-foreground font-mono">
                {voyage.voyageNumber}{voyage.vesselType && ` · ${voyage.vesselType}`}{voyage.vesselSpeed > 0 && ` · ${voyage.vesselSpeed} kn`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <button onClick={handleExportPdf} disabled={exporting === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
              {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} PDF
            </button>
            <button onClick={handleExportExcel} disabled={exporting === 'excel'}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors">
              {exporting === 'excel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />} Excel
            </button>
            <button onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
              <BookTemplate className="h-3.5 w-3.5" /> Template
            </button>
            <Link href={`/voyages/${voyage.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Edit className="h-3.5 w-3.5" /> Edit
            </Link>
            <button onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400/30 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Hero: Forecast vs Final ──────────────────────────── */}
      <div className="px-6 py-6 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Forecast */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Forecast Costs</p>
            <p className="text-3xl font-bold text-foreground">{formatCurrency(pnl.totalProformaCosts, 0)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Freight In</span><span className="text-blue-400 font-medium">{formatCurrency(pnl.freightIn, 0)}</span></div>
              <div className="flex justify-between"><span>Freight Out</span><span className="text-foreground">{formatCurrency(pnl.freightOut, 0)}</span></div>
              <div className="flex justify-between border-t border-border/50 pt-1 mt-1"><span>Gross Margin</span><span className="text-foreground font-semibold">{formatCurrency(pnl.grossMargin, 0)}</span></div>
            </div>
          </div>

          {/* Arrow + Deviation — the hero */}
          <div className={cn(
            'rounded-2xl p-5 border-2 flex flex-col items-center justify-center text-center',
            totalDevStatus === 'ok' ? 'bg-green-400/10 border-green-400/30' :
            totalDevStatus === 'warning' ? 'bg-amber-400/10 border-amber-400/30' :
            hasCostData ? 'bg-red-400/10 border-red-400/30' : 'bg-card border-border'
          )}>
            {!hasCostData ? (
              <p className="text-sm text-muted-foreground">No cost data entered yet</p>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Cost Deviation</p>
                <p className={cn('text-5xl font-black tracking-tight',
                  totalDevStatus === 'ok' ? 'text-green-400' :
                  totalDevStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
                )}>
                  {totalDev >= 0 ? '+' : ''}{totalDev.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {totalDev > 0 ? `$${formatCurrency(pnl.totalFinalCosts - pnl.totalProformaCosts, 0).replace('$','')} over budget` :
                   totalDev < 0 ? `$${formatCurrency(pnl.totalProformaCosts - pnl.totalFinalCosts, 0).replace('$','')} under budget` : 'On budget'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 opacity-60">Threshold ±{threshold}%</p>
              </>
            )}
          </div>

          {/* Final */}
          <div className={cn('rounded-2xl p-5 border',
            !hasCostData ? 'bg-card border-border' :
            totalDevStatus === 'ok' ? 'bg-green-400/5 border-green-400/20' :
            totalDevStatus === 'warning' ? 'bg-amber-400/5 border-amber-400/20' :
            'bg-red-400/5 border-red-400/20'
          )}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Final Costs</p>
            <p className={cn('text-3xl font-bold',
              !hasCostData ? 'text-muted-foreground' :
              totalDevStatus === 'ok' ? 'text-green-400' :
              totalDevStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
            )}>{formatCurrency(pnl.totalFinalCosts, 0)}</p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>Gross Margin</span><span className="text-foreground font-medium">{formatCurrency(pnl.grossMargin, 0)}</span></div>
              <div className="flex justify-between"><span>Final Costs</span><span className="text-foreground">{formatCurrency(pnl.totalFinalCosts, 0)}</span></div>
              <div className="flex justify-between border-t border-border/50 pt-1 mt-1">
                <span>Net Result</span>
                <span className={cn('font-bold', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {formatCurrency(pnl.netVoyageResult, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────── */}
      <div className="flex border-b border-border px-6">
        {([
          { id: 'costs', label: 'Cost Analysis' },
          { id: 'overview', label: 'Route & Cargo' },
          { id: 'remarks', label: 'Remarks & Docs' },
        ] as { id: Tab; label: string }[]).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={cn('px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            )}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">

        {/* ── Cost Analysis tab ───────────────────────────────── */}
        {activeTab === 'costs' && (
          <div className="space-y-3">
            {!hasCostData && (
              <div className="text-center py-16 text-muted-foreground">
                <p className="font-medium mb-1">No cost data</p>
                <p className="text-sm">Edit this voyage and fill in Step 4 to add costs.</p>
                <Link href={`/voyages/${voyage.id}/edit`} className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary hover:underline">
                  <Edit className="h-3.5 w-3.5" /> Add costs
                </Link>
              </div>
            )}

            {/* Per-port cost rows */}
            {voyage.costs.map((cost) => {
              const portCall = voyage.portRotation.find((p) => p.id === cost.portCallId);
              const proTotal = cost.proformaDa + cost.proformaPilotage + cost.proformaTowage + cost.proformaAgencyFee + cost.proformaOther;
              const finTotal = cost.finalDa + cost.finalPilotage + cost.finalTowage + cost.finalAgencyFee + cost.finalOther;
              const portDev = proTotal > 0 ? ((finTotal - proTotal) / proTotal) * 100 : 0;
              const portDevStatus = deviationColor(portDev, threshold);

              return (
                <div key={cost.id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Port header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/20">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-2 h-2 rounded-full', portCall?.role === 'load' ? 'bg-green-400' : portCall?.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400')} />
                      <span className="text-sm font-semibold text-foreground">{cost.portName}</span>
                      {portCall && <span className="text-xs text-muted-foreground capitalize">({portCall.role})</span>}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground font-mono">{formatCurrency(proTotal, 0)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-foreground">{formatCurrency(finTotal, 0)}</span>
                      {proTotal > 0 && (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                          portDevStatus === 'ok' ? 'bg-green-400/15 text-green-400' :
                          portDevStatus === 'warning' ? 'bg-amber-400/15 text-amber-400' :
                          'bg-red-400/15 text-red-400'
                        )}>
                          {portDev >= 0 ? '+' : ''}{portDev.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Line items */}
                  <div className="divide-y divide-border/30">
                    {COST_LABELS.map(({ proKey, finKey, label }) => {
                      const pro = (cost[proKey] as number) ?? 0;
                      const fin = (cost[finKey] as number) ?? 0;
                      if (pro === 0 && fin === 0) return null;
                      const dev = pro > 0 ? ((fin - pro) / pro) * 100 : 0;
                      const devStatus = deviationColor(dev, threshold);
                      const maxVal = Math.max(pro, fin, 1);
                      return (
                        <div key={label} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-muted-foreground font-mono">{formatCurrency(pro, 0)}</span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
                              <span className="font-mono text-foreground">{formatCurrency(fin, 0)}</span>
                              {pro > 0 && (
                                <span className={cn('font-bold w-14 text-right',
                                  devStatus === 'ok' ? 'text-green-400' :
                                  devStatus === 'warning' ? 'text-amber-400' : 'text-red-400'
                                )}>
                                  {dev >= 0 ? '+' : ''}{dev.toFixed(1)}%
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Visual bars */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground/60 w-12 shrink-0">Forecast</span>
                              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${(pro / maxVal) * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground/60 w-12 shrink-0">Final</span>
                              <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full',
                                  devStatus === 'ok' ? 'bg-green-500/70' :
                                  devStatus === 'warning' ? 'bg-amber-500/70' : 'bg-red-500/70'
                                )} style={{ width: `${(fin / maxVal) * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Canal costs */}
            {voyage.canalCosts.filter(c => c.proformaCost > 0 || c.finalCost > 0).map((cc) => {
              const dev = cc.proformaCost > 0 ? ((cc.finalCost - cc.proformaCost) / cc.proformaCost) * 100 : 0;
              const devStatus = deviationColor(dev, threshold);
              const maxVal = Math.max(cc.proformaCost, cc.finalCost, 1);
              const label = cc.canalType === 'suez' ? 'Suez Canal' : cc.canalType === 'bosphorus' ? 'Bosphorus' : 'Dardanelles';
              return (
                <div key={cc.id} className="bg-card border border-amber-400/20 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-amber-400/5">
                    <span className="text-sm font-semibold text-amber-400">{label} Transit</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground font-mono">{formatCurrency(cc.proformaCost, 0)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-foreground">{formatCurrency(cc.finalCost, 0)}</span>
                      {cc.proformaCost > 0 && (
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                          devStatus === 'ok' ? 'bg-green-400/15 text-green-400' :
                          devStatus === 'warning' ? 'bg-amber-400/15 text-amber-400' :
                          'bg-red-400/15 text-red-400'
                        )}>
                          {dev >= 0 ? '+' : ''}{dev.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="px-4 py-3 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 w-12 shrink-0">Forecast</span>
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500/60 rounded-full" style={{ width: `${(cc.proformaCost / maxVal) * 100}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground/60 w-12 shrink-0">Final</span>
                      <div className="flex-1 h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={cn('h-full rounded-full',
                          devStatus === 'ok' ? 'bg-green-500/70' :
                          devStatus === 'warning' ? 'bg-amber-500/70' : 'bg-red-500/70'
                        )} style={{ width: `${(cc.finalCost / maxVal) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Cargo costs */}
            {voyage.cargoes.filter(c => (c.lashingProforma ?? 0) + (c.lashingFinal ?? 0) + (c.otherCostsProforma ?? 0) + (c.otherCostsFinal ?? 0) > 0).map((c) => {
              const pro = (c.lashingProforma ?? 0) + (c.otherCostsProforma ?? 0);
              const fin = (c.lashingFinal ?? 0) + (c.otherCostsFinal ?? 0);
              const dev = pro > 0 ? ((fin - pro) / pro) * 100 : 0;
              const devStatus = deviationColor(dev, threshold);
              return (
                <div key={c.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-foreground capitalize">{c.cargoType} {c.chartererName ? `· ${c.chartererName}` : ''}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground font-mono">{formatCurrency(pro, 0)}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-mono text-foreground">{formatCurrency(fin, 0)}</span>
                      {pro > 0 && <span className={cn('text-xs font-bold', devStatus === 'ok' ? 'text-green-400' : devStatus === 'warning' ? 'text-amber-400' : 'text-red-400')}>{dev >= 0 ? '+' : ''}{dev.toFixed(1)}%</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Route & Cargo tab ───────────────────────────────── */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {/* Port rotation + map */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Port Rotation</h3>
              </div>
              {voyage.portRotation.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ports defined</p>
              ) : (
                <>
                  <div className="space-y-1">
                    {voyage.portRotation.map((pc, i) => (
                      <div key={pc.id} className="flex items-center gap-3 py-1">
                        <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                        <div className={cn('w-2 h-2 rounded-full shrink-0',
                          pc.role === 'load' ? 'bg-green-400' : pc.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400')} />
                        <span className="text-sm text-foreground font-medium">{pc.portName}</span>
                        <span className="text-xs text-muted-foreground capitalize">({pc.role})</span>
                        {pc.eta && <span className="text-xs text-muted-foreground ml-auto">ETA {pc.eta}</span>}
                      </div>
                    ))}
                  </div>
                  <div style={{ height: 220 }}>
                    <VoyageMap portRotation={voyage.portRotation} />
                  </div>
                </>
              )}
            </div>

            {/* Cargoes */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Cargoes</h3>
              </div>
              {voyage.cargoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cargoes defined</p>
              ) : (
                voyage.cargoes.map((cargo) => {
                  const gross = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
                  const brokerage = (gross * cargo.brokeragePercent) / 100;
                  return (
                    <div key={cargo.id} className="p-3 bg-background/40 rounded-lg border border-border/50">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground capitalize">{cargo.cargoType}</p>
                          <p className="text-xs text-muted-foreground">{cargo.quantity.toLocaleString()} MT · {cargo.chartererName || '—'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-400">{formatCurrency(gross, 0)}</p>
                          <p className="text-xs text-green-400">Net {formatCurrency(gross - brokerage, 0)}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {(cargo.loadingPortDAs?.map(p => p.portName).filter(Boolean) ?? []).map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-green-400/10 text-green-400 rounded border border-green-400/20">{p}</span>
                        ))}
                        {(cargo.dischargingPortDAs?.map(p => p.portName).filter(Boolean) ?? []).map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 bg-red-400/10 text-red-400 rounded border border-red-400/20">{p}</span>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ── Remarks tab ─────────────────────────────────────── */}
        {activeTab === 'remarks' && <RemarksSection voyage={voyage} />}
      </div>

      <ConfirmDialog
        open={deleteOpen} title="Delete Voyage"
        message={`Delete voyage ${voyage.voyageNumber}? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)}
        confirmLabel="Delete" danger
      />
    </div>
  );
}
