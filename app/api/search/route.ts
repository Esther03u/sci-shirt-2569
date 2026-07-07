// app/api/search/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ error: 'กรุณาระบุเบอร์โทรศัพท์' }, { status: 400 });
  }

  try {
    const supabase = await createServerSupabase();
    
    // Fetch all recipients and filter in JS for robust search matching
    const { data: recipients } = await supabase.from('recipients').select('*');
    
    const normalized = phone.replace(/\D/g, '').replace(/^(66)/, '0');
    
    const matchedRecipient = (recipients || []).find(rec => {
      const identifier = String(rec.identifier || '');
      const phoneInMeta = String((rec.metadata as any)?.phone || '');
      const sp = String((rec.metadata as any)?.searchPhones || '');
      
      const allPhones = [identifier, phoneInMeta, ...sp.split(',')]
        .map(p => p.replace(/\D/g, '').replace(/^(66)/, '0'))
        .filter(Boolean);
        
      return allPhones.includes(normalized);
    });

    if (!matchedRecipient) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลการสั่งซื้อ' }, { status: 404 });
    }

    const order = {
      phone: matchedRecipient.identifier,
      name: matchedRecipient.name,
      ...(matchedRecipient.metadata as any)
    };

    // Check distribution status from Supabase
    const { data: dist } = await supabase
      .from('distributions')
      .select('*, distributors!distributions_distributed_by_fkey(name)')
      .eq('phone', order.phone)
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

