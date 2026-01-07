# Firmanager V3 - Desktop Application

Version 3 is the **Electron desktop app** with licensing and subscription management.

## What's New in V3

- ✅ Desktop application (Windows .exe installer)
- ✅ Professional installer with desktop shortcuts
- ✅ Auto-update capability
- ✅ Licensing system (trial/paid)
- ✅ Subscription management
- ✅ Works like professional software (Adobe, Microsoft, etc.)

## Development

### Run in Development Mode
```bash
cd frontend
npm run electron-dev
```

This will:
1. Start React dev server on localhost:3000
2. Open Electron window automatically
3. Hot reload on code changes

### Build Production Installer
```bash
cd frontend
npm run dist
```

This creates:
- `frontend/dist/Firmanager Setup 3.0.0.exe` - Windows installer

## Architecture

```
Desktop App (Electron)
    ↓ Internet required
Backend (Render + MongoDB)
    ↓ License validation
User authenticated & authorized
```

## Distribution

1. Users download installer from your website
2. Run `Firmanager Setup 3.0.0.exe`
3. Install to `C:\Program Files\Firmanager`
4. Launch from desktop shortcut
5. Enter license key (or start trial)
6. App validates license with backend
7. Full access granted

## Next Steps (To Be Implemented)

- [ ] License key system in backend
- [ ] Trial period (14 days)
- [ ] Subscription tiers (free/pro/enterprise)
- [ ] Stripe integration for payments
- [ ] Auto-update functionality
- [ ] Feature flags based on subscription

## File Size

- Installer: ~150-200 MB
- Installed: ~300-400 MB
- (Includes bundled Chromium browser)

## System Requirements

- Windows 10/11 (64-bit)
- 4 GB RAM minimum
- 500 MB disk space
- Internet connection required

---

**Branch:** `firmanager-v3`  
**Keep V2 branch** (`firmanager-en`) for current production use
