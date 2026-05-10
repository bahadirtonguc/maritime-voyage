'use client';

import { useState, useMemo } from 'react';
import portsData from '@/data/ports.json';
import type { Port } from '@/types';

const PORTS: Port[] = portsData as Port[];

export function usePortSearch() {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return PORTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.country.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [query]);

  const getPort = (id: string) => PORTS.find((p) => p.id === id);
  const getPortByName = (name: string) => PORTS.find((p) => p.name === name);

  return { query, setQuery, results, getPort, getPortByName, allPorts: PORTS };
}
