'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { VoyageDetail } from '@/components/VoyageDetail';
import type { Voyage } from '@/types';

export default function VoyageDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [voyage, setVoyage] = useState<Voyage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVoyage() {
      try {
        const res = await fetch(`/api/voyages/${params.id}`);
        if (!res.ok) {
          router.push('/');
          return;
        }
        const data = await res.json();
        setVoyage(data);
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
      {loading ? (
        <div className="p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 bg-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : voyage ? (
        <VoyageDetail voyage={voyage} />
      ) : null}
    </AppShell>
  );
}
