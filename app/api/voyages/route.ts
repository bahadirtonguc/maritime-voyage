import { NextRequest, NextResponse } from 'next/server';
import { getVoyages, saveVoyage } from '@/lib/storage';
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
  return NextResponse.json(await getVoyages());
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const voyage: Voyage = await req.json();
  await saveVoyage(voyage);
  return NextResponse.json(voyage, { status: 201 });
}
