import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import db from './db/postgres';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'divorce-management-system-super-secure-academic-secret-key-2026'
);

const SESSION_COOKIE_NAME = 'dms_session_token';

export interface UserSession {
  id: string;
  email: string;
  role: 'ADMIN' | 'LAWYER' | 'CLIENT';
  fullName: string;
  lawyerId?: string | null;
  clientId?: string | null;
}

/**
 * Hash password securely with bcrypt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(plainText, salt);
}

/**
 * Verify password against bcrypt hash
 */
export async function verifyPassword(plainText: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hashed);
}

/**
 * Sign JWT token for user session
 */
export async function createSessionToken(user: UserSession): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

/**
 * Verify and decode JWT token
 */
export async function verifySessionToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

/**
 * Retrieve current user session from HTTP cookies (Server Components / API Routes)
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Server-Side Role-Based Authorization Guard
 * Throws or returns 401/403 if unauthorized
 */
export async function requireAuth(allowedRoles?: ('ADMIN' | 'LAWYER' | 'CLIENT')[]): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHORIZED: Authentication required to access this resource.');
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: Access restricted. Role '${user.role}' lacks necessary clearance.`);
  }

  return user;
}

/**
 * Fetch full user details with linked lawyer/client profiles from database
 */
export async function getUserProfile(userId: string) {
  const userRes = await db.query(
    `SELECT u.id, u.email, u.role, u.full_name, u.phone_number, u.is_active, u.created_at,
            l.id AS lawyer_id, l.bar_registration_number, l.specialization,
            c.id AS client_id, c.national_id
     FROM users u
     LEFT JOIN lawyers l ON u.id = l.user_id
     LEFT JOIN clients c ON u.id = c.user_id
     WHERE u.id = $1`,
    [userId]
  );
  return userRes.rows[0] || null;
}

export { SESSION_COOKIE_NAME };
