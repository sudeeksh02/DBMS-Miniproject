import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth, hashPassword } from '@/lib/auth';

const createLawyerSchema = z.object({
  fullName: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').default('Password123!'),
  phoneNumber: z.string().min(8, 'Phone number is required'),
  barRegistrationNumber: z.string().min(3, 'Bar registration number is required'),
  specialization: z.string().default('Matrimonial & Family Law'),
  yearsExperience: z.coerce.number().min(0).default(1),
  officeAddress: z.string().optional(),
  hourlyRate: z.coerce.number().min(0).default(2500),
  maxCaseCapacity: z.coerce.number().min(1).max(50).default(15),
});

export const dynamic = 'force-dynamic';

// GET: Retrieve all lawyers with workload metrics from SQL View v_lawyer_workload_metrics
export async function GET() {
  try {
    await requireAuth();

    const sql = `
      SELECT 
        l.id,
        l.user_id,
        l.bar_registration_number,
        l.specialization,
        l.years_experience,
        l.office_address,
        l.hourly_rate,
        l.max_case_capacity,
        u.full_name,
        u.email,
        u.phone_number,
        u.is_active,
        COALESCE(m.active_cases_count, 0) AS active_cases_count,
        COALESCE(m.capacity_utilization_pct, 0) AS capacity_utilization_pct,
        COALESCE(m.pending_hearings_count, 0) AS pending_hearings_count
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      LEFT JOIN v_lawyer_workload_metrics m ON l.id = m.lawyer_id
      ORDER BY u.full_name ASC;
    `;

    const res = await db.query(sql);
    return NextResponse.json({ lawyers: res.rows });
  } catch (error: any) {
    console.error('Fetch lawyers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lawyers', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Add new legal counsel (Admin only) using Atomic Transaction
export async function POST(request: Request) {
  try {
    const admin = await requireAuth(['ADMIN']);
    const body = await request.json();
    const parsed = createLawyerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique email and bar number
    const existing = await db.query(
      `SELECT u.email, l.bar_registration_number 
       FROM users u 
       LEFT JOIN lawyers l ON u.id = l.user_id 
       WHERE LOWER(u.email) = LOWER($1) OR l.bar_registration_number = $2`,
      [data.email, data.barRegistrationNumber]
    );

    if (existing.rowCount > 0) {
      return NextResponse.json(
        { error: 'A user with this email or bar registration number already exists.' },
        { status: 409 }
      );
    }

    const hashedPassword = await hashPassword(data.password);
    const userId = 'usr-law-' + Date.now().toString(36);
    const lawyerId = 'law-' + Date.now().toString(36);

    await db.transaction(async (tx) => {
      // 1. Insert User
      await tx.query(
        `INSERT INTO users (id, email, password_hash, role, full_name, phone_number, is_active)
         VALUES ($1, $2, $3, 'LAWYER', $4, $5, TRUE)`,
        [userId, data.email, hashedPassword, data.fullName, data.phoneNumber]
      );

      // 2. Insert Lawyer Profile
      await tx.query(
        `INSERT INTO lawyers (
          id, user_id, bar_registration_number, specialization,
          years_experience, office_address, hourly_rate, max_case_capacity
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          lawyerId,
          userId,
          data.barRegistrationNumber,
          data.specialization,
          data.yearsExperience,
          data.officeAddress || null,
          data.hourlyRate,
          data.maxCaseCapacity,
        ]
      );
    });

    // Audit log in MongoDB
    await mongo.logAuditEvent({
      userId: admin.id,
      userRole: 'ADMIN',
      action: 'LAWYER_REGISTERED',
      resource: 'LAWYERS',
      details: { lawyerId, name: data.fullName, barReg: data.barRegistrationNumber },
      status: 'SUCCESS',
    });

    return NextResponse.json({
      success: true,
      lawyerId,
      message: 'Legal counsel enrolled successfully.',
    });
  } catch (error: any) {
    console.error('Create lawyer error:', error);
    return NextResponse.json(
      { error: 'Failed to create lawyer', message: error.message },
      { status: 500 }
    );
  }
}
