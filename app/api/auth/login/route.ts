import { NextRequest, NextResponse } from 'next/server';
import { CREDENTIALS, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { username, password } = body;

  if (username !== CREDENTIALS.username || password !== CREDENTIALS.password) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await signToken({ username, name: CREDENTIALS.name });

  const res = NextResponse.json({ ok: true, name: CREDENTIALS.name });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
  return res;
}
