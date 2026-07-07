-- Supabase SQL Schema
-- รันใน Supabase Dashboard > SQL Editor

-- ==========================================
-- 1. ลบของเก่าทิ้ง (ถ้าต้องการเริ่มใหม่)
-- ลบ comment (--) ด้านหน้าออกถ้าต้องการลบตารางทั้งหมด
-- ==========================================
-- DROP TABLE IF EXISTS distributions CASCADE;
-- DROP TABLE IF EXISTS recipients CASCADE;
-- DROP TABLE IF EXISTS inventory CASCADE;
-- DROP TABLE IF EXISTS settings CASCADE;
-- DROP TABLE IF EXISTS distributors CASCADE;

-- ==========================================
-- 2. สร้างตาราง
-- ==========================================

-- ตารางผู้แจกเสื้อ
CREATE TABLE IF NOT EXISTS distributors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'distributor' CHECK (role IN ('admin', 'distributor')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ตารางผู้รับของ (นักศึกษา)
CREATE TABLE IF NOT EXISTS recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL, -- เช่น เบอร์โทร, รหัสนักศึกษา หรือ rowIndex
  name TEXT,
  metadata JSONB, -- เก็บข้อมูลอื่นๆ จาก Sheet (เช่น ไซส์ที่เลือกแต่แรก, คณะ, สลิป)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- สร้าง index ที่ identifier เพื่อให้ upsert ทำงานได้เร็ว
CREATE INDEX IF NOT EXISTS recipients_identifier_idx ON recipients(identifier);

-- ตารางสต็อกของ (เสื้อ)
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL, -- เช่น SHIRT-S, SHIRT-M
  name TEXT NOT NULL, -- เช่น "เสื้อไซส์ S"
  total_stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ตารางบันทึกการแจก
CREATE TABLE IF NOT EXISTS distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_row_id TEXT NOT NULL,
  phone TEXT NOT NULL,
  distributed_by UUID REFERENCES distributors(id),
  distributed_at TIMESTAMPTZ DEFAULT now(),
  cancelled BOOLEAN DEFAULT false,
  cancelled_by UUID REFERENCES distributors(id),
  cancelled_at TIMESTAMPTZ,
  UNIQUE(phone, cancelled) -- ป้องกันการรับของชิ้นเดิมซ้ำ
);

-- ตารางตั้งค่า
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ค่าเริ่มต้น: รหัสลับ (เปลี่ยนได้ผ่าน Admin Dashboard)
INSERT INTO settings (key, value) VALUES ('registration_code', 'SCI2569')
ON CONFLICT (key) DO NOTHING;

-- ==========================================
-- 3. Row Level Security (RLS)
-- ==========================================
ALTER TABLE distributors   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients     ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory      ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings       ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------
-- Policies สำหรับ distributors
-- ------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read distributors" ON distributors;
CREATE POLICY "Authenticated can read distributors"
  ON distributors FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Admins can update distributors" ON distributors;
CREATE POLICY "Admins can update distributors"
  ON distributors FOR UPDATE
  TO authenticated USING (
    (SELECT role FROM distributors WHERE id = auth.uid()) = 'admin'
  );

-- ------------------------------------------
-- Policies สำหรับ recipients
-- ------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read recipients" ON recipients;
CREATE POLICY "Authenticated can read recipients"
  ON recipients FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert recipients" ON recipients;
CREATE POLICY "Authenticated can insert recipients"
  ON recipients FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update recipients" ON recipients;
CREATE POLICY "Authenticated can update recipients"
  ON recipients FOR UPDATE
  TO authenticated USING (true);

-- ------------------------------------------
-- Policies สำหรับ inventory
-- ------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read inventory" ON inventory;
CREATE POLICY "Authenticated can read inventory"
  ON inventory FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert inventory" ON inventory;
CREATE POLICY "Authenticated can insert inventory"
  ON inventory FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can update inventory" ON inventory;
CREATE POLICY "Authenticated can update inventory"
  ON inventory FOR UPDATE
  TO authenticated USING (true);

-- ------------------------------------------
-- Policies สำหรับ distributions
-- ------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read distributions" ON distributions;
CREATE POLICY "Authenticated can read distributions"
  ON distributions FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert distributions" ON distributions;
CREATE POLICY "Authenticated can insert distributions"
  ON distributions FOR INSERT
  TO authenticated WITH CHECK (distributed_by = auth.uid());

DROP POLICY IF EXISTS "Admin or owner can update distributions" ON distributions;
CREATE POLICY "Admin or owner can update distributions"
  ON distributions FOR UPDATE
  TO authenticated USING (
    distributed_by = auth.uid() OR 
    (SELECT role FROM distributors WHERE id = auth.uid()) = 'admin'
  );

-- ------------------------------------------
-- Policies สำหรับ settings
-- ------------------------------------------
DROP POLICY IF EXISTS "Authenticated can read settings" ON settings;
CREATE POLICY "Authenticated can read settings"
  ON settings FOR SELECT
  TO authenticated USING (true);

-- ==========================================
-- 4. ตั้งค่า Realtime
-- ==========================================
-- (ถ้ายังไม่เคยเพิ่มตารางลงใน publication ให้รันคำสั่งด้านล่างนี้ใน SQL Editor แยกต่างหาก)
-- ALTER PUBLICATION supabase_realtime ADD TABLE distributions;

-- ─── Admin: สร้าง Admin account แรก ───────────────────────
-- หลังจาก sign up ผ่าน Supabase Auth แล้ว รัน query นี้:
-- UPDATE distributors SET role = 'admin' WHERE email = 'your-admin@email.com';
