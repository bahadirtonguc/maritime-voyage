import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { username, name, email, password } = await req.json();

  if (!username || !name || !password) {
    return NextResponse.json({ error: 'Username, name and password are required' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }

  const result = await registerUser({ username, name, email: email ?? '', password });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
