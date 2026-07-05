// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (!key || !value) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

  const supabase = await createAdminSupabase();
  const { error } = await supabase
    .from('settings')
    .upsert({ key, value }, { onConflict: 'key' });

  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ success: true });
}
