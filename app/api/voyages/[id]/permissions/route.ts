import { NextRequest, NextResponse } from 'next/server';
import {
  getVoyagePermissions,
  setVoyagePermission,
  removeVoyagePermission,
  VoyagePerm,
} from '@/lib/storage';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!);
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
  return user?.role === 'admin' ? user : null;
}

// GET — list all permissions for a voyage + all approved users (for the picker)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [perms, usersRes] = await Promise.all([
    getVoyagePermissions(params.id),
    getSupabase()
      .from('app_users')
      .select('username, name')
      .eq('status', 'approved')
      .neq('password_hash', 'HARDCODED_ADMIN')
      .order('name'),
  ]);

  return NextResponse.json({ permissions: perms, users: usersRes.data ?? [] });
}

// PUT — grant or update a permission
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { username, permission } = await req.json();
  if (!username || !['view', 'edit'].includes(permission)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  await setVoyagePermission(params.id, username, permission as VoyagePerm);
  return NextResponse.json({ ok: true });
}

// DELETE — revoke a permission
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { username } = await req.json();
  if (!username) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  await removeVoyagePermission(params.id, username);
  return NextResponse.json({ ok: true });
}
