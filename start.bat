@echo off
echo ================================
echo  School Management System
echo ================================
echo.
echo Starting Backend Server (port 5000)...
echo Make sure MongoDB is running!
echo.
start "Backend Server" cmd /k "cd /d %~dp0backend && node server.js"
timeout /t 2 /nobreak >nul
echo.
echo Backend started!
echo.
echo Open your browser and go to:
echo   http://localhost:5000/api/health  (check backend)
echo   Open frontend\index.html          (public website)
echo   Open frontend\login.html          (login page)
echo.
echo Admin Login: admin@school.com / admin123
echo Run 'npm run seed' in backend folder first!
echo.
pause
