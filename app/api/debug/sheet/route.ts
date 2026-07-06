// app/api/debug/sheet/route.ts
// TEMPORARY DEBUG ENDPOINT - DELETE AFTER FIXING
import { NextResponse } from 'next/server';
import { fetchSheetData } from '@/lib/google-sheets';

export async function GET() {
  try {
    const orders = await fetchSheetData(true); // force refresh
    if (orders.length === 0) {
      return NextResponse.json({ 
        error: 'No data fetched - sheet may not be public or CSV URL is wrong',
        orders: []
      });
    }
    return NextResponse.json({
      total: orders.length,
      // Show first 3 orders with all keys
      sample: orders.slice(0, 3).map(o => ({
        rowIndex: o.rowIndex,
        phone: o.phone,
        name: o.name,
        allKeys: Object.keys(o),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
