import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME, getCurrentUser } from '@/lib/auth';
import mongo from '@/lib/db/mongodb';

export async function POST() {
  const user = await getCurrentUser();
  if (user) {
    await mongo.logAuditEvent({
      userId: user.id,
      userRole: user.role,
      action: 'LOGOUT',
      resource: 'AUTH',
      status: 'SUCCESS',
    });
  }

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.delete(SESSION_COOKIE_NAME);
  return response;
}
