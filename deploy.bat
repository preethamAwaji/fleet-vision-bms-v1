@echo off
REM Fleet Vision BMS - Deployment Script (Windows)

echo ╔════════════════════════════════════╗
echo ║   Fleet Vision BMS Deployment     ║
echo ╚════════════════════════════════════╝
echo.

REM Check if git is initialized
if not exist ".git" (
    echo 📦 Initializing Git repository...
    git init
    git add .
    git commit -m "Initial commit - Fleet Vision BMS v2.0.0"
    echo ✅ Git initialized
) else (
    echo ✅ Git repository already initialized
)

echo.
echo Choose deployment option:
echo 1. Deploy Frontend (Vercel)
echo 2. Deploy Backend (Railway)
echo 3. Deploy Both
echo 4. Build Frontend Only
echo 5. Test Backend Locally
echo.
set /p choice="Enter choice (1-5): "

if "%choice%"=="1" goto frontend
if "%choice%"=="2" goto backend
if "%choice%"=="3" goto both
if "%choice%"=="4" goto build
if "%choice%"=="5" goto test
goto invalid

:frontend
echo.
echo 🎨 Deploying Frontend to Vercel...
cd frontend_1\Fleet_Intelligence_Platform
call npm install
call npm run build
call vercel --prod
cd ..\..
echo ✅ Frontend deployed!
goto end

:backend
echo.
echo 🔧 Deploying Backend to Railway...
call railway up
echo ✅ Backend deployed!
goto end

:both
echo.
echo 🚀 Deploying Both...

REM Backend
echo 🔧 Deploying Backend...
call railway up

REM Frontend
echo 🎨 Deploying Frontend...
cd frontend_1\Fleet_Intelligence_Platform
call npm install
call npm run build
call vercel --prod
cd ..\..

echo ✅ Both deployed!
goto end

:build
echo.
echo 🔨 Building Frontend...
cd frontend_1\Fleet_Intelligence_Platform
call npm install
call npm run build
cd ..\..
echo ✅ Frontend built! Check dist\ folder
goto end

:test
echo.
echo 🧪 Testing Backend Locally...
pip install -r requirements.txt
python app.py
goto end

:invalid
echo ❌ Invalid choice
exit /b 1

:end
echo.
echo ╔════════════════════════════════════╗
echo ║   Deployment Complete!            ║
echo ╚════════════════════════════════════╝
echo.
echo Next steps:
echo 1. Update Arduino WiFi settings with backend URL
echo 2. Update frontend API URL with backend URL
echo 3. Test the complete system
echo.
pause
