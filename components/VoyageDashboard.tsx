'use client';

import Link from 'next/link';
import { Edit, Download, FileSpreadsheet, Trash2, Loader2, FileText } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { RemarksSection } from './RemarksSection';
import { AppointmentLetterModal } from './AppointmentLetterModal';
import { useToast } from './ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { calculatePnL } from '@/lib/pnl';
import { formatCurrency, cn } from '@/lib/utils';
import type { Voyage, PortCall } from '@/types';

const COST_FIELDS: { pro: keyof PortCall; fin: keyof PortCall; label: string }[] = [
  { pro: 'proformaDa', fin: 'finalDa', label: 'D/A' },
  { pro: 'lashingProforma', fin: 'lashingFinal', label: 'Cargo Securing' },
  { pro: 'proformaFacilitation', fin: 'finalFacilitation', label: 'Facilitation' },
  { pro: 'proformaArmedGuards', fin: 'finalArmedGuards', label: 'Armed Guards' },
  { pro: 'proformaEwri', fin: 'finalEwri', label: 'EWRI' },
  { pro: 'proformaAdditionalInsurance', fin: 'finalAdditionalInsurance', label: 'Addl. Insurance' },
  { pro: 'proformaSurveyInspection', fin: 'finalSurveyInspection', label: 'Survey/Inspection' },
  { pro: 'proformaOther', fin: 'finalOther', label: 'Other' },
];

function devStatus(dev: number, threshold: number) {
  return Math.abs(dev) <= threshold ? 'ok' : Math.abs(dev) <= threshold * 2 ? 'warn' : 'danger';
}


interface Props {
  voyage: Voyage;
  embedded?: boolean;
}

export function VoyageDashboard({ voyage }: Props) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [showRemarks, setShowRemarks] = useState(false);
  const [appointmentPort, setAppointmentPort] = useState<PortCall | null>(null);
  const { deleteVoyage } = useVoyages();
  const { toast } = useToast();
  const router = useRouter();

  const pnl = calculatePnL(voyage);
  const threshold = voyage.deviationThreshold ?? 5;
  const totalDev = pnl.totalProformaCosts > 0 ? ((pnl.totalFinalCosts - pnl.totalProformaCosts) / pnl.totalProformaCosts) * 100 : null;
  const hasCosts = voyage.portRotation.length > 0 || voyage.canalCosts.length > 0 || voyage.costs.length > 0;

  async function handleDelete() {
    const ok = await deleteVoyage(voyage.id);
    if (ok) { toast('Voyage deleted', 'success'); router.push('/'); }
    else toast('Failed to delete voyage', 'error');
    setDeleteOpen(false);
  }

  async function handleExportPdf() {
    setExporting('pdf');
    try { const { exportVoyagePdf } = await import('@/lib/exportPdf'); await exportVoyagePdf(voyage); toast('PDF downloaded', 'success'); }
    catch { toast('Failed to generate PDF', 'error'); } finally { setExporting(null); }
  }

  async function handleExportExcel() {
    setExporting('excel');
    try { const { exportVoyageExcel } = await import('@/lib/exportExcel'); await exportVoyageExcel(voyage); toast('Excel downloaded', 'success'); }
    catch { toast('Failed to generate Excel', 'error'); } finally { setExporting(null); }
  }


  return (
    <div className="h-full flex flex-col overflow-hidden">

      {/* ── Header ── */}
      <div className="shrink-0 px-4 py-3 border-b border-border bg-card/40">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Vessel identity */}
          <span className="text-base font-bold text-foreground">{voyage.vesselName}</span>
          <StatusBadge status={voyage.status} />
          <span className="text-xs text-muted-foreground font-mono">{voyage.voyageNumber}</span>
          {voyage.vesselType && <span className="text-xs text-muted-foreground">· {voyage.vesselType}</span>}

          {/* Action buttons — sit directly after the identity pills */}
          <div className="flex items-center gap-1.5 ml-2">
            <Link
              href={`/voyages/${voyage.id}/edit`}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background/50 hover:bg-border/60 text-xs font-medium text-foreground transition-colors"
            >
              <Edit className="h-3 w-3" /> Edit
            </Link>

            <button
              onClick={handleExportPdf}
              disabled={exporting === 'pdf'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background/50 hover:bg-border/60 disabled:opacity-40 text-xs font-medium text-foreground transition-colors"
            >
              {exporting === 'pdf'
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <Download className="h-3 w-3" />}
              PDF
            </button>

            <button
              onClick={handleExportExcel}
              disabled={exporting === 'excel'}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background/50 hover:bg-border/60 disabled:opacity-40 text-xs font-medium text-foreground transition-colors"
            >
              {exporting === 'excel'
                ? <Loader2 className="h-3 w-3 animate-spin" />
                : <FileSpreadsheet className="h-3 w-3" />}
              Excel
            </button>

            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div className="shrink-0 grid grid-cols-4 divide-x divide-border border-b border-border">
        <KpiCell label="Net Result" value={formatCurrency(pnl.netVoyageResult, 0)}
          color={pnl.netVoyageResult >= 0 ? 'green' : 'red'} />
        <KpiCell
          label="Cost Deviation"
          value={totalDev !== null ? `${totalDev >= 0 ? '+' : ''}${totalDev.toFixed(1)}%` : '—'}
          color={totalDev === null ? 'muted' : devStatus(totalDev, threshold) === 'ok' ? 'green' : devStatus(totalDev, threshold) === 'warn' ? 'amber' : 'red'}
        />
        <KpiCell label="Gross Margin" value={formatCurrency(pnl.grossMargin, 0)} color={pnl.grossMargin >= 0 ? 'blue' : 'red'} />
        <KpiCell label="Final Costs" value={formatCurrency(pnl.totalFinalCosts, 0)}
          sub={`Forecast: ${formatCurrency(pnl.totalProformaCosts, 0)}`} color="muted" />
      </div>

      {/* ── Port Timeline ── */}
      <PortTimeline portRotation={voyage.portRotation} />

      {/* ── Body: scrollable dense layout ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-0 divide-y xl:divide-y-0 xl:divide-x divide-border min-h-full">

          {/* ── LEFT: Ports + Cargoes ── */}
          <div className="xl:col-span-1 divide-y divide-border">

            {/* Port rotation */}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Port Rotation</p>
              {voyage.portRotation.length === 0 ? (
                <p className="text-xs text-muted-foreground">No ports</p>
              ) : (
                <div className="space-y-0.5 mb-3">
                  {voyage.portRotation.map((pc, i) => (
                    <div key={pc.id} className="flex items-center gap-2 py-0.5">
                      <span className="text-[10px] text-muted-foreground/60 w-4 text-right">{i + 1}</span>
                      <div className={cn('w-1.5 h-1.5 rounded-full shrink-0',
                        pc.role === 'load' ? 'bg-green-400' : pc.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400')} />
                      <span className="text-xs font-medium text-foreground truncate">{pc.portName}</span>
                      <span className="text-[10px] text-muted-foreground capitalize ml-auto shrink-0">{pc.role}</span>
                      {pc.eta && <span className="text-[10px] text-muted-foreground/60">{pc.eta}</span>}
                    </div>
                  ))}
                </div>
              )}
              {/* VesselFinder live tracking */}
              <div className="mt-3">
                {voyage.imoNumber ? (
                  <VesselFinderMap imo={voyage.imoNumber} vesselName={voyage.vesselName} />
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-lg border border-dashed border-border text-center px-4">
                    <p className="text-xs text-muted-foreground">Enter IMO number to enable live vessel tracking</p>
                    <Link href={`/voyages/${voyage.id}/edit`} className="text-xs text-primary hover:underline flex items-center gap-1">
                      <Edit className="h-3 w-3" /> Edit voyage
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Cargoes */}
            <div className="p-4">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Cargoes</p>
              {voyage.cargoes.length === 0 ? (
                <p className="text-xs text-muted-foreground">No cargoes</p>
              ) : (
                <div className="space-y-2">
                  {voyage.cargoes.map((c) => {
                    const gross = c.freightType === 'lumpsum' ? c.freightRate : c.freightRate * c.quantity;
                    const brok = (gross * c.brokeragePercent) / 100;
                    const loads = c.loadingPortDAs?.map(p => p.portName).filter(Boolean) ?? c.loadingPorts ?? [];
                    const discs = c.dischargingPortDAs?.map(p => p.portName).filter(Boolean) ?? c.dischargingPorts ?? [];
                    return (
                      <div key={c.id} className="p-2.5 bg-background/40 rounded-lg border border-border/50">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-semibold text-foreground capitalize">{c.cargoType}</span>
                          <span className="text-xs font-bold text-blue-400">{formatCurrency(gross, 0)}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground space-y-0.5">
                          <div>{c.quantity.toLocaleString()} MT · {c.chartererName || '—'}</div>
                          <div className="flex gap-2 flex-wrap">
                            {loads.map((p, i) => <span key={i} className="text-green-400">↑{p}</span>)}
                            {discs.map((p, i) => <span key={i} className="text-red-400">↓{p}</span>)}
                          </div>
                          <div className="flex justify-between pt-0.5">
                            <span>Broker: {formatCurrency(brok, 0)}</span>
                            <span className="text-green-400 font-medium">Net: {formatCurrency(gross - brok, 0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* P&L */}
            <PnlSummary voyage={voyage} pnl={pnl} />

            {/* Remarks toggle */}
            <div className="p-4">
              <button onClick={() => setShowRemarks(v => !v)}
                className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-colors">
                {showRemarks ? '▾' : '▸'} Remarks & Documents
              </button>
              {showRemarks && <div className="mt-3"><RemarksSection voyage={voyage} /></div>}
            </div>
          </div>

          {/* ── RIGHT: Cost Analysis Table ── */}
          <div className="xl:col-span-2 overflow-hidden flex flex-col">
            <div className="shrink-0 px-4 pt-4 pb-2">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">
                Cost Analysis — Forecast vs Final
              </p>
            </div>

            {!hasCosts ? (
              <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground gap-2">
                <p className="text-sm font-medium">No cost data</p>
                <p className="text-xs">Add costs in the Port Rotation step</p>
                <Link href={`/voyages/${voyage.id}/edit`}
                  className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline">
                  <Edit className="h-3.5 w-3.5" /> Edit voyage
                </Link>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                <table className="w-full text-xs border-collapse">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Location / Item</th>
                      <th className="text-right px-3 py-2.5 text-blue-400 font-medium">Forecast</th>
                      <th className="text-right px-3 py-2.5 text-foreground font-medium">Final</th>
                      <th className="text-right px-4 py-2.5 text-muted-foreground font-medium w-32">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voyage.portRotation.map((pc) => {
                      const proTotal = COST_FIELDS.reduce((s, { pro }) => s + ((pc[pro] as number) ?? 0), 0);
                      const finTotal = COST_FIELDS.reduce((s, { fin }) => s + ((pc[fin] as number) ?? 0), 0);
                      const diff = finTotal - proTotal;
                      const portDev = proTotal > 0 ? (diff / proTotal) * 100 : null;
                      const lines = COST_FIELDS.filter(({ pro, fin }) => ((pc[pro] as number) ?? 0) > 0 || ((pc[fin] as number) ?? 0) > 0);

                      return (
                        <>
                          <tr key={`${pc.id}-header`} className="bg-background/50 border-t border-border">
                            <td className="px-4 py-2" colSpan={4}>
                              <div className="flex items-center gap-2">
                                <div className={cn('w-2 h-2 rounded-full shrink-0',
                                  pc.role === 'load' ? 'bg-green-400' : pc.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400')} />
                                <span className="font-bold text-foreground">{pc.portName}</span>
                                <span className="text-muted-foreground capitalize text-[10px]">({pc.role})</span>
                                <button
                                  onClick={() => setAppointmentPort(pc)}
                                  className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                                >
                                  <FileText className="h-3 w-3" />
                                  Appointment Letter
                                </button>
                              </div>
                            </td>
                          </tr>
                          {lines.map(({ pro, fin, label }) => {
                            const proVal = (pc[pro] as number) ?? 0;
                            const finVal = (pc[fin] as number) ?? 0;
                            const d = finVal - proVal;
                            const pct = proVal > 0 ? (d / proVal) * 100 : null;
                            return (
                              <tr key={`${pc.id}-${label}`} className="border-b border-border/30 hover:bg-background/30 transition-colors">
                                <td className="pl-9 pr-4 py-2 text-muted-foreground">{label}</td>
                                <td className="px-3 py-2 text-right font-mono text-blue-300/80">{proVal > 0 ? formatCurrency(proVal, 0) : '—'}</td>
                                <td className="px-3 py-2 text-right font-mono text-foreground">{finVal > 0 ? formatCurrency(finVal, 0) : '—'}</td>
                                <td className="px-4 py-2 text-right">
                                  {pct !== null ? (
                                    <span className={cn('font-semibold font-mono', d > 0 ? 'text-red-400' : d < 0 ? 'text-green-400' : 'text-muted-foreground')}>
                                      {d > 0 ? '+' : ''}{formatCurrency(d, 0)}
                                      <span className="text-[10px] ml-1 opacity-70">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                                    </span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </td>
                              </tr>
                            );
                          })}
                          <tr key={`${pc.id}-total`} className="border-b border-border bg-background/20">
                            <td className="pl-9 pr-4 py-1.5 font-semibold text-foreground/70 text-[11px] uppercase tracking-wide">Subtotal</td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-blue-300/80">{formatCurrency(proTotal, 0)}</td>
                            <td className="px-3 py-1.5 text-right font-mono font-semibold text-foreground">{formatCurrency(finTotal, 0)}</td>
                            <td className="px-4 py-1.5 text-right">
                              {portDev !== null ? (
                                <span className={cn('font-bold font-mono', diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-muted-foreground')}>
                                  {diff > 0 ? '+' : ''}{formatCurrency(diff, 0)}
                                  <span className="text-[10px] ml-1 opacity-70">({portDev >= 0 ? '+' : ''}{portDev.toFixed(1)}%)</span>
                                </span>
                              ) : <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        </>
                      );
                    })}

                    {/* Canal / strait costs */}
                    {voyage.canalCosts.length > 0 && (
                      <>
                        <tr className="bg-amber-400/5 border-t border-amber-400/20">
                          <td className="px-4 py-2 font-bold text-amber-400 text-[11px] uppercase tracking-wide" colSpan={4}>
                            Straits & Canals
                          </td>
                        </tr>
                        {voyage.canalCosts.map((cc) => {
                          const label = cc.canalType === 'suez' ? 'Suez Canal' : cc.canalType === 'bosphorus' ? 'Bosphorus' : 'Dardanelles';
                          const d = cc.finalCost - cc.proformaCost;
                          const pct = cc.proformaCost > 0 ? (d / cc.proformaCost) * 100 : null;
                          return (
                            <tr key={cc.id} className="border-b border-border/30 hover:bg-background/30 transition-colors">
                              <td className="pl-9 pr-4 py-2 text-muted-foreground">{label}</td>
                              <td className="px-3 py-2 text-right font-mono text-blue-300/80">{cc.proformaCost > 0 ? formatCurrency(cc.proformaCost, 0) : '—'}</td>
                              <td className="px-3 py-2 text-right font-mono text-foreground">{cc.finalCost > 0 ? formatCurrency(cc.finalCost, 0) : '—'}</td>
                              <td className="px-4 py-2 text-right">
                                {pct !== null ? (
                                  <span className={cn('font-semibold font-mono', d > 0 ? 'text-red-400' : d < 0 ? 'text-green-400' : 'text-muted-foreground')}>
                                    {d > 0 ? '+' : ''}{formatCurrency(d, 0)}
                                    <span className="text-[10px] ml-1 opacity-70">({pct >= 0 ? '+' : ''}{pct.toFixed(1)}%)</span>
                                  </span>
                                ) : <span className="text-muted-foreground">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </>
                    )}

                    {/* Grand total */}
                    <tr className="border-t-2 border-border bg-background/40">
                      <td className="px-4 py-3 font-bold text-foreground uppercase text-[11px] tracking-wide">Grand Total</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-blue-400">{formatCurrency(pnl.totalProformaCosts, 0)}</td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-foreground">{formatCurrency(pnl.totalFinalCosts, 0)}</td>
                      <td className="px-4 py-3 text-right">
                        {totalDev !== null ? (
                          <span className={cn('font-black font-mono text-sm',
                            (pnl.totalFinalCosts - pnl.totalProformaCosts) > 0 ? 'text-red-400' : (pnl.totalFinalCosts - pnl.totalProformaCosts) < 0 ? 'text-green-400' : 'text-muted-foreground'
                          )}>
                            {pnl.totalFinalCosts - pnl.totalProformaCosts >= 0 ? '+' : ''}{formatCurrency(pnl.totalFinalCosts - pnl.totalProformaCosts, 0)}
                            <span className="text-xs ml-1 opacity-80">({totalDev >= 0 ? '+' : ''}{totalDev.toFixed(1)}%)</span>
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>

      <ConfirmDialog open={deleteOpen} title="Delete Voyage"
        message={`Delete ${voyage.voyageNumber}? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteOpen(false)}
        confirmLabel="Delete" danger />

      {appointmentPort && (
        <AppointmentLetterModal
          voyage={voyage}
          port={appointmentPort}
          onClose={() => setAppointmentPort(null)}
        />
      )}
    </div>
  );
}

function VesselFinderMap({ imo, vesselName }: { imo: string; vesselName: string }) {
  const cleanImo = imo.replace(/\D/g, '');
  const srcDoc = `<!DOCTYPE html><html><body style="margin:0;padding:0;"><script>var width="100%";var height="400";var zoom="5";var imo="${cleanImo}";var show_track=true;<\/script><script src="https://www.vesselfinder.com/aismap.js"><\/script></body></html>`;

  return (
    <iframe
      srcDoc={srcDoc}
      title={`Live position — ${vesselName}`}
      width="100%"
      height="400"
      frameBorder="0"
      className="rounded-lg border border-border"
      style={{ border: 'none', display: 'block' }}
    />
  );
}

function PnlSummary({ voyage, pnl }: { voyage: Voyage; pnl: ReturnType<typeof calculatePnL> }) {
  // Use the SAME COST_FIELDS as the Cost Analysis table so both panels always match.
  // Step 1: compute pro/fin totals per portRotation entry using COST_FIELDS.reduce.
  const rawRows = voyage.portRotation.map((p) => {
    const fin = COST_FIELDS.reduce((s, { fin: f }) => s + ((p[f] as number) ?? 0), 0);
    const pro = COST_FIELDS.reduce((s, { pro: pr }) => s + ((p[pr] as number) ?? 0), 0);
    const anyFinal = fin > 0;
    return { portName: p.portName, role: p.role, pro, fin, total: anyFinal ? fin : pro, usingFinal: anyFinal };
  });

  // Step 2: merge duplicate (portName + role) entries — same port visited twice with same
  // role should be a single row. Different roles on the same portName stay separate and
  // get a "(load)" / "(discharge)" label so the user knows which visit is which.
  const merged = new Map<string, typeof rawRows[0]>();
  rawRows.forEach((r) => {
    const key = `${r.portName}||${r.role}`;
    const existing = merged.get(key);
    if (existing) {
      const fin = existing.fin + r.fin;
      const pro = existing.pro + r.pro;
      const anyFinal = fin > 0;
      merged.set(key, { ...existing, pro, fin, total: anyFinal ? fin : pro, usingFinal: anyFinal });
    } else {
      merged.set(key, { ...r });
    }
  });
  const deduped = Array.from(merged.values());

  // Step 3: if the same portName appears with multiple roles, show role disambiguation
  const portNameCount: Record<string, number> = {};
  deduped.forEach((r) => { portNameCount[r.portName] = (portNameCount[r.portName] ?? 0) + 1; });

  const canalCost = voyage.canalCosts.reduce((sum, cc) =>
    sum + (cc.finalCost > 0 ? cc.finalCost : cc.proformaCost), 0);

  // Only show ports that have at least some cost entered — a port with zero pro AND zero
  // fin adds nothing to a financial summary and causes phantom $0 rows (e.g. a stale
  // second Derince entry from the auto-build with a different role but no costs).
  const allPortRows = deduped.filter((r) => r.pro > 0 || r.fin > 0);
  const usingForecast = allPortRows.some((r) => !r.usingFinal);

  function Row({ label, value, bold, dim, separator }: { label: string; value: string; bold?: boolean; dim?: boolean; separator?: boolean }) {
    return (
      <div className={cn('flex justify-between items-center py-1.5', separator && 'border-b border-border/40')}>
        <span className={cn('text-xs', bold ? 'font-semibold text-foreground' : dim ? 'text-muted-foreground/60 pl-3' : 'text-muted-foreground')}>{label}</span>
        <span className={cn('font-mono text-xs shrink-0', bold ? 'font-bold text-foreground' : 'text-foreground')}>{value}</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">P&L Summary</p>
      <div className="text-xs">
        <Row label="Freight In" value={formatCurrency(pnl.freightIn, 0)} />
        <Row label="Less: Freight Out" value={`−${formatCurrency(pnl.freightOut, 0)}`} separator />
        <Row label="Gross Margin" value={formatCurrency(pnl.grossMargin, 0)} bold />

        {allPortRows.length > 0 && (
          <>
            <div className="mt-1.5 mb-0.5">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                Port Costs {usingForecast && <span className="text-amber-400/70">(some forecast)</span>}
              </span>
            </div>
            {allPortRows.map((r, i) => {
              const label = portNameCount[r.portName] > 1
                ? `${r.portName} (${r.role})`
                : r.portName;
              return (
                <Row key={`${r.portName}-${r.role}-${i}`} label={label} value={`−${formatCurrency(r.total, 0)}`} dim />
              );
            })}
          </>
        )}

        {canalCost > 0 && (
          <Row label="Less: Straits & Canals" value={`−${formatCurrency(canalCost, 0)}`} separator />
        )}

        <div className={cn(
          'flex justify-between items-center mt-2 rounded-lg px-2 py-2 -mx-2',
          pnl.netVoyageResult >= 0 ? 'bg-green-400/10' : 'bg-red-400/10'
        )}>
          <span className="font-bold text-foreground">Net Voyage Result</span>
          <span className={cn('font-mono font-black text-sm', pnl.netVoyageResult >= 0 ? 'text-green-400' : 'text-red-400')}>
            {formatCurrency(pnl.netVoyageResult, 0)}
          </span>
        </div>
      </div>
    </div>
  );
}

function PortTimeline({ portRotation }: { portRotation: Voyage['portRotation'] }) {
  if (portRotation.length === 0) return null;

  return (
    <div className="shrink-0 px-4 py-3 border-b border-border overflow-x-auto">
      <div className="flex items-start gap-0 min-w-max">
        {portRotation.map((pc, i) => {
          const isLoad      = pc.role === 'load';
          const isDischarge = pc.role === 'discharge';
          const dotColor    = isLoad ? 'bg-green-400 border-green-400' : isDischarge ? 'bg-red-400 border-red-400' : 'bg-amber-400 border-amber-400';
          const textColor   = isLoad ? 'text-green-400' : isDischarge ? 'text-red-400' : 'text-amber-400';

          // Determine if ETA is estimated (no actual arrival) → amber
          const etaLabel = pc.ata ? pc.ata.slice(0, 10) : pc.eta;
          const etaIsEstimate = !pc.ata && !!pc.eta;

          const nextDist = pc.distanceToNextPort;

          return (
            <div key={pc.id} className="flex items-start">
              {/* Port node */}
              <div className="flex flex-col items-center">
                {/* Port name + role */}
                <div className="text-center mb-1.5 w-28">
                  <p className={`text-[10px] font-bold uppercase tracking-wide truncate ${textColor}`}>
                    {pc.portName}
                  </p>
                  <p className="text-[9px] text-muted-foreground capitalize">{pc.role}</p>
                </div>

                {/* Dot */}
                <div className={`w-3 h-3 rounded-full border-2 ${dotColor} z-10 relative`} />

                {/* ETA / ETD */}
                <div className="mt-1.5 text-center w-28 space-y-0.5">
                  {etaLabel && (
                    <p className={`text-[9px] font-mono ${etaIsEstimate ? 'text-amber-400' : 'text-foreground/70'}`}>
                      {etaIsEstimate ? '~' : ''}{etaLabel}
                    </p>
                  )}
                  {pc.etd && (
                    <p className="text-[9px] font-mono text-muted-foreground/60">
                      ETD {pc.etd}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector to next port */}
              {i < portRotation.length - 1 && (
                <div className="flex flex-col items-center mt-4 mx-1 w-20 shrink-0">
                  <div className="w-full border-t border-dashed border-border" />
                  {nextDist && (
                    <p className="text-[9px] text-muted-foreground/60 mt-0.5 font-mono whitespace-nowrap">
                      {nextDist.toLocaleString(undefined, { maximumFractionDigits: 0 })} nm
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiCell({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  const textColor = color === 'green' ? 'text-green-400' : color === 'red' ? 'text-red-400' : color === 'blue' ? 'text-blue-400' : color === 'amber' ? 'text-amber-400' : 'text-foreground';
  return (
    <div className="px-4 py-3">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn('text-lg font-black tabular-nums', textColor)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
