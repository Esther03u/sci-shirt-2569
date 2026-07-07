// app/api/distribute/orders/route.ts
// Distributor: ดูออเดอร์ทั้งหมด + ค้นหาข้อมูล (คล้ายๆ admin)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const url = req.nextUrl;
  const filter = url.searchParams.get('filter') ?? 'all'; // all | distributed | pending
  const search = url.searchParams.get('search')?.toLowerCase().trim() ?? '';

  const supabase = await createServerSupabase();

  const [
    { data: recipients },
    { data: distributions }
  ] = await Promise.all([
    supabase.from('recipients').select('*'),
    supabase
      .from('distributions')
      .select('sheet_row_id, phone, distributed_at, distributors!distributions_distributed_by_fkey(name)')
      .eq('cancelled', false)
  ]);

  const orders = (recipients || []).map(r => ({
    phone: r.identifier,
    name: r.name,
    ...(r.metadata as any)
  }));

  const distMap = new Map(
    (distributions ?? []).map(d => [d.phone, d])
  );

  let enriched = orders.map(order => {
    return {
      rowIndex: order.rowIndex,
      displayId: order.displayId,
      name: order.name,
      phone: order.phone,
      searchPhones: order.searchPhones,
      size: order.size,
      quantity: order.quantity,
      branch: order.branch,
      slipUrl: order.slipUrl ?? null,
      supabaseSlipUrl: order.supabaseSlipUrl ?? null,
      distribution: distMap.get(order.phone) ?? null,
    };
  });

  const distributedCount = enriched.reduce((sum, o) => o.distribution !== null ? sum + (o.quantity || 1) : sum, 0);
  const totalCount = orders.reduce((sum, o) => sum + (o.quantity || 1), 0);

  // Filter by status
  if (filter === 'distributed') {
    enriched = enriched.filter(o => o.distribution !== null);
  } else if (filter === 'pending') {
    enriched = enriched.filter(o => o.distribution === null);
  }

  // Search by name or phone
  if (search) {
    enriched = enriched.filter(o =>
      (o.name || '').toLowerCase().includes(search) ||
      (o.searchPhones || '').includes(search)
    );
  }

  // Sort by latest distribution at the top
  enriched.sort((a, b) => {
    if (a.distribution && b.distribution) {
      return new Date(b.distribution.distributed_at).getTime() - new Date(a.distribution.distributed_at).getTime();
    }
    if (a.distribution && !b.distribution) return -1;
    if (!a.distribution && b.distribution) return 1;
    return (a.rowIndex || 0) - (b.rowIndex || 0);
  });

  return NextResponse.json({
    orders: enriched,
    total: totalCount,
    distributed: distributedCount,
  });
}
