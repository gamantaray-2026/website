#!/usr/bin/env python3
"""
simulate_boat_web.py — Simulator Pergerakan Kapal untuk Website Gamantaray (safinahone.vercel.app)
--------------------------------------------------------------------------------------------------
Script ini mensimulasikan pergerakan kapal (GPS Latitude, Longitude, SOG, dan COG/Heading)
dan mengirimkannya langsung ke database Supabase secara real-time.

Keunggulan:
- ZERO DEPENDENCY: Hanya menggunakan library bawaan Python (urllib, math, time, json).
- Otomatis membaca konfigurasi dari file .env.local di folder ini.
- Menghitung arah menghadap kapal (COG/Heading) secara akurat sesuai arah pergerakan.
"""

import os
import time
import math
import json
import urllib.request
import urllib.error

def load_env_local():
    env_vars = {}
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env.local')
    try:
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, val = line.split('=', 1)
                    env_vars[key.strip()] = val.strip().strip('"').strip("'")
    except FileNotFoundError:
        print(f"[Warning] File .env.local tidak ditemukan di {env_path}")
    return env_vars

def post_supabase(url, key, table, data):
    endpoint = f"{url.rstrip('/')}/rest/v1/{table}"
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }
    req = urllib.request.Request(endpoint, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.status in (200, 201, 204)
    except urllib.error.HTTPError as e:
        print(f"[Error Supabase] Tabel '{table}': HTTP {e.code} - {e.reason}")
        return False
    except Exception as e:
        print(f"[Error Supabase] {e}")
        return False

def get_lat_lon(origin_lat, origin_lon, dx_meters, dy_meters):
    earth_radius = 6378137.0
    d_lat = (dy_meters / earth_radius) * (180.0 / math.pi)
    d_lon = (dx_meters / (earth_radius * math.cos(math.radians(origin_lat)))) * (180.0 / math.pi)
    return origin_lat + d_lat, origin_lon + d_lon

def main():
    print("=================================================================")
    print("   SIMULATOR PERGERAKAN KAPAL GAMANTARAY (safinahone.vercel.app)")
    print("=================================================================")
    
    env = load_env_local()
    supabase_url = env.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not supabase_url or not supabase_key:
        print("[Error] NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY wajib ada di .env.local")
        return

    print(f"[Info] Terhubung ke Supabase: {supabase_url[:30]}...")

    # Titik tengah peta (Sesuai lintasan1 di safinahone.vercel.app)
    origin_lat = -7.9154834
    origin_lon = 112.5891244

    # Jalur waypoint kapal (lintasan persegi panjang memutari area)
    waypoints = [
        (-15.0, -20.0),  # Titik 1: Barat daya
        (-15.0,  20.0),  # Titik 2: Utara barat
        (  0.0,  25.0),  # Titik 3: Utara tengah
        ( 15.0,  20.0),  # Titik 4: Timur utara
        ( 15.0, -20.0),  # Titik 5: Timur selatan
        (  0.0, -25.0),  # Titik 6: Selatan tengah
    ]

    current_idx = 0
    curr_x, curr_y = waypoints[0]
    speed_mps = 2.5  # Kecepatan kapal 2.5 m/s (~5 knot)
    dt = 1.0         # Update setiap 1 detik

    print(f"[Info] Memulai simulasi dari Lat: {origin_lat}, Lon: {origin_lon}")
    print("[Info] Tekan Ctrl+C untuk menghentikan simulasi.\n")

    try:
        while True:
            target_idx = (current_idx + 1) % len(waypoints)
            target_x, target_y = waypoints[target_idx]

            dx = target_x - curr_x
            dy = target_y - curr_y
            dist = math.sqrt(dx*dx + dy*dy)

            if dist <= speed_mps * dt:
                curr_x, curr_y = target_x, target_y
                current_idx = target_idx
            else:
                curr_x += (dx / dist) * (speed_mps * dt)
                curr_y += (dy / dist) * (speed_mps * dt)

            # Hitung koordinat GPS
            lat, lon = get_lat_lon(origin_lat, origin_lon, curr_x, curr_y)

            # Hitung COG (Course Over Ground) / sudut putar kapal dalam derajat (0 = Utara, 90 = Timur)
            yaw_deg = math.degrees(math.atan2(dx, dy))
            if yaw_deg < 0:
                yaw_deg += 360.0

            # Kirim ke tabel nav_data
            nav_payload = {
                "latitude": lat,
                "longitude": lon,
                "sog_ms": round(speed_mps, 2)
            }
            post_supabase(supabase_url, supabase_key, "nav_data", nav_payload)

            # Kirim ke tabel cog_data
            cog_payload = {
                "cog": round(yaw_deg, 1)
            }
            post_supabase(supabase_url, supabase_key, "cog_data", cog_payload)

            print(f"[Simulasi -> Web] Lat: {lat:.6f} | Lon: {lon:.6f} | SOG: {speed_mps} m/s | COG: {yaw_deg:.1f}°")
            time.sleep(dt)

    except KeyboardInterrupt:
        print("\n[Info] Simulasi dihentikan.")

if __name__ == "__main__":
    main()
