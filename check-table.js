const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const l of env) {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { error } = await supabase.from('recipients').select('*').limit(1);
  console.log('Recipients query error:', error);
}
run();
