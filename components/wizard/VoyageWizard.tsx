'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Save, Loader2 } from 'lucide-react';
import { WizardProgress } from '@/components/WizardProgress';
import { StepVesselFreight } from './StepVesselFreight';
import { StepCargoes } from './StepCargoes';
import { StepPortRotation } from './StepPortRotation';
import { StepCosts } from './StepCosts';
import { PnLPanel } from '@/components/PnLPanel';
import { useToast } from '@/components/ToastProvider';
import { useVoyages } from '@/hooks/useVoyages';
import { generateId } from '@/lib/utils';
import type { Voyage } from '@/types';

const STEPS = [
  { label: 'Vessel & Freight', description: 'Basic info' },
  { label: 'Cargoes', description: 'Cargo lots' },
  { label: 'Port Rotation', description: 'Route & map' },
  { label: 'Costs', description: 'P&L' },
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
  const [step, setStep] = useState(0);
  const [voyage, setVoyage] = useState<Partial<Voyage>>(initialVoyage ?? defaultVoyage());
  const [saving, setSaving] = useState(false);
  const { saveVoyage } = useVoyages();
  const { toast } = useToast();
  const router = useRouter();

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!isEdit) {
      const key = 'voyage-draft';
      const draft = localStorage.getItem(key);
      if (draft) {
        try {
          setVoyage(JSON.parse(draft));
        } catch {}
      }
    }
  }, [isEdit]);

  useEffect(() => {
    if (!isEdit) {
      localStorage.setItem('voyage-draft', JSON.stringify(voyage));
    }
  }, [voyage, isEdit]);

  function isStepValid(s: number): boolean {
    if (s === 0) return !!(voyage.vesselName && voyage.voyageNumber);
    return true;
  }

  async function handleSave() {
    setSaving(true);
    try {
      const full: Voyage = {
        id: initialVoyage?.id ?? generateId(),
        voyageNumber: voyage.voyageNumber ?? '',
        vesselName: voyage.vesselName ?? '',
        vesselType: voyage.vesselType ?? '',
        vesselSpeed: voyage.vesselSpeed ?? 0,
        laydaysStart: voyage.laydaysStart ?? '',
        cancellingDate: voyage.cancellingDate ?? '',
        status: voyage.status ?? 'planned',
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

  const steps = [
    <StepVesselFreight key="step1" data={voyage} onChange={setVoyage} />,
    <StepCargoes key="step2" data={voyage} onChange={setVoyage} />,
    <StepPortRotation key="step3" data={voyage} onChange={setVoyage} />,
    <StepCosts key="step4" data={voyage} onChange={setVoyage} />,
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      {/* Main wizard */}
      <div className="flex-1 min-w-0">
        {/* Progress */}
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <WizardProgress steps={STEPS} currentStep={step} />
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-xl p-6 min-h-[400px]">
          {steps[step]}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <button
            type="button"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-border-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !isStepValid(0)}
              className="flex items-center gap-1.5 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
                disabled={!isStepValid(step)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !isStepValid(0)}
                className="flex items-center gap-1.5 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEdit ? 'Update Voyage' : 'Create Voyage'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* P&L sidebar */}
      <div className="w-full lg:w-72 shrink-0">
        <PnLPanel voyage={voyage} />
      </div>
    </div>
  );
}
