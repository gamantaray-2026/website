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

// EXACT DB CENTER (from mission_waypoints 'start')
const originLat = -7.76943801474675;
const originLon = 110.382921025157;
const earthRadius = 6378137;

function getLatLng(dx, dy) {
    const dLat = (dy / earthRadius) * (180 / Math.PI);
    const dLon = (dx / (earthRadius * Math.cos(originLat * Math.PI / 180))) * (180 / Math.PI);
    return { lat: originLat + dLat, lon: originLon + dLon };
}

async function simulate() {
  console.log("Memulai simulasi pergerakan kapal (GPS)...");
  
  // Rute kapal: Naik di x=-5, belok di atas, turun di x=5
  // Kita buat titik-titik (waypoint lokal)
  const pathPoints = [
    { x: -5, y: -12.5 },
    { x: -5, y: 10 },
    { x: -2.5, y: 12.5 },
    { x: 2.5, y: 12.5 },
    { x: 5, y: 10 },
    { x: 5, y: -12.5 }
  ];

  let currentPointIdx = 0;
  let currentX = pathPoints[0].x;
  let currentY = pathPoints[0].y;
  
  const speedMps = 2.0; // 2 meter per detik
  const intervalMs = 1000; // Update setiap 1 detik

  const interval = setInterval(async () => {
    if (currentPointIdx >= pathPoints.length - 1) {
      console.log("Kapal telah sampai di tujuan akhir!");
      clearInterval(interval);
      return;
    }

    const target = pathPoints[currentPointIdx + 1];
    const dx = target.x - currentX;
    const dy = target.y - currentY;
    const dist = Math.sqrt(dx*dx + dy*dy);
    
    if (dist <= speedMps) {
      // Sampai di titik berikutnya
      currentX = target.x;
      currentY = target.y;
      currentPointIdx++;
    } else {
      // Bergerak menuju titik
      currentX += (dx / dist) * speedMps;
      currentY += (dy / dist) * speedMps;
    }

    const { lat, lon } = getLatLng(currentX, currentY);
    
    // Calculate heading/yaw for cog_data (if needed)
    const yaw = Math.atan2(dx, dy) * (180 / Math.PI); // degrees from North

    const { error } = await supabase.from('nav_data').insert({
      latitude: lat,
      longitude: lon,
      sog_ms: speedMps,
      timestamp: new Date().toISOString()
    });
    
    // Also update cog_data for boat rotation!
    await supabase.from('cog_data').insert({
      cog: yaw < 0 ? yaw + 360 : yaw,
      timestamp: new Date().toISOString()
    });

    if (error) {
      console.error("Gagal mengirim data GPS:", error);
    } else {
      console.log(`Mengirim GPS -> Lat: ${lat.toFixed(6)}, Lon: ${lon.toFixed(6)}`);
    }

  }, intervalMs);
}

simulate();
