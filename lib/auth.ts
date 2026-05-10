import { SignJWT, jwtVerify } from 'jose';

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'maritime-voyage-secret-key-2024');
const COOKIE_NAME = 'maritime_session';

export const CREDENTIALS = {
  username: 'admin',
  password: 'voyage2024',
  name: 'Voyage Manager',
};

export async function signToken(payload: { username: string; name: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(SECRET);
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as { username: string; name: string };
  } catch {
    return null;
  }
}

export { COOKIE_NAME };
