import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const custodySchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  custodyType: z.enum([
    'SOLE_PETITIONER', 'SOLE_RESPONDENT', 'JOINT_LEGAL', 'SHARED_PHYSICAL', 'THIRD_PARTY_GUARDIAN'
  ]).default('JOINT_LEGAL'),
  numberOfChildren: z.coerce.number().min(1).default(1),
  childrenDetails: z.string().optional(),
  visitationSchedule: z.string().optional(),
  monthlySupportAmount: z.coerce.number().min(0).default(0),
  specialConditions: z.string().optional(),
  isAgreed: z.boolean().default(false),
});

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    let sql = `
      SELECT 
        ca.*,
        c.reference_number,
        c.case_title,
        c.status AS case_status
      FROM custody_arrangements ca
      JOIN divorce_cases c ON ca.case_id = c.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (caseId) {
      params.push(caseId);
      sql += ` AND ca.case_id = $${params.length}`;
    }

    sql += ` ORDER BY ca.created_at DESC;`;

    const res = await db.query(sql, params);
    return NextResponse.json({ arrangements: res.rows });
  } catch (error: any) {
    console.error('Fetch custody error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve custody arrangements', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const body = await request.json();
    const parsed = custodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const existing = await db.query('SELECT id FROM custody_arrangements WHERE case_id = $1', [data.caseId]);
    const custodyId = existing.rowCount > 0 ? existing.rows[0].id : 'cst-' + Date.now().toString(36);

    const caseRes = await db.query('SELECT reference_number FROM divorce_cases WHERE id = $1', [data.caseId]);
    const caseRef = caseRes.rows[0]?.reference_number || 'N/A';

    if (existing.rowCount > 0) {
      await db.query(
        `UPDATE custody_arrangements
         SET custody_type = $1,
             number_of_children = $2,
             children_details = $3,
             visitation_schedule = $4,
             monthly_support_amount = $5,
             special_conditions = $6,
             is_agreed = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          data.custodyType,
          data.numberOfChildren,
          data.childrenDetails || null,
          data.visitationSchedule || null,
          data.monthlySupportAmount,
          data.specialConditions || null,
          data.isAgreed,
          custodyId,
        ]
      );
    } else {
      await db.query(
        `INSERT INTO custody_arrangements (
          id, case_id, custody_type, number_of_children, children_details,
          visitation_schedule, monthly_support_amount, special_conditions, is_agreed
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          custodyId,
          data.caseId,
          data.custodyType,
          data.numberOfChildren,
          data.childrenDetails || null,
          data.visitationSchedule || null,
          data.monthlySupportAmount,
          data.specialConditions || null,
          data.isAgreed,
        ]
      );
    }

    // Log to MongoDB
    await mongo.logActivity({
      caseId: data.caseId,
      referenceNumber: caseRef,
      eventType: 'SETTLEMENT_UPDATED',
      title: 'Custody Terms Recorded',
      description: `Arrangement: ${data.custodyType.replace(/_/g, ' ')}. Children: ${data.numberOfChildren}. Monthly Support: ₹${Number(data.monthlySupportAmount).toLocaleString()}. Agreed: ${data.isAgreed ? 'Yes' : 'No'}.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { custodyType: data.custodyType, children: data.numberOfChildren, agreed: data.isAgreed },
    });

    return NextResponse.json({
      success: true,
      custodyId,
      message: 'Child custody terms saved successfully.',
    });
  } catch (error: any) {
    console.error('Save custody error:', error);
    return NextResponse.json(
      { error: 'Failed to record custody arrangement', message: error.message },
      { status: 500 }
    );
  }
}
