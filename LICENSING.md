# Licensing System Documentation

## Overview
V3 includes a complete licensing and subscription management system for commercial distribution.

## Subscription Tiers

### Trial (14 days)
- Full features
- Max 50 customers
- Max 20 routes
- Max 100 products
- HMS enabled
- Automatically expires after 14 days

### Free
- Limited features
- Max 10 customers
- Max 5 routes
- Max 20 products
- NO HMS

### Pro
- Unlimited customers
- Unlimited routes
- Unlimited products
- HMS enabled
- Single organization

### Enterprise
- Everything in Pro
- Multi-user support
- Priority support
- Custom features

## API Endpoints

### Generate License (Admin Only)
```
POST /api/licenses/generate
Authorization: Bearer <admin_token>

Request:
{
  "organization_id": "org-uuid",
  "subscription_tier": "trial",
  "max_users": 1,
  "trial_days": 14
}

Response:
{
  "id": "license-uuid",
  "license_key": "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "organization_id": "org-uuid",
  "subscription_tier": "trial",
  "status": "active",
  "expires_at": "2026-01-21T00:00:00Z",
  "features": {...}
}
```

### Validate License (Public)
```
POST /api/licenses/validate

Request:
{
  "license_key": "XXXX-XXXX-XXXX-XXXX-XXXX-XXXX",
  "organization_id": "org-uuid" (optional)
}

Response:
{
  "valid": true,
  "license": {...},
  "days_remaining": 14
}
```

### Check Current License (Authenticated)
```
GET /api/licenses/check
Authorization: Bearer <user_token>

Response:
{
  "valid": true,
  "license": {...},
  "days_remaining": 14
}
```

## License States

- **active** - License is valid and can be used
- **expired** - Trial period ended or subscription cancelled
- **suspended** - Payment failed or terms violated
- **cancelled** - User cancelled subscription

## Integration Flow

### First-Time Setup
1. User downloads `Firmanager Setup.exe`
2. Installs application
3. Launches app for first time
4. Prompted to either:
   - **Start 14-day trial** (auto-generates trial license)
   - **Enter license key** (purchased license)

### Trial Flow
```
User clicks "Start Trial"
    ↓
App calls POST /api/licenses/generate
    ↓
Backend creates trial license (14 days)
    ↓
License key saved to app
    ↓
User has full access for 14 days
```

### Purchase Flow
```
User purchases on website
    ↓
Payment processor (Stripe)
    ↓
Webhook calls POST /api/licenses/generate
    ↓
License key emailed to user
    ↓
User enters key in app
    ↓
App calls POST /api/licenses/validate
    ↓
Full access granted
```

### Daily Validation
```
App startup
    ↓
Check local license
    ↓
Call GET /api/licenses/check
    ↓
If expired: Show upgrade prompt
If valid: Continue
```

## Feature Flags

Use license.features to control access:

```javascript
// Frontend check
if (license.features.hms_enabled) {
  // Show HMS menu item
}

if (license.features.max_customers === -1 || 
    currentCustomerCount < license.features.max_customers) {
  // Allow add customer
}
```

## Next Steps

- [ ] Add license validation in Electron app startup
- [ ] Create trial signup flow
- [ ] Add license key input dialog
- [ ] Implement feature restrictions
- [ ] Add expiration warnings
- [ ] Create admin panel for license management
- [ ] Integrate Stripe for payments
- [ ] Add auto-renewal logic

## Testing

To test locally:
1. Register as admin user
2. Call `/api/licenses/generate` to create test license
3. Use license key in app
4. Verify features work according to tier
