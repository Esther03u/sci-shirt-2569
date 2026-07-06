// lib/google-sheets.ts
// Fetches data from Google Sheets via public CSV export (no auth required for public sheets)
// Falls back to API with service account if available

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1Lbc8y8Te4YplBJNFPcJdQvxBB0hY2fvus51QS3uVwlg';

export interface ShirtOrder {
  rowIndex: number;
  displayId: string;
  timestamp: string;
  phone: string;
  name: string;
  size: string;
  quantity: number;
  color?: string;
  note?: string;
  slipUrl?: string;
  [key: string]: string | number | undefined;
}

export async function fetchSheetData(forceRefresh = true): Promise<ShirtOrder[]> {
  // Try multiple gid values — Google Form responses may be on gid=0, 1, or 2
  // Also try without gid (exports first sheet by default)
  const gidsToTry = ['1257582283', '0', '1', '2', ''];
  let lastError: unknown;

  for (const gid of gidsToTry) {
    try {
      const gidParam = gid ? `&gid=${gid}` : '';
      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv${gidParam}`;

      // Use Next.js fetch caching instead of in-memory cache
      const res = await fetch(csvUrl, {
        next: { revalidate: forceRefresh ? 0 : 300 }
      });

      if (!res.ok) {
        console.warn(`[sheets] gid=${gid} failed with status ${res.status}`);
        continue;
      }

      const csv = await res.text();
      // Sanity check: must have at least 2 lines (header + 1 row)
      const lines = csv.split('\n').filter(l => l.trim());
      if (lines.length < 2) {
        console.warn(`[sheets] gid=${gid} returned empty/header-only CSV (${lines.length} lines)`);
        continue;
      }

      const orders = parseCsv(csv);
      if (orders.length === 0) {
        console.warn(`[sheets] gid=${gid} parsed 0 orders (phone column not found?)`);
      }

      return orders;
    } catch (err) {
      lastError = err;
      console.warn(`[sheets] Error trying gid=${gid}:`, err);
    }
  }

  console.error('[sheets] All gid attempts failed. Last error:', lastError);
  return [];
}

function parseCsv(csv: string): ShirtOrder[] {
  const lines = csv.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseRow(lines[0]);
  const orders: ShirtOrder[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (!values.some(v => v.trim())) continue;

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? '';
    });

    // Normalize common column names (Thai and English)
    const order: ShirtOrder = {
      rowIndex: i,
      displayId: row['ลำดับ'] || row['No'] || row['ID'] || String(i),
      timestamp: row['Timestamp'] || row['เวลา'] || row['timestamp'] || '',
      phone: normalizePhone(
        row['เบอร์โทรศัพท์ติดต่อ'] || row['เบอร์โทรศัพท์'] || row['Phone'] || row['phone'] || 
        row['เบอร์โทร'] || row['โทรศัพท์'] || ''
      ),
      name: row['ชื่อ-นามสกุล'] || row['ชื่อ'] || row['Name'] || row['name'] || '',
      size: row['เลือกไซส์เสื้อ'] || row['เลือกไซส์เสื้อ (ดูรายละเอียดขนาดในตาราง)'] || row['ไซส์'] || row['ขนาด'] || row['Size'] || row['size'] || '',
      quantity: parseInt(row['จำนวนที่สั่งซื้อ (ตัว)'] || row['จำนวน'] || row['Quantity'] || '1') || 1,
      color: row['สี'] || row['Color'] || '',
      note: row['หมายเหตุเพิ่มเติม (ถ้ามี)'] || row['หมายเหตุ'] || row['Note'] || '',
      slipUrl: convertDriveUrl(
        row['แนบสลิปการโอนเงิน (หลักฐานการชำระเงิน)'] ||
        row['หลักฐานการชำระเงิน'] ||
        row['แนบสลิป'] ||
        row['สลิป'] ||
        row['Slip'] ||
        row['slip'] ||
        row['payment_slip'] ||
        ''
      ),
    };

    // Attach raw row data
    Object.assign(order, row);

    if (order.phone) orders.push(order);
  }

  return orders;
}

function parseRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === ',' && !inQuote) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Converts any Google Drive URL to a direct-view URL.
 * Handles: open?id=..., /file/d/.../view, /d/.../view formats
 */
function convertDriveUrl(url: string): string {
  if (!url) return '';
  url = url.trim();

  // Already a direct open URL
  if (url.startsWith('https://drive.google.com/open?id=')) return url;

  // /file/d/<id>/view or /file/d/<id>/edit → open?id=<id>
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) return `https://drive.google.com/open?id=${fileMatch[1]}`;

  // open?id= embedded in longer URL
  const openMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch) return `https://drive.google.com/open?id=${openMatch[1]}`;

  // Return as-is if we can't parse it
  return url;
}

function normalizePhone(phone: string | undefined): string {
  if (!phone) return '';
  // If cell has multiple numbers (e.g. '062-661-9483 / 089-xxx' or '083-xxx และ 080-xxx'), take only the first
  const first = phone.split(/\s*[\/และ]\s*/)[0].trim();
  return first.replace(/[\s\-\(\)]/g, '').replace(/^(\+66|66)/, '0');
}

export async function findOrderByPhone(phone: string, forceRefresh = true): Promise<ShirtOrder | null> {
  const normalized = normalizePhone(phone);
  const orders = await fetchSheetData(forceRefresh);
  return orders.find(o => normalizePhone(o.phone) === normalized) ?? null;
}

export async function findOrderByRowIndex(rowIndex: number, forceRefresh = true): Promise<ShirtOrder | null> {
  const orders = await fetchSheetData(forceRefresh);
  return orders.find(o => o.rowIndex === rowIndex) ?? null;
}

export function getOrderId(order: ShirtOrder): string {
  // Encode phone + rowIndex as a stable token for QR codes
  return Buffer.from(`${order.rowIndex}:${order.phone}`).toString('base64url');
}

export function decodeOrderId(token: string): { rowIndex: number; phone: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    if (!decoded.includes(':')) return null;
    const [rowIdx, phone] = decoded.split(':');
    return { rowIndex: parseInt(rowIdx), phone };
  } catch {
    return null;
  }
}
