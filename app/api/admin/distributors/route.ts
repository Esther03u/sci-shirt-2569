import { NextResponse } from 'next/server';
import { createServerSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, role } = body;

    if (!id || !['admin', 'distributor'].includes(role)) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Prevent removing admin from self (to avoid getting locked out)
    if (id === session.user.id && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot remove your own admin role' }, { status: 400 });
    }

    const supabase = await createServerSupabase();
    
    const { error } = await supabase
      .from('distributors')
      .update({ role })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Update role error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
