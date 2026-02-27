#!/bin/bash

# Fleet Vision BMS - Deployment Script
# This script helps deploy frontend and backend

echo "╔════════════════════════════════════╗"
echo "║   Fleet Vision BMS Deployment     ║"
echo "╚════════════════════════════════════╝"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Fleet Vision BMS v2.0.0"
    echo "✅ Git initialized"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "Choose deployment option:"
echo "1. Deploy Frontend (Vercel)"
echo "2. Deploy Backend (Railway)"
echo "3. Deploy Both"
echo "4. Build Frontend Only"
echo "5. Test Backend Locally"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo ""
        echo "🎨 Deploying Frontend to Vercel..."
        cd frontend_1/Fleet_Intelligence_Platform
        npm install
        npm run build
        vercel --prod
        cd ../..
        echo "✅ Frontend deployed!"
        ;;
    2)
        echo ""
        echo "🔧 Deploying Backend to Railway..."
        railway up
        echo "✅ Backend deployed!"
        ;;
    3)
        echo ""
        echo "🚀 Deploying Both..."
        
        # Backend
        echo "🔧 Deploying Backend..."
        railway up
        
        # Frontend
        echo "🎨 Deploying Frontend..."
        cd frontend_1/Fleet_Intelligence_Platform
        npm install
        npm run build
        vercel --prod
        cd ../..
        
        echo "✅ Both deployed!"
        ;;
    4)
        echo ""
        echo "🔨 Building Frontend..."
        cd frontend_1/Fleet_Intelligence_Platform
        npm install
        npm run build
        cd ../..
        echo "✅ Frontend built! Check dist/ folder"
        ;;
    5)
        echo ""
        echo "🧪 Testing Backend Locally..."
        pip install -r requirements.txt
        python app.py
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "╔════════════════════════════════════╗"
echo "║   Deployment Complete!            ║"
echo "╚════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "1. Update Arduino WiFi settings with backend URL"
echo "2. Update frontend API URL with backend URL"
echo "3. Test the complete system"
echo ""
