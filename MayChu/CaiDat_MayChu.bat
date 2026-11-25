@echo off
rem ArchiLift - cai dat may chu luon bat (tu xin quyen quan tri roi chay CaiDat_MayChu.ps1)
net session >nul 2>&1
if errorlevel 1 (
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CaiDat_MayChu.ps1"
