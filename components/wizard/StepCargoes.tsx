'use client';

import { Plus, Trash2, Anchor } from 'lucide-react';
import type { Cargo, CargoPort, CargoType, FreightType, Voyage } from '@/types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const CARGO_TYPES: CargoType[] = ['grain', 'steel', 'coal', 'fertilizer', 'cement', 'timber', 'containers', 'bulk', 'other'];

const inputClass = "w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";
const smallInputClass = "w-full px-2 py-1 bg-background border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors";

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function emptyPort(): CargoPort {
  return { portName: '', proformaDa: 0, finalDa: 0 };
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
  };
}

function PortDASection({
  label,
  ports,
  onChange,
}: {
  label: string;
  ports: CargoPort[];
  onChange: (ports: CargoPort[]) => void;
}) {
  const safePorts = ports.length === 0 ? [emptyPort()] : ports;

  function updatePort(idx: number, updates: Partial<CargoPort>) {
    const next = safePorts.map((p, i) => (i === idx ? { ...p, ...updates } : p));
    onChange(next);
  }

  function addPort() {
    onChange([...safePorts, emptyPort()]);
  }

  function removePort(idx: number) {
    if (safePorts.length === 1) return;
    onChange(safePorts.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Anchor className="h-3 w-3 text-primary" />
          {label}
        </span>
        <button
          type="button"
          onClick={addPort}
          className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary rounded transition-colors"
        >
          <Plus className="h-2.5 w-2.5" /> Port ekle
        </button>
      </div>

      {/* column headers */}
      <div className="grid grid-cols-[1fr_80px_80px_20px] gap-1.5 px-1">
        <span className="text-[10px] text-muted-foreground">Liman</span>
        <span className="text-[10px] text-muted-foreground">Pro. D/A ($)</span>
        <span className="text-[10px] text-muted-foreground">Final D/A ($)</span>
        <span />
      </div>

      {safePorts.map((port, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_80px_80px_20px] gap-1.5 items-center">
          <input
            type="text"
            value={port.portName}
            onChange={(e) => updatePort(idx, { portName: e.target.value })}
            placeholder="Port adı..."
            className={smallInputClass}
          />
          <input
            type="number"
            value={port.proformaDa || ''}
            onChange={(e) => updatePort(idx, { proformaDa: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min={0}
            className={smallInputClass}
          />
          <input
            type="number"
            value={port.finalDa || ''}
            onChange={(e) => updatePort(idx, { finalDa: parseFloat(e.target.value) || 0 })}
            placeholder="0"
            min={0}
            className={smallInputClass}
          />
          <button
            type="button"
            onClick={() => removePort(idx)}
            disabled={safePorts.length === 1}
            className="text-muted-foreground hover:text-red-400 disabled:opacity-30 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function StepCargoes({ data, onChange }: Props) {
  const cargoes: Cargo[] = data.cargoes ?? [];

  function updateCargo(id: string, updates: Partial<Cargo>) {
    const updated = cargoes.map((c) => {
      if (c.id !== id) return c;
      const merged = { ...c, ...updates };
      // keep legacy string arrays in sync
      merged.loadingPorts = (merged.loadingPortDAs ?? []).map((p) => p.portName).filter(Boolean);
      merged.dischargingPorts = (merged.dischargingPortDAs ?? []).map((p) => p.portName).filter(Boolean);
      return merged;
    });
    onChange({ ...data, cargoes: updated });
  }

  function addCargo() {
    onChange({ ...data, cargoes: [...cargoes, emptyCargoRow()] });
  }

  function removeCargo(id: string) {
    onChange({ ...data, cargoes: cargoes.filter((c) => c.id !== id) });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Cargoes</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Yüke ait detaylar — her yük bağımsız olarak tanımlanır</p>
        </div>
        <button
          type="button"
          onClick={addCargo}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Cargo
        </button>
      </div>

      {cargoes.length === 0 && (
        <div className="text-center py-10 text-sm text-muted-foreground bg-background/30 border border-dashed border-border rounded-xl">
          Henüz yük eklenmedi. <strong>Add Cargo</strong> ile başlayın.
        </div>
      )}

      {cargoes.map((cargo, idx) => {
        const safeLDAs = cargo.loadingPortDAs?.length ? cargo.loadingPortDAs : [emptyPort()];
        const safeDDAs = cargo.dischargingPortDAs?.length ? cargo.dischargingPortDAs : [emptyPort()];
        const grossFreight = cargo.freightType === 'lumpsum'
          ? cargo.freightRate
          : cargo.freightRate * cargo.quantity;
        const brokerage = (grossFreight * cargo.brokeragePercent) / 100;

        return (
          <div key={cargo.id} className="bg-background/40 border border-border rounded-xl overflow-hidden">
            {/* Card header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/20">
              <span className="text-sm font-semibold text-foreground">Cargo #{idx + 1}</span>
              <button
                type="button"
                onClick={() => removeCargo(cargo.id)}
                className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* 2-column body */}
            <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-border">

              {/* LEFT — Cargo info */}
              <div className="p-4 space-y-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Yük Bilgileri</p>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Cargo Type">
                    <select
                      value={cargo.cargoType}
                      onChange={(e) => updateCargo(cargo.id, { cargoType: e.target.value as CargoType })}
                      className={inputClass}
                    >
                      {CARGO_TYPES.map((t) => (
                        <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Quantity (MT)">
                    <input
                      type="number"
                      value={cargo.quantity || ''}
                      onChange={(e) => updateCargo(cargo.id, { quantity: parseFloat(e.target.value) || 0 })}
                      placeholder="25000"
                      min={0}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Freight Type">
                    <select
                      value={cargo.freightType}
                      onChange={(e) => updateCargo(cargo.id, { freightType: e.target.value as FreightType })}
                      className={inputClass}
                    >
                      <option value="per_mt">Per MT ($/MT)</option>
                      <option value="lumpsum">Lumpsum ($)</option>
                    </select>
                  </Field>

                  <Field label={cargo.freightType === 'lumpsum' ? 'Freight ($)' : 'Freight ($/MT)'}>
                    <input
                      type="number"
                      value={cargo.freightRate || ''}
                      onChange={(e) => updateCargo(cargo.id, { freightRate: parseFloat(e.target.value) || 0 })}
                      placeholder={cargo.freightType === 'lumpsum' ? '500000' : '35.50'}
                      min={0}
                      step={0.01}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Brokerage %">
                    <input
                      type="number"
                      value={cargo.brokeragePercent || ''}
                      onChange={(e) => updateCargo(cargo.id, { brokeragePercent: parseFloat(e.target.value) || 0 })}
                      placeholder="2.5"
                      min={0}
                      max={100}
                      step={0.25}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Charterer Name">
                    <input
                      type="text"
                      value={cargo.chartererName}
                      onChange={(e) => updateCargo(cargo.id, { chartererName: e.target.value })}
                      placeholder="ABC Trading Co."
                      className={inputClass}
                    />
                  </Field>
                </div>

                <Field label="Charterer Address">
                  <input
                    type="text"
                    value={cargo.chartererAddress}
                    onChange={(e) => updateCargo(cargo.id, { chartererAddress: e.target.value })}
                    placeholder="123 Trade St, London, UK"
                    className={inputClass}
                  />
                </Field>

                {/* Freight summary */}
                {cargo.freightRate > 0 && (
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 bg-primary/5 rounded-lg border border-primary/10 mt-1">
                    <div>
                      <p className="text-muted-foreground text-[10px]">Gross Freight</p>
                      <p className="text-foreground font-semibold">${grossFreight.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Brokerage</p>
                      <p className="text-amber-400 font-semibold">${brokerage.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px]">Net Freight</p>
                      <p className="text-green-400 font-semibold">${(grossFreight - brokerage).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT — Ports & D/A */}
              <div className="p-4 space-y-5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Limanlar & Disbursement Accounts</p>

                <PortDASection
                  label="Yükleme Limanları"
                  ports={safeLDAs}
                  onChange={(ports) => updateCargo(cargo.id, { loadingPortDAs: ports })}
                />

                <div className="border-t border-border/50" />

                <PortDASection
                  label="Tahliye Limanları"
                  ports={safeDDAs}
                  onChange={(ports) => updateCargo(cargo.id, { dischargingPortDAs: ports })}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
