@echo off
title Khoi dong LifeOS
color 0A

echo ====================================================================
echo                   [START] LIFEOS - KHOI DONG HE THONG
echo ====================================================================
echo.

set "ROOT_DIR=%~dp0"
cd /d "%ROOT_DIR%"

:: 1. Kiem tra Python
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong tim thay Python trong he thong!
    echo Vui long cai dat Python va tich chon "Add Python to PATH".
    echo.
    pause
    exit /b 1
)

:: 2. Kiem tra Node.js / npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Khong tim thay Node.js / npm trong he thong!
    echo Vui long cai dat Node.js tu https://nodejs.org/
    echo.
    pause
    exit /b 1
)

:: 3. Don dep cac tien trinh cu tren cong 8000 va 5173
echo [*] Dang kiem tra va giai phong cong 8000 va 5173...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>nul
)

:: 4. Khoi dong Backend
echo [*] Dang khoi dong Backend (FastAPI - Port 8000)...
start "LifeOS - Backend (FastAPI)" cmd /k "title LifeOS - Backend && cd /d "%ROOT_DIR%backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

:: 5. Khoi dong Frontend
echo [*] Dang khoi dong Frontend (Vite - Port 5173)...
start "LifeOS - Frontend (Vite)" cmd /k "title LifeOS - Frontend && cd /d "%ROOT_DIR%frontend" && npm run dev"

:: 6. Doi 3 giay de server san sang roi tu dong mo trinh duyet
echo [*] Dang chuan bi mo trinh duyet Web...
ping -n 4 127.0.0.1 >nul

start "" "http://localhost:5173/"

echo.
echo ====================================================================
echo                   [OK] LIFEOS DA KHOI DONG THANH CONG!
echo ====================================================================
echo.
echo  - Frontend Web UI : http://localhost:5173/
echo  - Backend API Docs: http://127.0.0.1:8000/docs
echo.
echo  * Huong dan:
echo    - Hai cua so console cua Backend va Frontend dang chay doc lap.
echo    - De tat toan bo he thong, ban co the dong 2 cua so do hoac chay file "stop.bat".
echo ====================================================================
echo.
echo Cua so nay se tu dong dong sau 5 giay...
timeout /t 5 >nul 2>nul || ping -n 6 127.0.0.1 >nul
