# 🚀 Firmanager Deployment Guide

Dette prosjektet bruker hybrid cloud hosting for gratis/billig drift:
- **Frontend**: DigitalOcean App Platform
- **Backend**: Render.com (gratis tier)
- **Database**: MongoDB Atlas (gratis tier)

## 📋 Steg-for-steg deployment

### 1️⃣ MongoDB Atlas (Database) - 5 minutter

1. Gå til https://www.mongodb.com/cloud/atlas/register
2. Opprett gratis konto
3. Klikk **"Create"** for å lage et nytt cluster
4. Velg **FREE tier** (M0)
5. Velg region nærmest deg (f.eks. Frankfurt/Germany)
6. Klikk **"Create Cluster"**
7. Vent på at clusteret opprettes (~3 minutter)

**Sett opp tilgang:**
1. Klikk **"Database Access"** i venstre meny
2. Klikk **"Add New Database User"**
3. Lag en bruker med passord (lagre dette!)
4. Gi rollen: **"Read and write to any database"**

**Sett opp nettverk:**
1. Klikk **"Network Access"** i venstre meny
2. Klikk **"Add IP Address"**
3. Velg **"Allow Access from Anywhere"** (0.0.0.0/0)
4. Klikk **"Confirm"**

**Få tilkoblings-URL:**
1. Gå tilbake til **"Database"**
2. Klikk **"Connect"** på clusteret ditt
3. Velg **"Connect your application"**
4. Kopier connection string (ser slik ut):
   ```
   mongodb+srv://brukernavn:<password>@cluster0.xxxxx.mongodb.net/
   ```
5. Erstatt `<password>` med ditt faktiske passord
6. **LAGRE DENNE URL-en** - du trenger den straks!

---

### 2️⃣ Render.com (Backend) - 10 minutter

**Først: Push kode til GitHub**

1. Gå til https://github.com/new
2. Opprett nytt repository: `firmanager-emergent`
3. **IKKE** kryss av "Initialize with README"
4. Klikk **"Create repository"**

**I terminalen din, kjør:**
```powershell
cd C:\firmanager-emergent\firmanager-emergent-main\firmanager-emergent-main
git add .
git commit -m "Initial commit for deployment"
git branch -M main
git remote add origin https://github.com/DIN-BRUKER/firmanager-emergent.git
git push -u origin main
```
(Erstatt `DIN-BRUKER` med ditt GitHub brukernavn)

**Deploy backend:**

1. Gå til https://render.com og opprett konto (bruk GitHub login)
2. Klikk **"New +"** → **"Web Service"**
3. Koble til GitHub repository: `firmanager-emergent`
4. Fyll ut:
   - **Name**: `firmanager-backend`
   - **Region**: Frankfurt (eller nærmest deg)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free**

5. Klikk **"Advanced"** og legg til Environment Variables:
   ```
   MONGO_URL = mongodb+srv://... (din URL fra MongoDB Atlas)
   DB_NAME = firmanager
   SECRET_KEY = [auto-generate ved å klikke "Generate"]
   CORS_ORIGINS = *
   ```

6. Klikk **"Create Web Service"**
7. Vent på deployment (~5 minutter)
8. **LAGRE backend URL** (f.eks. `https://firmanager-backend.onrender.com`)

**Test backend:**
Gå til: `https://firmanager-backend.onrender.com/docs`
Du skal se FastAPI dokumentasjon!

---

### 3️⃣ DigitalOcean App Platform (Frontend) - 10 minutter

**Oppdater frontend config først:**

1. Rediger `.do/app.yaml`:
   - Endre `your-username` til ditt GitHub brukernavn
   - Endre `your-backend-app.onrender.com` til din faktiske Render URL

2. Commit og push:
```powershell
git add .
git commit -m "Update deployment config"
git push
```

**Deploy frontend:**

1. Gå til https://cloud.digitalocean.com
2. Opprett konto (få $200 kreditt i 60 dager!)
3. Klikk **"Create"** → **"Apps"**
4. Velg **"GitHub"** som kilde
5. Velg repository: `firmanager-emergent`
6. DigitalOcean vil automatisk detektere React appen
7. Sett:
   - **Source Directory**: `/frontend`
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: `build`
   
8. Legg til Environment Variable:
   ```
   REACT_APP_BACKEND_URL = https://firmanager-backend.onrender.com
   ```

9. Velg plan: **Basic (starter)** eller **Static Site (gratis)**
10. Klikk **"Create Resources"**
11. Vent på deployment (~5 minutter)

**Koble til eget domene (valgfritt):**

1. I DigitalOcean app, gå til **"Settings"** → **"Domains"**
2. Klikk **"Add Domain"**
3. Skriv inn: `www.vmp-as.no`
4. DigitalOcean vil gi deg DNS records å legge til hos domeneleverandøren din

---

### 4️⃣ Seed database (sett inn testdata)

Etter backend er deployet:

1. Gå til Render.com dashboard
2. Klikk på `firmanager-backend` servicen
3. Klikk **"Shell"** (øverst til høyre)
4. Kjør:
```bash
python seed_data.py
```

---

## ✅ Ferdig!

Din app kjører nå på:
- **Frontend**: https://firmanager-xxxxx.ondigitalocean.app (eller www.vmp-as.no)
- **Backend**: https://firmanager-backend.onrender.com
- **Database**: MongoDB Atlas

**Testbrukere:**
- admin@biovac.no / admin123
- bruker@biovac.no / user123
- test@test.com / test

---

## 💰 Kostnader

**Månedlig kostnad etter gratis perioder:**
- MongoDB Atlas: **$0** (gratis tier)
- Render.com: **$0** (gratis tier, sleeper etter 15 min inaktivitet)
- DigitalOcean: **$0-3** (static site er gratis, eller $3/måned for basic)

**Total: $0-3/måned** 🎉

---

## 🔧 Oppdatering senere

For å deploye nye endringer:
```powershell
git add .
git commit -m "Beskrivelse av endring"
git push
```

Render og DigitalOcean deployer automatisk!
