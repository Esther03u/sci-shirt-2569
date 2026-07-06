import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vqkrlbvkdelfjqqbjvlm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxa3JsYnZrZGVsZmpxcWJqdmxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzI3NjkzNCwiZXhwIjoyMDk4ODUyOTM0fQ.tFfeUTLh3XSd0tDiKe_xhgYT9-U-LjWr0yYXfaVRS0Y'
);

async function run() {
  const { data, error } = await supabase
    .from('settings')
    .upsert({ key: 'announcement', value: 'Hello' }, { onConflict: 'key' });

  console.log('Error:', error);
  console.log('Data:', data);
}

run();
