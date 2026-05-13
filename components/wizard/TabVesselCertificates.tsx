'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Paperclip, ExternalLink, Trash2, Loader2, Shield } from 'lucide-react';
import type { Voyage } from '@/types';

interface CertFile {
  name: string;
  url: string;
  uploadedAt: string;
}

interface Props {
  data: Partial<Voyage>;
}

export function TabVesselCertificates({ data }: Props) {
  const [files, setFiles]       = useState<CertFile[]>([]);
  const [loading, setLoading]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const lastImo = useRef('');

  const rawImo = data.imoNumber ?? '';
  const imo    = rawImo.replace(/\D/g, '');

  // Auto-load files when IMO changes
  useEffect(() => {
    if (!imo || imo === lastImo.current) return;
    lastImo.current = imo;
    setLoading(true);
    setFiles([]);
    fetch(`/api/upload?bucket=vessel-certificates&prefix=${imo}/`)
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [imo]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !imo) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('bucket', 'vessel-certificates');
      form.append('path', `${imo}/${file.name}`);
      const res  = await fetch('/api/upload', { method: 'POST', body: form });
      const json = await res.json();
      if (json.url) {
        setFiles((prev) => [...prev, { name: file.name, url: json.url, uploadedAt: new Date().toISOString() }]);
      }
    } catch { /* ignore */ } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(f: CertFile) {
    if (!imo) return;
    try {
      await fetch(`/api/upload?bucket=vessel-certificates&path=${imo}/${f.name}`, { method: 'DELETE' });
      setFiles((prev) => prev.filter((x) => x.url !== f.url));
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Vessel Certificates</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Certificates are stored by IMO number and auto-loaded across voyages
          </p>
        </div>
        {imo && (
          <label className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors border ${
            uploading
              ? 'opacity-40 cursor-default border-border text-muted-foreground'
              : 'border-primary/30 text-primary hover:bg-primary/10 border-dashed'
          }`}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {uploading ? 'Uploading…' : 'Upload Certificate'}
            <input type="file" className="hidden" disabled={uploading} onChange={handleUpload} />
          </label>
        )}
      </div>

      {/* IMO gate */}
      {!imo ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <Shield className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Enter IMO number in the Vessel tab to manage certificates</p>
          <p className="text-xs text-muted-foreground/60">Certificates are linked per vessel (by IMO) and available across all voyages</p>
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading certificates for IMO {imo}…
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-background/40 px-4 py-2 flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">IMO</span>
            <span className="text-xs font-mono font-semibold text-foreground">{imo}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''}</span>
          </div>

          {files.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 border border-dashed border-border rounded-xl text-center">
              <Paperclip className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No certificates on file for this vessel</p>
              <p className="text-xs text-muted-foreground/60">Upload Safety Certificate, Class Certificate, Manning Certificate, etc.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {files.map((f, i) => (
                <div key={i}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border bg-background/40 hover:bg-background/60 transition-colors group">
                  <Paperclip className="h-4 w-4 text-primary/60 shrink-0" />
                  <span className="text-sm text-foreground/90 truncate flex-1">{f.name}</span>
                  {f.uploadedAt && (
                    <span className="text-[10px] text-muted-foreground/60 shrink-0 hidden sm:block">
                      {new Date(f.uploadedAt).toLocaleDateString()}
                    </span>
                  )}
                  <a href={f.url} target="_blank" rel="noopener noreferrer"
                    className="p-1 text-muted-foreground hover:text-primary transition-colors shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <button type="button" onClick={() => handleDelete(f)}
                    className="p-1 text-muted-foreground hover:text-red-400 transition-colors shrink-0 opacity-0 group-hover:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
