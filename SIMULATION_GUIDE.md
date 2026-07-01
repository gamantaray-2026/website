# Panduan Simulasi Gamantaray (SITL + ROS 2 + Web)

Dokumen ini menjelaskan alur kerja lengkap (langkah demi langkah) untuk menjalankan simulasi kapal (ArduRover) menggunakan SITL, merancang jalur menggunakan Mission Planner, dan memvisualisasikan pergerakan kapal secara langsung di Gamantaray Web secara *real-time* menggunakan **ROS 2 (Jazzy)** dan **Rosbridge**.

## Prasyarat Lingkungan
Pastikan perangkat/sistem Anda sudah memiliki:
1. **ArduPilot / ArduRover (SITL)** ter-install dan siap pakai (`sim_vehicle.py`).
2. **Mission Planner** (bisa dijalankan via Windows atau Wine/WSL).
3. **ROS 2 Jazzy Jalisco** (beserta `mavros` dan `rosbridge_suite`).
4. **Node.js & npm** untuk menjalankan server Web Gamantaray.

---

## Langkah 1: Menjalankan Simulasi SITL
Simulasi kapal (SITL) dijalankan melalui terminal dengan menentukan titik mula (Origin/Home) di danau Wisdom Park UGM.

1. Buka Terminal 1.
2. Jalankan perintah berikut:
   ```bash
   sim_vehicle.py -v rover --console --map --custom-location=-7.769386,110.382935,110,0
   ```
   *(Secara otomatis, MAVProxy dari SITL akan me-routing koneksi MAVLink ke UDP `127.0.0.1:14550` dan `127.0.0.1:14551`)*

## Langkah 2: Mengatur Rute di Mission Planner
Mission Planner digunakan sebagai Ground Control Station (GCS) untuk membuat *waypoints*.

1. Buka aplikasi **Mission Planner**.
2. Pada sudut kanan atas, pilih metode koneksi **UDP** dan klik **Connect**. Biarkan port berada di **14550**.
3. Masuk ke panel **PLAN** (Flight Plan).
4. Klik kanan pada area peta (Danau Wisdom Park) lalu pilih **Set Home Here**.
5. Gambar dan atur titik *waypoint* yang diinginkan.
6. Klik menu **Write WPs** di sebelah kanan layar untuk mengirim rute misi tersebut ke dalam memori kapal simulator.

## Langkah 3: Menjalankan MAVROS
MAVROS bertugas "menerjemahkan" bahasa MAVLink dari SITL menjadi pesan-pesan ROS 2 (Topik) yang bisa dipahami oleh sistem secara luas. Kita akan mengkoneksikan MAVROS ke port UDP kedua (14551).

1. Buka Terminal 2.
2. *Source* environment ROS 2 Jazzy Anda:
   ```bash
   source /opt/ros/jazzy/setup.zsh
   ```
3. Jalankan MAVROS:
   ```bash
   ros2 run mavros mavros_node --ros-args -p fcu_url:="udp://127.0.0.1:14551@"
   ```
   *(Pastikan tidak ada pesan error `channel closed`. Jika ada `request timeout` itu wajar sampai SITL mengirimkan datanya).*

## Langkah 4: Menjalankan Rosbridge Server (WebSocket)
Untuk mengizinkan Web (JavaScript) membaca topik ROS, kita harus membuka jembatan WebSocket.

1. Buka Terminal 3.
2. *Source* environment ROS 2 Jazzy:
   ```bash
   source /opt/ros/jazzy/setup.zsh
   ```
3. Jalankan server Rosbridge:
   ```bash
   ros2 launch rosbridge_server rosbridge_websocket_launch.xml
   ```
   *(Pesan `Rosbridge WebSocket server started on port 9090` akan muncul).*

## Langkah 5: Menjalankan Web Gamantaray
Web Gamantaray (`gamantarayweb`) sudah dimodifikasi dengan *library* `roslib` untuk secara otomatis terkoneksi ke *Rosbridge* dan menggambar rute kapal.

1. Buka Terminal 4 (di dalam folder proyek web).
2. Jalankan server web pengembangan:
   ```bash
   npm run dev
   ```
3. Buka browser dan pergi ke `http://localhost:3000`.
4. Di _Console_ (Inspect Element), Anda akan melihat keterangan: `[ROS] Connected to rosbridge websocket server.`. 
   *(Ini menandakan bahwa web sudah berhasil mendengar secara langsung data MAVROS tanpa melalui backend Supabase).*

## Langkah 6: Mulai Menjalankan Kapal
1. Kembali ke aplikasi **Mission Planner**.
2. Buka tab **DATA** (Flight Data).
3. Di tab action bagian bawah, tekan tombol **Arm/Disarm** (pastikan kapal dalam kondisi *Armed* / siap berlayar).
4. Ubah **Flight Mode** (Mode Terbang/Jalan) ke mode **AUTO**.
5. Kapal di dalam simulasi akan mulai bergerak menyusuri *waypoint*, dan ikon kapal di layar **Web Gamantaray** Anda akan langsung bergerak tersinkronisasi (sehalus detak pergerakannya di dalam Mission Planner)!

---
*Catatan Perbaikan Troubleshooting:*
- *Jika Rosbridge crash dengan error `BSON`, jalankan: `pip uninstall bson -y && pip install pymongo`.*
- *Jika kapal tidak mau bergerak, pastikan SITL tidak terkunci (paused) dan perhatikan pesan teks yang muncul di Terminal MAVProxy.*
