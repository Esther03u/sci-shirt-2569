const fs = require('fs');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const env = fs.readFileSync('.env.local', 'utf8').split('\n');
for (const l of env) {
  const m = l.match(/^([^=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^['"]|['"]$/g, '');
}
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

function getDriveId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.searchParams.has('id')) return u.searchParams.get('id');
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  } catch (e) {}
  return null;
}

function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Handle redirect
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = new URL(redirectUrl, url).href;
        }
        resolve(downloadFile(redirectUrl));
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Failed to download: ${res.statusCode}`));
        return;
      }
      
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function run() {
  console.log('Creating bucket "slips"...');
  await supabase.storage.createBucket('slips', { public: true }).catch(() => {}); // ignore error if already exists

  const { data: recipients, error } = await supabase.from('recipients').select('*');
  if (error) {
    console.error('Fetch error:', error);
    return;
  }

  console.log(`Found ${recipients.length} recipients. Starting migration...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const r of recipients) {
    const slipUrl = r.metadata?.slipUrl;
    if (!slipUrl || r.metadata?.supabaseSlipUrl) continue;
    
    const driveId = getDriveId(slipUrl);
    if (!driveId) continue;
    
    try {
      console.log(`Downloading ${driveId} for ${r.identifier}...`);
      const directUrl = `https://drive.google.com/uc?export=download&id=${driveId}`;
      const buffer = await downloadFile(directUrl);
      
      console.log(`Uploading ${driveId}.jpg (${buffer.length} bytes)...`);
      const { data, error: uploadError } = await supabase.storage
        .from('slips')
        .upload(`${driveId}.jpg`, buffer, {
          contentType: 'image/jpeg',
          upsert: true
        });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage.from('slips').getPublicUrl(`${driveId}.jpg`);
      const supabaseUrl = publicUrlData.publicUrl;
      
      // Update metadata
      const newMetadata = { ...r.metadata, supabaseSlipUrl: supabaseUrl };
      await supabase.from('recipients').update({ metadata: newMetadata }).eq('id', r.id);
      
      console.log(`✅ Success: ${supabaseUrl}`);
      successCount++;
    } catch (err) {
      console.error(`❌ Failed for ${driveId}:`, err.message);
      failCount++;
    }
  }
  
  console.log(`Migration complete! Success: ${successCount}, Failures: ${failCount}`);
}

run();
