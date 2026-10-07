@echo off
setlocal EnableDelayedExpansion
title KaamWala Development Server

:: =====================================================================
:: 1. Dynamic Directory Detection
:: Navigate to the folder where this batch file is located
:: =====================================================================
cd /d "%~dp0"

:: Validate Node.js is installed and available
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo.
    echo [ERROR] Node.js was not found in your system PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

:: Validate package.json exists in the current directory
if not exist "package.json" (
    echo.
    echo [ERROR] package.json not found in "%~dp0".
    echo Please make sure this script is located in the root project folder.
    echo.
    pause
    exit /b 1
)

:: =====================================================================
:: 2. Network IP Extraction (Wi-Fi / Ethernet IPv4)
:: =====================================================================
set "LOCAL_IP="

:: Try finding the active IP on the default gateway route first
for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-NetRoute -DestinationPrefix '0.0.0.0/0' -ErrorAction SilentlyContinue | Sort-Object RouteMetric | Select-Object -First 1 | Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress"` ) do (
    set "LOCAL_IP=%%A"
)

:: Fallback: Query active IPv4 excluding loopback and APIPA addresses
if "%LOCAL_IP%"=="" (
    for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.InterfaceAlias -notmatch 'Loopback|vEthernet' -and $_.IPAddress -notmatch '^169\.254\.' } | Select-Object -ExpandProperty IPAddress -First 1)"` ) do (
        set "LOCAL_IP=%%A"
    )
)

:: Final fallback if offline
if "%LOCAL_IP%"=="" set "LOCAL_IP=127.0.0.1"

:: =====================================================================
:: 3. Display Connection Info Banner
:: =====================================================================
cls
echo ===============================================================================
echo                           KAAMWALA WEB APPLICATION
echo ===============================================================================
echo.
echo   Localhost URL : http://localhost:3000
echo   Network URL   : http://%LOCAL_IP%:3000
echo.
echo   * To test on mobile devices, connect your phone to the same Wi-Fi and open:
echo     http://%LOCAL_IP%:3000
echo.
echo   * Auto-opening http://localhost:3000 in your default browser in 3-4 seconds...
echo   * Live compilation and HMR logs will appear below.
echo   * Press Ctrl+C in this window at any time to stop the server.
echo.
echo ===============================================================================
echo.

:: =====================================================================
:: 4. Auto-Open Browser (Asynchronous background wait of 3-4 seconds)
:: =====================================================================
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 4; Start-Process 'http://localhost:3000'"

:: =====================================================================
:: 5. Start Next.js Development Server (Bound to 0.0.0.0 for LAN access)
:: =====================================================================
call npm run dev -- -H 0.0.0.0

:: =====================================================================
:: 6. Keep Process Alive if Server Exits / Errors
:: =====================================================================
if %ERRORLEVEL% neq 0 (
    echo.
    echo ===============================================================================
    echo [ERROR] KaamWala server terminated with exit code %ERRORLEVEL%.
    echo Check the error traces above to diagnose the issue.
    echo ===============================================================================
    echo.
) else (
    echo.
    echo [INFO] KaamWala server shut down cleanly.
    echo.
)

pause
