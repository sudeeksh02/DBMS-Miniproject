import { NextResponse } from 'next/server';
import { z } from 'zod';
import mongo from '@/lib/db/mongodb';
import { requireAuth } from '@/lib/auth';

const messageSchema = z.object({
  caseId: z.string().min(1, 'Case ID is required'),
  message: z.string().min(1, 'Message text cannot be empty'),
  recipientId: z.string().optional(),
  isConfidential: z.boolean().default(true),
});

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId parameter is required' }, { status: 400 });
    }

    const comms = await mongo.getCaseCommunications(caseId);
    return NextResponse.json({ communications: comms });
  } catch (error: any) {
    console.error('Fetch communications error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages', message: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const parsed = messageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten() }, { status: 400 });
    }

    const { caseId, message, recipientId, isConfidential } = parsed.data;

    const comm = await mongo.saveCommunication({
      caseId,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role,
      recipientId,
      message,
      isConfidential,
    });

    // Log communication event to activity timeline
    await mongo.logActivity({
      caseId,
      referenceNumber: 'CASE',
      eventType: 'COMMUNICATION_SENT',
      title: `Communication from ${user.fullName}`,
      description: `New message dispatched by ${user.role}: "${message.slice(0, 60)}${message.length > 60 ? '...' : ''}"`,
      actorId: user.id,
      actorName: user.fullName,
      actorRole: user.role,
    });

    return NextResponse.json({ success: true, communication: comm });
  } catch (error: any) {
    console.error('Save communication error:', error);
    return NextResponse.json({ error: 'Failed to send communication', message: error.message }, { status: 500 });
  }
}
