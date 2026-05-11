'use client';

import { AlertTriangle } from 'lucide-react';
import type { CostEntry, CanalCost, Voyage } from '@/types';
import { generateId } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const smCls = "w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

function Num({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <input type="number" value={value || ''} onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder="0" min={0} className={smCls} />
  );
}

function devColor(pro: number, fin: number, threshold: number) {
  if (!pro || !fin) return 'text-muted-foreground';
  const d = Math.abs(((fin - pro) / pro) * 100);
  if (d > threshold * 2) return 'text-red-400';
  if (d > threshold) return 'text-amber-400';
  return 'text-green-400';
}

function emptyCostEntry(portCallId: string, portName: string): CostEntry {
  return {
    id: generateId(), portCallId, portName,
    proformaDa: 0, finalDa: 0,
    proformaPilotage: 0, finalPilotage: 0,
    proformaTowage: 0, finalTowage: 0,
    proformaAgencyFee: 0, finalAgencyFee: 0,
    proformaOther: 0, finalOther: 0,
  };
}

function emptyCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles'): CanalCost {
  return { id: generateId(), canalType: type, proformaCost: 0, finalCost: 0 };
}

const COST_ROWS: { key: keyof CostEntry; proKey: keyof CostEntry; finKey: keyof CostEntry; label: string }[] = [
  { key: 'proformaDa', proKey: 'proformaDa', finKey: 'finalDa', label: 'D/A' },
  { key: 'proformaPilotage', proKey: 'proformaPilotage', finKey: 'finalPilotage', label: 'Pilotage' },
  { key: 'proformaTowage', proKey: 'proformaTowage', finKey: 'finalTowage', label: 'Towage' },
  { key: 'proformaAgencyFee', proKey: 'proformaAgencyFee', finKey: 'finalAgencyFee', label: 'Agency Fee' },
  { key: 'proformaOther', proKey: 'proformaOther', finKey: 'finalOther', label: 'Diğer' },
];

export function StepCosts({ data, onChange }: Props) {
  const costs: CostEntry[] = data.costs ?? [];
  const canalCosts: CanalCost[] = data.canalCosts ?? [];
  const threshold = data.deviationThreshold ?? 5;
  const portRotation = data.portRotation ?? [];
  const cargoes = data.cargoes ?? [];

  const hasBosphorus = portRotation.some((p) => p.isBosphorus);
  const hasSuez = portRotation.some((p) => p.isSuez);
  const hasDardanelles = portRotation.some((p) => p.isDardanelles);

  // Auto-ensure a CostEntry per portCall
  function ensureCostForPort(portCallId: string, portName: string) {
    if (costs.find((c) => c.portCallId === portCallId)) return;
    onChange({ ...data, costs: [...costs, emptyCostEntry(portCallId, portName)] });
  }

  // Ensure all ports have a cost entry on render
  portRotation.forEach((pc) => {
    if (!costs.find((c) => c.portCallId === pc.id)) {
      // Will trigger re-render; do in useEffect equivalent via direct push
    }
  });

  function updateCost(id: string, updates: Partial<CostEntry>) {
    onChange({ ...data, costs: costs.map((c) => c.id === id ? { ...c, ...updates } : c) });
  }

  function toggleCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles') {
    const existing = canalCosts.find((c) => c.canalType === type);
    if (existing) onChange({ ...data, canalCosts: canalCosts.filter((c) => c.canalType !== type) });
    else onChange({ ...data, canalCosts: [...canalCosts, emptyCanalCost(type)] });
  }

  function updateCanalCost(id: string, updates: Partial<CanalCost>) {
    onChange({ ...data, canalCosts: canalCosts.map((c) => c.id === id ? { ...c, ...updates } : c) });
  }

  // Group costs by portCall
  const portGroups = portRotation.map((pc) => ({
    portCall: pc,
    cost: costs.find((c) => c.portCallId === pc.id) ?? null,
  }));

  // Total proforma and final
  const totalPro = costs.reduce((s, c) =>
    s + c.proformaDa + c.proformaPilotage + c.proformaTowage + c.proformaAgencyFee + c.proformaOther, 0)
    + canalCosts.reduce((s, c) => s + c.proformaCost, 0)
    + cargoes.reduce((s, c) => s + (c.lashingProforma ?? 0) + (c.otherCostsProforma ?? 0), 0);

  const totalFin = costs.reduce((s, c) =>
    s + c.finalDa + c.finalPilotage + c.finalTowage + c.finalAgencyFee + c.finalOther, 0)
    + canalCosts.reduce((s, c) => s + c.finalCost, 0)
    + cargoes.reduce((s, c) => s + (c.lashingFinal ?? 0) + (c.otherCostsFinal ?? 0), 0);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Costs & Disbursements</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Her port için beklenen ve gerçekleşen masraflar</p>
      </div>

      {/* Per-port costs */}
      {portGroups.map(({ portCall, cost }) => {
        const entry = cost ?? emptyCostEntry(portCall.id, portCall.portName);
        const hasEntry = !!cost;

        return (
          <div key={portCall.id} className="bg-background/40 border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/20">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${portCall.role === 'load' ? 'bg-green-400' : portCall.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400'}`} />
                <span className="text-sm font-semibold text-foreground">{portCall.portName || '(Unnamed)'}</span>
                <span className="text-xs capitalize text-muted-foreground">· {portCall.role}</span>
              </div>
              {!hasEntry && (
                <button type="button" onClick={() => ensureCostForPort(portCall.id, portCall.portName)}
                  className="text-xs px-2 py-0.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded transition-colors">
                  + Masraf Ekle
                </button>
              )}
            </div>

            {hasEntry && (
              <div className="p-4">
                {/* Header row */}
                <div className="grid grid-cols-[120px_1fr_1fr_60px] gap-2 mb-1.5 px-1">
                  <span className="text-[10px] text-muted-foreground font-medium">Kalem</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Proforma ($)</span>
                  <span className="text-[10px] text-muted-foreground font-medium">Final ($)</span>
                  <span className="text-[10px] text-muted-foreground font-medium text-right">Dev.</span>
                </div>
                <div className="space-y-1.5">
                  {COST_ROWS.map(({ label, proKey, finKey }) => {
                    const pro = entry[proKey] as number;
                    const fin = entry[finKey] as number;
                    return (
                      <div key={label} className="grid grid-cols-[120px_1fr_1fr_60px] gap-2 items-center">
                        <span className="text-xs text-foreground">{label}</span>
                        <Num value={pro} onChange={(v) => updateCost(entry.id, { [proKey]: v } as Partial<CostEntry>)} />
                        <Num value={fin} onChange={(v) => updateCost(entry.id, { [finKey]: v } as Partial<CostEntry>)} />
                        <span className={`text-[10px] text-right font-medium ${devColor(pro, fin, threshold)}`}>
                          {pro > 0 && fin > 0 ? `${((fin - pro) / pro * 100).toFixed(1)}%` : '—'}
                        </span>
                      </div>
                    );
                  })}
                </div>
                {/* Port subtotal */}
                <div className="mt-3 pt-2 border-t border-border/50 flex justify-between text-xs">
                  <span className="text-muted-foreground">Port toplamı</span>
                  <div className="flex gap-6">
                    <span>Pro: <strong>{formatCurrency(entry.proformaDa + entry.proformaPilotage + entry.proformaTowage + entry.proformaAgencyFee + entry.proformaOther, 0)}</strong></span>
                    <span>Final: <strong className={devColor(
                      entry.proformaDa + entry.proformaPilotage + entry.proformaTowage + entry.proformaAgencyFee + entry.proformaOther,
                      entry.finalDa + entry.finalPilotage + entry.finalTowage + entry.finalAgencyFee + entry.finalOther,
                      threshold)}>{formatCurrency(entry.finalDa + entry.finalPilotage + entry.finalTowage + entry.finalAgencyFee + entry.finalOther, 0)}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Cargo-level costs summary (from step 2) */}
      {cargoes.some((c) => (c.lashingProforma ?? 0) + (c.lashingFinal ?? 0) + (c.otherCostsProforma ?? 0) + (c.otherCostsFinal ?? 0) > 0) && (
        <div className="bg-background/40 border border-border rounded-xl p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Yük Masrafları (Step 2&apos;den)</h3>
          <div className="grid grid-cols-[1fr_100px_100px] gap-2 mb-1 px-1">
            <span className="text-[10px] text-muted-foreground">Yük</span>
            <span className="text-[10px] text-muted-foreground">Proforma ($)</span>
            <span className="text-[10px] text-muted-foreground">Final ($)</span>
          </div>
          {cargoes.map((c) => {
            const pro = (c.lashingProforma ?? 0) + (c.otherCostsProforma ?? 0);
            const fin = (c.lashingFinal ?? 0) + (c.otherCostsFinal ?? 0);
            if (pro + fin === 0) return null;
            return (
              <div key={c.id} className="grid grid-cols-[1fr_100px_100px] gap-2 items-center py-1">
                <span className="text-xs text-foreground capitalize">{c.cargoType} {c.chartererName ? `· ${c.chartererName}` : ''}</span>
                <span className="text-xs">{formatCurrency(pro, 0)}</span>
                <span className={`text-xs font-medium ${devColor(pro, fin, threshold)}`}>{formatCurrency(fin, 0)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Canal costs */}
      <div className="bg-background/40 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Kanal / Boğaz Masrafları</h3>
          {(hasBosphorus || hasSuez || hasDardanelles) && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Rotadan tespit edildi
            </span>
          )}
        </div>
        {([
          { type: 'suez', label: 'Süveyş Kanalı', flagged: hasSuez },
          { type: 'bosphorus', label: 'Boğaziçi', flagged: hasBosphorus },
          { type: 'dardanelles', label: 'Çanakkale Boğazı', flagged: hasDardanelles },
        ] as const).map(({ type, label, flagged }) => {
          const cc = canalCosts.find((c) => c.canalType === type);
          return (
            <div key={type} className={`p-3 rounded-lg border transition-colors ${flagged ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <input type="checkbox" id={`canal-${type}`} checked={!!cc} onChange={() => toggleCanalCost(type)} className="rounded border-border" />
                <label htmlFor={`canal-${type}`} className="text-sm font-medium text-foreground cursor-pointer">
                  {label}{flagged && <span className="ml-2 text-xs text-amber-400">(rotada var)</span>}
                </label>
              </div>
              {cc && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div><p className="text-xs text-muted-foreground mb-1">Proforma ($)</p><Num value={cc.proformaCost} onChange={(v) => updateCanalCost(cc.id, { proformaCost: v })} /></div>
                  <div><p className="text-xs text-muted-foreground mb-1">Final ($)</p><Num value={cc.finalCost} onChange={(v) => updateCanalCost(cc.id, { finalCost: v })} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grand total */}
      <div className="bg-card border border-border rounded-xl p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Genel Toplam</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Toplam Proforma</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(totalPro, 0)}</p>
          </div>
          <div className="p-3 bg-background/50 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Toplam Final</p>
            <p className={`text-lg font-bold ${devColor(totalPro, totalFin, threshold)}`}>{formatCurrency(totalFin, 0)}</p>
          </div>
        </div>
        {totalPro > 0 && totalFin > 0 && (
          <div className={`mt-2 text-center text-sm font-semibold ${devColor(totalPro, totalFin, threshold)}`}>
            Sapma: {((totalFin - totalPro) / totalPro * 100).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}
