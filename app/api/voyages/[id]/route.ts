import { NextRequest, NextResponse } from 'next/server';
import { getVoyage, saveVoyage, deleteVoyage } from '@/lib/storage';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const voyage = getVoyage(params.id);
  if (!voyage) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(voyage);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const voyage = await req.json();
  voyage.id = params.id;
  saveVoyage(voyage);
  return NextResponse.json(voyage);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  deleteVoyage(params.id);
  return NextResponse.json({ ok: true });
}
