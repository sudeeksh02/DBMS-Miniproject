import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth, hashPassword } from '@/lib/auth';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'LAWYER', 'CLIENT']),
  phoneNumber: z.string().optional(),
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAuth(['ADMIN']);

    const res = await db.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.full_name,
        u.phone_number,
        u.is_active,
        u.created_at,
        l.bar_registration_number,
        l.specialization,
        c.national_id
      FROM users u
      LEFT JOIN lawyers l ON u.id = l.user_id
      LEFT JOIN clients c ON u.id = c.user_id
      ORDER BY u.created_at DESC;
    `);

    return NextResponse.json({ users: res.rows });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users', message: error.message },
      { status: 403 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAuth(['ADMIN']);
    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { email, password, fullName, role, phoneNumber } = parsed.data;

    const existing = await db.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    if (existing.rowCount > 0) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    const userId = `usr-${role.toLowerCase()}-${Date.now().toString(36)}`;

    await db.query(
      `INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
      [userId, email, hashedPassword, role, fullName, phoneNumber || null]
    );

    // If client, create client entry
    if (role === 'CLIENT') {
      const clientId = 'cli-' + Date.now().toString(36);
      await db.query(
        `INSERT INTO clients (id, user_id, annual_income) VALUES ($1, $2, 0)`,
        [clientId, userId]
      );
    }

    await mongo.logAuditEvent({
      userId: admin.id,
      userRole: 'ADMIN',
      action: 'USER_CREATED',
      resource: 'USERS',
      details: { createdUserId: userId, email, role },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, userId, message: 'User account created.' });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user', message: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAuth(['ADMIN']);
    const { userId, isActive, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (isActive !== undefined) {
      values.push(isActive);
      updates.push(`is_active = $${values.length}`);
    }
    if (role) {
      values.push(role);
      updates.push(`role = $${values.length}`);
    }

    if (updates.length > 0) {
      values.push(userId);
      await db.query(
        `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length}`,
        values
      );
    }

    await mongo.logAuditEvent({
      userId: admin.id,
      userRole: 'ADMIN',
      action: 'USER_UPDATED',
      resource: 'USERS',
      details: { targetUserId: userId, isActive, role },
      status: 'SUCCESS',
    });

    return NextResponse.json({ success: true, message: 'User updated successfully.' });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Failed to update user', message: error.message }, { status: 500 });
  }
}
