// app/api/distribute/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'ไม่พบข้อมูลผู้แจก' }, { status: 403 });

  const { sheetRowId, phone } = await req.json();
  if (!sheetRowId) return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 });

  const supabase = await createAdminSupabase();

  // Check if already distributed
  const { data: existing } = await supabase
    .from('distributions')
    .select('id')
    .eq('sheet_row_id', String(sheetRowId))
    .eq('cancelled', false)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'ได้รับเสื้อแล้ว' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('distributions')
    .insert({
      sheet_row_id: String(sheetRowId),
      phone,
      distributed_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Distribute error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }

  return NextResponse.json({ success: true, distribution: data });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'เฉพาะ Admin เท่านั้น' }, { status: 403 });
  }

  const { distributionId } = await req.json();
  const supabase = await createAdminSupabase();

  const { error } = await supabase
    .from('distributions')
    .update({
      cancelled: true,
      cancelled_by: session.user.id,
      cancelled_at: new Date().toISOString(),
    })
    .eq('id', distributionId);

  if (error) return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  return NextResponse.json({ success: true });
}
