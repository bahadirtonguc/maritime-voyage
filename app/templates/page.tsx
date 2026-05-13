'use client';

import { useRouter } from 'next/navigation';
import { BookTemplate, Trash2, Copy, Plus } from 'lucide-react';
import { AppShell } from '@/components/AppShell';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useTemplates } from '@/hooks/useTemplates';
import { useVoyages } from '@/hooks/useVoyages';
import { useToast } from '@/components/ToastProvider';
import { generateId, formatCurrency } from '@/lib/utils';
import { calculatePnL } from '@/lib/pnl';
import { useState } from 'react';
import type { VoyageTemplate, Voyage } from '@/types';

export default function TemplatesPage() {
  const { templates, loading, deleteTemplate } = useTemplates();
  const { saveVoyage } = useVoyages();
  const { toast } = useToast();
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  async function handleClone(template: VoyageTemplate) {
    const newVoyage: Voyage = {
      ...template.voyage as Voyage,
      id: generateId(),
      status: 'planned',
      voyageNumber: `VOY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const ok = await saveVoyage(newVoyage);
    if (ok) {
      toast('Voyage created from template', 'success');
      router.push(`/voyages/${newVoyage.id}/edit`);
    } else {
      toast('Failed to create voyage from template', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    const ok = await deleteTemplate(deleteId);
    if (ok) toast('Template deleted', 'success');
    else toast('Failed to delete template', 'error');
    setDeleteId(null);
  }

  return (
    <AppShell>
      <div className="flex-1 overflow-y-auto">
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Voyage Templates</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Save and reuse voyage configurations</p>
          </div>
          <button
            onClick={() => router.push('/voyages/new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Voyage
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-40 bg-card border border-border rounded-xl animate-pulse" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-20">
            <BookTemplate className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground text-sm">No templates yet</p>
            <p className="text-xs text-muted-foreground mt-1">Open any voyage and click &quot;Template&quot; to save it</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map((template) => {
              const pnl = calculatePnL(template.voyage as Partial<Voyage>);
              return (
                <div key={template.id} className="bg-card border border-border rounded-xl p-5 hover:border-border-light transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <BookTemplate className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground">{(template.voyage as Voyage).vesselName || 'Unnamed vessel'}</p>
                      <p className="text-xs text-muted-foreground">{(template.voyage as Voyage).vesselType}</p>
                    </div>
                    <button
                      onClick={() => setDeleteId(template.id)}
                      className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>{(template.voyage as Voyage).portRotation?.length ?? 0} ports · {(template.voyage as Voyage).cargoes?.length ?? 0} cargoes</p>
                    <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                    {pnl.freightIn > 0 && <p>Est. net freight: {formatCurrency(pnl.freightIn, 0)}</p>}
                  </div>

                  <button
                    onClick={() => handleClone(template)}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary rounded-lg text-xs font-medium transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Use Template
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Template"
        message="Are you sure you want to delete this template? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
      </div>
    </AppShell>
  );
}
