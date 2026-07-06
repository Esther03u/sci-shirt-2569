// app/api/distribute/stats/route.ts — Stats for logged-in distributor
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminSupabase, getSession } from '@/lib/supabase-server';
import { fetchSheetData } from '@/lib/google-sheets';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [supabase, orders] = await Promise.all([
    createAdminSupabase(),
    fetchSheetData()
  ]);

  const { data: allDists } = await supabase
    .from('distributions')
    .select('id, sheet_row_id, phone, distributed_at, distributed_by')
    .eq('cancelled', false)
    .order('distributed_at', { ascending: false });

  const dists = allDists ?? [];
  const validPhones = new Set(orders.map(o => o.phone));

  // Only count distributions that correspond to a valid order in the sheet
  const validDists = dists.filter(d => validPhones.has(d.phone));
  
  const myDists = validDists.filter(d => d.distributed_by === session.user.id);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const totalMine = myDists.length;
  const todayMine = myDists.filter(d => d.distributed_at >= todayStart).length;
  const recentFive = myDists.slice(0, 5);

  const totalAll = validDists.length;

  return NextResponse.json({
    myStats: { total: totalMine, today: todayMine },
    overall: { distributed: totalAll },
    recentFive,
  });
}
