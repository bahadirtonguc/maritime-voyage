'use client';

import type { Voyage } from '@/types';

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const VESSEL_TYPES = ['Bulk Carrier', 'Tanker', 'Container', 'General Cargo', 'OBO', 'Ro-Ro', 'Other'];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors";

export function StepVesselFreight({ data, onChange }: Props) {
  const set = (key: keyof Voyage, value: unknown) => onChange({ ...data, [key]: value });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">Vessel & Freight Details</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Basic voyage and vessel information</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vessel Name *">
          <input
            type="text"
            value={data.vesselName ?? ''}
            onChange={(e) => set('vesselName', e.target.value)}
            placeholder="M/V Example"
            className={inputClass}
          />
        </Field>

        <Field label="Voyage Number *">
          <input
            type="text"
            value={data.voyageNumber ?? ''}
            onChange={(e) => set('voyageNumber', e.target.value)}
            placeholder="VOY-2024-001"
            className={inputClass}
          />
        </Field>

        <Field label="Vessel Type">
          <select
            value={data.vesselType ?? ''}
            onChange={(e) => set('vesselType', e.target.value)}
            className={inputClass}
          >
            <option value="">Select type...</option>
            {VESSEL_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="Vessel Speed (knots)">
          <input
            type="number"
            value={data.vesselSpeed ?? ''}
            onChange={(e) => set('vesselSpeed', parseFloat(e.target.value) || 0)}
            placeholder="13.5"
            min={0}
            step={0.5}
            className={inputClass}
          />
        </Field>

        <Field label="Laydays Start">
          <input
            type="date"
            value={data.laydaysStart ?? ''}
            onChange={(e) => set('laydaysStart', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Cancelling Date">
          <input
            type="date"
            value={data.cancellingDate ?? ''}
            onChange={(e) => set('cancellingDate', e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Status">
          <select
            value={data.status ?? 'planned'}
            onChange={(e) => set('status', e.target.value)}
            className={inputClass}
          >
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="closed">Closed</option>
          </select>
        </Field>

        <Field label="Deviation Threshold (%)">
          <input
            type="number"
            value={data.deviationThreshold ?? 5}
            onChange={(e) => set('deviationThreshold', parseFloat(e.target.value) || 5)}
            placeholder="5"
            min={0}
            max={100}
            step={0.5}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}
