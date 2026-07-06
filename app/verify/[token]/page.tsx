// app/verify/[token]/page.tsx
// หน้าที่เปิดเมื่อ scan QR Code — แสดงข้อมูลทันที + ปุ่มแจกถ้า login อยู่

import { notFound } from 'next/navigation';
import { decodeOrderId, findOrderByPhone } from '@/lib/google-sheets';
import { createAdminSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';
import VerifyClient from './VerifyClient';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function VerifyPage({ params }: PageProps) {
  const { token } = await params;
  const decoded = decodeOrderId(token);
  if (!decoded) notFound();

  const order = await findOrderByPhone(decoded.phone);
  if (!order) notFound();

  // Check distribution status
  const supabase = await createAdminSupabase();
  const { data: distribution } = await supabase
    .from('distributions')
    .select('*, distributors!distributions_distributed_by_fkey(name)')
    .eq('phone', order.phone)
    .eq('cancelled', false)
    .single();

  // Check if viewer is logged in distributor
  const session = await getSession();
  let profile = null;
  if (session) {
    profile = await getDistributorProfile(session.user.id);
  }

  return (
    <VerifyClient
      order={order}
      distribution={distribution ?? null}
      canDistribute={!!profile}
      isAdmin={profile?.role === 'admin'}
      token={token}
    />
  );
}
