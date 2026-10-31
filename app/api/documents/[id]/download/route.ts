import { NextResponse } from 'next/server';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';
import { getFileBuffer } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: docId } = await params;

    const allDocs = await mongo.getAllDocuments();
    const doc = allDocs.find(d => String(d._id) === docId || d.fileName === docId);

    if (!doc) {
      return NextResponse.json({ error: 'Document metadata not found' }, { status: 404 });
    }

    // Role check
    if (user.role !== 'ADMIN' && doc.allowedRoles && !doc.allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Access denied for this document' }, { status: 403 });
    }

    const fileData = getFileBuffer(doc.fileStoragePath);
    if (!fileData) {
      return NextResponse.json({ error: 'Underlying file is not present on disk' }, { status: 404 });
    }

    return new Response(fileData.buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Content-Length': fileData.buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Download document error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve document file', message: error.message },
      { status: 500 }
    );
  }
}
