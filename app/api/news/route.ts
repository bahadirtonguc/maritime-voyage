import { NextResponse } from 'next/server';

export interface NewsItem { title: string; link: string }

/* ── In-process cache (15 min TTL) ──────────────────────────────── */
const cache = new Map<string, { items: NewsItem[]; expiresAt: number }>();
const TTL_MS = 15 * 60 * 1000;

const FEEDS: Record<string, string> = {
  dry:    'https://splash247.com/category/sector/dry-cargo/feed/',
  africa: 'https://maritimafrica.com/en/feed/',
};

function parseRss(xml: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Match each <item> block
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/g;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null && items.length < 10) {
    const block = m[1];
    // Title — handles plain text and CDATA
    const titleM = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/);
    // Link — plain <link> or atom:link href="..."
    const linkM  = block.match(/<link>(https?:\/\/[^\s<]+)<\/link>/) ??
                   block.match(/href="(https?:\/\/[^"]+)"/);
    const title = (titleM?.[1] ?? '').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
    const link  = (linkM?.[1] ?? '').trim();
    if (title && link) items.push({ title, link });
  }
  return items;
}

async function getFeed(key: string): Promise<NewsItem[]> {
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return cached.items;

  const url = FEEDS[key];
  if (!url) return [];

  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MaritimeVoyage/1.0)' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const xml   = await res.text();
  const items = parseRss(xml);
  cache.set(key, { items, expiresAt: Date.now() + TTL_MS });
  return items;
}

export async function GET(req: Request) {
  const feed = new URL(req.url).searchParams.get('feed') ?? 'dry';
  try {
    const items = await getFeed(feed);
    return NextResponse.json({ items }, {
      headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=60' },
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}
