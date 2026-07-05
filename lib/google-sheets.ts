// lib/google-sheets.ts
// Fetches data from Google Sheets via public CSV export (no auth required for public sheets)
// Falls back to API with service account if available

const SHEET_ID = process.env.GOOGLE_SHEETS_ID || '1Lbc8y8Te4YplBJNFPcJdQvxBB0hY2fvus51QS3uVwlg';

export interface ShirtOrder {
  rowIndex: number;
  timestamp: string;
  phone: string;
  name: string;
  size: string;
  quantity: number;
  color?: string;
  note?: string;
  [key: string]: string | number | undefined;
}

// Cache for sheet data (5 min TTL)
let cache: { data: ShirtOrder[]; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function fetchSheetData(forceRefresh = false): Promise<ShirtOrder[]> {
  const now = Date.now();
  if (!forceRefresh && cache && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data;
  }

  try {
    // Use public CSV export (works if sheet is "Anyone with link can view")
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`;
    const res = await fetch(csvUrl, { next: { revalidate: 300 } });
    
    if (!res.ok) throw new Error(`Sheet fetch failed: ${res.status}`);
    
    const csv = await res.text();
    const orders = parseCsv(csv);
    
    cache = { data: orders, fetchedAt: now };
    return orders;
  } catch (err) {
    console.error('Failed to fetch sheet data:', err);
    if (cache) return cache.data; // Return stale cache on error
    return [];
  }
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
      timestamp: row['Timestamp'] || row['เวลา'] || row['timestamp'] || '',
      phone: normalizePhone(
        row['เบอร์โทรศัพท์'] || row['Phone'] || row['phone'] || 
        row['เบอร์โทร'] || row['โทรศัพท์'] || ''
      ),
      name: row['ชื่อ-นามสกุล'] || row['ชื่อ'] || row['Name'] || row['name'] || '',
      size: row['ไซส์'] || row['ขนาด'] || row['Size'] || row['size'] || '',
      quantity: parseInt(row['จำนวน'] || row['Quantity'] || '1') || 1,
      color: row['สี'] || row['Color'] || '',
      note: row['หมายเหตุ'] || row['Note'] || '',
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

function normalizePhone(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, '').replace(/^(\+66|66)/, '0');
}

export async function findOrderByPhone(phone: string): Promise<ShirtOrder | null> {
  const normalized = normalizePhone(phone);
  const orders = await fetchSheetData();
  return orders.find(o => normalizePhone(o.phone) === normalized) ?? null;
}

export async function findOrderByRowIndex(rowIndex: number): Promise<ShirtOrder | null> {
  const orders = await fetchSheetData();
  return orders.find(o => o.rowIndex === rowIndex) ?? null;
}

export function getOrderId(order: ShirtOrder): string {
  // Encode phone + rowIndex as a stable token for QR codes
  return Buffer.from(`${order.rowIndex}:${order.phone}`).toString('base64url');
}

export function decodeOrderId(token: string): { rowIndex: number; phone: string } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString();
    const [rowIdx, phone] = decoded.split(':');
    return { rowIndex: parseInt(rowIdx), phone };
  } catch {
    return null;
  }
}
