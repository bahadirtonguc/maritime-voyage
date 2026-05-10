import { AppShell } from '@/components/AppShell';
import { VoyageWizard } from '@/components/wizard/VoyageWizard';

export default function NewVoyagePage() {
  return (
    <AppShell>
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold text-foreground">New Voyage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Complete all steps to create a voyage</p>
      </div>
      <VoyageWizard />
    </AppShell>
  );
}
