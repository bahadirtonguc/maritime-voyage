import { NextRequest, NextResponse } from 'next/server';
import { getTemplates, saveTemplate } from '@/lib/storage';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

async function authenticate(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return NextResponse.json(getTemplates());
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const template = await req.json();
  saveTemplate(template);
  return NextResponse.json(template, { status: 201 });
}
