// app/api/admin/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSession, getDistributorProfile, createAdminSupabase } from '@/lib/supabase-server';
import { AdminSettingSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const profile = await getDistributorProfile(session.user.id);
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const validation = AdminSettingSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }
    const { key, value } = validation.data;

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
