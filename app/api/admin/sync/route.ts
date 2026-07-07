import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';
import { createServerSupabase, getSession, getDistributorProfile } from '@/lib/supabase-server';

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const profile = await getDistributorProfile(session.user.id);
  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const orders = await fetchSheetData();
    const supabase = await createServerSupabase();

    // Fetch existing to preserve supabaseSlipUrl
    const { data: existingData } = await supabase.from('recipients').select('identifier, metadata');
    const existingMap = new Map((existingData || []).map(r => [r.identifier, r]));

    const recipients = orders.map(o => {
      const existing = existingMap.get(o.phone);
      return {
        identifier: o.phone,
        name: o.name,
        metadata: {
          rowIndex: o.rowIndex,
          displayId: o.displayId,
          timestamp: o.timestamp,
          size: o.size,
          quantity: o.quantity,
          color: o.color,
          note: o.note,
          searchPhones: o.searchPhones,
          slipUrl: o.slipUrl,
          branch: o.branch,
          supabaseSlipUrl: existing?.metadata?.supabaseSlipUrl || null,
        }
      };
    });

    // Deduplicate by identifier to prevent Postgres ON CONFLICT error
    const uniqueRecipientsMap = new Map();
    for (const r of recipients) {
      uniqueRecipientsMap.set(r.identifier, r);
    }
    const uniqueRecipients = Array.from(uniqueRecipientsMap.values());

    // Upsert into Supabase (will update existing or insert new based on identifier=phone)
    const { error } = await supabase
      .from('recipients')
      .upsert(uniqueRecipients, { onConflict: 'identifier' });

    if (error) {
      console.error('[sync] Supabase upsert error:', error);
      return NextResponse.json({ error: 'Failed to save to database' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: uniqueRecipients.length });
  } catch (error) {
    console.error('[sync] Fetch sheet data error:', error);
    return NextResponse.json({ error: 'Failed to fetch from Google Sheets' }, { status: 500 });
  }
}
