import { NextRequest, NextResponse } from 'next/server';
import portsData from '@/data/ports.json';

/**
 * Resolves a port name → ISO 3166-1 alpha-2 country code.
 *
 * Strategy (in order):
 *   1. In-memory cache (module-level, survives warm invocations)
 *   2. ports.json lookup — first two chars of UN/LOCODE are the ISO country code.
 *      e.g. "TRDCE" → "TR". This is authoritative and avoids Nominatim ambiguity
 *      (e.g. "Derince" exists in both Turkey and Northern Cyprus; "Aliaga" exists
 *      in both Turkey and Spain — Nominatim picks the wrong one).
 *   3. Nominatim OpenStreetMap geocoding as fallback for ports not in ports.json.
 */

interface PortEntry { id: string; name: string }

// Build name→country-code map from ports.json at module load time
const portJsonMap = new Map<string, string>();
for (const p of portsData as PortEntry[]) {
  if (p.id && p.id.length >= 2 && p.name) {
    portJsonMap.set(p.name.toLowerCase().trim(), p.id.slice(0, 2).toUpperCase());
  }
}

// Runtime cache for Nominatim results (and ports.json hits, to avoid map lookup on every request)
const cache: Record<string, string> = {};

export async function GET(req: NextRequest) {
  const port = req.nextUrl.searchParams.get('port')?.trim();
  if (!port) return NextResponse.json({ code: '' });

  const key = port.toLowerCase().trim();

  // 1. Cache hit
  if (cache[key] !== undefined) {
    return NextResponse.json({ code: cache[key] });
  }

  // 2. ports.json — authoritative, no network call, no ambiguity
  const fromJson = portJsonMap.get(key);
  if (fromJson) {
    cache[key] = fromJson;
    return NextResponse.json({ code: fromJson });
  }

  // 3. Nominatim fallback for ports not in our list
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(port)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'maritime-voyage-app',
        'Accept-Language': 'en',
      },
      next: { revalidate: 86400 }, // 24-hour Next.js fetch cache
    });

    if (!res.ok) {
      cache[key] = '';
      return NextResponse.json({ code: '' });
    }

    const data: Array<{ address?: { country_code?: string } }> = await res.json();
    const code = (data[0]?.address?.country_code ?? '').toUpperCase().slice(0, 2);
    cache[key] = code;
    return NextResponse.json({ code });
  } catch {
    cache[key] = '';
    return NextResponse.json({ code: '' });
  }
}
