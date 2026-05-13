'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, Trash2, GripVertical, AlertTriangle, ChevronDown, ChevronRight, Paperclip, ExternalLink, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { PortCall, PortRole, CanalCost, Voyage } from '@/types';
import type { Port } from '@/types';
import { generateId } from '@/lib/utils';
import { PortAutocomplete } from './PortAutocomplete';
import portsData from '@/data/ports.json';

const VoyageMap = dynamic(() => import('./VoyageMap').then((m) => m.VoyageMap), {
  ssr: false,
  loading: () => <div className="w-full h-80 bg-background/50 rounded-xl flex items-center justify-center text-muted-foreground text-sm">Loading map...</div>,
});

interface Props {
  data: Partial<Voyage>;
  onChange: (data: Partial<Voyage>) => void;
}

const ROLE_OPTIONS: { value: PortRole; label: string }[] = [
  { value: 'load', label: 'Load' },
  { value: 'discharge', label: 'Discharge' },
  { value: 'transit', label: 'Transit' },
];

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

function emptyPortCall(): PortCall {
  return { id: generateId(), portId: '', portName: '', role: 'load', eta: '', etd: '' };
}

function emptyCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles'): CanalCost {
  return { id: generateId(), canalType: type, proformaCost: 0, finalCost: 0 };
}

const PORTS = portsData as Port[];

function findPort(name: string): Port | undefined {
  const lower = name.toLowerCase().trim();
  return PORTS.find((p) => p.name.toLowerCase() === lower || p.id.toLowerCase() === lower);
}

function buildRotationFromCargoes(data: Partial<Voyage>): PortCall[] {
  const seen = new Set<string>();
  const result: PortCall[] = [];
  for (const cargo of data.cargoes ?? []) {
    const loadingNames = cargo.loadingPortDAs?.map((p) => p.portName).filter(Boolean) ?? cargo.loadingPorts ?? [];
    const dischargeNames = cargo.dischargingPortDAs?.map((p) => p.portName).filter(Boolean) ?? cargo.dischargingPorts ?? [];
    for (const name of loadingNames) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const port = findPort(name);
      result.push({ id: generateId(), portId: port?.id ?? '', portName: port?.name ?? name, role: 'load', eta: '', etd: '', lat: port?.lat, lng: port?.lng, isBosphorus: port?.isBosphorus, isDardanelles: port?.isDardanelles, isSuez: port?.isSuez });
    }
    for (const name of dischargeNames) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const port = findPort(name);
      result.push({ id: generateId(), portId: port?.id ?? '', portName: port?.name ?? name, role: 'discharge', eta: '', etd: '', lat: port?.lat, lng: port?.lng, isBosphorus: port?.isBosphorus, isDardanelles: port?.isDardanelles, isSuez: port?.isSuez });
    }
  }
  return result;
}

const inputCls = 'w-full px-2 py-1 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 text-right';

// ── Per-port document uploader ─────────────────────────────────────────────
interface PortDoc { name: string; url: string; uploadedAt: string }

function PortDocuments({
  pc, voyageNumber, onUpdate,
}: { pc: PortCall; voyageNumber: string; onUpdate: (docs: PortDoc[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const docs: PortDoc[] = pc.portDocuments ?? [];

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'port-documents');
      const safeName = pc.portName.replace(/[^a-zA-Z0-9_-]/g, '_');
      form.append('path', `${voyageNumber}/${safeName}/${file.name}`);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (json.url) {
        onUpdate([...docs, { name: file.name, url: json.url, uploadedAt: new Date().toISOString() }]);
      }
    } catch { /* ignore */ } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
          <Paperclip className="h-3 w-3" /> Documents
        </p>
        <label className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-medium cursor-pointer transition-colors border ${
          uploading ? 'opacity-40 cursor-default border-border text-muted-foreground' : 'border-primary/30 text-primary hover:bg-primary/10 border-dashed'
        }`}>
          {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          {uploading ? 'Uploading…' : 'Upload'}
          <input type="file" className="hidden" disabled={uploading} onChange={handleFile} />
        </label>
      </div>
      {docs.length === 0 ? (
        <p className="text-[10px] text-muted-foreground/50">No documents uploaded for this port</p>
      ) : (
        <div className="space-y-1">
          {docs.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <Paperclip className="h-3 w-3 text-muted-foreground/60 shrink-0" />
              <span className="text-xs text-foreground/80 truncate flex-1">{d.name}</span>
              <a href={d.url} target="_blank" rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors shrink-0">
                <ExternalLink className="h-3 w-3" />
              </a>
              <button type="button" onClick={() => onUpdate(docs.filter((_, j) => j !== i))}
                className="text-muted-foreground hover:text-red-400 transition-colors shrink-0">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StepPortRotation({ data, onChange }: Props) {
  const portRotation: PortCall[] = data.portRotation ?? [];
  const canalCosts: CanalCost[] = data.canalCosts ?? [];
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const synced = useRef(false);

  // ETA hints: keyed by destination portCall id
  const [etaHints, setEtaHints] = useState<Record<string, { nm: number; etaDate: Date; speed: number } | null>>({});
  const [hintLoading, setHintLoading] = useState<Record<string, boolean>>({});

  const calculateEta = useCallback(async (fromPort: PortCall, toPort: PortCall, etd: string) => {
    if (!fromPort.lat || !fromPort.lng || !toPort.lat || !toPort.lng) return;
    if (!etd) return;
    const speed = data.vesselSpeed ?? 0;
    if (speed <= 0) return;

    setHintLoading((prev) => ({ ...prev, [toPort.id]: true }));
    try {
      const res = await fetch(
        `https://searoute-service-production.up.railway.app/distance?oLon=${fromPort.lng}&oLat=${fromPort.lat}&dLon=${toPort.lng}&dLat=${toPort.lat}`
      );
      const json = await res.json();
      if (json.status === 'ok') {
        const nm: number = json.distanceNM;
        const hours = nm / speed;
        const etdDate = new Date(etd + 'T00:00:00');
        const etaDate = new Date(etdDate.getTime() + hours * 3_600_000);
        setEtaHints((prev) => ({ ...prev, [toPort.id]: { nm, etaDate, speed } }));
        // Persist distance on the departing port
        updatePort(fromPort.id, { distanceToNextPort: nm });
      }
    } catch {
      // silently ignore network errors
    } finally {
      setHintLoading((prev) => ({ ...prev, [toPort.id]: false }));
    }
  }, [data.vesselSpeed]);

  useEffect(() => {
    if (synced.current) return;
    synced.current = true;
    if (portRotation.length === 0) {
      const derived = buildRotationFromCargoes(data);
      if (derived.length > 0) onChange({ ...data, portRotation: derived });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addPort() {
    const pc = emptyPortCall();
    onChange({ ...data, portRotation: [...portRotation, pc] });
    setExpandedIds((s) => { const n = new Set(s); n.add(pc.id); return n; });
  }

  function removePort(id: string) {
    onChange({ ...data, portRotation: portRotation.filter((p) => p.id !== id) });
    setExpandedIds((s) => { const n = new Set(s); n.delete(id); return n; });
  }

  function updatePort(id: string, updates: Partial<PortCall>) {
    onChange({ ...data, portRotation: portRotation.map((p) => p.id === id ? { ...p, ...updates } : p) });
  }

  function handlePortSelect(id: string, port: Port) {
    updatePort(id, { portId: port.id, portName: port.name, country: port.country, lat: port.lat, lng: port.lng, isBosphorus: port.isBosphorus, isDardanelles: port.isDardanelles, isSuez: port.isSuez });
  }

  function toggleExpand(id: string) {
    setExpandedIds((s) => { const n = new Set(s); if (n.has(id)) { n.delete(id); } else { n.add(id); } return n; });
  }

  function handleDragStart(idx: number) { setDragIdx(idx); }
  function handleDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const updated = [...portRotation];
    const [item] = updated.splice(dragIdx, 1);
    updated.splice(idx, 0, item);
    onChange({ ...data, portRotation: updated });
    setDragIdx(idx);
  }
  function handleDragEnd() { setDragIdx(null); }

  function toggleCanalCost(type: 'suez' | 'bosphorus' | 'dardanelles') {
    const existing = canalCosts.find((c) => c.canalType === type);
    if (existing) onChange({ ...data, canalCosts: canalCosts.filter((c) => c.canalType !== type) });
    else onChange({ ...data, canalCosts: [...canalCosts, emptyCanalCost(type)] });
  }

  function updateCanalCost(id: string, updates: Partial<CanalCost>) {
    onChange({ ...data, canalCosts: canalCosts.map((c) => c.id === id ? { ...c, ...updates } : c) });
  }

  const hasBosphorus = portRotation.some((p) => p.isBosphorus);
  const hasSuez = portRotation.some((p) => p.isSuez);
  const hasDardanelles = portRotation.some((p) => p.isDardanelles);
  const transitFlags = portRotation.filter((p) => p.isBosphorus || p.isDardanelles || p.isSuez);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Port Rotation & Costs</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Define ports, agents, times and costs for the voyage</p>
        </div>
        <button type="button" onClick={addPort}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors">
          <Plus className="h-3.5 w-3.5" /> Add Port
        </button>
      </div>

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

      {portRotation.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground bg-background/30 border border-dashed border-border rounded-xl">
          No ports yet. Click <strong>Add Port</strong> to start.
        </div>
      ) : (
        <div className="space-y-2">
          {portRotation.map((pc, idx) => {
            const expanded = expandedIds.has(pc.id);
            const roleColor = pc.role === 'load' ? 'bg-green-400' : pc.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400';
            const portTotal = (pro: boolean) => COST_FIELDS.reduce((s, f) =>
              s + ((pc[pro ? f.pro : f.fin] as number) ?? 0), 0);
            const proSum = portTotal(true);
            const finSum = portTotal(false);

            return (
              <div key={pc.id} draggable onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)} onDragEnd={handleDragEnd}
                className={`border rounded-xl overflow-hidden transition-all ${dragIdx === idx ? 'border-primary/50 bg-primary/5' : 'border-border bg-background/40'}`}>

                {/* Port header row — click anywhere to expand */}
                <div className="flex items-center gap-2 px-3 py-2.5 cursor-pointer select-none"
                  onClick={() => toggleExpand(pc.id)}>
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab shrink-0"
                    onClick={(e) => e.stopPropagation()} />
                  <span className="text-xs font-mono text-muted-foreground w-5 text-center shrink-0">{idx + 1}</span>

                  <select value={pc.role}
                    onChange={(e) => updatePort(pc.id, { role: e.target.value as PortRole })}
                    onClick={(e) => e.stopPropagation()}
                    className="px-2 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 shrink-0">
                    {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>

                  <div className="flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                    <PortAutocomplete value={pc.portName} onChange={(port) => handlePortSelect(pc.id, port)} placeholder="Search port..." />
                  </div>

                  {(pc.isBosphorus || pc.isDardanelles || pc.isSuez) && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 rounded shrink-0">
                      {pc.isBosphorus ? 'BSP' : pc.isDardanelles ? 'DAR' : 'SUE'}
                    </span>
                  )}

                  {proSum > 0 && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      Pro: ${proSum.toLocaleString()}
                      {finSum > 0 && <span className={finSum > proSum ? ' text-red-400' : ' text-green-400'}> / Fin: ${finSum.toLocaleString()}</span>}
                    </span>
                  )}

                  {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}

                  <button type="button" onClick={(e) => { e.stopPropagation(); removePort(pc.id); }}
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Expanded panel */}
                {expanded && (
                  <div className="border-t border-border/50 bg-background/20 divide-y divide-border/40">

                    {/* Section 1: Agent Details */}
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Agent Details</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Agent Company</p>
                          <input type="text" value={pc.agentCompany ?? ''}
                            onChange={(e) => updatePort(pc.id, { agentCompany: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Contact Name</p>
                          <input type="text" value={pc.agentName ?? ''}
                            onChange={(e) => updatePort(pc.id, { agentName: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Email</p>
                          <input type="email" value={pc.agentEmail ?? ''}
                            onChange={(e) => updatePort(pc.id, { agentEmail: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">Phone</p>
                          <input type="text" value={pc.agentPhone ?? ''}
                            onChange={(e) => updatePort(pc.id, { agentPhone: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Times */}
                    <div className="px-4 py-3 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Times</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">ETA (Estimated Arrival)</p>
                          <input type="date" value={pc.eta}
                            onChange={(e) => updatePort(pc.id, { eta: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                          {/* ETA hint from previous port's ETD calculation */}
                          {(() => {
                            const hint = etaHints[pc.id];
                            const loading = hintLoading[pc.id];
                            if (loading) return (
                              <p className="text-[10px] text-muted-foreground/60 mt-1 animate-pulse">Calculating sea distance…</p>
                            );
                            if (!hint) return null;
                            const fmt = hint.etaDate.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                            return (
                              <p className="text-[10px] text-blue-400 mt-1 leading-tight">
                                ⚓ Est. arrival: <span className="font-semibold">{fmt}</span>
                                <span className="text-muted-foreground ml-1">({hint.nm.toLocaleString(undefined, { maximumFractionDigits: 0 })} nm @ {hint.speed} kts)</span>
                              </p>
                            );
                          })()}
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">ETD (Estimated Departure)</p>
                          <input type="date" value={pc.etd}
                            onChange={(e) => {
                              updatePort(pc.id, { etd: e.target.value });
                              const nextPort = portRotation[idx + 1];
                              if (nextPort) calculateEta(pc, nextPort, e.target.value);
                            }}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">ATA (Actual Arrival)</p>
                          <input type="datetime-local" value={pc.ata ?? ''}
                            onChange={(e) => updatePort(pc.id, { ata: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground mb-1">ATD (Actual Departure)</p>
                          <input type="datetime-local" value={pc.atd ?? ''}
                            onChange={(e) => updatePort(pc.id, { atd: e.target.value })}
                            className="w-full px-2 py-1.5 bg-background border border-border rounded text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Port Costs */}
                    <div className="px-4 py-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${roleColor}`} />
                        <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Port Costs</p>
                      </div>
                      <div className="grid grid-cols-[1fr_100px_100px_80px] gap-x-2 gap-y-1.5 items-center">
                        {/* Column headers */}
                        <span className="text-[10px] text-muted-foreground/50" />
                        <span className="text-[10px] text-blue-400/80 font-medium text-right">Forecast ($)</span>
                        <span className="text-[10px] text-muted-foreground font-medium text-right">Final ($)</span>
                        <span className="text-[10px] text-muted-foreground font-medium text-right">Variance</span>
                        {COST_FIELDS.map(({ pro, fin, label }) => {
                          const proVal = (pc[pro] as number) ?? 0;
                          const finVal = (pc[fin] as number) ?? 0;
                          const variance = proVal > 0 ? ((finVal - proVal) / proVal) * 100 : 0;
                          const hasVariance = proVal > 0 && finVal > 0 && variance !== 0;
                          return (
                            <>
                              <span key={`${pc.id}-${label}-lbl`} className="text-xs text-muted-foreground">{label}</span>
                              <input key={`${pc.id}-${label}-pro`} type="number" min={0}
                                value={proVal || ''}
                                onChange={(e) => updatePort(pc.id, { [pro]: parseFloat(e.target.value) || 0 })}
                                className={inputCls} />
                              <input key={`${pc.id}-${label}-fin`} type="number" min={0}
                                value={finVal || ''}
                                onChange={(e) => updatePort(pc.id, { [fin]: parseFloat(e.target.value) || 0 })}
                                className={inputCls} />
                              <span key={`${pc.id}-${label}-var`} className={`text-[10px] font-mono text-right ${hasVariance ? (variance > 0 ? 'text-red-400' : 'text-green-400') : 'text-muted-foreground/30'}`}>
                                {hasVariance ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%` : '—'}
                              </span>
                            </>
                          );
                        })}
                      </div>
                      {proSum > 0 && (
                        <div className="pt-2 border-t border-border/40 grid grid-cols-[1fr_100px_100px_80px] gap-x-2 items-center">
                          <span className="text-xs font-semibold text-muted-foreground">Total</span>
                          <span className="text-xs font-mono text-blue-400/80 text-right">${proSum.toLocaleString()}</span>
                          <span className={`text-xs font-mono font-semibold text-right ${finSum > proSum ? 'text-red-400' : finSum > 0 ? 'text-green-400' : 'text-muted-foreground/40'}`}>
                            {finSum > 0 ? `$${finSum.toLocaleString()}` : '—'}
                          </span>
                          <span className={`text-[10px] font-mono text-right ${finSum > proSum ? 'text-red-400' : finSum > 0 ? 'text-green-400' : 'text-muted-foreground/30'}`}>
                            {finSum > 0 && proSum > 0 ? `${finSum > proSum ? '+' : ''}${(((finSum - proSum) / proSum) * 100).toFixed(1)}%` : '—'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Section 4: Documents */}
                    <PortDocuments
                      pc={pc}
                      voyageNumber={data.voyageNumber ?? 'DRAFT'}
                      onUpdate={(docs) => updatePort(pc.id, { portDocuments: docs })}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Canal costs */}
      <div className="bg-background/40 border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground">Canal & Strait Costs</h3>
          {(hasBosphorus || hasSuez || hasDardanelles) && (
            <span className="flex items-center gap-1 text-xs text-amber-400">
              <AlertTriangle className="h-3 w-3" /> Detected in route
            </span>
          )}
        </div>
        {([
          { type: 'suez', label: 'Suez Canal', flagged: hasSuez },
          { type: 'bosphorus', label: 'Bosphorus', flagged: hasBosphorus },
          { type: 'dardanelles', label: 'Dardanelles', flagged: hasDardanelles },
        ] as const).map(({ type, label, flagged }) => {
          const cc = canalCosts.find((c) => c.canalType === type);
          return (
            <div key={type} className={`p-3 rounded-lg border transition-colors ${flagged ? 'border-amber-400/30 bg-amber-400/5' : 'border-border/50'}`}>
              <div className="flex items-center gap-3 mb-2">
                <input type="checkbox" id={`canal-${type}`} checked={!!cc} onChange={() => toggleCanalCost(type)} className="rounded border-border" />
                <label htmlFor={`canal-${type}`} className="text-sm font-medium text-foreground cursor-pointer">
                  {label}{flagged && <span className="ml-2 text-xs text-amber-400">(in route)</span>}
                </label>
              </div>
              {cc && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Proforma ($)</p>
                    <input type="number" min={0} value={cc.proformaCost || ''}
                      onChange={(e) => updateCanalCost(cc.id, { proformaCost: parseFloat(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Final ($)</p>
                    <input type="number" min={0} value={cc.finalCost || ''}
                      onChange={(e) => updateCanalCost(cc.id, { finalCost: parseFloat(e.target.value) || 0 })}
                      className={inputCls} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Map */}
      <div className="mt-2 h-72 w-full">
        <VoyageMap portRotation={portRotation} />
      </div>
    </div>
  );
}
