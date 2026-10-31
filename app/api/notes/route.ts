import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const noteSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  noteTitle: z.string().min(2, 'Note title is required'),
  content: z.string().min(2, 'Note content is required'),
  importance: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  isPrivateToCounsel: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId parameter is required' }, { status: 400 });
    }

    const notes = await mongo.getCaseNotes(caseId, user.role !== 'CLIENT');
    return NextResponse.json({ notes });
  } catch (error: any) {
    console.error('Fetch notes error:', error);
    return NextResponse.json({ error: 'Failed to fetch notes', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth(['ADMIN', 'LAWYER']);
    const body = await request.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { caseId, noteTitle, content, importance, isPrivateToCounsel } = parsed.data;

    const note = await mongo.saveCaseNote({
      caseId,
      lawyerId: user.lawyerId || user.id,
      lawyerName: user.fullName,
      noteTitle,
      content,
      importance,
      isPrivateToCounsel,
    });

    await mongo.logActivity({
      caseId,
      referenceNumber: 'CASE',
      eventType: 'NOTE_ADDED',
      title: `Case Note Added: ${noteTitle}`,
      description: `Advocate ${user.fullName} recorded an internal case observation (${importance} importance).`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, note });
  } catch (error: any) {
    console.error('Save note error:', error);
    return NextResponse.json({ error: 'Failed to record case note', message: error.message }, { status: 500 });
  }
}
