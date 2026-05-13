'use client';

import { Plus, Trash2, Anchor } from 'lucide-react';
import type { Cargo, CargoPort, CargoType, FreightType, Voyage, PortCall } from '@/types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const CARGO_TYPES: CargoType[] = ['grain', 'steel', 'coal', 'fertilizer', 'cement', 'timber', 'containers', 'bulk', 'other'];

const inputCls = "w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";
const smCls   = "w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label>{children}</div>;
}

function emptyPort(): CargoPort { return { portName: '' }; }

function emptyCargoRow(): Cargo {
  return {
    id: generateId(),
    cargoType: 'grain',
    quantity: 0,
    loadingPorts: [],
    dischargingPorts: [],
    loadingPortDAs: [emptyPort()],
    dischargingPortDAs: [emptyPort()],
    chartererName: '',
    chartererAddress: '',
    freightRate: 0,
    freightType: 'per_mt',
    brokeragePercent: 2.5,
    lashingProforma: 0,
    lashingFinal: 0,
    otherCostsProforma: 0,
    otherCostsFinal: 0,
  };
}

function PortList({ label, ports, onChange }: {
  label: string;
  ports: CargoPort[];
  onChange: (ports: CargoPort[]) => void;
}) {
  const list = ports.length === 0 ? [emptyPort()] : ports;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
          <Anchor className="h-3 w-3 text-primary" /> {label}
        </span>
        <button type="button" onClick={() => onChange([...list, emptyPort()])}
          className="text-[10px] px-1.5 py-0.5 bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded transition-colors flex items-center gap-0.5">
          <Plus className="h-2.5 w-2.5" /> Add
        </button>
      </div>
      {list.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <input
            type="text"
            value={p.portName}
            onChange={(e) => {
              const next = list.map((x, j) => j === i ? { portName: e.target.value } : x);
              onChange(next);
            }}
            className={smCls + ' flex-1'}
          />
          {list.length > 1 && (
            <button type="button" onClick={() => onChange(list.filter((_, j) => j !== i))}
              className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function StepCargoes({ data, onChange }: Props) {
  const cargoes: Cargo[] = data.cargoes ?? [];
  const portRotation: PortCall[] = data.portRotation ?? [];
  const loadPorts      = portRotation.filter((p) => p.role === 'load').map((p) => p.portName).filter(Boolean);
  const dischargePorts = portRotation.filter((p) => p.role === 'discharge').map((p) => p.portName).filter(Boolean);

  function update(id: string, updates: Partial<Cargo>) {
    const updated = cargoes.map((c) => {
      if (c.id !== id) return c;
      const m = { ...c, ...updates };
      m.loadingPorts    = (m.loadingPortDAs    ?? []).map((p) => p.portName).filter(Boolean);
      m.dischargingPorts = (m.dischargingPortDAs ?? []).map((p) => p.portName).filter(Boolean);
      return m;
    });
    onChange({ ...data, cargoes: updated });
  }

  // ── Freight totals ──
  const totalFreightIn = cargoes.reduce((sum, c) => {
    const gross = c.freightType === 'lumpsum' ? c.freightRate : c.freightRate * c.quantity;
    const brok  = (gross * c.brokeragePercent) / 100;
    return sum + (gross - brok);
  }, 0);
  const freightOut   = data.freightOut ?? 0;
  const grossMargin  = totalFreightIn - freightOut;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cargoes & Freight</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Each cargo lot is defined independently</p>
        </div>
        <button type="button" onClick={() => onChange({ ...data, cargoes: [...cargoes, emptyCargoRow()] })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Cargo
        </button>
      </div>

      {cargoes.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground bg-background/30 border border-dashed border-border rounded-xl">
          No cargoes yet. Click <strong>Add Cargo</strong> to begin.
        </div>
      )}

      {/* Cargo cards */}
      {cargoes.map((cargo, idx) => {
        const gross = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
        const brok  = (gross * cargo.brokeragePercent) / 100;
        const net   = gross - brok;

        return (
          <div key={cargo.id} className="bg-background/40 border border-border rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/20">
              <span className="text-sm font-semibold text-foreground">Cargo #{idx + 1}</span>
              <button type="button"
                onClick={() => onChange({ ...data, cargoes: cargoes.filter((c) => c.id !== cargo.id) })}
                className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2-column body */}
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-border">

              {/* LEFT — Cargo details */}
              <div className="p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Cargo Details</p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Cargo Type">
                    <select value={cargo.cargoType}
                      onChange={(e) => update(cargo.id, { cargoType: e.target.value as CargoType })}
                      className={inputCls}>
                      {CARGO_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Commodity">
                    <input type="text" value={cargo.commodity ?? ''} onChange={(e) => update(cargo.id, { commodity: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="B/L Number">
                    <input type="text" value={cargo.blNumber ?? ''} onChange={(e) => update(cargo.id, { blNumber: e.target.value })} className={inputCls} />
                  </Field>
                  <Field label="Quantity (MT)">
                    <input type="number" value={cargo.quantity || ''} onChange={(e) => update(cargo.id, { quantity: parseFloat(e.target.value) || 0 })} min={0} className={inputCls} />
                  </Field>
                  <Field label="Freight Type">
                    <select value={cargo.freightType}
                      onChange={(e) => update(cargo.id, { freightType: e.target.value as FreightType })}
                      className={inputCls}>
                      <option value="per_mt">Per MT ($/MT)</option>
                      <option value="lumpsum">Lumpsum ($)</option>
                    </select>
                  </Field>
                  <Field label={cargo.freightType === 'lumpsum' ? 'Freight In ($)' : 'Freight In ($/MT)'}>
                    <input type="number" value={cargo.freightRate || ''} onChange={(e) => update(cargo.id, { freightRate: parseFloat(e.target.value) || 0 })} min={0} step={0.01} className={inputCls} />
                  </Field>
                  <Field label="Brokerage %">
                    <input type="number" value={cargo.brokeragePercent || ''} onChange={(e) => update(cargo.id, { brokeragePercent: parseFloat(e.target.value) || 0 })} min={0} max={100} step={0.25} className={inputCls} />
                  </Field>
                  <Field label="Charterer">
                    <input type="text" value={cargo.chartererName} onChange={(e) => update(cargo.id, { chartererName: e.target.value })} className={inputCls} />
                  </Field>
                </div>

                <Field label="Charterer Address">
                  <input type="text" value={cargo.chartererAddress} onChange={(e) => update(cargo.id, { chartererAddress: e.target.value })} className={inputCls} />
                </Field>

                {gross > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                    <div><p className="text-muted-foreground text-[10px]">Gross</p><p className="font-semibold">${gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    <div><p className="text-muted-foreground text-[10px]">Brokerage</p><p className="text-amber-400 font-semibold">${brok.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    <div><p className="text-muted-foreground text-[10px]">Net Freight In</p><p className="text-green-400 font-semibold">${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                  </div>
                )}
              </div>

              {/* RIGHT — Ports */}
              <div className="p-4 space-y-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Ports</p>

                {(loadPorts.length > 0 || dischargePorts.length > 0) && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {loadPorts.length > 0 && (
                      <Field label="Loading Port">
                        <select value={cargo.linkedLoadPort ?? ''} onChange={(e) => update(cargo.id, { linkedLoadPort: e.target.value })} className={smCls}>
                          <option value="">Select</option>
                          {loadPorts.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                    )}
                    {dischargePorts.length > 0 && (
                      <Field label="Discharge Port">
                        <select value={cargo.linkedDischargePort ?? ''} onChange={(e) => update(cargo.id, { linkedDischargePort: e.target.value })} className={smCls}>
                          <option value="">Select</option>
                          {dischargePorts.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </Field>
                    )}
                  </div>
                )}

                <PortList
                  label="Loading Ports"
                  ports={cargo.loadingPortDAs?.length ? cargo.loadingPortDAs : [emptyPort()]}
                  onChange={(ports) => update(cargo.id, { loadingPortDAs: ports })}
                />
                <PortList
                  label="Discharge Ports"
                  ports={cargo.dischargingPortDAs?.length ? cargo.dischargingPortDAs : [emptyPort()]}
                  onChange={(ports) => update(cargo.id, { dischargingPortDAs: ports })}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Freight Summary ── */}
      <div className="mt-2 bg-background/40 border border-border rounded-xl p-4 space-y-4">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Freight Summary</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          {/* Total Freight In — read-only, calculated */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Total Freight In ($)</label>
            <div className="w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-sm font-mono font-semibold text-green-400 cursor-default">
              {totalFreightIn >= 0 ? '' : '-'}${Math.abs(totalFreightIn).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Sum of all net cargo freight (after brokerage)</p>
          </div>

          {/* Freight Out — editable */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Freight Out ($)</label>
            <input
              type="number"
              value={freightOut || ''}
              onChange={(e) => onChange({ ...data, freightOut: parseFloat(e.target.value) || 0 })}
              min={0}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
            />
            <p className="text-[10px] text-muted-foreground mt-1">Total paid to vessel owner / hire cost</p>
          </div>

          {/* Gross Margin — calculated */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Gross Margin ($)</label>
            <div className={`w-full px-3 py-2 bg-background/60 border border-border/50 rounded-lg text-sm font-mono font-semibold cursor-default ${grossMargin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {grossMargin >= 0 ? '+' : ''}{grossMargin.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Freight In − Freight Out</p>
          </div>
        </div>
      </div>
    </div>
  );
}
