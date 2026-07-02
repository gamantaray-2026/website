import time
import math
from pymavlink import mavutil

print("Menghubungkan langsung ke ArduPilot (SITL)...")
master = mavutil.mavlink_connection('udpin:127.0.0.1:14551')
master.wait_heartbeat()
print("Terhubung ke kapal! Memulai radar cerdas...")

# Minta ArduPilot mengirim data posisi lokal (LOCAL_POSITION_NED) dengan cepat
master.mav.request_data_stream_send(
    master.target_system, master.target_component,
    mavutil.mavlink.MAV_DATA_STREAM_POSITION, 10, 1)

rock_set = False
rock_n = 0.0
rock_e = 0.0
last_send_time = 0

current_n = 0.0
current_e = 0.0
current_yaw = 0.0
got_pos = False
got_yaw = False

while True:
    # Selalu kuras buffer pesan
    msg = master.recv_match(blocking=False)
    if msg:
        mtype = msg.get_type()
        if mtype == 'LOCAL_POSITION_NED':
            current_n = msg.x
            current_e = msg.y
            got_pos = True
        elif mtype == 'ATTITUDE':
            current_yaw = msg.yaw
            got_yaw = True
            
    now = time.time()
    
    # Hanya jalankan logika jika kita sudah punya data posisi dan rotasi kapal
    if got_pos and got_yaw:
        # Tanam batu sekali saja di awal (15 meter lurus di depan)
        if not rock_set:
            rock_n = current_n + 15.0 * math.cos(current_yaw)
            rock_e = current_e + 15.0 * math.sin(current_yaw)
            rock_set = True
            print(f"Batu ditanam secara PERMANEN di koordinat (N:{rock_n:.2f}, E:{rock_e:.2f})")
        
        # Kirim data radar TEPAT 10 kali per detik (0.1s) agar LiDAR Health selalu sehat!
        if now - last_send_time >= 0.1:
            # Hitung jarak dan sudut batu ke kapal sekarang
            dist = math.hypot(rock_n - current_n, rock_e - current_e)
            global_angle = math.atan2(rock_e - current_e, rock_n - current_n)
            
            # Sudut relatif terhadap moncong kapal
            rel_angle = global_angle - current_yaw
            
            # Normalisasi sudut -pi sampai pi
            while rel_angle > math.pi: rel_angle -= 2 * math.pi
            while rel_angle < -math.pi: rel_angle += 2 * math.pi
            
            distances = [65535] * 72
            
            # Jika batu masih dalam jangkauan sensor (0.2 - 20 meter)
            if 0.2 < dist < 20.0:
                deg = math.degrees(rel_angle)
                
                # Konversi derajat ke indeks MAVLink (0 s/d 71)
                if deg >= 0:
                    idx = int(deg / 5.0) % 72
                else:
                    idx = int(72 + (deg / 5.0)) % 72
                
                # Buat batu sedikit melebar (3 sektor = 15 derajat)
                for i in [-1, 0, 1]:
                    final_idx = (idx + i) % 72
                    distances[final_idx] = int(dist * 100)
            
            # Kirim Pesan Obstacle Distance
            master.mav.obstacle_distance_send(
                int(now * 1000000) % 4294967295,
                0, distances, 0, 20, 2000, 10.0, 0, 12)
            
            last_send_time = now
            
    # Tidur sejenak agar CPU tidak 100%
    time.sleep(0.001)
