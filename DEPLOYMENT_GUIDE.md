# Fleet Vision - Deployment Guide

## 🚀 Overview

This guide covers deploying Fleet Vision BMS to production:
- **Frontend**: Vercel (Free tier)
- **Backend**: Render/Railway (Free tier)
- **Database**: SQLite (included) or upgrade to PostgreSQL

## 📦 Project Structure

```
vsd-bms/
├── frontend_1/Fleet_Intelligence_Platform/  # React frontend
├── app.py                                    # Flask backend
├── requirements.txt                          # Python dependencies
├── Procfile                                  # Backend deployment config
├── runtime.txt                               # Python version
├── vercel.json                               # Frontend deployment config
├── *.pkl                                     # ML models
├── bms_data.db                               # SQLite database
└── vsd_bms_fleet_vision.ino                 # Arduino code
```

---

## 🎨 Frontend Deployment (Vercel)

### Option 1: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Navigate to frontend directory**
   ```bash
   cd frontend_1/Fleet_Intelligence_Platform
   ```

3. **Build the project**
   ```bash
   npm install
   npm run build
   ```

4. **Deploy to Vercel**
   ```bash
   vercel
   ```

5. **Follow prompts:**
   - Set up and deploy? `Y`
   - Which scope? (Select your account)
   - Link to existing project? `N`
   - Project name? `fleet-vision-bms`
   - Directory? `./`
   - Override settings? `N`

6. **Production deployment**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via Vercel Dashboard

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/fleet-vision-bms.git
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - Framework Preset: `Vite`
     - Root Directory: `frontend_1/Fleet_Intelligence_Platform`
     - Build Command: `npm run build`
     - Output Directory: `dist`

3. **Environment Variables** (if needed)
   - Add in Vercel dashboard under Settings → Environment Variables
   - `VITE_API_URL`: Your backend URL

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### Update API URL in Frontend

After backend deployment, update the API URL:

```typescript
// frontend_1/Fleet_Intelligence_Platform/src/config.ts
export const API_URL = 'https://your-backend-url.onrender.com';
```

---

## 🔧 Backend Deployment (Render)

### Step 1: Prepare Backend

1. **Ensure all files are ready**
   - ✅ `app.py`
   - ✅ `requirements.txt`
   - ✅ `Procfile`
   - ✅ `runtime.txt`
   - ✅ ML model files (*.pkl)

2. **Update CORS settings in app.py**
   ```python
   # Allow your Vercel frontend domain
   CORS(app, origins=["https://your-frontend.vercel.app"])
   ```

### Step 2: Deploy to Render

1. **Push to GitHub** (if not already done)

2. **Create Render account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `fleet-vision-backend`
     - Environment: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `gunicorn app:app`
     - Instance Type: `Free`

4. **Environment Variables** (Optional)
   - Add any secrets or config

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)

6. **Get Backend URL**
   - Copy the URL: `https://fleet-vision-backend.onrender.com`

### Alternative: Railway Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   railway up
   ```

5. **Add domain**
   ```bash
   railway domain
   ```

---

## 🗄️ Database Configuration

### SQLite (Default - Free)
- Included in deployment
- Suitable for single-instance deployments
- Data persists in container (may be lost on restart)

### Upgrade to PostgreSQL (Recommended for Production)

1. **Add PostgreSQL to Render**
   - In Render dashboard, create new PostgreSQL database
   - Copy connection string

2. **Update app.py**
   ```python
   import os
   from sqlalchemy import create_engine
   
   # Use PostgreSQL if available, else SQLite
   DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///bms_data.db')
   
   # For PostgreSQL
   if DATABASE_URL.startswith('postgres://'):
       DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
   ```

3. **Add to requirements.txt**
   ```
   psycopg2-binary==2.9.9
   sqlalchemy==2.0.23
   ```

---

## 🔐 Environment Variables

### Backend (.env or Render/Railway dashboard)
```env
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
SECRET_KEY=your-secret-key-here
CORS_ORIGINS=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```env
VITE_API_URL=https://your-backend.onrender.com
```

---

## 📡 Arduino Configuration

Update WiFi and server settings in `vsd_bms_fleet_vision.ino`:

```cpp
const char* WIFI_SSID = "YourWiFiName";
const char* WIFI_PASS = "YourPassword";
const char* SERVER_HOST = "your-backend.onrender.com";  // Your deployed backend
const int SERVER_PORT = 443;  // HTTPS port (or 80 for HTTP)
```

**Note:** You may need to update the HTTP request to use HTTPS:
```cpp
// Change POST request to use HTTPS
sprintf(cmd, "AT+CIPSTART=\"SSL\",\"%s\",%d", SERVER_HOST, SERVER_PORT);
```

---

## ✅ Post-Deployment Checklist

### Frontend
- [ ] Build completes without errors
- [ ] Site loads correctly
- [ ] API calls work (check browser console)
- [ ] All routes accessible
- [ ] Responsive design works

### Backend
- [ ] Server starts without errors
- [ ] Database initializes
- [ ] API endpoints respond
- [ ] CORS configured correctly
- [ ] ML models load successfully

### Arduino
- [ ] WiFi connects
- [ ] Data sends to backend
- [ ] Backend receives and processes data
- [ ] Frontend displays real-time data

---

## 🔍 Troubleshooting

### Frontend Issues

**Build fails:**
```bash
cd frontend_1/Fleet_Intelligence_Platform
npm install
npm run build
# Check for errors
```

**API calls fail:**
- Check CORS settings in backend
- Verify API URL in frontend config
- Check browser console for errors

### Backend Issues

**Deployment fails:**
- Check `requirements.txt` for incompatible versions
- Verify Python version in `runtime.txt`
- Check logs in Render/Railway dashboard

**Database errors:**
- Ensure database file permissions
- Check SQLite version compatibility
- Consider upgrading to PostgreSQL

**ML models not loading:**
- Ensure .pkl files are in repository
- Check file paths in app.py
- Verify scikit-learn/tensorflow versions match training

### Arduino Issues

**Can't connect to backend:**
- Verify backend URL is accessible
- Check if backend requires HTTPS
- Test with HTTP first, then upgrade to HTTPS
- Ensure firewall allows incoming connections

---

## 📊 Monitoring

### Render Dashboard
- View logs
- Monitor CPU/Memory usage
- Check request metrics

### Vercel Analytics
- Enable in Vercel dashboard
- Track page views
- Monitor performance

---

## 💰 Cost Estimates

### Free Tier Limits

**Vercel (Frontend)**
- ✅ 100 GB bandwidth/month
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ Automatic HTTPS

**Render (Backend)**
- ✅ 750 hours/month
- ✅ 512 MB RAM
- ⚠️ Spins down after 15 min inactivity
- ⚠️ Cold start delay (~30 seconds)

**Railway (Alternative)**
- ✅ $5 free credit/month
- ✅ No sleep/cold starts
- ✅ Better for real-time apps

### Upgrade Recommendations

For production with multiple vehicles:
- **Backend**: Render Starter ($7/month) or Railway Pro ($5/month)
- **Database**: Render PostgreSQL ($7/month)
- **Frontend**: Vercel Pro ($20/month) for team features

---

## 🚀 Quick Deploy Commands

```bash
# Frontend (Vercel)
cd frontend_1/Fleet_Intelligence_Platform
npm install && npm run build
vercel --prod

# Backend (Railway)
railway login
railway init
railway up

# Or Backend (Render)
# Use Render dashboard to connect GitHub repo
```

---

## 📞 Support

- Documentation: See `FLEET_VISION_BMS_DOCUMENTATION.md`
- Quick Start: See `QUICK_START_GUIDE.md`
- Issues: Create GitHub issue

---

**Fleet Vision BMS** - Ready for Production Deployment! 🎉
