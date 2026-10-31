import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const recordPaymentSchema = z.object({
  settlementId: z.string().min(1, 'Settlement ID is required'),
  amountPaid: z.coerce.number().positive('Payment amount must be greater than zero'),
  paymentMethod: z.string().default('Bank Transfer'),
  transactionReference: z.string().min(3, 'Transaction reference is required'),
  receiptNotes: z.string().optional(),
});

// POST: Record payment with automated settlement status recalculation
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER', 'CLIENT']);
    const body = await request.json();
    const parsed = recordPaymentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { settlementId, amountPaid, paymentMethod, transactionReference, receiptNotes } = parsed.data;

    // Check unique transaction reference
    const dupCheck = await db.query(
      'SELECT id FROM payments WHERE transaction_reference = $1',
      [transactionReference]
    );
    if (dupCheck.rowCount > 0) {
      return NextResponse.json(
        { error: 'A payment with this transaction reference already exists.' },
        { status: 409 }
      );
    }

    const paymentId = 'pay-' + Date.now().toString(36);

    // ATOMIC TRANSACTION: Insert payment and update settlement payment status
    const result = await db.transaction(async (tx) => {
      // 1. Insert Payment
      await tx.query(
        `INSERT INTO payments (
          id, settlement_id, amount_paid, payment_date, payment_method,
          transaction_reference, receipt_notes
        ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, $6)`,
        [paymentId, settlementId, amountPaid, paymentMethod, transactionReference, receiptNotes || null]
      );

      // 2. Fetch settlement details & compute aggregate sum of all payments
      const stlRes = await tx.query(
        `SELECT s.id, s.case_id, s.total_agreed_amount, c.reference_number,
                COALESCE(SUM(p.amount_paid), 0) AS new_total_paid
         FROM settlements s
         JOIN divorce_cases c ON s.case_id = c.id
         LEFT JOIN payments p ON s.id = p.settlement_id
         WHERE s.id = $1
         GROUP BY s.id, s.case_id, s.total_agreed_amount, c.reference_number`,
        [settlementId]
      );

      const stl = stlRes.rows[0];
      if (!stl) {
        throw new Error('Settlement record not found');
      }

      const totalAgreed = Number(stl.total_agreed_amount);
      const totalPaid = Number(stl.new_total_paid);

      let newStatus = 'PARTIALLY_PAID';
      if (totalAgreed > 0 && totalPaid >= totalAgreed) {
        newStatus = 'COMPLETED';
      }

      // 3. Update Settlement status
      await tx.query(
        `UPDATE settlements SET payment_status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [newStatus, settlementId]
      );

      return {
        paymentId,
        caseId: stl.case_id,
        caseRef: stl.reference_number,
        newStatus,
        totalPaid,
        totalAgreed,
      };
    });

    // 4. Log to MongoDB Activity Stream
    await mongo.logActivity({
      caseId: result.caseId,
      referenceNumber: result.caseRef,
      eventType: 'SETTLEMENT_UPDATED',
      title: `Payment Recorded: ₹${amountPaid.toLocaleString()}`,
      description: `Payment of ₹${amountPaid.toLocaleString()} recorded via ${paymentMethod} (Ref: ${transactionReference}). New Status: ${result.newStatus}.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: {
        paymentId: result.paymentId,
        amount: amountPaid,
        status: result.newStatus,
        totalPaid: result.totalPaid,
      },
    });

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      newStatus: result.newStatus,
      totalPaid: result.totalPaid,
      message: 'Payment recorded and financial status updated.',
    });
  } catch (error: any) {
    console.error('Record payment error:', error);
    return NextResponse.json(
      { error: 'Failed to record payment', message: error.message },
      { status: 500 }
    );
  }
}
