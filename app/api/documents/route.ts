import { NextResponse } from 'next/server';
import db from '@/lib/db/postgres';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';
import { saveUploadedFile } from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    let docs = caseId 
      ? await mongo.getCaseDocuments(caseId, user.role)
      : await mongo.getAllDocuments();

    // Enforce role authorization if viewing all docs
    if (user.role === 'CLIENT') {
      // Find client's cases
      const clientCasesRes = await db.query(
        `SELECT DISTINCT case_id FROM case_parties 
         WHERE client_id = $1 OR LOWER(email) = LOWER($2)`,
        [user.clientId || 'none', user.email]
      );
      const authorizedCaseIds = new Set(clientCasesRes.rows.map(r => r.case_id));
      docs = docs.filter(d => authorizedCaseIds.has(d.caseId) && (!d.allowedRoles || d.allowedRoles.includes('CLIENT')));
    } else if (user.role === 'LAWYER') {
      const lawyerCasesRes = await db.query(
        `SELECT DISTINCT case_id FROM case_lawyers WHERE lawyer_id = $1 AND is_active = TRUE`,
        [user.lawyerId || 'none']
      );
      const authorizedCaseIds = new Set(lawyerCasesRes.rows.map(r => r.case_id));
      docs = docs.filter(d => authorizedCaseIds.has(d.caseId) && (!d.allowedRoles || d.allowedRoles.includes('LAWYER')));
    }

    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    console.error('Fetch documents error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve documents', message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER', 'CLIENT']);
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string;
    const title = formData.get('title') as string;
    const category = formData.get('category') as any;
    const description = (formData.get('description') as string) || '';
    const allowedRolesRaw = (formData.get('allowedRoles') as string) || 'ADMIN,LAWYER,CLIENT';

    if (!file || !caseId || !title || !category) {
      return NextResponse.json(
        { error: 'File, Case ID, Title, and Category are mandatory fields.' },
        { status: 400 }
      );
    }

    // Verify case existence
    const caseRes = await db.query('SELECT reference_number FROM divorce_cases WHERE id = $1', [caseId]);
    if (caseRes.rowCount === 0) {
      return NextResponse.json({ error: 'Referenced case does not exist.' }, { status: 404 });
    }
    const caseRef = caseRes.rows[0].reference_number;

    // 1. Save file locally using storage service
    const storedFile = await saveUploadedFile(file);

    const allowedRoles = allowedRolesRaw.split(',').map(r => r.trim()) as any[];

    // 2. Save document metadata in MongoDB
    const docMeta = await mongo.saveDocumentMetadata({
      caseId,
      title,
      category,
      fileName: storedFile.savedName,
      fileStoragePath: storedFile.storagePath,
      fileSizeBytes: storedFile.sizeBytes,
      mimeType: storedFile.mimeType,
      uploadedByUserId: user.id,
      uploaderName: user.fullName,
      uploaderRole: user.role,
      allowedRoles,
      description,
    });

    // 3. Log event to MongoDB Case Activity Timeline
    await mongo.logActivity({
      caseId,
      referenceNumber: caseRef,
      eventType: 'DOCUMENT_UPLOADED',
      title: `Document Uploaded: ${title}`,
      description: `Category: ${category}. File: ${storedFile.originalName} (${Math.round(storedFile.sizeBytes / 1024)} KB).`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
      metadata: { category, fileName: storedFile.originalName, fileSize: storedFile.sizeBytes },
    });

    return NextResponse.json({
      success: true,
      document: docMeta,
      message: 'Document saved and metadata indexed in MongoDB.',
    });
  } catch (error: any) {
    console.error('Document upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document', message: error.message },
      { status: 500 }
    );
  }
}
