// app/api/distribute/stats/route.ts — Stats for logged-in distributor
import { NextResponse } from 'next/server';
import { createAdminSupabase, getSession } from '@/lib/supabase-server';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = await createAdminSupabase();

  // All distributions for this user (not cancelled)
  const { data: myDists } = await supabase
    .from('distributions')
    .select('id, sheet_row_id, phone, distributed_at')
    .eq('distributed_by', session.user.id)
    .eq('cancelled', false)
    .order('distributed_at', { ascending: false });

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

  const totalMine = myDists?.length ?? 0;
  const todayMine = myDists?.filter(d => d.distributed_at >= todayStart).length ?? 0;
  const recentFive = myDists?.slice(0, 5) ?? [];

  // Overall stats (all distributors)
  const { count: totalAll } = await supabase
    .from('distributions')
    .select('id', { count: 'exact', head: true })
    .eq('cancelled', false);

  return NextResponse.json({
    myStats: { total: totalMine, today: todayMine },
    overall: { distributed: totalAll ?? 0 },
    recentFive,
  });
}
