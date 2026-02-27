@echo off
echo ========================================
echo EVOLVE.3X BMS Server Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo [1/3] Checking Python dependencies...
pip install -q -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [2/3] Checking if frontend is built...
if not exist "frontend_1\Fleet_Intelligence_Platform\dist\index.html" (
    echo WARNING: Frontend not built yet
    echo Run: cd frontend_1\Fleet_Intelligence_Platform ^&^& npm run build
    echo.
    echo Starting with simple BMS control only...
    echo Access at: http://localhost:5000/bms
) else (
    echo Frontend build found!
    echo React app will be available at: http://localhost:5000
)

echo.
echo [3/3] Starting Flask server...
echo ========================================
echo.
python app.py
