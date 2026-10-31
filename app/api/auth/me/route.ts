import { NextResponse } from 'next/server';
import { getCurrentUser, getUserProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 401 });
  }

  const profile = await getUserProfile(session.id);
  return NextResponse.json({
    authenticated: true,
    user: session,
    profile,
  });
}
