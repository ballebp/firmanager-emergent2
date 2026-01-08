# 🚀 Firmanager Online Deployment

Quick guide to deploy at **https://www.vmp-as.no/firmanager**

## 📦 Files Created

✅ `backend/Dockerfile` - Docker container config
✅ `backend/railway.toml` - Railway deployment config  
✅ `backend/.env.example` - Environment variables template
✅ `frontend/.htaccess` - React Router config for one.com
✅ `frontend/.env.production` - Production backend URL

## 🎯 3-Step Deployment

### 1️⃣ MongoDB Atlas (Database) - 5 minutes

1. Sign up: https://mongodb.com/cloud/atlas/register
2. Create FREE M0 cluster (Europe region)
3. Create user: `firmanager` with strong password
4. Network: Allow access from anywhere (0.0.0.0/0)
5. Get connection string:
   ```
   mongodb+srv://firmanager:PASSWORD@cluster.mongodb.net/firmanager
   ```

### 2️⃣ Railway (Backend) - 10 minutes

1. Sign up: https://railway.app (use GitHub)
2. New Project → Deploy from GitHub
3. Select `firmanager-emergent2` repo
4. Root directory: `/backend`
5. Add variables:
   ```
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=run: python -c "import secrets; print(secrets.token_urlsafe(32))"
   CORS_ORIGINS=https://www.vmp-as.no,http://localhost:3000
   PORT=8000
   ```
6. Deploy & get Railway URL (like: `https://yourapp.railway.app`)

### 3️⃣ one.com (Frontend) - 15 minutes

1. **Update backend URL** in `frontend/.env.production`:
   ```
   REACT_APP_BACKEND_URL=https://your-railway-url.railway.app
   ```

2. **Build**:
   ```bash
   cd frontend
   npm run build
   ```

3. **Upload to one.com**:
   - Create folder: `/public_html/firmanager/`
   - Upload ALL files from `build/` folder
   - **Important**: Upload `.htaccess` file too!

## ✅ Test

Visit: https://www.vmp-as.no/firmanager

Login:
- Admin: `admin@vmp.no` / `admin123`
- User: `user1@vmp.no` / `user123`

## 🔄 Sync PC App

Update `frontend/.env.development`:
```
REACT_APP_BACKEND_URL=https://your-railway-url.railway.app
```

Now PC app connects to same online database = **perfect sync**!

## 💰 Cost

- MongoDB Atlas: **FREE** (512MB)
- Railway: **FREE** ($5 credit/month)
- one.com: Already paid

**Total: $0/month**

## 🆘 Issues?

- **Blank page**: Check `.htaccess` uploaded
- **Login fails**: Seed database: `python seed_data.py`
- **Connection errors**: Verify Railway URL in `.env.production`
- **403 Forbidden**: Check CORS_ORIGINS includes your domain

Done! 🎉
