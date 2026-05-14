'use client';

import { usePortFlag } from '@/hooks/usePortFlag';

/**
 * Renders the country flag emoji for a given port name.
 * Uses the usePortFlag hook internally so it can be placed inside .map() calls
 * (each item gets its own component instance, satisfying React's rules of hooks).
 *
 * The flag is followed by a non-breaking space if present, or renders nothing.
 */
export function PortFlagInline({ portName, className }: { portName: string; className?: string }) {
  const flag = usePortFlag(portName);
  if (!flag) return null;
  return (
    <span className={className} style={{ fontStyle: 'normal', textTransform: 'none' }}>
      {flag}{' '}
    </span>
  );
}
