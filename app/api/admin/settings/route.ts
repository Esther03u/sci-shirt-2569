// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getDistributorProfile(session.user.id);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { key, value } = await req.json();
    if (!key || value === undefined) return NextResponse.json({ error: 'Missing data' }, { status: 400 });

    const supabase = await createAdminSupabase();
    const { error } = await supabase
      .from('settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) {
      console.error('[Settings] Upsert error:', error);
      return NextResponse.json({ error: 'Failed to save', details: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[Settings] Fatal error:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message, stack: err.stack }, { status: 500 });
  }
}
