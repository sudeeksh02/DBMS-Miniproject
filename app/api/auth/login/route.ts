import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { verifyPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Retrieve user and linked profiles from PostgreSQL
    const res = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.role, u.full_name, u.is_active,
              l.id AS lawyer_id, c.id AS client_id
       FROM users u
       LEFT JOIN lawyers l ON u.id = l.user_id
       LEFT JOIN clients c ON u.id = c.user_id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email]
    );

    const user = res.rows[0];

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is deactivated. Please contact the administrator.' },
        { status: 403 }
      );
    }

    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      // Audit log failed attempt
      await mongo.logAuditEvent({
        userId: user.id,
        userRole: user.role,
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        details: { email },
        status: 'FAILED',
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const sessionPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
      lawyerId: user.lawyer_id || null,
      clientId: user.client_id || null,
    };

    const token = await createSessionToken(sessionPayload);

    // Audit log successful authentication
    await mongo.logAuditEvent({
      userId: user.id,
      userRole: user.role,
      action: 'LOGIN_SUCCESS',
      resource: 'AUTH',
      details: { email },
      status: 'SUCCESS',
    });

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: user.role === 'ADMIN' ? '/admin/dashboard' : user.role === 'LAWYER' ? '/lawyer/dashboard' : '/client/dashboard',
    });

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication', message: error.message },
      { status: 500 }
    );
  }
}
