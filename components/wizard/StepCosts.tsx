'use client';

import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import type { CostEntry, CanalCost, Voyage } from '@/types';
import { generateId, formatCurrency } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const inputClass = "w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

function NumInput({ value, onChange, placeholder = '0' }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      min={0}
      step={100}
      className={inputClass}
    />
  );
}

function emptyCostEntry(portName: string, portCallId: string): CostEntry {
  return {
    id: generateId(),
    portCallId,
    portName,
    proformaDa: 0,
    finalDa: 0,
    proformaLashing: 0,
    finalLashing: 0,
    pilotage: 0,
    towage: 0,
    agencyFee: 0,
    otherCosts: 0,
  };
}

function emptyCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles'): CanalCost {
  return { id: generateId(), canalType: type, proformaCost: 0, finalCost: 0 };
}

function deviationColor(proforma: number, final: number, threshold: number) {
  if (proforma === 0) return '';
  const dev = Math.abs(((final - proforma) / proforma) * 100);
  if (dev > threshold * 2) return 'text-red-400';
  if (dev > threshold) return 'text-amber-400';
  return 'text-green-400';
}

export function StepCosts({ data, onChange }: Props) {
  const costs: CostEntry[] = data.costs ?? [];
  const canalCosts: CanalCost[] = data.canalCosts ?? [];
  const threshold = data.deviationThreshold ?? 5;
  const portRotation = data.portRotation ?? [];

  const hasBosphorus = portRotation.some((p) => p.isBosphorus);
  const hasSuez = portRotation.some((p) => p.isSuez);
  const hasDardanelles = portRotation.some((p) => p.isDardanelles);

  function addCostEntry() {
    const pc = portRotation[0];
    onChange({ ...data, costs: [...costs, emptyCostEntry(pc?.portName ?? 'Port', pc?.id ?? '')] });
  }

  function addCostForPort(portCallId: string, portName: string) {
    onChange({ ...data, costs: [...costs, emptyCostEntry(portName, portCallId)] });
  }

  function updateCost(id: string, updates: Partial<CostEntry>) {
    onChange({ ...data, costs: costs.map((c) => (c.id === id ? { ...c, ...updates } : c)) });
  }

  function removeCost(id: string) {
    onChange({ ...data, costs: costs.filter((c) => c.id !== id) });
  }

  function toggleCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles') {
    const existing = canalCosts.find((c) => c.canalType === type);
    if (existing) {
      onChange({ ...data, canalCosts: canalCosts.filter((c) => c.canalType !== type) });
    } else {
      onChange({ ...data, canalCosts: [...canalCosts, emptyCanalCost(type)] });
    }
  }

  function updateCanalCost(id: string, updates: Partial<CanalCost>) {
    onChange({ ...data, canalCosts: canalCosts.map((c) => (c.id === id ? { ...c, ...updates } : c)) });
  }

  // Group costs by port
  const portGroups = portRotation.map((pc) => ({
    portCall: pc,
    costs: costs.filter((c) => c.portCallId === pc.id),
  }));

  const unassignedCosts = costs.filter((c) => !portRotation.find((pc) => pc.id === c.portCallId));

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold text-foreground">Port Costs</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter proforma and final costs per port. Deviation threshold: <strong>{threshold}%</strong>
        </p>
      </div>

      {/* Per-port cost sections */}
      {portGroups.map(({ portCall, costs: portCosts }) => (
        <div key={portCall.id} className="bg-background/40 border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-foreground">{portCall.portName || '(Unnamed Port)'}</span>
              <span className="ml-2 text-xs capitalize px-1.5 py-0.5 rounded bg-border/50 text-muted-foreground">{portCall.role}</span>
            </div>
            <button
              type="button"
              onClick={() => addCostForPort(portCall.id, portCall.portName)}
              className="flex items-center gap-1 px-2 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs transition-colors"
            >
              <Plus className="h-3 w-3" /> Add Cost
            </button>
          </div>

          {portCosts.length === 0 && (
            <p className="text-xs text-muted-foreground">No costs added for this port yet.</p>
          )}

          {portCosts.length > 0 && (
            <div className="space-y-3">
              {/* Header */}
              <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground px-1">
                <span>Proforma D/A</span>
                <span>Final D/A</span>
                <span>Pro. Lashing</span>
                <span>Final Lashing</span>
                <span>Pilotage</span>
                <span>Towage</span>
                <span>Agency Fee</span>
                <span></span>
              </div>
              {portCosts.map((cost) => (
                <div key={cost.id} className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center">
                  <NumInput value={cost.proformaDa} onChange={(v) => updateCost(cost.id, { proformaDa: v })} />
                  <div className="relative">
                    <NumInput value={cost.finalDa} onChange={(v) => updateCost(cost.id, { finalDa: v })} />
                    {cost.proformaDa > 0 && cost.finalDa > 0 && (
                      <span className={`absolute -top-4 right-0 text-xs ${deviationColor(cost.proformaDa, cost.finalDa, threshold)}`}>
                        {cost.proformaDa > 0 ? `${((cost.finalDa - cost.proformaDa) / cost.proformaDa * 100).toFixed(1)}%` : ''}
                      </span>
                    )}
                  </div>
                  <NumInput value={cost.proformaLashing} onChange={(v) => updateCost(cost.id, { proformaLashing: v })} />
                  <NumInput value={cost.finalLashing} onChange={(v) => updateCost(cost.id, { finalLashing: v })} />
                  <NumInput value={cost.pilotage} onChange={(v) => updateCost(cost.id, { pilotage: v })} />
                  <NumInput value={cost.towage} onChange={(v) => updateCost(cost.id, { towage: v })} />
                  <NumInput value={cost.agencyFee} onChange={(v) => updateCost(cost.id, { agencyFee: v })} />
                  <button
                    type="button"
                    onClick={() => removeCost(cost.id)}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* Unassigned costs (legacy) */}
      {unassignedCosts.length > 0 && (
        <div className="bg-background/40 border border-border rounded-xl p-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Other Costs</h4>
          {unassignedCosts.map((cost) => (
            <div key={cost.id} className="text-xs text-muted-foreground">
              {cost.portName}: Various costs
            </div>
          ))}
        </div>
      )}

      {portRotation.length === 0 && (
        <button
          type="button"
          onClick={addCostEntry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" /> Add Cost Entry
        </button>
      )}

      {/* Canal costs */}
      <div className="bg-background/40 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Canal Transit Costs</h3>
          {(hasBosphorus || hasSuez || hasDardanelles) && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Auto-detected from port rotation
            </span>
          )}
        </div>

        <div className="space-y-3">
          {([
            { type: 'suez', label: 'Suez Canal', flagged: hasSuez },
            { type: 'bosphorus', label: 'Bosphorus Strait', flagged: hasBosphorus },
            { type: 'dardanelles', label: 'Dardanelles Strait', flagged: hasDardanelles },
          ] as const).map(({ type, label, flagged }) => {
            const canalCost = canalCosts.find((c) => c.canalType === type);
            return (
              <div key={type} className={`p-3 rounded-lg border transition-colors ${flagged ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  <input
                    type="checkbox"
                    id={`canal-${type}`}
                    checked={!!canalCost}
                    onChange={() => toggleCanalCost(type)}
                    className="rounded border-border"
                  />
                  <label htmlFor={`canal-${type}`} className="text-sm text-foreground font-medium cursor-pointer">
                    {label}
                    {flagged && <span className="ml-2 text-xs text-amber-400">(flagged)</span>}
                  </label>
                </div>
                {canalCost && (
                  <div className="grid grid-cols-2 gap-3 ml-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Proforma Cost ($)</p>
                      <NumInput value={canalCost.proformaCost} onChange={(v) => updateCanalCost(canalCost.id, { proformaCost: v })} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Final Cost ($)</p>
                      <NumInput value={canalCost.finalCost} onChange={(v) => updateCanalCost(canalCost.id, { finalCost: v })} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
