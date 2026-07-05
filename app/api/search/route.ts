// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findOrderByPhone } from '@/lib/google-sheets';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ error: 'กรุณาระบุเบอร์โทรศัพท์' }, { status: 400 });
  }

  try {
    const order = await findOrderByPhone(phone);
    if (!order) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการสั่งซื้อ' }, { status: 404 });
    }

    // Check distribution status from Supabase
    const supabase = await createAdminSupabase();
    const { data: dist } = await supabase
      .from('distributions')
      .select('*, distributors(name)')
      .eq('sheet_row_id', String(order.rowIndex))
      .eq('cancelled', false)
      .single();

    return NextResponse.json({
      order,
      distribution: dist ?? null,
    });
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });
  }
}
