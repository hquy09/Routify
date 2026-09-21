@echo off
title Tat LifeOS
color 0C

echo ====================================================================
echo                   [STOP] LIFEOS - DUNG HE THONG
echo ====================================================================
echo.
echo [*] Dang tat cac tien trinh Backend (Port 8000) va Frontend (Port 5173)...

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

echo.
echo [OK] Da tat sach toan bo dich vu cua LifeOS!
echo ====================================================================
echo.
timeout /t 3 >nul 2>nul || ping -n 4 127.0.0.1 >nul
