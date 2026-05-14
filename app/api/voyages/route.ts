import { NextRequest, NextResponse } from 'next/server';
import { getVoyages, saveVoyage, getUserPermittedVoyageIds } from '@/lib/storage';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import type { Voyage } from '@/types';

async function authenticate(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const all = await getVoyages();

  // Admin sees everything
  if (user.role === 'admin') return NextResponse.json(all);

  // Regular users only see voyages they have explicit permission for
  const permittedIds = new Set(await getUserPermittedVoyageIds(user.username));
  return NextResponse.json(all.filter((v) => permittedIds.has(v.id)));
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only admins can create voyages
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const voyage: Voyage = await req.json();
  await saveVoyage(voyage);
  return NextResponse.json(voyage, { status: 201 });
}
