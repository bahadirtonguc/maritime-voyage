import { NextResponse } from 'next/server';

export interface BdiIndex {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

/* ── 30-min in-process cache ────────────────────────────────────── */
const cache = new Map<string, { data: BdiIndex[]; expiresAt: number }>();
const TTL_MS = 30 * 60 * 1000;

const INDICES: { key: string; ticker: string }[] = [
  { key: 'BDI',  ticker: '%5EBDIY' },
  { key: 'BCI',  ticker: '%5EBCI'  },
  { key: 'BSI',  ticker: '%5EBSI'  },
  { key: 'BHSI', ticker: '%5EBHSI' },
];

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchOne(key: string, ticker: string): Promise<BdiIndex | null> {
  const url =
    `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}` +
    `?interval=1d&range=2d&includePrePost=false`;

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const json = await res.json();
    const meta  = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price      = meta.regularMarketPrice ?? 0;
    const prevClose  = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change     = price - prevClose;
    const changePct  = prevClose !== 0 ? (change / prevClose) * 100 : 0;

    return { symbol: key, price, change, changePercent: changePct };
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
    INDICES.map(({ key, ticker }) => fetchOne(key, ticker))
  );
  const data = results.filter(Boolean) as BdiIndex[];
  if (data.length > 0) {
    cache.set('bdi', { data, expiresAt: Date.now() + TTL_MS });
  }

  return NextResponse.json({ data }, {
    headers: { 'Cache-Control': 's-maxage=1800, stale-while-revalidate=60' },
  });
}
