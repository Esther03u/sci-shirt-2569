// app/api/admin/orders/route.ts — Full order list for admin dashboard
import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [orders, supabase] = await Promise.all([
    fetchSheetData(true),
    createAdminSupabase(),
  ]);

  const { data: distributions } = await supabase
    .from('distributions')
    .select('*, distributors(name)')
    .eq('cancelled', false);

  const distMap = new Map(
    (distributions ?? []).map(d => [d.sheet_row_id, d])
  );

  const enriched = orders.map(order => ({
    ...order,
    distribution: distMap.get(String(order.rowIndex)) ?? null,
  }));

  // Stats
  const total = orders.length;
  const distributed = enriched.filter(o => o.distribution).length;

  // Per-distributor stats
  const distributorStats: Record<string, { name: string; count: number; lastAt: string }> = {};
  (distributions ?? []).forEach(d => {
    const id = d.distributed_by;
    const name = (d.distributors as Record<string, string>)?.name ?? 'ไม่ทราบ';
    if (!distributorStats[id]) distributorStats[id] = { name, count: 0, lastAt: '' };
    distributorStats[id].count++;
    if (!distributorStats[id].lastAt || d.distributed_at > distributorStats[id].lastAt) {
      distributorStats[id].lastAt = d.distributed_at;
    }
  });

  return NextResponse.json({
    orders: enriched,
    stats: { total, distributed, remaining: total - distributed },
    distributorStats: Object.values(distributorStats),
  });
}
