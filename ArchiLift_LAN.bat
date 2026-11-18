@echo off
chcp 65001 >nul
title ArchiLift (LAN, chia se truc tiep) - Archivina
cd /d "%~dp0"
echo ============================================================
echo  ArchiLift dang chay - CHIA SE TRUC TIEP TRONG MANG LAN
echo  Tren may nay:  http://localhost:8765/index.html
echo  May khac:      http://IP-BEN-DUOI:8765/index.html
echo  Mot nguoi sua (bam "Xin sua"), nguoi khac xem tu cap nhat.
echo  Du an chia se luu tai: _shared\ArchiLift_chung.json
echo ============================================================
ipconfig | findstr /i "IPv4"
echo ------------------------------------------------------------
echo  Dong cua so nay de tat phan mem.
start "" cmd /c "timeout /t 1 >nul & start http://localhost:8765/index.html"
python serve.py 8765 0.0.0.0
if errorlevel 1 (
  echo Khong chay duoc Python - mo truc tiep file index.html (khong chia se)
  start "" "%~dp0app\index.html"
  pause
)
