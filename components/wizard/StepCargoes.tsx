'use client';

import { Plus, Trash2 } from 'lucide-react';
import type { Cargo, CargoType, FreightType, Voyage } from '@/types';
import { generateId } from '@/lib/utils';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const CARGO_TYPES: CargoType[] = ['grain', 'steel', 'coal', 'fertilizer', 'cement', 'timber', 'containers', 'bulk', 'other'];

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}

function emptyCargoRow(): Cargo {
  return {
    id: generateId(),
    cargoType: 'grain',
    quantity: 0,
    loadingPorts: [],
    dischargingPorts: [],
    chartererName: '',
    chartererAddress: '',
    freightRate: 0,
    freightType: 'per_mt',
    brokeragePercent: 2.5,
  };
}

export function StepCargoes({ data, onChange }: Props) {
  const cargoes: Cargo[] = data.cargoes ?? [];

  function updateCargo(id: string, updates: Partial<Cargo>) {
    const updated = cargoes.map((c) => (c.id === id ? { ...c, ...updates } : c));
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
          <p className="text-xs text-muted-foreground mt-0.5">Add one or more cargo lots for this voyage</p>
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
          No cargoes added. Click <strong>Add Cargo</strong> to start.
        </div>
      )}

      {cargoes.map((cargo, idx) => (
        <div key={cargo.id} className="bg-background/40 border border-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Cargo #{idx + 1}</span>
            <button
              type="button"
              onClick={() => removeCargo(cargo.id)}
              className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Field label="Cargo Type">
              <select
                value={cargo.cargoType}
                onChange={(e) => updateCargo(cargo.id, { cargoType: e.target.value as CargoType })}
                className={inputClass}
              >
                {CARGO_TYPES.map((t) => (
                  <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
            <div className="flex items-center gap-4 text-xs p-2.5 bg-primary/5 rounded-lg border border-primary/10">
              <div>
                <span className="text-muted-foreground">Gross Freight: </span>
                <span className="text-foreground font-semibold">
                  ${cargo.freightType === 'lumpsum'
                    ? cargo.freightRate.toLocaleString()
                    : (cargo.freightRate * cargo.quantity).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Brokerage: </span>
                <span className="text-amber-400 font-semibold">
                  ${((cargo.freightType === 'lumpsum' ? cargo.freightRate : cargo.freightRate * cargo.quantity) * cargo.brokeragePercent / 100).toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
