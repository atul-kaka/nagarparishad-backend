@echo off
REM Database Backup Script for Windows
REM This script can be scheduled using Windows Task Scheduler

cd /d "%~dp0\.."
echo ========================================
echo Nagar Parishad Database Backup
echo ========================================
echo Date: %date%
echo Time: %time%
echo ========================================

call npm run backup

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup completed successfully!
) else (
    echo.
    echo Backup failed with error code: %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo ========================================
echo Backup process finished
echo ========================================

