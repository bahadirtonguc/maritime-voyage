import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side Nominatim geocoding: resolves a port name → ISO 3166-1 alpha-2 country code.
 * Caches results in-memory so each unique port name is only looked up once per server session.
 */

// Module-level cache (persists across warm Lambda invocations)
const cache: Record<string, string> = {};

export async function GET(req: NextRequest) {
  const port = req.nextUrl.searchParams.get('port')?.trim();
  if (!port) return NextResponse.json({ code: '' });

  const key = port.toLowerCase();
  if (cache[key] !== undefined) {
    return NextResponse.json({ code: cache[key] });
  }

  try {
    // addressdetails=1 is required — without it, country_code is NOT included in the response.
    // The country code is nested under result[0].address.country_code
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(port)}&format=json&limit=1&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'maritime-voyage-app',
        'Accept-Language': 'en',
      },
      // 24-hour Next.js fetch cache so repeated cold starts avoid Nominatim
      next: { revalidate: 86400 },
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
