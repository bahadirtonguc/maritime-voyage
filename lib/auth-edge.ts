/**
 * Edge-runtime-safe auth helpers — only jose (no crypto, no Supabase).
 * Used by middleware.ts which runs in the Vercel Edge Runtime.
 */
import { jwtVerify } from 'jose/jwt/verify';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'maritime-voyage-secret-key-2024');
export const COOKIE_NAME = 'maritime_session';

export interface SessionUser {
  username: string;
  name: string;
  role: 'admin' | 'user';
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
