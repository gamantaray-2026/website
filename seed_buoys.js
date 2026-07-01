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

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// EXACT DB CENTER (from mission_waypoints 'start')
const originLat = -7.76943801474675;
const originLon = 110.382921025157;

function getLatLng(dx, dy) {
    const earthRadius = 6378137;
    const dLat = (dy / earthRadius) * (180 / Math.PI);
    const dLon = (dx / (earthRadius * Math.cos(originLat * Math.PI / 180))) * (180 / Math.PI);
    return { lat: originLat + dLat, lon: originLon + dLon };
}

async function seedBuoys() {
  const buoysToInsert = [];
  let idCounter = 1;

  function addPair(redDx, redDy, greenDx, greenDy) {
      const redPos = getLatLng(redDx, redDy);
      buoysToInsert.push({ id: idCounter++, latitude: redPos.lat, longitude: redPos.lon, color: 'red' });
      
      const greenPos = getLatLng(greenDx, greenDy);
      buoysToInsert.push({ id: idCounter++, latitude: greenPos.lat, longitude: greenPos.lon, color: 'green' });
  }

  // We design a perfect inverted U shape centered in the 25x25m grid.
  // The grid goes from x = -12.5 to 12.5, and y = -12.5 to 12.5.
  // We use exactly the grid lines to make it perfectly symmetric.
  // Red is the OUTER boundary. Green is the INNER boundary.
  
  // Straight path going North (Left side, Column 2)
  addPair(-7.5, -10, -2.5, -10); // Gate 1
  addPair(-7.5, -5,  -2.5, -5);  // Gate 2
  addPair(-7.5,  0,  -2.5,  0);  // Gate 3
  addPair(-7.5,  5,  -2.5,  5);  // Gate 4

  // Top Curve
  // Red forms outer circle, Green forms inner circle. Gate width exactly 5 meters.
  addPair(-5, 10, -1, 7); // Gate 5 (Top Left)
  addPair( 5, 10,  1, 7); // Gate 6 (Top Right)

  // Straight path going South (Right side, Column 4)
  // Remember: Left is Red. Going South, Left is East (+dx). So Red is +dx (outer).
  addPair(7.5,  5,  2.5,  5);  // Gate 7
  addPair(7.5,  0,  2.5,  0);  // Gate 8
  addPair(7.5, -5,  2.5, -5);  // Gate 9
  addPair(7.5, -10, 2.5, -10); // Gate 10

  // Clear existing buoys
  console.log("Deleting existing buoys...");
  const { error: delErr } = await supabase.from('buoys').delete().neq('id', 0);
  if (delErr) console.error("Delete Error:", delErr);
  
  // Insert new buoys
  console.log("Inserting perfectly grid-centered inverted U shape...");
  const { error } = await supabase.from('buoys').insert(buoysToInsert);
  
  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Success! Buoys perfectly aligned.");
  }
}

seedBuoys();
