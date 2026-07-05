-- Supabase SQL Schema
-- รันใน Supabase Dashboard > SQL Editor

-- ตารางผู้แจกเสื้อ
CREATE TABLE distributors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'distributor' CHECK (role IN ('admin', 'distributor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ตารางบันทึกการแจก
CREATE TABLE distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_row_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  distributed_by UUID REFERENCES distributors(id),
  distributed_at TIMESTAMPTZ DEFAULT now(),
  cancelled BOOLEAN DEFAULT false,
  cancelled_by UUID REFERENCES distributors(id),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(sheet_row_id, cancelled) -- prevent duplicates for active distributions
);

-- ตารางตั้งค่า
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ค่าเริ่มต้น: รหัสลับ (เปลี่ยนได้ผ่าน Admin Dashboard)
INSERT INTO settings (key, value) VALUES ('registration_code', 'SCI2569');

-- Row Level Security
ALTER TABLE distributors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

-- Distributors: อ่านได้เฉพาะ authenticated users
CREATE POLICY "Authenticated can read distributors"
  ON distributors FOR SELECT
  TO authenticated USING (true);

-- Distributions: authenticated users read all, write own
CREATE POLICY "Authenticated can read distributions"
  ON distributions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert distributions"
  ON distributions FOR INSERT
  TO authenticated WITH CHECK (distributed_by = auth.uid());

-- Settings: authenticated users read
CREATE POLICY "Authenticated can read settings"
  ON settings FOR SELECT
  TO authenticated USING (true);

-- ─── Admin: สร้าง Admin account แรก ───────────────────────
-- หลังจาก sign up ผ่าน Supabase Auth แล้ว รัน query นี้:
-- UPDATE distributors SET role = 'admin' WHERE email = 'your-admin@email.com';
