import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'announcement_text')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching announcement:', error);
      return NextResponse.json({ announcement: null }, { status: 500 });
    }

    return NextResponse.json({ announcement: data?.value || '' });
  } catch (error) {
    console.error('Error in announcement API:', error);
    return NextResponse.json({ announcement: null }, { status: 500 });
  }
}
