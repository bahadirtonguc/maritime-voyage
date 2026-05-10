'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { VoyageWizard } from '@/components/wizard/VoyageWizard';
import type { Voyage } from '@/types';

export default function EditVoyagePage() {
  const params = useParams();
  const router = useRouter();
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVoyage() {
      try {
        const res = await fetch(`/api/voyages/${params.id}`);
        if (!res.ok) { router.push('/'); return; }
        setVoyage(await res.json());
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchVoyage();
  }, [params.id, router]);

  return (
    <AppShell>
      <div className="p-6 pb-2">
        <h1 className="text-xl font-bold text-foreground">Edit Voyage</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Update voyage details</p>
      </div>
      {loading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : voyage ? (
        <VoyageWizard initialVoyage={voyage} isEdit />
      ) : null}
    </AppShell>
  );
}
