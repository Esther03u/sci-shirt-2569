// app/api/distribute/orders/route.ts
// Distributor: ????????????????????? + ??????????? (??????????? admin)
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: '????????????????' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: '?????????????????' }, { status: 403 });

  const url = req.nextUrl;
  const filter = url.searchParams.get('filter') ?? 'all'; // all | distributed | pending
  const search = url.searchParams.get('search')?.toLowerCase().trim() ?? '';

  const [orders, supabase] = await Promise.all([
    fetchSheetData(),
    createAdminSupabase(),
  ]);

  const { data: distributions } = await supabase
    .from('distributions')
    .select('sheet_row_id, phone, distributed_at, distributors!distributions_distributed_by_fkey(name)')
    .eq('cancelled', false);

  const distMap = new Map(
    (distributions ?? []).map(d => [d.phone, d])
  );

  let enriched = orders.map(order => ({
    rowIndex: order.rowIndex,
    displayId: order.displayId,
    name: order.name,
    phone: order.phone,
    size: order.size,
    quantity: order.quantity,
    slipUrl: order.slipUrl ?? null,
    distribution: distMap.get(order.phone) ?? null,
  }));

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
      o.name.toLowerCase().includes(search) ||
      o.phone.includes(search)
    );
  }

  return NextResponse.json({
    orders: enriched,
    total: totalCount,
    distributed: distributedCount,
  });
}
