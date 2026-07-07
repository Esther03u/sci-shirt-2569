// app/api/search/route.ts
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  // 1. Rate Limiting (15 requests per 15 mins by default)
  const ip = req.headers.get('x-forwarded-for') ?? req.ip ?? '127.0.0.1';
  const limitStatus = rateLimit(ip, 15);
  if (!limitStatus.success) {
    return NextResponse.json({ error: 'ค้นหาบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }

  const phone = req.nextUrl.searchParams.get('phone')?.trim();
  if (!phone) {
    return NextResponse.json({ error: 'กรุณาระบุเบอร์โทรศัพท์' }, { status: 400 });
  }

  try {
    const supabase = await createAdminSupabase();
    
    // Normalize phone for searching
    const normalized = phone.replace(/\D/g, '').replace(/^(66)/, '0');
    
    // 2. Fetch ONLY matched recipients instead of all (Performance & Security)
    const { data: recipients } = await supabase
      .from('recipients')
      .select('identifier, name, metadata')
      .or(`identifier.ilike.%${normalized}%,metadata->>phone.ilike.%${normalized}%,metadata->>searchPhones.ilike.%${normalized}%`)
      .limit(10);
      
    // Exact matching in JS to prevent partial matches like 08123 matching 0812345678
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

    // 3. Prevent Information Disclosure by returning ONLY needed fields
    const meta = matchedRecipient.metadata as any || {};
    const order = {
      phone: matchedRecipient.identifier,
      name: matchedRecipient.name,
      rowIndex: meta.rowIndex,
      displayId: meta.displayId,
      size: meta.size,
      quantity: meta.quantity,
      slipUrl: meta.slipUrl,
      supabaseSlipUrl: meta.supabaseSlipUrl,
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


