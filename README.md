# SCI Shirt 2569 — ระบบแจกเสื้อ Freshy

ระบบจัดการแจกเสื้อ Freshy คณะวิทยาศาสตร์และเทคโนโลยี มหาวิทยาลัยราชภัฏภูเก็ต ปี 2569

## Tech Stack
- **Next.js 14** (App Router + TypeScript)
- **Supabase** (Auth + Database)
- **Google Sheets** (ข้อมูลการสั่งซื้อ — CSV export)
- **Vercel** (Hosting ฟรี)

## Setup

### 1. ตั้งค่า Google Sheet
Share Google Sheet เป็น **"Anyone with the link can view"**

### 2. สร้าง Supabase Project
รัน SQL จากไฟล์ `supabase-schema.sql` ใน Supabase SQL Editor

### 3. Environment Variables
```env
GOOGLE_SHEETS_ID=your_sheet_id
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Run locally
```bash
npm install
npm run dev
```

### 5. Deploy บน Vercel
1. Push ขึ้น GitHub
2. Import ใน Vercel
3. ใส่ Environment Variables
4. Deploy!

## Pages

| URL | หน้า |
|-----|------|
| `/` | ค้นหาด้วยเบอร์โทร (สาธารณะ) |
| `/verify/[token]` | ผลจาก QR Scan |
| `/login` | Login |
| `/register` | สมัครบัญชีผู้แจก |
| `/distribute` | แจกเสื้อ |
| `/dashboard` | Admin Dashboard |

## Admin Setup
1. สมัครบัญชีด้วยรหัสลับ `SCI2569`
2. ไปที่ Supabase → Table Editor → distributors
3. เปลี่ยน `role` เป็น `admin`
