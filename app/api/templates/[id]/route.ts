import { NextRequest, NextResponse } from 'next/server';
import { deleteTemplate } from '@/lib/storage';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await deleteTemplate(params.id);
  return NextResponse.json({ ok: true });
}
