import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabase } from '@/lib/supabase-server';
import { RegisterSchema } from '@/lib/validations';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? '127.0.0.1';
  const { success: rateLimitSuccess } = rateLimit(ip, 5, 15 * 60 * 1000); // 5 attempts per 15 mins
  if (!rateLimitSuccess) {
    return NextResponse.json({ error: 'คุณทำรายการบ่อยเกินไป กรุณารอสักครู่' }, { status: 429 });
  }

  const body = await req.json();
  const validation = RegisterSchema.safeParse(body);
  
  if (!validation.success) {
    return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
  }

  const { name, email, password, registrationCode } = validation.data;

  const supabase = await createAdminSupabase();

  // Validate registration code
  const { data: setting } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'registration_code')
    .single();

  if (!setting || setting.value !== registrationCode) {
    return NextResponse.json({ error: 'รหัสลับไม่ถูกต้อง' }, { status: 403 });
  }

  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    const msg = authError.message.includes('already registered')
      ? 'อีเมลนี้ถูกใช้งานแล้ว'
      : 'เกิดข้อผิดพลาดในการสร้างบัญชี';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Create distributor profile
  const { error: profileError } = await supabase.from('distributors').insert({
    id: authData.user.id,
    name,
    email,
    role: 'distributor',
  });

  if (profileError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
