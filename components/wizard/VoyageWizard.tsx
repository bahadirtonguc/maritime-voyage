'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Loader2 } from 'lucide-react';
import { StepVesselFreight } from './StepVesselFreight';
import { StepCargoes } from './StepCargoes';
import { StepPortRotation } from './StepPortRotation';
import { TabVesselCertificates } from './TabVesselCertificates';
import { PnLPanel } from '@/components/PnLPanel';
import { useToast } from '@/components/ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { generateId } from '@/lib/utils';
import type { Voyage } from '@/types';

const TABS = [
  { id: 'vessel',       label: 'Vessel' },
  { id: 'cargoes',      label: 'Cargoes & Freight' },
  { id: 'ports',        label: 'Port Rotation' },
  { id: 'certificates', label: 'Certificates' },
];

function defaultVoyage(): Partial<Voyage> {
  return {
    voyageNumber: `VOY-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    vesselName: '',
    vesselType: 'Bulk Carrier',
    vesselSpeed: 13,
    laydaysStart: '',
    cancellingDate: '',
    status: 'planned',
    cargoes: [],
    portRotation: [],
    costs: [],
    canalCosts: [],
    deviationThreshold: 5,
    remarks: '',
    documents: [],
  };
}

interface Props {
  initialVoyage?: Voyage;
  isEdit?: boolean;
}

export function VoyageWizard({ initialVoyage, isEdit }: Props) {
  const [activeTab, setActiveTab] = useState(0);
  const [voyage, setVoyage] = useState<Partial<Voyage>>(initialVoyage ?? defaultVoyage());
  const [saving, setSaving] = useState(false);
  const { saveVoyage } = useVoyages();
  const { toast } = useToast();
  const router = useRouter();

  // Auto-save draft to localStorage (new voyages only)
  useEffect(() => {
    if (!isEdit) {
      const key = 'voyage-draft';
      const draft = localStorage.getItem(key);
      if (draft) {
        try { setVoyage(JSON.parse(draft)); } catch {}
      }
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem('voyage-draft', JSON.stringify(voyage));
    }
  }, [voyage, isEdit]);

  async function handleSave() {
    setSaving(true);
    try {
      const full: Voyage = {
        ...voyage,
        id: initialVoyage?.id ?? generateId(),
        voyageNumber: voyage.voyageNumber ?? '',
        vesselName: voyage.vesselName ?? '',
        vesselType: voyage.vesselType ?? '',
        vesselSpeed: voyage.vesselSpeed ?? 0,
        laydaysStart: voyage.laydaysStart ?? '',
        cancellingDate: voyage.cancellingDate ?? '',
        status: voyage.status ?? 'planned',
        freightIn: voyage.freightIn ?? 0,
        freightOut: voyage.freightOut ?? 0,
        cargoes: voyage.cargoes ?? [],
        portRotation: voyage.portRotation ?? [],
        costs: voyage.costs ?? [],
        canalCosts: voyage.canalCosts ?? [],
        deviationThreshold: voyage.deviationThreshold ?? 5,
        remarks: voyage.remarks ?? '',
        documents: voyage.documents ?? [],
        createdAt: initialVoyage?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const ok = await saveVoyage(full);
      if (ok) {
        localStorage.removeItem('voyage-draft');
        toast(isEdit ? 'Voyage updated successfully' : 'Voyage created successfully', 'success');
        router.push(`/voyages/${full.id}`);
      } else {
        toast('Failed to save voyage', 'error');
      }
    } finally {
      setSaving(false);
    }
  }

  const canSave = !!(voyage.vesselName && voyage.voyageNumber);

  const tabContent = [
    <StepVesselFreight    key="vessel" data={voyage} onChange={setVoyage} />,
    <StepCargoes          key="cargoes" data={voyage} onChange={setVoyage} />,
    <StepPortRotation     key="ports"  data={voyage} onChange={setVoyage} />,
    <TabVesselCertificates key="certs" data={voyage} />,
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main area */}
      <div className="flex-1 min-w-0">

        {/* Tab bar + Save button row */}
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-1 bg-background/50 border border-border rounded-xl p-1 overflow-x-auto">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(i)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === i
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-border/50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !canSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-colors shrink-0"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Update Voyage' : 'Save Voyage'}
          </button>
        </div>

        {/* Active tab content */}
        <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
          {tabContent[activeTab]}
        </div>
      </div>

      {/* P&L sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        <PnLPanel voyage={voyage} />
      </div>
    </div>
  );
}
