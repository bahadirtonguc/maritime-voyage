'use client';

import { Sidebar } from './Sidebar';
import { useVoyages } from '@/hooks/useVoyages';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { voyages, loading } = useVoyages();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar voyages={voyages} loading={loading} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
