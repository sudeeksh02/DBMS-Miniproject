import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const scheduleHearingSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  assignedLawyerId: z.string().optional(),
  hearingDate: z.string().min(1, 'Hearing date and time are required'),
  courtRoom: z.string().default('Court Hall 3'),
  judgeName: z.string().default('Hon. Justice M. Rao'),
  hearingType: z.enum([
    'PRELIMINARY', 'MEDIATION_SESSION', 'EVIDENCE_PRESENTATION',
    'CROSS_EXAMINATION', 'FINAL_ARGUMENTS', 'JUDGMENT_PRONOUNCEMENT'
  ]).default('PRELIMINARY'),
  summaryNotes: z.string().optional(),
});

const updateOutcomeSchema = z.object({
  hearingId: z.string().min(1, 'Hearing ID is required'),
  outcome: z.enum([
    'SCHEDULED', 'ADJOURNED', 'SETTLEMENT_REACHED', 'ORDER_PASSED', 'DISMISSED', 'CONCLUDED'
  ]),
  summaryNotes: z.string().optional(),
  nextHearingDate: z.string().optional().nullable(),
});

// GET: Retrieve court hearings with filters
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');
    const outcome = searchParams.get('outcome');
    const upcomingOnly = searchParams.get('upcoming') === 'true';

    let sql = `
      SELECT 
        h.id,
        h.case_id,
        c.reference_number,
        c.case_title,
        c.status AS case_status,
        h.assigned_lawyer_id,
        u_lawyer.full_name AS lawyer_name,
        h.hearing_date,
        h.court_room,
        h.judge_name,
        h.hearing_type,
        h.outcome,
        h.summary_notes,
        h.next_hearing_date,
        h.created_at
      FROM hearings h
      JOIN divorce_cases c ON h.case_id = c.id
      LEFT JOIN lawyers l ON h.assigned_lawyer_id = l.id
      LEFT JOIN users u_lawyer ON l.user_id = u_lawyer.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Role-based filtering
    if (user.role === 'CLIENT') {
      params.push(user.clientId || 'none', user.email);
      sql += ` AND EXISTS (
        SELECT 1 FROM case_parties cp 
        WHERE cp.case_id = c.id 
          AND (cp.client_id = $${params.length - 1} OR LOWER(cp.email) = LOWER($${params.length}))
      )`;
    } else if (user.role === 'LAWYER') {
      params.push(user.lawyerId || 'none');
      sql += ` AND (h.assigned_lawyer_id = $${params.length} OR EXISTS (
        SELECT 1 FROM case_lawyers cl WHERE cl.case_id = c.id AND cl.lawyer_id = $${params.length} AND cl.is_active = TRUE
      ))`;
    }

    if (caseId) {
      params.push(caseId);
      sql += ` AND h.case_id = $${params.length}`;
    }

    if (outcome && outcome !== 'ALL') {
      params.push(outcome);
      sql += ` AND h.outcome = $${params.length}`;
    }

    if (upcomingOnly) {
      sql += ` AND h.hearing_date >= CURRENT_TIMESTAMP AND h.outcome = 'SCHEDULED'`;
    }

    sql += ` ORDER BY h.hearing_date ASC;`;

    const res = await db.query(sql, params);
    return NextResponse.json({ hearings: res.rows });
  } catch (error: any) {
    console.error('Fetch hearings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch court hearings', message: error.message },
      { status: 500 }
    );
  }
}

// POST: Schedule a new hearing with Lawyer Schedule Conflict Prevention
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const body = await request.json();
    const parsed = scheduleHearingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const hearingDate = new Date(data.hearingDate);

    // Validate that hearing is in future
    if (isNaN(hearingDate.getTime())) {
      return NextResponse.json({ error: 'Invalid hearing date format' }, { status: 400 });
    }

    // Determine lawyer to check
    let lawyerId = data.assignedLawyerId;
    if (!lawyerId) {
      // Find lead counsel for the case
      const counselRes = await db.query(
        `SELECT lawyer_id FROM case_lawyers WHERE case_id = $1 AND is_lead_counsel = TRUE AND is_active = TRUE LIMIT 1`,
        [data.caseId]
      );
      lawyerId = counselRes.rows[0]?.lawyer_id;
    }

    // ADVANCED DATABASE CHECK: LAWYER CONFLICT DETECTION
    // Prevent overlapping hearing times within a 2-hour window (7200 seconds) for the same counsel
    if (lawyerId) {
      const conflictSql = `
        SELECT 
          h.id,
          h.hearing_date,
          h.court_room,
          c.reference_number,
          c.case_title,
          u.full_name AS lawyer_name
        FROM hearings h
        JOIN divorce_cases c ON h.case_id = c.id
        JOIN lawyers l ON h.assigned_lawyer_id = l.id
        JOIN users u ON l.user_id = u.id
        WHERE h.assigned_lawyer_id = $1
          AND h.outcome = 'SCHEDULED'
          AND ABS(EXTRACT(EPOCH FROM (h.hearing_date - $2::timestamp with time zone))) < 7200
        LIMIT 1;
      `;

      const conflictRes = await db.query(conflictSql, [lawyerId, data.hearingDate]);
      if (conflictRes.rowCount > 0) {
        const conflict = conflictRes.rows[0];
        return NextResponse.json(
          {
            error: 'CONFLICTING_SCHEDULE: Lawyer already has a court appearance scheduled within this 2-hour window.',
            conflictingHearing: {
              caseReference: conflict.reference_number,
              caseTitle: conflict.case_title,
              time: conflict.hearing_date,
              courtRoom: conflict.court_room,
              lawyer: conflict.lawyer_name,
            },
          },
          { status: 409 }
        );
      }
    }

    const hearingId = 'hrg-' + Date.now().toString(36);

    // Insert hearing into PostgreSQL
    await db.query(
      `INSERT INTO hearings (
        id, case_id, assigned_lawyer_id, hearing_date, court_room, judge_name,
        hearing_type, outcome, summary_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'SCHEDULED', $8)`,
      [
        hearingId,
        data.caseId,
        lawyerId || null,
        data.hearingDate,
        data.courtRoom,
        data.judgeName,
        data.hearingType,
        data.summaryNotes || null,
      ]
    );

    // Update case status to 'HEARING_SCHEDULED' if currently earlier in lifecycle
    const caseRes = await db.query('SELECT reference_number, status FROM divorce_cases WHERE id = $1', [data.caseId]);
    const caseRef = caseRes.rows[0]?.reference_number || 'N/A';
    const curStatus = caseRes.rows[0]?.status;

    if (['REGISTERED', 'UNDER_REVIEW', 'DOCUMENTATION_PENDING'].includes(curStatus)) {
      await db.query(`UPDATE divorce_cases SET status = 'HEARING_SCHEDULED' WHERE id = $1`, [data.caseId]);
    }

    // Log event in MongoDB Activity Stream
    await mongo.logActivity({
      caseId: data.caseId,
      referenceNumber: caseRef,
      eventType: 'HEARING_SCHEDULED',
      title: `${data.hearingType.replace(/_/g, ' ')} Scheduled`,
      description: `Hearing fixed for ${new Date(data.hearingDate).toLocaleString()} in ${data.courtRoom} before ${data.judgeName}.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { courtRoom: data.courtRoom, judgeName: data.judgeName, type: data.hearingType },
    });

    return NextResponse.json({
      success: true,
      hearingId,
      message: 'Court hearing scheduled without advocate conflicts.',
    });
  } catch (error: any) {
    console.error('Schedule hearing error:', error);
    return NextResponse.json(
      { error: 'Failed to schedule hearing', message: error.message },
      { status: 500 }
    );
  }
}

// PATCH: Update Hearing Outcome and Next Court Date
export async function PATCH(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const body = await request.json();
    const parsed = updateOutcomeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { hearingId, outcome, summaryNotes, nextHearingDate } = parsed.data;

    const res = await db.query(
      `UPDATE hearings 
       SET outcome = $1, 
           summary_notes = COALESCE($2, summary_notes), 
           next_hearing_date = $3
       WHERE id = $4
       RETURNING *;`,
      [outcome, summaryNotes || null, nextHearingDate || null, hearingId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });
    }

    const hearing = res.rows[0];

    // Log to MongoDB
    await mongo.logActivity({
      caseId: hearing.case_id,
      referenceNumber: 'CASE',
      eventType: 'HEARING_SCHEDULED',
      title: `Hearing Outcome: ${outcome.replace(/_/g, ' ')}`,
      description: summaryNotes || `Court proceedings concluded with outcome: ${outcome}.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { outcome, nextHearingDate },
    });

    return NextResponse.json({
      success: true,
      hearing,
      message: 'Hearing outcome recorded successfully.',
    });
  } catch (error: any) {
    console.error('Update hearing outcome error:', error);
    return NextResponse.json(
      { error: 'Failed to update hearing outcome', message: error.message },
      { status: 500 }
    );
  }
}
