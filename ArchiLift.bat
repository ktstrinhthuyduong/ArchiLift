@echo off
chcp 65001 >nul
title ArchiLift - Archivina
cd /d "%~dp0app"
echo Dang chay ArchiLift tai http://localhost:8765  (dong cua so nay de tat)
start "" cmd /c "timeout /t 1 >nul & start http://localhost:8765/index.html"
python -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 (
  echo Khong chay duoc Python - mo truc tiep file index.html
  start "" "%~dp0app\index.html"
  pause
)
