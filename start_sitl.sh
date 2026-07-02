#!/bin/bash
echo "Menghapus semua file cache yang mungkin tersisa..."
rm -f eeprom.bin mav.parm mav.tlog

echo "Menjalankan SITL dengan koordinat UGM..."
sim_vehicle.py -v rover --console --map --custom-location=-7.769386,110.382935,110,0
