const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local', 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const cleanLine = line.trim();
  if (cleanLine && !cleanLine.startsWith('#')) {
    const idx = cleanLine.indexOf('=');
    if (idx > -1) {
      envVars[cleanLine.substring(0, idx).trim()] = cleanLine.substring(idx + 1).trim();
    }
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data: cData } = await supabase.from("Center_Lintasan").select('*');
  console.log("Center_Lintasan:", cData);

  const { data: wData } = await supabase.from("mission_waypoints").select('*');
  console.log("mission_waypoints:", wData);
}

check();
