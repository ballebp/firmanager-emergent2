# Firmanager V3 - Distribution Guide

## 🎯 What You Have

A **standalone desktop application** that works on any Windows PC without requiring:
- ❌ No Terminal/Command Prompt needed
- ❌ No local database installation
- ❌ No backend server setup
- ✅ Just install and run!

## 📦 Installer Location

**File**: `frontend/dist/Firmanager Setup 3.0.0.exe`  
**Size**: 113 MB  
**Type**: Windows Installer (NSIS)

## 🚀 How to Distribute

### Option 1: Send File Directly
1. Navigate to `frontend/dist/`
2. Copy `Firmanager Setup 3.0.0.exe`
3. Send via:
   - Email (if size allowed)
   - USB drive
   - Cloud storage (Google Drive, Dropbox, OneDrive)
   - File transfer services (WeTransfer, Send Anywhere)

### Option 2: Create ZIP Archive
```powershell
# Create a ZIP file for easy sharing
Compress-Archive -Path "frontend\dist\Firmanager Setup 3.0.0.exe" -DestinationPath "Firmanager-v3.0.0-Windows.zip"
```

### Option 3: Host on Website
Upload to your website and provide download link:
```html
<a href="/downloads/Firmanager-Setup-3.0.0.exe">Download Firmanager for Windows</a>
```

## 💻 Installation Instructions (for Recipients)

### On Recipient's Computer:
1. **Download/Receive** the `Firmanager Setup 3.0.0.exe` file
2. **Double-click** the installer
3. **Windows SmartScreen Warning** may appear (since app isn't code-signed):
   - Click "More info"
   - Click "Run anyway"
4. **Choose installation location** (or use default)
5. **Installation completes** in 30-60 seconds
6. **Launch Firmanager** from:
   - Desktop shortcut (if created)
   - Start Menu → Firmanager
7. **Register account** or login
8. **Start using** immediately!

## ☁️ Data Storage

### Current Setup: Cloud-Based
- **Backend**: Hosted on Render.com (https://firmanager-backend.onrender.com)
- **Database**: MongoDB Atlas (cloud database)
- **Benefits**:
  - ✅ Data accessible from any device
  - ✅ No local backup needed
  - ✅ Automatic cloud backup
  - ✅ Multi-device sync
  - ✅ Works on any PC/laptop

### Data Access
- All user data, customers, routes, products stored in cloud
- Each organization has separate data
- Login from any installed instance to access your data

## 🔐 Licensing System

### Trial Mode (Default)
- **Duration**: 14 days from activation
- **Limits**: 50 customers, 20 routes, 100 products
- **HMS Module**: Enabled
- **Activation**: Automatic on first "Start Trial" click

### Paid Licenses
To generate paid license keys:
1. Log in as admin to backend
2. POST to `/api/licenses/generate`
3. Email license key to customer
4. Customer enters key in "Enter License Key" modal

### License Tiers
- **Free**: 10 customers, 5 routes, 20 products (no HMS)
- **Professional**: Unlimited everything + HMS
- **Enterprise**: Professional + multi-user

## ⚠️ Windows SmartScreen Warning

Since the app isn't code-signed, Windows will show a warning:

### What Users See:
```
Windows protected your PC
Microsoft Defender SmartScreen prevented an unrecognized app from starting.
```

### How to Bypass:
1. Click "More info"
2. Click "Run anyway"

### To Remove Warning (Optional):
Get a code signing certificate ($200-400/year):
- DigiCert Code Signing Certificate
- Sectigo Code Signing Certificate
- Then rebuild installer with certificate

## 📱 Platform Support

### Currently Supported:
- ✅ Windows 10/11 (64-bit)

### Future Support (requires building):
- ⏳ macOS (requires Mac to build)
- ⏳ Linux (easy to add)
- ⏳ iOS/Android (would need React Native rebuild)

## 🔄 Updates

### Manual Updates (Current):
1. Build new installer with updated version number
2. Distribute new .exe file
3. Users uninstall old version and install new

### Auto-Update (Future Enhancement):
- Install `electron-updater` package
- Configure update server
- App checks for updates on startup
- Download and install automatically

## 📧 Distribution Checklist

Before sending to customers:

- [ ] Test installer on clean Windows PC
- [ ] Verify app connects to cloud backend
- [ ] Confirm trial license activation works
- [ ] Test customer/route/product creation
- [ ] Verify HMS module access
- [ ] Check Settings page displays license info
- [ ] Ensure logout/login works
- [ ] Test on Windows 10 and Windows 11

## 🎁 Package for Distribution

Create a professional package:

### 1. Create Distribution Folder
```
Firmanager-v3.0.0/
  ├── Firmanager Setup 3.0.0.exe
  ├── README.txt (installation instructions)
  ├── LICENSE.txt (your license terms)
  └── SUPPORT.txt (support contact info)
```

### 2. Create README.txt
```
Firmanager - Professional Facility Management Software
Version 3.0.0

INSTALLATION:
1. Double-click "Firmanager Setup 3.0.0.exe"
2. Follow installation wizard
3. Launch from Desktop or Start Menu

SYSTEM REQUIREMENTS:
- Windows 10/11 (64-bit)
- Internet connection
- 200 MB free disk space

TRIAL:
- 14 days free trial
- Full access to all features
- No credit card required

SUPPORT:
Email: support@vmpnordic.com
Website: https://vmpnordic.com
```

### 3. ZIP Everything
```powershell
Compress-Archive -Path "Firmanager-v3.0.0" -DestinationPath "Firmanager-v3.0.0-Complete.zip"
```

## 🌐 Marketing Website Example

Create a simple download page:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Download Firmanager</title>
</head>
<body>
    <h1>Firmanager - Professional Facility Management</h1>
    
    <h2>Free 14-Day Trial</h2>
    <ul>
        <li>Manage up to 50 customers</li>
        <li>Generate 20 optimized routes</li>
        <li>Track 100 products</li>
        <li>Full HMS module access</li>
    </ul>
    
    <a href="/downloads/Firmanager-Setup-3.0.0.exe" class="download-btn">
        Download for Windows (113 MB)
    </a>
    
    <h3>System Requirements</h3>
    <p>Windows 10/11 (64-bit), 200 MB disk space, Internet connection</p>
    
    <h3>Pricing</h3>
    <ul>
        <li><strong>Free:</strong> $0/month - Limited features</li>
        <li><strong>Professional:</strong> $49/month - Unlimited everything</li>
        <li><strong>Enterprise:</strong> $199/month - Multi-user + priority support</li>
    </ul>
</body>
</html>
```

## ✅ Success!

Your app is now:
- ✅ **Standalone** - No dependencies required
- ✅ **Cloud-connected** - Data stored securely online
- ✅ **Distributable** - Send .exe file to anyone
- ✅ **Licensed** - 14-day trial + paid tiers
- ✅ **Professional** - Ready for commercial use

**Ready to distribute!** 🎉
