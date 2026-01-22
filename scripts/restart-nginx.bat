@echo off
echo Stopping all nginx processes...
taskkill /F /IM nginx.exe
timeout /t 2 /nobreak >nul

echo Starting nginx...
cd /d C:\nginx
nginx.exe

echo.
echo Checking nginx status...
timeout /t 1 /nobreak >nul
tasklist | findstr nginx

echo.
echo Testing nginx configuration...
nginx.exe -t

echo.
echo Done! Nginx should now be running with a single instance.
pause



