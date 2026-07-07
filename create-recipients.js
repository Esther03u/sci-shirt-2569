const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const l of env) {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const sql = `
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT UNIQUE NOT NULL,
  name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX recipients_identifier_idx ON recipients(identifier);

ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read recipients"
  ON recipients FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Authenticated can insert recipients"
  ON recipients FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update recipients"
  ON recipients FOR UPDATE
  TO authenticated USING (true);
`;

async function run() {
  const { error } = await supabase.rpc('exec_sql', { query: sql });
  console.log('Execute SQL Error:', error);
}
run();
