import { NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createAdminSupabase();
    const { data, error } = await supabase
      .from('settings')
      .upsert({ key: 'test', value: '123' }, { onConflict: 'key' });
    
    return NextResponse.json({ data, error });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
