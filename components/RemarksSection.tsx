'use client';

import { useState } from 'react';
import { Save, Upload, FileText, Loader2, X } from 'lucide-react';
import { useToast } from './ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { generateId } from '@/lib/utils';
import type { Voyage, Document } from '@/types';

interface Props {
  voyage: Voyage;
}

const DOC_TYPE_LABELS: Record<Document['type'], string> = {
  bl: 'Bill of Lading',
  cp: 'Charter Party',
  nor: 'Notice of Readiness',
  other: 'Other',
};

export function RemarksSection({ voyage }: Props) {
  const [remarks, setRemarks] = useState(voyage.remarks ?? '');
  const [saving, setSaving] = useState(false);
  const { saveVoyage } = useVoyages();
  const { toast } = useToast();

  async function handleSaveRemarks() {
    setSaving(true);
    try {
      const ok = await saveVoyage({ ...voyage, remarks, updatedAt: new Date().toISOString() });
      if (ok) toast('Remarks saved', 'success');
      else toast('Failed to save remarks', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const type = (() => {
      const name = file.name.toLowerCase();
      if (name.includes('bl') || name.includes('bill')) return 'bl' as const;
      if (name.includes('cp') || name.includes('charter')) return 'cp' as const;
      if (name.includes('nor') || name.includes('readiness')) return 'nor' as const;
      return 'other' as const;
    })();

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const doc: Document = {
        id: generateId(),
        name: file.name,
        type,
        uploadedAt: new Date().toISOString(),
        size: file.size,
        dataUrl: ev.target?.result as string,
      };
      const updated = { ...voyage, documents: [...(voyage.documents ?? []), doc], updatedAt: new Date().toISOString() };
      const ok = await saveVoyage(updated);
      if (ok) toast('Document uploaded', 'success');
      else toast('Failed to upload document', 'error');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleDeleteDoc(docId: string) {
    const updated = { ...voyage, documents: voyage.documents.filter((d) => d.id !== docId), updatedAt: new Date().toISOString() };
    const ok = await saveVoyage(updated);
    if (ok) toast('Document removed', 'success');
    else toast('Failed to remove document', 'error');
  }

  return (
    <div className="space-y-5">
      {/* Remarks */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Remarks</h3>
        <textarea
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          rows={6}
          placeholder="Add voyage remarks, notes, or special instructions..."
          className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
        <button
          onClick={handleSaveRemarks}
          disabled={saving}
          className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
        >
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save Remarks
        </button>
      </div>

      {/* Documents */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Documents</h3>
          <label className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5" />
            Upload
            <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.jpg,.png" />
          </label>
        </div>

        {voyage.documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {voyage.documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-background/40 rounded-lg border border-border/50">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-foreground font-medium truncate max-w-xs">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.type]} · {(doc.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDoc(doc.id)}
                  className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
