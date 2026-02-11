@echo off
REM Stock Bot Background Monitor Startup Script
REM This script starts the background monitoring service

echo ========================================
echo Premium Quant Dashboard - Monitor
echo ========================================
echo.

REM Check if .env.local exists
if not exist ".env.local" (
    echo ERROR: .env.local file not found!
    echo Please create .env.local with required environment variables.
    echo.
    pause
    exit /b 1
)

echo Starting background monitor...
echo Press Ctrl+C to stop
echo.

REM Start the monitor
node scripts\monitor.js

pause
