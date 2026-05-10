'use client';

import { useState, useEffect, useCallback } from 'react';
import type { VoyageTemplate } from '@/types';

export function useTemplates() {
  const [templates, setTemplates] = useState<VoyageTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/templates');
      if (!res.ok) throw new Error('Failed to fetch templates');
      const data = await res.json();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveTemplate = useCallback(async (template: VoyageTemplate): Promise<boolean> => {
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(template),
      });
      if (!res.ok) throw new Error();
      await fetchTemplates();
      return true;
    } catch {
      return false;
    }
  }, [fetchTemplates]);

  const deleteTemplate = useCallback(async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchTemplates();
      return true;
    } catch {
      return false;
    }
  }, [fetchTemplates]);

  return { templates, loading, saveTemplate, deleteTemplate, refetch: fetchTemplates };
}
