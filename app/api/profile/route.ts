// app/api/profile/route.ts
import { NextResponse } from 'next/server';
import { getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null, { status: 401 });
  const profile = await getDistributorProfile(session.user.id);
  return NextResponse.json(profile);
}
