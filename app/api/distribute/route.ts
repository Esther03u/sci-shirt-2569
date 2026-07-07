import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';
import { DistributePostSchema, DistributeDeleteSchema } from '@/lib/validations';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'ไม่พบข้อมูลผู้แจก' }, { status: 403 });

  const body = await req.json();
  const validation = DistributePostSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }
  const { sheetRowId, phone } = validation.data;

  const supabase = await createServerSupabase();

  // Check if already distributed
  const { data: existing } = await supabase
    .from('distributions')
    .select('id')
    .eq('phone', phone)
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

  const body = await req.json();
  const validation = DistributeDeleteSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }
  const { distributionId } = validation.data;
  const supabase = await createServerSupabase();

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
