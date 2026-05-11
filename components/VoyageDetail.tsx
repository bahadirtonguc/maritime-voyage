'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Edit, Trash2, Ship, Download, BookTemplate,
  AlertTriangle, FileSpreadsheet, Loader2,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { PnLPanel } from './PnLPanel';
import { VarianceTable } from './VarianceTable';
import { ConfirmDialog } from './ConfirmDialog';
import { RemarksSection } from './RemarksSection';
import { useToast } from './ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { useTemplates } from '@/hooks/useTemplates';
import { buildVarianceItems } from '@/lib/pnl';
import { formatCurrency, generateId, cn } from '@/lib/utils';
import type { Voyage } from '@/types';
import dynamic from 'next/dynamic';

const VoyageMap = dynamic(() => import('./wizard/VoyageMap').then((m) => m.VoyageMap), {
  ssr: false,
  loading: () => <div className="h-48 bg-background/50 rounded-xl animate-pulse" />,
});

interface Props {
  voyage: Voyage;
}

type Tab = 'overview' | 'costs' | 'variance' | 'remarks';

export function VoyageDetail({ voyage }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const { deleteVoyage } = useVoyages();
  const { saveTemplate } = useTemplates();
  const { toast } = useToast();
  const router = useRouter();

  const varianceItems = buildVarianceItems(voyage);

  async function handleDelete() {
    const ok = await deleteVoyage(voyage.id);
    if (ok) {
      toast('Voyage deleted', 'success');
      router.push('/');
    } else {
      toast('Failed to delete voyage', 'error');
    }
    setDeleteOpen(false);
  }

  async function handleExportPdf() {
    setExporting('pdf');
    try {
      const { exportVoyagePdf } = await import('@/lib/exportPdf');
      await exportVoyagePdf(voyage);
      toast('PDF report downloaded', 'success');
    } catch {
      toast('Failed to generate PDF', 'error');
    } finally {
      setExporting(null);
    }
  }

  async function handleExportExcel() {
    setExporting('excel');
    try {
      const { exportVoyageExcel } = await import('@/lib/exportExcel');
      await exportVoyageExcel(voyage);
      toast('Excel file downloaded', 'success');
    } catch {
      toast('Failed to generate Excel', 'error');
    } finally {
      setExporting(null);
    }
  }

  async function handleSaveTemplate() {
    const name = prompt('Template name:');
    if (!name) return;
    const ok = await saveTemplate({
      id: generateId(),
      name,
      voyage: {
        voyageNumber: voyage.voyageNumber,
        vesselName: voyage.vesselName,
        vesselType: voyage.vesselType,
        vesselSpeed: voyage.vesselSpeed,
        laydaysStart: voyage.laydaysStart,
        cancellingDate: voyage.cancellingDate,
        cargoes: voyage.cargoes,
        portRotation: voyage.portRotation,
        costs: voyage.costs,
        canalCosts: voyage.canalCosts,
        deviationThreshold: voyage.deviationThreshold,
        remarks: voyage.remarks,
        documents: voyage.documents,
      },
      createdAt: new Date().toISOString(),
    });
    if (ok) toast('Saved as template', 'success');
    else toast('Failed to save template', 'error');
  }

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'costs', label: 'Costs' },
    { id: 'variance', label: 'Variance' },
    { id: 'remarks', label: 'Remarks & Docs' },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <Ship className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">{voyage.vesselName}</h1>
              <StatusBadge status={voyage.status} />
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span className="font-mono">{voyage.voyageNumber}</span>
              {voyage.vesselType && <span>· {voyage.vesselType}</span>}
              {voyage.vesselSpeed > 0 && <span>· {voyage.vesselSpeed} knots</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportPdf}
              disabled={exporting === 'pdf'}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border-light disabled:opacity-50 transition-colors"
            >
              {exporting === 'pdf' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={exporting === 'excel'}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border-light disabled:opacity-50 transition-colors"
            >
              {exporting === 'excel' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5" />}
              Excel
            </button>
            <button
              onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border-light transition-colors"
            >
              <BookTemplate className="h-3.5 w-3.5" />
              Template
            </button>
            <Link
              href={`/voyages/${voyage.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-border-light transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400/30 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Port rotation */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Port Rotation</h3>
              {voyage.portRotation.length === 0 ? (
                <p className="text-sm text-muted-foreground">No ports defined</p>
              ) : (
                <div className="space-y-1">
                  {voyage.portRotation.map((pc, i) => (
                    <div key={pc.id} className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                      <div
                        className={cn(
                          'w-2 h-2 rounded-full shrink-0',
                          pc.role === 'load' ? 'bg-green-400' : pc.role === 'discharge' ? 'bg-red-400' : 'bg-amber-400'
                        )}
                      />
                      <span className="text-sm text-foreground font-medium">{pc.portName}</span>
                      <span className="text-xs text-muted-foreground capitalize">({pc.role})</span>
                      {pc.eta && <span className="text-xs text-muted-foreground ml-auto">ETA: {pc.eta}</span>}
                      {(pc.isBosphorus || pc.isDardanelles || pc.isSuez) && (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}
              {voyage.portRotation.length > 0 && (
                <div className="mt-4" style={{ height: 280 }}>
                  <VoyageMap portRotation={voyage.portRotation} />
                </div>
              )}
            </div>

            {/* Cargoes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Cargoes</h3>
              {voyage.cargoes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No cargoes defined</p>
              ) : (
                <div className="space-y-2">
                  {voyage.cargoes.map((cargo) => {
                    const grossFreight = cargo.freightType === 'lumpsum'
                      ? cargo.freightRate
                      : cargo.freightRate * cargo.quantity;
                    const brokerage = (grossFreight * cargo.brokeragePercent) / 100;
                    return (
                      <div key={cargo.id} className="flex items-center justify-between p-3 bg-background/40 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-foreground capitalize">{cargo.cargoType}</p>
                          <p className="text-xs text-muted-foreground">
                            {cargo.quantity.toLocaleString()} MT · {cargo.chartererName || 'No charterer'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-blue-400 font-semibold">{formatCurrency(grossFreight, 0)}</p>
                          <p className="text-xs text-muted-foreground">Brokerage: {formatCurrency(brokerage, 0)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'costs' && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Cost Breakdown</h3>
            {voyage.costs.length === 0 && voyage.canalCosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">No costs entered</p>
            ) : (
              <div className="space-y-4">
                {voyage.costs.map((cost) => (
                  <div key={cost.id} className="bg-background/40 p-4 rounded-lg border border-border/50">
                    <p className="text-sm font-medium text-foreground mb-3">{cost.portName}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <CostRow label="Pro. D/A" value={cost.proformaDa} />
                      <CostRow label="Final D/A" value={cost.finalDa} />
                      {(cost.proformaPilotage > 0 || cost.finalPilotage > 0) && <CostRow label="Pro. Pilotage" value={cost.proformaPilotage} />}
                      {cost.finalPilotage > 0 && <CostRow label="Final Pilotage" value={cost.finalPilotage} />}
                      {(cost.proformaTowage > 0 || cost.finalTowage > 0) && <CostRow label="Pro. Towage" value={cost.proformaTowage} />}
                      {cost.finalTowage > 0 && <CostRow label="Final Towage" value={cost.finalTowage} />}
                      {(cost.proformaAgencyFee > 0 || cost.finalAgencyFee > 0) && <CostRow label="Pro. Agency" value={cost.proformaAgencyFee} />}
                      {cost.finalAgencyFee > 0 && <CostRow label="Final Agency" value={cost.finalAgencyFee} />}
                      {(cost.proformaOther > 0 || cost.finalOther > 0) && <CostRow label="Pro. Other" value={cost.proformaOther} />}
                      {cost.finalOther > 0 && <CostRow label="Final Other" value={cost.finalOther} />}
                    </div>
                  </div>
                ))}
                {voyage.canalCosts.map((cc) => (
                  <div key={cc.id} className="bg-amber-400/5 p-4 rounded-lg border border-amber-400/20">
                    <p className="text-sm font-medium text-amber-400 capitalize mb-3">{cc.canalType} Transit</p>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <CostRow label="Proforma" value={cc.proformaCost} />
                      <CostRow label="Final" value={cc.finalCost} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'variance' && (
          <VarianceTable items={varianceItems} threshold={voyage.deviationThreshold ?? 5} />
        )}

        {activeTab === 'remarks' && (
          <RemarksSection voyage={voyage} />
        )}
      </div>

      {/* P&L sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        <PnLPanel voyage={voyage} />
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Voyage"
        message={`Are you sure you want to delete voyage ${voyage.voyageNumber}? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        confirmLabel="Delete"
        danger
      />
    </div>
  );
}

function CostRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-medium">{formatCurrency(value, 0)}</p>
    </div>
  );
}
