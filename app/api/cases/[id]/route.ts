import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const updateCaseSchema = z.object({
  status: z.enum([
    'REGISTERED', 'UNDER_REVIEW', 'DOCUMENTATION_PENDING', 'MEDIATION',
    'HEARING_SCHEDULED', 'SETTLEMENT_NEGOTIATION', 'AWAITING_FINAL_ORDER',
    'RESOLVED', 'CLOSED'
  ]).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  presidingCourt: z.string().optional(),
  notes: z.string().optional(),
  resolutionDate: z.string().optional(),
  statusChangeReason: z.string().optional(),
});

// GET: Comprehensive Single Case Profile with Relational and Document Models
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: caseId } = await params;

    // 1. Fetch Primary Case Record
    const caseRes = await db.query(
      `SELECT * FROM divorce_cases WHERE id = $1`,
      [caseId]
    );

    if (caseRes.rowCount === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const caseData = caseRes.rows[0];

    // 2. Fetch Case Parties
    const partiesRes = await db.query(
      `SELECT * FROM case_parties WHERE case_id = $1 ORDER BY party_role ASC`,
      [caseId]
    );

    // 3. Fetch Case Lawyers
    const lawyersRes = await db.query(
      `SELECT cl.*, l.bar_registration_number, l.specialization, l.office_address,
              u.full_name AS lawyer_name, u.email AS lawyer_email, u.phone_number AS lawyer_phone
       FROM case_lawyers cl
       JOIN lawyers l ON cl.lawyer_id = l.id
       JOIN users u ON l.user_id = u.id
       WHERE cl.case_id = $1 AND cl.is_active = TRUE`,
      [caseId]
    );

    // 4. Server-Side Security Clearance Validation
    if (user.role === 'CLIENT') {
      const isParty = partiesRes.rows.some(
        p => (p.client_id && p.client_id === user.clientId) || (p.email && p.email.toLowerCase() === user.email.toLowerCase())
      );
      if (!isParty) {
        return NextResponse.json(
          { error: 'FORBIDDEN: You do not have authorization to view this case.' },
          { status: 403 }
        );
      }
    } else if (user.role === 'LAWYER') {
      const isAssigned = lawyersRes.rows.some(l => l.lawyer_id === user.lawyerId);
      if (!isAssigned) {
        return NextResponse.json(
          { error: 'FORBIDDEN: You are not assigned to this case.' },
          { status: 403 }
        );
      }
    }

    // 5. Fetch Hearings
    const hearingsRes = await db.query(
      `SELECT h.*, u.full_name AS assigned_lawyer_name
       FROM hearings h
       LEFT JOIN lawyers l ON h.assigned_lawyer_id = l.id
       LEFT JOIN users u ON l.user_id = u.id
       WHERE h.case_id = $1
       ORDER BY h.hearing_date ASC`,
      [caseId]
    );

    // 6. Fetch Settlement & Payments
    const settlementRes = await db.query(
      `SELECT * FROM settlements WHERE case_id = $1`,
      [caseId]
    );
    const settlement = settlementRes.rows[0] || null;

    let payments: any[] = [];
    if (settlement) {
      const paymentsRes = await db.query(
        `SELECT * FROM payments WHERE settlement_id = $1 ORDER BY payment_date DESC`,
        [settlement.id]
      );
      payments = paymentsRes.rows;
    }

    // 7. Fetch Custody Arrangement
    const custodyRes = await db.query(
      `SELECT * FROM custody_arrangements WHERE case_id = $1`,
      [caseId]
    );
    const custody = custodyRes.rows[0] || null;

    // 8. Fetch Relational Status History (Trigger-maintained)
    const historyRes = await db.query(
      `SELECT h.*, u.full_name AS changed_by_name
       FROM case_status_history h
       LEFT JOIN users u ON h.changed_by_user_id = u.id
       WHERE h.case_id = $1
       ORDER BY h.changed_at DESC`,
      [caseId]
    );

    // 9. Fetch MongoDB Document Store Models (Activities, Docs, Notes, Comms)
    const [activities, documents, communications, notes] = await Promise.all([
      mongo.getCaseActivities(caseId),
      mongo.getCaseDocuments(caseId, user.role),
      mongo.getCaseCommunications(caseId),
      mongo.getCaseNotes(caseId, user.role !== 'CLIENT'),
    ]);

    return NextResponse.json({
      case: caseData,
      parties: partiesRes.rows,
      assignedLawyers: lawyersRes.rows,
      hearings: hearingsRes.rows,
      settlement,
      payments,
      custody,
      statusHistory: historyRes.rows,
      // Document store models
      activities,
      documents,
      communications,
      notes,
    });
  } catch (error: any) {
    console.error('Fetch case detail error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve case details', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update Case Status, Priority, or Resolution Date
// Automatically invokes PostgreSQL database triggers for audit logs
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const { id: caseId } = await params;
    const body = await request.json();
    const parsed = updateCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, priority, presidingCourt, notes, resolutionDate, statusChangeReason } = parsed.data;

    // Fetch existing case for reference and status comparison
    const existingRes = await db.query('SELECT * FROM divorce_cases WHERE id = $1', [caseId]);
    if (existingRes.rowCount === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    const currentCase = existingRes.rows[0];

    const updates: string[] = [];
    const values: any[] = [];

    if (status) {
      values.push(status);
      updates.push(`status = $${values.length}`);
    }
    if (priority) {
      values.push(priority);
      updates.push(`priority = $${values.length}`);
    }
    if (presidingCourt) {
      values.push(presidingCourt);
      updates.push(`presiding_court = $${values.length}`);
    }
    if (notes !== undefined) {
      values.push(notes);
      updates.push(`notes = $${values.length}`);
    }
    if (status === 'RESOLVED' || resolutionDate) {
      values.push(resolutionDate ? new Date(resolutionDate) : new Date());
      updates.push(`resolution_date = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ message: 'No fields to update' });
    }

    values.push(caseId);
    const updateSql = `
      UPDATE divorce_cases
      SET ${updates.join(', ')}
      WHERE id = $${values.length}
      RETURNING *;
    `;

    // Execute update in PostgreSQL (Triggers trg_case_status_audit and trg_cases_timestamp automatically execute)
    const updateRes = await db.query(updateSql, values);
    const updatedCase = updateRes.rows[0];

    // Log status transition into MongoDB activity stream
    if (status && status !== currentCase.status) {
      await mongo.logActivity({
        caseId,
        referenceNumber: currentCase.reference_number,
        eventType: 'STATUS_CHANGED',
        title: `Status Changed to ${status.replace(/_/g, ' ')}`,
        description: statusChangeReason || `Case status updated from ${currentCase.status} to ${status}.`,
        actorId: user.id,
        actorName: user.fullName,
        actorRole: user.role,
        metadata: { previousStatus: currentCase.status, newStatus: status, reason: statusChangeReason },
      });
    }

    return NextResponse.json({
      success: true,
      case: updatedCase,
      message: 'Case updated successfully. Status audit triggered.',
    });
  } catch (error: any) {
    console.error('Update case error:', error);
    return NextResponse.json(
      { error: 'Failed to update case', message: error.message },
      { status: 500 }
    );
  }
}
