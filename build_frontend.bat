@echo off
echo ========================================
echo Building React Frontend
echo ========================================
echo.

cd frontend_1\Fleet_Intelligence_Platform

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing npm dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: npm install failed
        pause
        exit /b 1
    )
) else (
    echo [1/2] Dependencies already installed
)

echo.
echo [2/2] Building production bundle...
call npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo Build complete!
echo ========================================
echo.
echo Production files created in: dist/
echo.
echo Next steps:
echo 1. Run: start_server.bat
echo 2. Open: http://localhost:5000
echo 3. Connect Arduino to send BMS data
echo.
pause
