@echo off
echo ========================================================
echo   ParkSmart - Smart Parking Reservation & Management
echo ========================================================
echo.
echo [1/2] Starting Backend Server (Port 5000)...
start "ParkSmart Backend" cmd /k "cd backend && npm run dev"
timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend Vite Server (Port 5173)...
start "ParkSmart Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================================
echo Application launching!
echo Frontend: http://localhost:5173
echo Backend API: http://localhost:5000
echo ========================================================
