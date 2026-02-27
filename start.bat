@echo off
echo Starting Anon eCommerce Website...
echo.
echo Backend Server:
cd backend
start "Backend Server" cmd /k "npm start"
timeout /t 3 /nobreak >nul
cd ..
echo.
echo Frontend Server:
start "Frontend Server" cmd /k "python -m http.server 3000"
echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
