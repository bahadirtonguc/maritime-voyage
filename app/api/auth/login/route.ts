import { NextRequest, NextResponse } from 'next/server';
import { tryLogin, signToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();
  const user = await tryLogin(username ?? '', password ?? '');

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials or account pending approval' }, { status: 401 });
  }

  const token = await signToken(user);
  const res = NextResponse.json({ ok: true, name: user.name, role: user.role });
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    sameSite: 'lax',
  });
  return res;
}
