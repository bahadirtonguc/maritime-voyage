'use client';

import { useState } from 'react';
import { X, Download, Loader2, FileText, Building2, Ship, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Voyage, PortCall, Cargo } from '@/types';

interface Props {
  voyage: Voyage;
  port: PortCall;
  onClose: () => void;
}

function roleName(role: string) {
  return role === 'load' ? 'Loading' : role === 'discharge' ? 'Discharging' : 'Transit';
}

function cargosForPort(voyage: Voyage, port: PortCall): Cargo[] {
  return voyage.cargoes.filter((c) => {
    const loads = c.loadingPortDAs?.map((p) => p.portName) ?? c.loadingPorts ?? [];
    const discs = c.dischargingPortDAs?.map((p) => p.portName) ?? c.dischargingPorts ?? [];
    return loads.includes(port.portName) || discs.includes(port.portName);
  });
}

function InfoRow({ label, value }: { label: string; value?: string | number }) {
  return (
    <div className="flex gap-2 py-1 border-b border-border/30 last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-xs text-foreground">{value || '—'}</span>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, multiline }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean;
}) {
  const base = 'w-full px-2.5 py-1.5 rounded-lg border border-border bg-background/60 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors';
  return (
    <div>
      <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">{label}</label>
      {multiline
        ? <textarea className={cn(base, 'resize-none h-20')} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
        : <input className={base} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      }
    </div>
  );
}

export function AppointmentLetterModal({ voyage, port, onClose }: Props) {
  const [opsName,    setOpsName]    = useState('');
  const [opsPhone,   setOpsPhone]   = useState('');
  const [opsEmail,   setOpsEmail]   = useState('');
  const [masterPhone, setMasterPhone] = useState('');
  const [additional, setAdditional] = useState('');
  const [generating, setGenerating] = useState(false);

  const ref      = `CS-APP-${voyage.voyageNumber}-${port.portName.replace(/\s+/g, '').toUpperCase()}`;
  const portCargoes = cargosForPort(voyage, port);

  async function handleDownload() {
    setGenerating(true);
    try {
      const { generateAppointmentLetterPdf } = await import('@/lib/appointmentLetterPdf');
      await generateAppointmentLetterPdf({
        voyage, port,
        opsOfficerName:  opsName,
        opsOfficerPhone: opsPhone,
        opsOfficerEmail: opsEmail,
        masterPhone,
        additionalInstructions: additional,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-border bg-card/80">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-bold text-foreground">Appointment Letter</p>
              <p className="text-[10px] text-muted-foreground font-mono">{ref}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-border/50 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Subject preview */}
          <div className="px-3 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-[9px] uppercase tracking-widest font-semibold text-blue-400 mb-0.5">Subject</p>
            <p className="text-xs font-semibold text-foreground">
              Appointment Letter — MV {voyage.vesselName} / Port of {port.portName} / {roleName(port.role)}
            </p>
          </div>

          {/* Two-column info grid */}
          <div className="grid grid-cols-2 gap-4">

            {/* Vessel & Voyage */}
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Ship className="h-3 w-3 text-primary" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Vessel & Voyage</p>
              </div>
              <InfoRow label="Vessel"      value={voyage.vesselName} />
              <InfoRow label="IMO"         value={voyage.imoNumber} />
              <InfoRow label="Type"        value={voyage.vesselType} />
              <InfoRow label="Flag"        value={voyage.flag} />
              <InfoRow label="DWT"         value={voyage.dwt ? `${voyage.dwt.toLocaleString()} MT` : undefined} />
              <InfoRow label="Built"       value={voyage.builtYear} />
              <InfoRow label="Voyage No."  value={voyage.voyageNumber} />
            </div>

            {/* Port */}
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Building2 className="h-3 w-3 text-primary" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Port & Agent</p>
              </div>
              <InfoRow label="Port"        value={port.portName + (port.country ? `, ${port.country}` : '')} />
              <InfoRow label="Purpose"     value={roleName(port.role)} />
              <InfoRow label="ETA"         value={port.eta} />
              <InfoRow label="ETD"         value={port.etd} />
              <InfoRow label="Agent Co."   value={port.agentCompany} />
              <InfoRow label="Contact"     value={port.agentName} />
              <InfoRow label="Email"       value={port.agentEmail} />
              <InfoRow label="Phone"       value={port.agentPhone} />
            </div>
          </div>

          {/* Cargo */}
          {portCargoes.length > 0 && (
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Package className="h-3 w-3 text-primary" />
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Cargo</p>
              </div>
              {portCargoes.map((c) => (
                <div key={c.id} className="flex flex-wrap gap-x-4 gap-y-0.5">
                  <InfoRow label="Commodity"  value={c.commodity || c.cargoType} />
                  <InfoRow label="Quantity"   value={`${c.quantity.toLocaleString()} MT`} />
                  <InfoRow label="Charterer"  value={c.chartererName} />
                </div>
              ))}
            </div>
          )}

          {/* Editable fields */}
          <div className="rounded-xl border border-border bg-background/40 p-3 space-y-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground">Emergency Contacts — Fill Before Generating</p>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Ops Officer — Name"  value={opsName}  onChange={setOpsName} />
              <Field label="Ops Officer — Phone" value={opsPhone} onChange={setOpsPhone} />
              <Field label="Ops Officer — Email" value={opsEmail} onChange={setOpsEmail} />
            </div>

            <Field label="Vessel Master — Phone" value={masterPhone} onChange={setMasterPhone} />
          </div>

          <div className="rounded-xl border border-border bg-background/40 p-3">
            <Field
              label="Additional Instructions (optional)"
              value={additional}
              onChange={setAdditional}
              multiline
            />
          </div>

          {/* Clauses preview */}
          <div className="rounded-xl border border-border bg-background/40 p-3">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-2">Standard Clauses (auto-included)</p>
            <div className="space-y-1">
              {[
                'Voyage-basis appointment only',
                'Agent to follow Core Shipping instructions at all times',
                'Proforma DA before arrival · Final DA within 14 days of departure',
                'Agent responsible for all port formalities & cargo operations',
                'Cost overruns >10% must be pre-approved',
                'Commencement of services constitutes acceptance of these terms',
                'Subject to FONASBA Standard Port Agency Agreement',
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-primary shrink-0 mt-0.5">{i + 1}.</span>
                  <span className="text-[10px] text-muted-foreground">{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signatory — only shown once the user has entered their name */}
          {opsName.trim() && (
            <div className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">Signatory</p>
              <p className="text-xs font-bold text-foreground">{opsName.trim()}</p>
              <p className="text-[10px] text-muted-foreground">Operations · Core Shipping B.V.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-t border-border bg-card/80">
          <p className="text-[10px] text-muted-foreground">
            PDF will download as <span className="font-mono text-foreground/70">AppointmentLetter_{voyage.voyageNumber}_{port.portName.replace(/\s+/g, '_')}_{new Date().toISOString().slice(0,10)}.pdf</span>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold transition-colors"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
