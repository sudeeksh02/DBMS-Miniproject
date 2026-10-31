import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { hashPassword, createSessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must have at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  nationalId: z.string().optional(),
  address: z.string().optional(),
  occupation: z.string().optional(),
  annualIncome: z.coerce.number().min(0).optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fullName, email, password, phoneNumber, nationalId, address, occupation, annualIncome } = parsed.data;

    // Check if email already registered
    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(password);
    const userId = 'usr-cli-' + Date.now().toString(36);
    const clientId = 'cli-' + Date.now().toString(36);

    // ATOMIC TRANSACTION: Create User + Create Client Profile
    await db.transaction(async (tx) => {
      await tx.query(
        `INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_active)
         VALUES ($1, $2, $3, 'CLIENT', $4, $5, TRUE)`,
        [userId, email, hashedPassword, fullName, phoneNumber]
      );

      await tx.query(
        `INSERT INTO clients (id, user_id, national_id, address, occupation, annual_income)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [clientId, userId, nationalId || null, address || null, occupation || null, annualIncome || 0]
      );
    });

    // Audit log in MongoDB
    await mongo.logAuditEvent({
      userId,
      userRole: 'CLIENT',
      action: 'CLIENT_REGISTERED',
      resource: 'USERS',
      details: { email, fullName },
      status: 'SUCCESS',
    });

    const sessionPayload = {
      id: userId,
      email,
      role: 'CLIENT' as const,
      fullName,
      clientId,
      lawyerId: null,
    };

    const token = await createSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      user: sessionPayload,
      redirectUrl: '/client/dashboard',
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration', message: error.message },
      { status: 500 }
    );
  }
}
