/**
 * Derives a country flag emoji from a port name by looking up the port's
 * UN/LOCODE in ports.json. The first two characters of a LOCODE are the
 * ISO 3166-1 alpha-2 country code (e.g. "NLRTM" → "NL" → 🇳🇱).
 *
 * Lookup is case-insensitive so it works for both "Rotterdam" and "ROTTERDAM".
 */

import portsData from '@/data/ports.json';

interface PortEntry { id: string; name: string }

// Build lookup once at module load
const _nameToCode = new Map<string, string>();
for (const p of portsData as PortEntry[]) {
  if (p.id && p.id.length >= 2) {
    _nameToCode.set(p.name.toLowerCase(), p.id.slice(0, 2).toUpperCase());
  }
}

/** Convert ISO 3166-1 alpha-2 code to flag emoji (e.g. "TR" → "🇹🇷"). */
export function flagEmoji(code: string): string {
  if (!code || code.length !== 2) return '';
  const u = code.toUpperCase();
  try {
    return String.fromCodePoint(
      0x1F1E6 + u.charCodeAt(0) - 65,
      0x1F1E6 + u.charCodeAt(1) - 65,
    );
  } catch {
    return '';
  }
}

/** Returns the flag emoji for a port given its display name. Returns '' if unknown. */
export function portFlag(portName: string): string {
  if (!portName) return '';
  return flagEmoji(_nameToCode.get(portName.toLowerCase().trim()) ?? '');
}
