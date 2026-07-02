# Panduan Uji Coba Obstacle Avoidance (ROS 2 + LiDAR + Pixhawk SITL)

Dokumen ini adalah panduan lengkap dan terperinci untuk mendemonstrasikan bagaimana **ROS 2** dan **Pixhawk (ArduRover)** dapat bekerja sama untuk menghindari rintangan secara otomatis. 

Dalam arsitektur ini:
- **ROS 2** bertugas membaca sensor (LiDAR) dan melaporkan posisi rintangan.
- **Pixhawk (ArduRover)** bertugas menggunakan PID dan algoritma *BendyRuler* untuk memutar kemudi dan membanting setir menghindarinya.

---

## Langkah 1: Persiapan Dasar (Menyalakan SITL & MAVROS)

Agar ROS bisa berkomunikasi dengan Pixhawk, kita harus menyalakan sistem dasarnya terlebih dahulu.

1. Buka **Terminal 1**, jalankan simulasi SITL (ArduRover):
   ```bash
   sim_vehicle.py -v rover --console --map --custom-location=-7.769386,110.382935,110,0
   ```
2. Buka **Terminal 2**, jalankan MAVROS untuk ROS 2 Jazzy:
   ```bash
   source /opt/ros/jazzy/setup.zsh
   ros2 run mavros mavros_node --ros-args -p fcu_url:="udp://127.0.0.1:14551@"
   ```
   *(Tunggu hingga muncul pesan `[mavros]: MAVROS started` atau status koneksi stabil).*

---

## Langkah 2: Konfigurasi Parameter di Mission Planner

Kita harus "memberitahu" Pixhawk (simulator) bahwa dia memiliki sensor proximity eksternal (dari ROS) dan dia diizinkan untuk mengubah rute (*Obstacle Avoidance*).

1. Buka aplikasi **Mission Planner**.
2. Hubungkan ke simulator (via **UDP** di sudut kanan atas, klik **Connect**).
3. Masuk ke menu **CONFIG** (di barisan menu paling atas).
4. Pilih **Full Parameter List** di menu sebelah kiri.
5. Pada kolom pencarian (kanan atas), cari dan atur 2 parameter berikut:
   - **`PRX_TYPE`**: Ubah nilainya menjadi **`2`** *(MAVLink - Mengizinkan input rintangan dari MAVROS).*
   - **`OA_TYPE`**: Ubah nilainya menjadi **`1`** *(BendyRuler - Mengaktifkan kecerdasan buatan Pixhawk untuk kalkulasi jalur menghindar).*
6. Klik tombol hijau **Write Params** di sebelah kanan layar untuk menyimpan perubahan.
7. **Penting:** Sangat disarankan untuk me-*restart* SITL (Terminal 1 ditutup lalu dijalankan ulang) agar fitur *Avoidance* aktif secara sempurna.

---

## Langkah 3: Menjalankan "LiDAR Bohongan" (Fake LiDAR)

Karena kita tidak sedang mencolokkan LiDAR fisik, kita akan menjalankan script buatan kita yang berpura-pura menjadi LiDAR dan melihat adanya rintangan (batu) sejauh 3 meter di depan kapal.

1. Buka **Terminal 3**.
2. *Source* sistem ROS 2 Anda:
   ```bash
   source /opt/ros/jazzy/setup.zsh
   ```
3. Masuk ke folder proyek web tempat file Python disimpan, lalu jalankan script-nya:
   ```bash
   python fake_lidar_ros2.py
   ```
   *(Script ini akan mempublikasikan data `sensor_msgs/LaserScan` ke topik `/mavros/obstacle/send` sebanyak 10x per detik).*

---

## Langkah 4: Visualisasi di RViz2 (Sudut Pandang ROS)

Mari kita lihat seperti apa bentuk rintangan ini di mata ROS.

1. Buka **Terminal 4**, ketik perintah berikut:
   ```bash
   source /opt/ros/jazzy/setup.zsh
   rviz2
   ```
2. Di jendela aplikasi **RViz2**:
   - Di menu sebelah kiri atas (Global Options), ubah **Fixed Frame** menjadi `base_link`.
   - Di sudut kiri bawah, klik tombol **Add**.
   - Pilih tab **By topic**.
   - Cari dan pilih `/mavros/obstacle/send`, lalu klik **LaserScan** di bawahnya dan tekan OK.
3. Anda akan melihat sebuah garis lengkung berwarna merah sejauh 3 meter (kotak grid) tepat di depan pusat kapal. Itu adalah "batu" imajiner kita.

---

## Langkah 5: Pembuktian di Mission Planner (Sudut Pandang Pixhawk)

Sekarang mari kita lihat bagaimana Pixhawk merespons "batu" ini saat kapal sedang berlayar!

1. Buka **Mission Planner**, pergi ke layar **DATA** (Flight Data).
2. Lihat ke instrumen radar (kiri bawah) atau peta Anda. Anda akan melihat **zona merah/kuning di area depan kapal**, yang menandakan Pixhawk sadar ada rintangan di sana!
3. Masuk ke layar **PLAN** (Flight Plan).
4. Klik di area peta yang lurus jauh ke depan kapal (kira-kira jarak 20 meter, pastikan melewati rintangan batu 3 meter tadi).
5. Klik **Write WPs** untuk menyimpan perintah titik tujuan tersebut.
6. Kembali ke layar **DATA** (Flight Data).
7. Di panel *Actions* bawah, klik **Arm/Disarm** (hingga status menjadi *Armed*).
8. Ubah *Flight Mode* ke **AUTO**.

### HASILNYA:
Kapal akan mulai melaju ke depan. Saat jaraknya semakin dekat dengan "batu", Pixhawk (menggunakan fungsi PID internalnya) akan otomatis **membanting setir** (berbelok keluar jalur), menyalip rintangan tersebut dari samping, lalu kembali memutar kemudi untuk menuju *waypoint* yang Anda pasang. 

*Selamat! Anda baru saja sukses membuktikan konsep Obstacle Avoidance menggunakan ROS dan Pixhawk!*
