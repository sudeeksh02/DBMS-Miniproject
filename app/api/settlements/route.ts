import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const createSettlementSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  settlementType: z.enum([
    'LUMP_SUM', 'MONTHLY_ALIMONY', 'CHILD_SUPPORT', 'PROPERTY_DIVISION', 'HYBRID'
  ]).default('LUMP_SUM'),
  totalAgreedAmount: z.coerce.number().min(0).default(0),
  monthlyAlimony: z.coerce.number().min(0).default(0),
  alimonyTenureMonths: z.coerce.number().min(0).default(0),
  paymentStatus: z.enum(['PENDING', 'PARTIALLY_PAID', 'COMPLETED', 'DEFAULTED']).default('PENDING'),
  termsConditions: z.string().optional(),
  settlementDate: z.string().optional(),
});

// GET: Retrieve settlements with payment history and ledger stats
export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    let sql = `
      SELECT 
        s.*,
        c.reference_number,
        c.case_title,
        c.status AS case_status,
        COALESCE(SUM(p.amount_paid), 0) AS total_amount_paid,
        (s.total_agreed_amount - COALESCE(SUM(p.amount_paid), 0)) AS balance_outstanding,
        COUNT(p.id) AS payment_transactions_count
      FROM settlements s
      JOIN divorce_cases c ON s.case_id = c.id
      LEFT JOIN payments p ON s.id = p.settlement_id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (caseId) {
      params.push(caseId);
      sql += ` AND s.case_id = $${params.length}`;
    }

    sql += ` GROUP BY s.id, c.reference_number, c.case_title, c.status ORDER BY s.created_at DESC;`;

    const res = await db.query(sql, params);
    return NextResponse.json({ settlements: res.rows });
  } catch (error: any) {
    console.error('Fetch settlements error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve settlements', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Create or Update Settlement Terms
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const body = await request.json();
    const parsed = createSettlementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if settlement already exists for case
    const existing = await db.query('SELECT id FROM settlements WHERE case_id = $1', [data.caseId]);
    const settlementId = existing.rowCount > 0 ? existing.rows[0].id : 'stl-' + Date.now().toString(36);

    const caseRes = await db.query('SELECT reference_number FROM divorce_cases WHERE id = $1', [data.caseId]);
    const caseRef = caseRes.rows[0]?.reference_number || 'N/A';

    if (existing.rowCount > 0) {
      // Update
      await db.query(
        `UPDATE settlements
         SET settlement_type = $1,
             total_agreed_amount = $2,
             monthly_alimony = $3,
             alimony_tenure_months = $4,
             payment_status = $5,
             terms_conditions = $6,
             settlement_date = $7,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $8`,
        [
          data.settlementType,
          data.totalAgreedAmount,
          data.monthlyAlimony,
          data.alimonyTenureMonths,
          data.paymentStatus,
          data.termsConditions || null,
          data.settlementDate || null,
          settlementId,
        ]
      );
    } else {
      // Insert
      await db.query(
        `INSERT INTO settlements (
          id, case_id, settlement_type, total_agreed_amount, monthly_alimony,
          alimony_tenure_months, payment_status, terms_conditions, settlement_date
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          settlementId,
          data.caseId,
          data.settlementType,
          data.totalAgreedAmount,
          data.monthlyAlimony,
          data.alimonyTenureMonths,
          data.paymentStatus,
          data.termsConditions || null,
          data.settlementDate || null,
        ]
      );
    }

    // Log to MongoDB
    await mongo.logActivity({
      caseId: data.caseId,
      referenceNumber: caseRef,
      eventType: 'SETTLEMENT_UPDATED',
      title: 'Settlement Terms Formulated',
      description: `Agreed total: ₹${Number(data.totalAgreedAmount).toLocaleString()} (${data.settlementType}). Monthly alimony: ₹${Number(data.monthlyAlimony).toLocaleString()}.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { totalAmount: data.totalAgreedAmount, monthly: data.monthlyAlimony, status: data.paymentStatus },
    });

    return NextResponse.json({
      success: true,
      settlementId,
      message: 'Settlement terms recorded successfully.',
    });
  } catch (error: any) {
    console.error('Save settlement error:', error);
    return NextResponse.json(
      { error: 'Failed to record settlement terms', message: error.message },
      { status: 500 }
    );
  }
}
