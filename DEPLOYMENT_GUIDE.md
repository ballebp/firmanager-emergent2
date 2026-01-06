# Firmanager Deployment Guide

## 📋 Quick Overview

**Application:** Firmanager - Business Management System  
**Repository:** https://github.com/ballebp/firmanager-emergent2

### Technology Stack
- **Frontend:** React 19.0.0, Tailwind CSS, Radix UI
- **Backend:** FastAPI 0.110.1, Python 3.11.7
- **Database:** MongoDB Atlas (Free Tier - 512MB)
- **Hosting:** 
  - Backend: Render.com (Free Tier)
  - Frontend: Vercel (Free Tier)

---

## 🌐 Production URLs

| Service | URL | Status |
|---------|-----|--------|
| **Frontend** | Your Vercel URL | ✅ Live |
| **Backend API** | https://firmanager-backend.onrender.com | ✅ Live |
| **Database** | MongoDB Atlas | ✅ Connected |

### Test Credentials

```
Admin User:
- Email: admin@biovac.no
- Password: admin123

Regular User:
- Email: bruker@biovac.no
- Password: user123

Test User:
- Email: test@test.com
- Password: test
```

---

## 🚀 Deployment Steps (From Scratch)

### 1. MongoDB Atlas Setup

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create new cluster (Free M0 tier)
4. **Database Access:**
   - Create user: `firmanager`
   - Set password (save it!)
   - Database User Privileges: Read/Write to any database
5. **Network Access:**
   - Add IP: `0.0.0.0/0` (Allow from anywhere)
6. **Get Connection String:**
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Format: `mongodb+srv://firmanager:<password>@cluster0.ywavpsm.mongodb.net/`

### 2. Seed Production Database

From your local machine:

```powershell
# Set environment variable
$env:MONGO_URL="mongodb+srv://firmanager:<password>@cluster0.ywavpsm.mongodb.net/"

# Navigate to backend folder
cd backend

# Run seed script
python seed_data.py
```

This creates:
- 3 test users
- 8 employees
- 30 customers
- 50 work orders
- 21 products
- Routes, HMS data, economy data

### 3. Backend Deployment (Render.com)

#### A. Prepare Files

**backend/runtime.txt:**
```
python-3.11.7
```

**backend/requirements.txt:**
```
fastapi==0.110.1
uvicorn[standard]==0.25.0
motor==3.3.1
python-dotenv==1.0.0
pydantic[email]==2.5.2
PyJWT==2.8.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pandas==2.1.3
openpyxl==3.1.2
```

#### B. Deploy to Render

1. Go to https://render.com
2. Sign up with GitHub
3. **Create New Web Service:**
   - Connect repository: `ballebp/firmanager-emergent2`
   - Name: `firmanager-backend`
   - Region: Choose closest
   - Branch: `main`
   - **Root Directory:** `backend` ⚠️ IMPORTANT
   - Runtime: Python 3
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - Instance Type: Free

4. **Environment Variables:**
   ```
   MONGO_URL = mongodb+srv://firmanager:<password>@cluster0.ywavpsm.mongodb.net/
   DB_NAME = firmanager
   SECRET_KEY = your-super-secret-jwt-key-change-this-in-production
   CORS_ORIGINS = *
   ```

5. Click **Create Web Service**
6. Wait 5-10 minutes for deployment
7. Verify: Visit `https://your-backend-url.onrender.com/health`
   - Should return: `{"status":"healthy","database":"connected"}`

### 4. Frontend Deployment (Vercel)

#### A. Prepare Configuration

**frontend/.npmrc:**
```
legacy-peer-deps=true
```

**frontend/.env.production:**
```
PUBLIC_URL=/filemanager
REACT_APP_BACKEND_URL=https://firmanager-backend.onrender.com
```

#### B. Deploy to Vercel

**Option 1: CLI (Fastest)**
```powershell
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend folder
cd frontend

# Login
vercel login

# Deploy to production
vercel --prod
```

**Option 2: Dashboard (Easier)**
1. Go to https://vercel.com/new
2. Import Git Repository: `ballebp/firmanager-emergent2`
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`
   - **Environment Variables:**
     - `REACT_APP_BACKEND_URL` = `https://firmanager-backend.onrender.com`
4. Click **Deploy**
5. Wait 2-3 minutes

---

## 📁 Important Files & Their Purpose

### Backend Configuration

| File | Purpose | Key Content |
|------|---------|-------------|
| `backend/runtime.txt` | Specifies Python version for Render | `python-3.11.7` |
| `backend/requirements.txt` | Python dependencies | FastAPI, Motor, JWT, etc. |
| `backend/server.py` | Main FastAPI application | All API endpoints |
| `backend/seed_data.py` | Database seeding script | Creates test data |
| `backend/.env` | Local environment variables | Not committed to git |

### Frontend Configuration

| File | Purpose | Key Content |
|------|---------|-------------|
| `frontend/.npmrc` | npm configuration | `legacy-peer-deps=true` |
| `frontend/.env.production` | Production environment vars | Backend URL |
| `frontend/package.json` | Dependencies and scripts | React, Tailwind, etc. |
| `frontend/src/services/api.js` | API client configuration | Axios with backend URL |

### GitHub Repository

| File | Purpose |
|------|---------|
| `.do/app.yaml` | DigitalOcean config (alternative) |
| `README.md` | Project documentation |
| `DEPLOYMENT_GUIDE.md` | This file |

---

## 🔧 Common Commands

### Local Development

```powershell
# Backend (from project root)
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn server:app --reload

# Frontend (from project root)
cd frontend
npm install --legacy-peer-deps
npm start
```

### Database Operations

```powershell
# Seed production database
$env:MONGO_URL="mongodb+srv://firmanager:<password>@cluster0.ywavpsm.mongodb.net/"
cd backend
python seed_data.py

# Seed local database
$env:MONGO_URL="mongodb://localhost:27017"
python seed_data.py
```

### Git Operations

```powershell
# Add all changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### Deployment

```powershell
# Redeploy backend (Render)
# - Automatic on git push
# - Or manual via Render dashboard

# Redeploy frontend (Vercel)
vercel --prod
# Or automatic on git push if configured
```

---

## 🐛 Troubleshooting

### Backend Won't Start on Render

**Issue:** "Exited with status 1"

**Solutions:**
1. Check Python version is `3.11.7` (not 3.13)
2. Verify Root Directory is set to `backend`
3. Check environment variables are set correctly
4. Review logs in Render dashboard

### Frontend Build Fails

**Issue:** "ERESOLVE could not resolve"

**Solution:**
- Ensure `.npmrc` file exists with `legacy-peer-deps=true`
- Clear Vercel cache and redeploy

### Cannot Connect to Database

**Issue:** Connection timeout or authentication failed

**Solutions:**
1. Check MongoDB Atlas Network Access allows `0.0.0.0/0`
2. Verify password in connection string is correct
3. Ensure Database User has correct privileges
4. Check MONGO_URL environment variable format

### CORS Errors

**Issue:** Frontend can't access backend API

**Solutions:**
1. Verify backend CORS_ORIGINS includes frontend URL
2. Check frontend REACT_APP_BACKEND_URL is correct
3. Ensure backend is running and healthy

---

## 📊 Application Features

### Available Modules
- **Dashboard** - Overview and statistics
- **Customers** - Customer management (30 seeded)
- **Employees** - Employee management (8 seeded)
- **Work Orders** - Service planning (50 seeded)
- **Products** - Product catalog (21 seeded)
- **Routes** - Route optimization
- **HMS** - Health & Safety management
- **Internal** - Internal task tracking
- **Invoicing** - Invoice generation
- **Economy** - Financial overview
- **Results** - Reporting and analytics

### Database Collections
```
firmanager
├── users (authentication)
├── customers
├── employees
├── workorders
├── internalorders
├── products
├── routes
├── hms_riskassessments
├── hms_incidents
├── hms_training
├── hms_equipment
├── payouts
├── services
└── supplier_pricing
```

---

## 🔐 Security Considerations

### Production Checklist
- ✅ Change SECRET_KEY in production
- ✅ Use strong passwords for database
- ✅ Enable 2FA on all services
- ⚠️ Consider restricting CORS_ORIGINS to specific domains
- ⚠️ Add rate limiting to API
- ⚠️ Implement logging and monitoring
- ⚠️ Regular database backups

### Environment Variables (Never Commit)
```
MONGO_URL
SECRET_KEY
DB_NAME
```

---

## 💰 Free Tier Limitations

### Render.com (Backend)
- ⏰ Spins down after 15 minutes of inactivity
- 🕐 First request after spin-down takes 30-60 seconds
- 💾 512 MB RAM
- 🔄 Automatic deployments from GitHub

### Vercel (Frontend)
- ✅ Always on
- 🚀 Fast global CDN
- 🔄 Automatic deployments from GitHub
- 📊 100 GB bandwidth/month

### MongoDB Atlas (Database)
- 💾 512 MB storage
- ⚡ Shared cluster
- ✅ Always on
- 🔒 Automatic backups (limited)

---

## 📝 Next Steps & Improvements

### Immediate
- [ ] Change SECRET_KEY to strong random value
- [ ] Update test passwords
- [ ] Add your custom domain
- [ ] Set up monitoring/alerts

### Future Enhancements
- [ ] Implement role-based access control
- [ ] Add email notifications
- [ ] Implement file upload for product images
- [ ] Add data export functionality
- [ ] Implement search filters
- [ ] Add mobile responsive improvements
- [ ] Set up CI/CD pipeline
- [ ] Add unit tests

---

## 🆘 Support & Resources

### Documentation
- FastAPI: https://fastapi.tiangolo.com
- React: https://react.dev
- MongoDB: https://www.mongodb.com/docs/atlas/
- Render: https://render.com/docs
- Vercel: https://vercel.com/docs

### Your Resources
- **Repository:** https://github.com/ballebp/firmanager-emergent2
- **Backend:** https://firmanager-backend.onrender.com
- **Frontend:** [Your Vercel URL]
- **Database:** MongoDB Atlas Dashboard

---

## 📧 Contact & Maintenance

Remember to:
1. Keep dependencies updated regularly
2. Monitor error logs
3. Backup database before major changes
4. Test in development before deploying to production
5. Document any custom changes

---

**Last Updated:** January 6, 2026  
**Version:** 1.0  
**Deployment Date:** January 6, 2026
