// app/api/admin/orders/route.ts — Full order list for admin dashboard
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createServerSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = await createServerSupabase();

  const [
    { data: recipients },
    { data: distributions },
    { data: allDistributors }
  ] = await Promise.all([
    supabase.from('recipients').select('*'),
    supabase
      .from('distributions')
      .select('*, distributors!distributions_distributed_by_fkey(name)')
      .eq('cancelled', false),
    supabase
      .from('distributors')
      .select('id, name, email, role')
      .order('created_at', { ascending: true })
  ]);

  const orders = (recipients || []).map(r => ({
    phone: r.identifier,
    name: r.name,
    ...(r.metadata as any)
  }));

  const distMap = new Map(
    (distributions ?? []).map(d => [d.phone, d])
  );

  const enriched = orders.map(order => ({
    ...order,
    distribution: distMap.get(order.phone) ?? null,
  }));

  // Stats
  const total = orders.reduce((sum, order) => sum + (order.quantity || 1), 0);
  const distributed = enriched.reduce((sum, order) => order.distribution ? sum + (order.quantity || 1) : sum, 0);

  // Per-distributor stats
  const distributorStats: Record<string, { name: string; count: number; lastAt: string }> = {};
  enriched.forEach(o => {
    if (o.distribution) {
      const d = o.distribution as any;
      const id = d.distributed_by || 'unknown';
      const name = d.distributors?.name ?? 'ไม่ทราบ';
      if (!distributorStats[id]) distributorStats[id] = { name, count: 0, lastAt: '' };
      distributorStats[id].count += (o.quantity || 1);
      if (!distributorStats[id].lastAt || d.distributed_at > distributorStats[id].lastAt) {
        distributorStats[id].lastAt = d.distributed_at;
      }
    }
  });

  // Sort by latest distribution at the top, then by rowIndex
  enriched.sort((a, b) => {
    if (a.distribution && b.distribution) {
      return new Date((b.distribution as any).distributed_at).getTime() - new Date((a.distribution as any).distributed_at).getTime();
    }
    if (a.distribution && !b.distribution) return -1;
    if (!a.distribution && b.distribution) return 1;
    return (a.rowIndex || 0) - (b.rowIndex || 0);
  });

  return NextResponse.json({
    orders: enriched,
    stats: { total, distributed, remaining: total - distributed },
    distributorStats: Object.values(distributorStats),
    distributors: allDistributors ?? [],
  });
}

