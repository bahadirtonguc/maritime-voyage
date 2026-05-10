'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Voyage } from '@/types';

export function useVoyages() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoyages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/voyages');
      if (!res.ok) throw new Error('Failed to fetch voyages');
      const data = await res.json();
      setVoyages(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVoyages();
  }, [fetchVoyages]);

  const saveVoyage = useCallback(async (voyage: Voyage): Promise<boolean> => {
    try {
      const res = await fetch(
        voyage.id ? `/api/voyages/${voyage.id}` : '/api/voyages',
        {
          method: voyage.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(voyage),
        }
      );
      if (!res.ok) throw new Error('Failed to save voyage');
      await fetchVoyages();
      return true;
    } catch {
      return false;
    }
  }, [fetchVoyages]);

  const deleteVoyage = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/voyages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete voyage');
      await fetchVoyages();
      return true;
    } catch {
      return false;
    }
  }, [fetchVoyages]);

  return { voyages, loading, error, saveVoyage, deleteVoyage, refetch: fetchVoyages };
}
