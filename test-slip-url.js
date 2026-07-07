const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const l of env) {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data } = await supabase.from('recipients').select('metadata').limit(10);
  for (const r of data) {
    if (r.metadata.slipUrl) {
      console.log('Slip URL:', r.metadata.slipUrl);
      const match = r.metadata.slipUrl.match(/\/d\/([a-zA-Z0-9_-]+)/) || (new URL(r.metadata.slipUrl).searchParams.has('id') ? [null, new URL(r.metadata.slipUrl).searchParams.get('id')] : null);
      if (match && match[1]) {
        console.log('Direct image link: https://drive.google.com/uc?id=' + match[1]);
      }
    }
  }
}
run();
