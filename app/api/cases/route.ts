import { NextResponse } from 'next/server';
import { z } from 'zod';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const createCaseSchema = z.object({
  caseTitle: z.string().min(5, 'Case title must have at least 5 characters'),
  divorceCategory: z.string().default('Mutual Consent (Section 13B)'),
  marriageDate: z.string().min(1, 'Marriage date is required'),
  marriagePlace: z.string().optional(),
  separationDate: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  presidingCourt: z.string().default('Principal Family Court, Hall 2'),
  notes: z.string().optional(),
  // Petitioner details
  petitionerName: z.string().min(2, 'Petitioner name is required'),
  petitionerGender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('MALE'),
  petitionerEmail: z.string().email().optional(),
  petitionerPhone: z.string().optional(),
  petitionerAddress: z.string().optional(),
  petitionerEmployment: z.string().optional(),
  petitionerIncome: z.coerce.number().min(0).default(0),
  // Respondent details
  respondentName: z.string().min(2, 'Respondent name is required'),
  respondentGender: z.enum(['MALE', 'FEMALE', 'OTHER']).default('FEMALE'),
  respondentEmail: z.string().email().optional(),
  respondentPhone: z.string().optional(),
  respondentAddress: z.string().optional(),
  respondentEmployment: z.string().optional(),
  respondentIncome: z.coerce.number().min(0).default(0),
  // Optional Lawyer assignment
  assignedLawyerId: z.string().optional(),
});

// GET: Retrieve divorce cases with role-based scoping and search filters
export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';

    let sql = `
      SELECT 
        c.id,
        c.reference_number,
        c.case_title,
        c.divorce_category,
        c.filing_date,
        c.marriage_date,
        c.marriage_place,
        c.separation_date,
        c.status,
        c.priority,
        c.presiding_court,
        c.resolution_date,
        c.notes,
        c.created_at,
        p_pet.full_name AS petitioner_name,
        p_pet.email AS petitioner_email,
        p_resp.full_name AS respondent_name,
        p_resp.email AS respondent_email,
        u_lawyer.full_name AS lead_lawyer_name,
        l.bar_registration_number AS lead_lawyer_bar,
        l.id AS lawyer_id
      FROM divorce_cases c
      LEFT JOIN case_parties p_pet ON c.id = p_pet.case_id AND p_pet.party_role = 'PETITIONER'
      LEFT JOIN case_parties p_resp ON c.id = p_resp.case_id AND p_resp.party_role = 'RESPONDENT'
      LEFT JOIN case_lawyers cl ON c.id = cl.case_id AND cl.is_lead_counsel = TRUE AND cl.is_active = TRUE
      LEFT JOIN lawyers l ON cl.lawyer_id = l.id
      LEFT JOIN users u_lawyer ON l.user_id = u_lawyer.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Role-based authorization scoping
    if (user.role === 'CLIENT') {
      params.push(user.clientId || 'none', user.email);
      sql += ` AND (p_pet.client_id = $${params.length - 1} OR p_resp.client_id = $${params.length - 1} OR LOWER(p_pet.email) = LOWER($${params.length}) OR LOWER(p_resp.email) = LOWER($${params.length}))`;
    } else if (user.role === 'LAWYER') {
      params.push(user.lawyerId || 'none');
      sql += ` AND EXISTS (SELECT 1 FROM case_lawyers cl2 WHERE cl2.case_id = c.id AND cl2.lawyer_id = $${params.length} AND cl2.is_active = TRUE)`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      sql += ` AND c.status = $${params.length}`;
    }

    if (priority && priority !== 'ALL') {
      params.push(priority);
      sql += ` AND c.priority = $${params.length}`;
    }

    if (search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (
        c.reference_number ILIKE $${params.length} OR 
        c.case_title ILIKE $${params.length} OR 
        p_pet.full_name ILIKE $${params.length} OR 
        p_resp.full_name ILIKE $${params.length}
      )`;
    }

    sql += ` ORDER BY c.created_at DESC;`;

    const res = await db.query(sql, params);
    return NextResponse.json({ cases: res.rows });
  } catch (error: any) {
    console.error('Fetch cases error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve divorce cases', message: error.message },
      { status: error.message.includes('UNAUTHORIZED') ? 401 : error.message.includes('FORBIDDEN') ? 403 : 500 }
    );
  }
}

// POST: Register a new divorce case using an ACID PostgreSQL Transaction
export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER', 'CLIENT']);
    const body = await request.json();
    const parsed = createCaseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const caseId = 'cas-' + Date.now().toString(36);
    const petId = 'pty-pet-' + Date.now().toString(36);
    const respId = 'pty-resp-' + Date.now().toString(36);
    const historyId = 'hsh-' + Date.now().toString(36);

    let assignedLawyerId = data.assignedLawyerId;
    if (user.role === 'LAWYER' && user.lawyerId) {
      assignedLawyerId = user.lawyerId;
    }

    // MULTI-STEP ATOMIC TRANSACTION
    const result = await db.transaction(async (tx) => {
      // 1. Generate sequential reference number via PostgreSQL function
      const refRes = await tx.query(`SELECT fn_generate_case_reference() AS ref_no;`);
      const refNumber = refRes.rows[0]?.ref_no || `DIV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Insert into divorce_cases
      await tx.query(
        `INSERT INTO divorce_cases (
          id, reference_number, case_title, divorce_category, filing_date,
          marriage_date, marriage_place, separation_date, status, priority,
          presiding_court, notes
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, 'REGISTERED', $8, $9, $10)`,
        [
          caseId,
          refNumber,
          data.caseTitle,
          data.divorceCategory,
          data.marriageDate,
          data.marriagePlace || null,
          data.separationDate || null,
          data.priority,
          data.presidingCourt,
          data.notes || null,
        ]
      );

      // 3. Insert Petitioner into case_parties
      await tx.query(
        `INSERT INTO case_parties (
          id, case_id, client_id, party_role, full_name, gender, email, phone_number,
          current_address, employment, monthly_income
        ) VALUES ($1, $2, $3, 'PETITIONER', $4, $5, $6, $7, $8, $9, $10)`,
        [
          petId,
          caseId,
          user.role === 'CLIENT' ? user.clientId : null,
          data.petitionerName,
          data.petitionerGender,
          data.petitionerEmail || null,
          data.petitionerPhone || null,
          data.petitionerAddress || null,
          data.petitionerEmployment || null,
          data.petitionerIncome,
        ]
      );

      // 4. Insert Respondent into case_parties
      await tx.query(
        `INSERT INTO case_parties (
          id, case_id, client_id, party_role, full_name, gender, email, phone_number,
          current_address, employment, monthly_income
        ) VALUES ($1, $2, NULL, 'RESPONDENT', $3, $4, $5, $6, $7, $8, $9)`,
        [
          respId,
          caseId,
          data.respondentName,
          data.respondentGender,
          data.respondentEmail || null,
          data.respondentPhone || null,
          data.respondentAddress || null,
          data.respondentEmployment || null,
          data.respondentIncome,
        ]
      );

      // 5. Assign Lawyer if selected
      if (assignedLawyerId) {
        const cslId = 'csl-' + Date.now().toString(36);
        await tx.query(
          `INSERT INTO case_lawyers (id, case_id, lawyer_id, representing_role, is_lead_counsel, is_active)
           VALUES ($1, $2, $3, 'PETITIONER', TRUE, TRUE)`,
          [cslId, caseId, assignedLawyerId]
        );
      }

      // 6. Record initial case status history
      await tx.query(
        `INSERT INTO case_status_history (id, case_id, previous_status, new_status, changed_by_user_id, reason)
         VALUES ($1, $2, NULL, 'REGISTERED', $3, 'Case officially registered into legal repository')`,
        [historyId, caseId, user.id]
      );

      return { caseId, refNumber };
    });

    // 7. Record initial activity in MongoDB Document Store
    await mongo.logActivity({
      caseId: result.caseId,
      referenceNumber: result.refNumber,
      eventType: 'CASE_REGISTERED',
      title: 'Divorce Case Registered',
      description: `Petition '${data.caseTitle}' filed under category '${data.divorceCategory}'.`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { priority: data.priority, court: data.presidingCourt },
    });

    return NextResponse.json({
      success: true,
      caseId: result.caseId,
      referenceNumber: result.refNumber,
      message: 'Divorce case registered successfully via atomic transaction.',
    });
  } catch (error: any) {
    console.error('Case registration transaction failed:', error);
    return NextResponse.json(
      { error: 'Transaction failed. All changes rolled back.', message: error.message },
      { status: 500 }
    );
  }
}
