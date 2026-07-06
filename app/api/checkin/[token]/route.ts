// app/api/checkin/[token]/route.ts — QR token lookup + distribute action
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { decodeOrderId, findOrderByPhone } from '@/lib/google-sheets';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

// GET: decode token and return order + distribution status
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const decoded = decodeOrderId(token);
  if (!decoded) {
    return NextResponse.json({ error: 'QR Code ไม่ถูกต้อง' }, { status: 400 });
  }

  const order = await findOrderByPhone(decoded.phone);
  if (!order) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลการสั่งซื้อ' }, { status: 404 });
  }

  const supabase = await createAdminSupabase();
  const { data: dist } = await supabase
    .from('distributions')
    .select('*, distributors!distributions_distributed_by_fkey(name)')
    .eq('phone', order.phone)
    .eq('cancelled', false)
    .single();

  return NextResponse.json({ order, distribution: dist ?? null });
}

// POST: mark as distributed via QR token (admin/distributor action)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'ไม่พบข้อมูลผู้แจก' }, { status: 403 });

  const { token } = await params;
  const decoded = decodeOrderId(token);
  if (!decoded) {
    return NextResponse.json({ error: 'QR Code ไม่ถูกต้อง' }, { status: 400 });
  }

  const order = await findOrderByPhone(decoded.phone);
  if (!order) {
    return NextResponse.json({ error: 'ไม่พบข้อมูลการสั่งซื้อ' }, { status: 404 });
  }

  const supabase = await createAdminSupabase();

  // Check already distributed
  const { data: existing } = await supabase
    .from('distributions')
    .select('id')
    .eq('phone', order.phone)
    .eq('cancelled', false)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'ได้รับเสื้อแล้ว' }, { status: 409 });
  }

  const { data, error } = await supabase
    .from('distributions')
    .insert({
      sheet_row_id: String(order.rowIndex),
      phone: order.phone,
      distributed_by: session.user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 });
  }

  return NextResponse.json({ success: true, distribution: data });
}
