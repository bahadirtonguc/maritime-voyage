import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyToken, COOKIE_NAME } from '@/lib/auth';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

async function requireAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const user = token ? await verifyToken(token) : null;
  if (!user || user.role !== 'admin') return null;
  return user;
}

// GET /api/admin/users — list all non-hardcoded users
export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('app_users')
    .select('id, username, name, email, role, status, created_at')
    .neq('password_hash', 'HARDCODED_ADMIN')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  return NextResponse.json({ users: data ?? [] });
}

// PATCH /api/admin/users — approve or reject a user
export async function PATCH(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, status } = await req.json();
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { error } = await supabase
    .from('app_users')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users — delete a user
export async function DELETE(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const supabase = getSupabase();
  const { error } = await supabase.from('app_users').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'DB error' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
