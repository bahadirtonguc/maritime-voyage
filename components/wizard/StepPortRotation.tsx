'use client';

import { useState } from 'react';
import { Plus, Trash2, GripVertical, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PortCall, PortRole, Voyage } from '@/types';
import type { Port } from '@/types';
import { generateId } from '@/lib/utils';
import { PortAutocomplete } from './PortAutocomplete';

const VoyageMap = dynamic(() => import('./VoyageMap').then((m) => m.VoyageMap), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-sm">Loading map...</div>,
});

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const ROLE_OPTIONS: { value: PortRole; label: string; color: string }[] = [
  { value: 'load', label: 'Load', color: 'text-green-400' },
  { value: 'discharge', label: 'Discharge', color: 'text-red-400' },
  { value: 'transit', label: 'Transit', color: 'text-amber-400' },
];

function emptyPortCall(): PortCall {
  return {
    id: generateId(),
    portId: '',
    portName: '',
    role: 'load',
    eta: '',
    etd: '',
  };
}

export function StepPortRotation({ data, onChange }: Props) {
  const portRotation: PortCall[] = data.portRotation ?? [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  function addPort() {
    onChange({ ...data, portRotation: [...portRotation, emptyPortCall()] });
  }

  function removePort(id: string) {
    onChange({ ...data, portRotation: portRotation.filter((p) => p.id !== id) });
  }

  function updatePort(id: string, updates: Partial<PortCall>) {
    const updated = portRotation.map((p) => (p.id === id ? { ...p, ...updates } : p));
    onChange({ ...data, portRotation: updated });
  }

  function handlePortSelect(id: string, port: Port) {
    updatePort(id, {
      portId: port.id,
      portName: port.name,
      isBosphorus: port.isBosphorus,
      isDardanelles: port.isDardanelles,
      isSuez: port.isSuez,
    });
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...portRotation];
    const [item] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, item);
    onChange({ ...data, portRotation: updated });
    setDragIdx(idx);
  }

  function handleDragEnd() {
    setDragIdx(null);
  }

  const transitFlags = portRotation.filter((p) => p.isBosphorus || p.isDardanelles || p.isSuez);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Port Rotation</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Drag to reorder ports. Strait transits are auto-detected.</p>
        </div>
        <button
          type="button"
          onClick={addPort}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Port
        </button>
      </div>

      {/* Transit alerts */}
      {transitFlags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitFlags.map((p) => (
            <div key={p.id} className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-amber-400/10 border border-amber-400/20 rounded-full text-amber-400">
              <AlertTriangle className="h-3 w-3" />
              {p.portName}: {p.isBosphorus ? 'Bosphorus' : p.isDardanelles ? 'Dardanelles' : 'Suez'} transit
            </div>
          ))}
        </div>
      )}

      {/* Port list */}
      {portRotation.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-background/30 border border-dashed border-border rounded-xl">
          No ports yet. Click <strong>Add Port</strong> to start building the rotation.
        </div>
      ) : (
        <div className="space-y-2">
          {portRotation.map((pc, idx) => (
            <div
              key={pc.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={`bg-background/40 border rounded-xl p-3 transition-all ${dragIdx === idx ? 'border-primary/50 bg-primary/5' : 'border-border'}`}
            >
              <div className="flex items-center gap-2">
                {/* Drag handle */}
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0" />

                {/* Index */}
                <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>

                {/* Role */}
                <select
                  value={pc.role}
                  onChange={(e) => updatePort(pc.id, { role: e.target.value as PortRole })}
                  className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 shrink-0"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>

                {/* Port search */}
                <div className="flex-1 min-w-0">
                  <PortAutocomplete
                    value={pc.portName}
                    onChange={(port) => handlePortSelect(pc.id, port)}
                    placeholder="Search port..."
                  />
                </div>

                {/* ETA/ETD */}
                <input
                  type="date"
                  value={pc.eta}
                  onChange={(e) => updatePort(pc.id, { eta: e.target.value })}
                  className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-36 shrink-0"
                  title="ETA"
                />
                <input
                  type="date"
                  value={pc.etd}
                  onChange={(e) => updatePort(pc.id, { etd: e.target.value })}
                  className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 w-36 shrink-0"
                  title="ETD"
                />

                {/* Strait badge */}
                {(pc.isBosphorus || pc.isDardanelles || pc.isSuez) && (
                  <span className="text-xs px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded shrink-0">
                    {pc.isBosphorus ? 'BSP' : pc.isDardanelles ? 'DAR' : 'SUE'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => removePort(pc.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div className="mt-4 h-80 w-full">
        <VoyageMap portRotation={portRotation} />
      </div>
    </div>
  );
}
