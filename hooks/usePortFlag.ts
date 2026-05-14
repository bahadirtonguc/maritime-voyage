'use client';

import { useState, useEffect } from 'react';

/**
 * Client-side cache so each port name is only fetched once per browser session.
 * Stored at module level — survives component re-mounts.
 */
const clientCache: Record<string, string> = {};

/**
 * Convert an ISO 3166-1 alpha-2 country code to its flag emoji.
 * e.g. "TR" → "🇹🇷"
 * Uses Regional Indicator Symbol letters starting at U+1F1E6 ('A').
 */
function toFlag(cc: string): string {
  if (!cc || cc.length !== 2) return '';
  const u = cc.toUpperCase();
  try {
    return String.fromCodePoint(
      0x1F1E6 + u.charCodeAt(0) - 65,
      0x1F1E6 + u.charCodeAt(1) - 65,
    );
  } catch {
    return '';
  }
}

/**
 * Returns the flag emoji for a given port name, resolved via /api/port-country
 * (which calls Nominatim OpenStreetMap geocoding API server-side).
 * Returns '' while loading or if the port is unknown.
 */
export function usePortFlag(portName: string): string {
  const key = (portName ?? '').trim().toLowerCase();
  const [flag, setFlag] = useState<string>(clientCache[key] ?? '');

  useEffect(() => {
    if (!key) return;

    // Already cached → apply immediately
    if (clientCache[key] !== undefined) {
      setFlag(clientCache[key]);
      return;
    }

    let cancelled = false;

    fetch(`/api/port-country?port=${encodeURIComponent(portName.trim())}`)
      .then((r) => r.json())
      .then(({ code }: { code: string }) => {
        const f = toFlag(code);
        clientCache[key] = f;
        if (!cancelled) setFlag(f);
      })
      .catch(() => {
        clientCache[key] = '';
      });

    return () => { cancelled = true; };
  }, [key, portName]);

  return flag;
}
