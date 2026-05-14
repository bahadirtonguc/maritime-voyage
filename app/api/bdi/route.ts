import { NextResponse } from 'next/server';

/**
 * Fetches Baltic Exchange freight indices from Stooq.
 * Yahoo Finance does NOT carry BDI/BSI/BHSI (proprietary Baltic Exchange data).
 * Stooq provides daily end-of-day values for these indices.
 *
 * Stooq symbols: bdi.i, bci.i, bsi.i, bhsi.i
 * Endpoint: https://stooq.com/q/l/?s=bdi.i&f=sd2t2ohlcv&h&e=json
 */

export interface BdiIndex {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

/* ── 30-min in-process cache ────────────────────────────────────── */
const cache = new Map<string, { data: BdiIndex[]; expiresAt: number }>();
const TTL_MS = 30 * 60 * 1000;

const INDICES: { label: string; stooqSymbol: string }[] = [
  { label: 'BDI',  stooqSymbol: 'bdi.i'  },
  { label: 'BCI',  stooqSymbol: 'bci.i'  },
  { label: 'BSI',  stooqSymbol: 'bsi.i'  },
  { label: 'BHSI', stooqSymbol: 'bhsi.i' },
];

async function fetchStooq(label: string, symbol: string): Promise<BdiIndex | null> {
  // Fetch last 2 days so we can compute daily change
  const url = `https://stooq.com/q/d/l/?s=${encodeURIComponent(symbol)}&i=d`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/plain,text/csv,*/*',
        'Referer': 'https://stooq.com/',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;

    // Stooq returns CSV: Date,Open,High,Low,Close,Volume
    const text = await res.text();
    const lines = text.trim().split('\n').filter(Boolean);
    if (lines.length < 2) return null; // Only header

    // Last line = most recent, second-to-last = previous day
    const parse = (line: string) => {
      const parts = line.split(',');
      return { date: parts[0], close: parseFloat(parts[4]) };
    };

    const latest = parse(lines[lines.length - 1]);
    const prev   = lines.length >= 3 ? parse(lines[lines.length - 2]) : null;

    if (!latest || isNaN(latest.close) || latest.close <= 0) return null;

    const prevClose = prev && !isNaN(prev.close) && prev.close > 0 ? prev.close : latest.close;
    const change    = latest.close - prevClose;
    const changePct = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return { symbol: label, price: latest.close, change, changePercent: changePct };
  } catch {
    return null;
  }
}

export async function GET() {
  const hit = cache.get('bdi');
  if (hit && Date.now() < hit.expiresAt) {
    return NextResponse.json({ data: hit.data }, {
      headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=60' },
    });
  }

  const results = await Promise.all(
    INDICES.map(({ label, stooqSymbol }) => fetchStooq(label, stooqSymbol)),
  );
  const data = results.filter(Boolean) as BdiIndex[];

  if (data.length > 0) {
    cache.set('bdi', { data, expiresAt: Date.now() + TTL_MS });
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=60' },
  });
}
