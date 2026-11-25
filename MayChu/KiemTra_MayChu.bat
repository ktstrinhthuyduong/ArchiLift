@echo off
rem ArchiLift - kiem tra may truoc khi cai, KHONG thay doi gi (khong can quyen quan tri)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0CaiDat_MayChu.ps1" -ThuNghiem
