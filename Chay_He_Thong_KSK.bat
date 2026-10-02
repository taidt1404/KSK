@echo off
chcp 65001 > nul
title HE THONG NHAP LIEU KHAM SUC KHOE DINH KY (LAN KSK)

cd /d "%~dp0"

cls
node scripts/getLanIp.js

rem Tự động mở trình duyệt sau 2 giây
start "" powershell -NoProfile -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:3000'"

node src/server.js
pause
