import { SignJWT } from 'jose/jwt/sign';
import { jwtVerify } from 'jose/jwt/verify';
import { createClient } from '@supabase/supabase-js';
import { pbkdf2Sync, randomBytes } from 'crypto';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'maritime-voyage-secret-key-2024');
export const COOKIE_NAME = 'maritime_session';

// ── Hardcoded admin fallback (always works, cannot be changed) ──────────────
export const HARDCODED_ADMIN = {
  username: 'admin',
  password: 'voyage2024',
  name: 'Voyage Manager',
  role: 'admin' as const,
};

// ── Supabase client (server-only) ───────────────────────────────────────────
function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

// ── Password hashing (PBKDF2-SHA256) ────────────────────────────────────────
export function hashPassword(password: string, salt?: string): string {
  const s = salt ?? randomBytes(16).toString('hex');
  const hash = pbkdf2Sync(password, s, 100_000, 64, 'sha256').toString('hex');
  return `${s}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt] = stored.split(':');
  if (!salt) return false;
  return hashPassword(password, salt) === stored;
}

// ── JWT ─────────────────────────────────────────────────────────────────────
export interface SessionUser {
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export async function signToken(payload: SessionUser) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}

// ── Login ────────────────────────────────────────────────────────────────────
export async function tryLogin(
  username: string,
  password: string,
): Promise<SessionUser | null> {
  // 1. Hardcoded admin always works (bootstrap / recovery)
  if (
    username === HARDCODED_ADMIN.username &&
    password === HARDCODED_ADMIN.password
  ) {
    return { username: HARDCODED_ADMIN.username, name: HARDCODED_ADMIN.name, role: 'admin' };
  }

  // 2. Database users
  const supabase = getSupabase();
  const { data } = await supabase
    .from('app_users')
    .select('username, name, role, status, password_hash')
    .eq('username', username.toLowerCase())
    .single();

  if (!data) return null;
  if (data.status !== 'approved') return null;  // pending / rejected
  if (data.password_hash === 'HARDCODED_ADMIN') return null; // sentinel row, use hardcoded path
  if (!verifyPassword(password, data.password_hash)) return null;

  return { username: data.username, name: data.name, role: data.role };
}

// ── Registration ─────────────────────────────────────────────────────────────
export async function registerUser(fields: {
  username: string;
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string }> {
  const supabase = getSupabase();

  // Block reserved username
  if (fields.username.toLowerCase() === HARDCODED_ADMIN.username) {
    return { ok: false, error: 'Username not available' };
  }

  const hash = hashPassword(fields.password);
  const { error } = await supabase.from('app_users').insert({
    username: fields.username.toLowerCase(),
    name: fields.name,
    email: fields.email,
    password_hash: hash,
    role: 'user',
    status: 'pending',
  });

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Username already taken' };
    return { ok: false, error: 'Registration failed' };
  }
  return { ok: true };
}
