# Panduan Menjalankan Sistem Telemetri Gamantaray

Panduan ini berisi langkah-langkah berurutan untuk menghubungkan kapal (Pixhawk/FCU) ke *website* melalui jaringan lokal (WiFi/Tailscale).

---

## Tahap 1: Di Companion Computer (NUC di atas Kapal)
Komputer ini bertugas mengambil data langsung dari Pixhawk dan memancarkannya lewat WiFi ke Ground Station (Laptop Anda).

1. Buka terminal (atau SSH ke NUC `safinah1one@192.168.1.103`).
2. Pastikan Pixhawk sudah terhubung via USB (biasanya terdeteksi sebagai `/dev/ttyACM0`).
3. Jalankan `mavproxy.py` dan tembakkan data UDP ke IP Ground Station (Laptop Anda). 
   *(Catatan: Ganti `192.168.1.104` dengan IP WiFi laptop Anda jika berubah).*
   
   ```bash
   mavproxy.py --master=/dev/ttyACM0 --out=udp:192.168.1.104:14550
   ```

---

## Tahap 2: Di Ground Station (Laptop/PC Anda)
Komputer ini bertugas menerima pancaran data dari NUC, memprosesnya dengan MAVROS, dan mengirimkannya ke database Supabase agar muncul di *website*.

1. Buka terminal baru.
2. Pindah ke direktori proyek *website* Gamantaray:
   ```bash
   cd /media/marcel/Data1/Dev/GamantarayWeb/gamantarayweb
   ```
3. Jalankan *script* otomatis yang telah disediakan:
   ```bash
   ./start_telemetry.sh
   ```
   *(Script ini akan secara otomatis membuka MAVROS di latar belakang dan menjalankan `mavlink_to_supabase.py` untuk melakukan sinkronisasi data ke Supabase).*

---

## Tahap 3: Mengecek Website
1. Jika *server website* belum menyala, buka terminal baru di folder proyek dan jalankan:
   ```bash
   npm run dev
   ```
2. Buka _browser_ dan akses `http://localhost:3000`.
3. Anda akan melihat kapal bergerak secara real-time di peta sesuai dengan koordinat dari Pixhawk!

---

### Cara Menghentikan Telemetri di Ground Station
Jika Anda ingin mematikan sistem telemetri (MAVROS dan *script* Supabase) di komputer Anda, Anda bisa melihat PID (Process ID) yang muncul saat menjalankan `./start_telemetry.sh` dan mematikannya menggunakan perintah `kill`, atau cara paling cepat:
```bash
killall -9 mavros_node
pkill -f mavlink_to_supabase.py
```
