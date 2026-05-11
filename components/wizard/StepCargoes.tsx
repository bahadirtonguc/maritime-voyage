'use client';

import { Plus, Trash2, Anchor } from 'lucide-react';
import type { Cargo, CargoPort, CargoType, FreightType, Voyage } from '@/types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const CARGO_TYPES: CargoType[] = ['grain', 'steel', 'coal', 'fertilizer', 'cement', 'timber', 'containers', 'bulk', 'other'];

const inputCls = "w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";
const smCls = "w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-muted-foreground mb-1">{children}</label>;
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={className}><Label>{label}</Label>{children}</div>;
}

function Num({ value, onChange, placeholder = '0', step }: { value: number; onChange: (v: number) => void; placeholder?: string; step?: number }) {
  return (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      min={0}
      step={step}
      className={smCls}
    />
  );
}

function emptyPort(): CargoPort {
  return { portName: '' };
}

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
    freightPayable: 0,
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
          <Plus className="h-2.5 w-2.5" /> Ekle
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
            placeholder="Liman adı..."
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

  function update(id: string, updates: Partial<Cargo>) {
    const updated = cargoes.map((c) => {
      if (c.id !== id) return c;
      const m = { ...c, ...updates };
      m.loadingPorts = (m.loadingPortDAs ?? []).map((p) => p.portName).filter(Boolean);
      m.dischargingPorts = (m.dischargingPortDAs ?? []).map((p) => p.portName).filter(Boolean);
      return m;
    });
    onChange({ ...data, cargoes: updated });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cargoes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Her yük bağımsız olarak tanımlanır</p>
        </div>
        <button type="button" onClick={() => onChange({ ...data, cargoes: [...cargoes, emptyCargoRow()] })}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Cargo
        </button>
      </div>

      {cargoes.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground bg-background/30 border border-dashed border-border rounded-xl">
          Henüz yük eklenmedi. <strong>Add Cargo</strong> ile başlayın.
        </div>
      )}

      {cargoes.map((cargo, idx) => {
        const gross = cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity;
        const brok = (gross * cargo.brokeragePercent) / 100;
        const net = gross - brok;

        return (
          <div key={cargo.id} className="bg-background/40 border border-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/20">
              <span className="text-sm font-semibold text-foreground">Cargo #{idx + 1}</span>
              <button type="button" onClick={() => onChange({ ...data, cargoes: cargoes.filter((c) => c.id !== cargo.id) })}
                className="p-1 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Body: 2 columns */}
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-border">

              {/* LEFT — Yük Bilgileri */}
              <div className="p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Yük Bilgileri</p>

                <div className="grid grid-cols-2 gap-2.5">
                  <Field label="Cargo Type">
                    <select value={cargo.cargoType} onChange={(e) => update(cargo.id, { cargoType: e.target.value as CargoType })} className={inputCls}>
                      {CARGO_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Quantity (MT)">
                    <input type="number" value={cargo.quantity || ''} onChange={(e) => update(cargo.id, { quantity: parseFloat(e.target.value) || 0 })} placeholder="25000" min={0} className={inputCls} />
                  </Field>
                  <Field label="Freight Type">
                    <select value={cargo.freightType} onChange={(e) => update(cargo.id, { freightType: e.target.value as FreightType })} className={inputCls}>
                      <option value="per_mt">Per MT ($/MT)</option>
                      <option value="lumpsum">Lumpsum ($)</option>
                    </select>
                  </Field>
                  <Field label={cargo.freightType === 'lumpsum' ? 'Freight ($)' : 'Freight ($/MT)'}>
                    <input type="number" value={cargo.freightRate || ''} onChange={(e) => update(cargo.id, { freightRate: parseFloat(e.target.value) || 0 })} placeholder={cargo.freightType === 'lumpsum' ? '500000' : '35.50'} min={0} step={0.01} className={inputCls} />
                  </Field>
                  <Field label="Brokerage %">
                    <input type="number" value={cargo.brokeragePercent || ''} onChange={(e) => update(cargo.id, { brokeragePercent: parseFloat(e.target.value) || 0 })} placeholder="2.5" min={0} max={100} step={0.25} className={inputCls} />
                  </Field>
                  <Field label="Charterer">
                    <input type="text" value={cargo.chartererName} onChange={(e) => update(cargo.id, { chartererName: e.target.value })} placeholder="ABC Trading Co." className={inputCls} />
                  </Field>
                </div>

                <Field label="Charterer Address">
                  <input type="text" value={cargo.chartererAddress} onChange={(e) => update(cargo.id, { chartererAddress: e.target.value })} placeholder="123 Trade St, London, UK" className={inputCls} />
                </Field>

                <Field label="Ödenecek Navlun ($)">
                  <input type="number" value={cargo.freightPayable || ''} onChange={(e) => update(cargo.id, { freightPayable: parseFloat(e.target.value) || 0 })} placeholder="0" min={0} className={inputCls} />
                </Field>

                {gross > 0 && (
                  <div className="grid grid-cols-3 gap-2 text-xs p-2.5 bg-primary/5 rounded-lg border border-primary/10">
                    <div><p className="text-muted-foreground text-[10px]">Gross</p><p className="font-semibold">${gross.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    <div><p className="text-muted-foreground text-[10px]">Brokerage</p><p className="text-amber-400 font-semibold">${brok.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                    <div><p className="text-muted-foreground text-[10px]">Net</p><p className="text-green-400 font-semibold">${net.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                  </div>
                )}
              </div>

              {/* RIGHT — Limanlar + Extra Costs */}
              <div className="p-4 space-y-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Limanlar</p>

                <PortList
                  label="Yükleme Limanları"
                  ports={cargo.loadingPortDAs?.length ? cargo.loadingPortDAs : [emptyPort()]}
                  onChange={(ports) => update(cargo.id, { loadingPortDAs: ports })}
                />
                <PortList
                  label="Tahliye Limanları"
                  ports={cargo.dischargingPortDAs?.length ? cargo.dischargingPortDAs : [emptyPort()]}
                  onChange={(ports) => update(cargo.id, { dischargingPortDAs: ports })}
                />

                <div className="border-t border-border/50 pt-3">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Yük Masrafları</p>
                  <div className="grid grid-cols-[1fr_80px_80px] gap-1.5 mb-1 px-0.5">
                    <span className="text-[10px] text-muted-foreground">Kalem</span>
                    <span className="text-[10px] text-muted-foreground">Proforma ($)</span>
                    <span className="text-[10px] text-muted-foreground">Final ($)</span>
                  </div>
                  <div className="grid grid-cols-[1fr_80px_80px] gap-1.5 items-center mb-1.5">
                    <span className="text-xs text-foreground">Lashing</span>
                    <Num value={cargo.lashingProforma ?? 0} onChange={(v) => update(cargo.id, { lashingProforma: v })} />
                    <Num value={cargo.lashingFinal ?? 0} onChange={(v) => update(cargo.id, { lashingFinal: v })} />
                  </div>
                  <div className="grid grid-cols-[1fr_80px_80px] gap-1.5 items-center">
                    <span className="text-xs text-foreground">Diğer</span>
                    <Num value={cargo.otherCostsProforma ?? 0} onChange={(v) => update(cargo.id, { otherCostsProforma: v })} />
                    <Num value={cargo.otherCostsFinal ?? 0} onChange={(v) => update(cargo.id, { otherCostsFinal: v })} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
