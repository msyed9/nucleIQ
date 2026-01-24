# Session Timeout Configuration - Implementation Summary

## Overview
This implementation adds tenant-level configurability for session timeouts in the nucleIQ system. Each tenant can now configure their own timeout values for:
- JWT Access Tokens (active session timeout)
- JWT Refresh Tokens (remember me / stay logged in)
- Django Admin session timeout

## Changes Made

### 1. Database Schema (Backend)

#### File: `backend/tenants/models.py`
**Added Fields to Tenant Model:**
- `session_timeout_minutes` (default: 60 minutes)
  - Controls JWT access token lifetime
  - Range: 5-1440 minutes (5 min to 24 hours)
  
- `refresh_timeout_days` (default: 7 days)
  - Controls JWT refresh token lifetime
  - Range: 1-30 days
  
- `admin_session_timeout_minutes` (default: 120 minutes)
  - Controls Django admin session timeout
  - Range: 5-1440 minutes (5 min to 24 hours)

**Added Validation:**
- `clean()` method validates timeout values are within acceptable ranges

**Migration:**
- Created: `backend/tenants/migrations/0003_add_session_timeout_fields.py`

### 2. JWT Token Generation (Backend)

#### File: `backend/users/serializers.py`

**Updated `CustomTokenObtainPairSerializer`:**
- Modified `get_token()` to apply tenant-specific access token lifetime
- Added `validate()` method to apply tenant-specific refresh token lifetime
- Falls back to default values if tenant not found

**Updated `UnifiedLoginSerializer`:**
- Modified token generation to use tenant-specific timeouts
- Applies custom expiration to both access and refresh tokens

### 3. Django Admin Session Management (Backend)

#### File: `backend/users/middleware_session.py` (NEW)
**Created `AdminSessionTimeoutMiddleware`:**
- Intercepts Django admin requests
- Sets session expiry based on tenant's `admin_session_timeout_minutes`
- Only applies to authenticated users with tenant association

#### File: `backend/config/settings/base.py`
**Added Middleware:**
- Registered `AdminSessionTimeoutMiddleware` in MIDDLEWARE list
- Positioned after `TenantMiddleware` to ensure tenant context is available

### 4. API Endpoints (Backend)

#### File: `backend/tenants/session_timeout_views.py` (NEW)
**Created `TenantSessionTimeoutViewSet`:**
- **GET /api/tenants/session-timeout/** - Get current settings
- **PATCH /api/tenants/session-timeout/** - Update settings

**Created `SessionTimeoutSerializer`:**
- Validates timeout values with min/max constraints
- Provides helpful error messages

#### File: `backend/tenants/urls.py`
**Added URL Routing:**
- Registered `session-timeout` endpoint in the router

## How It Works

### Frontend (React App) - JWT Authentication
1. User logs in via `/api/auth/unified-login/`
2. Backend generates JWT tokens with tenant-specific expiration:
   - **Access Token:** expires in `session_timeout_minutes`
   - **Refresh Token:** expires in `refresh_timeout_days`
3. Frontend stores tokens and uses them for API requests
4. When access token expires, frontend automatically refreshes using refresh token
5. When refresh token expires, user must log in again

### Django Admin - Session-based Authentication
1. User logs into Django admin at `/admin/`
2. `AdminSessionTimeoutMiddleware` detects the tenant
3. Session expiry is set to `admin_session_timeout_minutes`
4. Session expires after the configured time of inactivity

### Configuration by Tenant Admin
1. Tenant admin navigates to Settings → Session & Security
2. Makes API call: `PATCH /api/tenants/session-timeout/`
3. Backend validates and saves the new timeout values
4. **New logins** will use the updated timeout values
5. **Existing sessions** continue with their original expiration

## API Usage Examples

### Get Current Session Timeout Settings
```http
GET /api/tenants/session-timeout/
Authorization: Bearer <access_token>

Response:
{
  "session_timeout_minutes": 60,
  "refresh_timeout_days": 7,
  "admin_session_timeout_minutes": 120
}
```

### Update Session Timeout Settings
```http
PATCH /api/tenants/session-timeout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "session_timeout_minutes": 30,
  "refresh_timeout_days": 14,
  "admin_session_timeout_minutes": 60
}

Response:
{
  "session_timeout_minutes": 30,
  "refresh_timeout_days": 14,
  "admin_session_timeout_minutes": 60,
  "message": "Session timeout settings updated successfully"
}
```

## Validation Rules

- **session_timeout_minutes:** 5-1440 (5 minutes to 24 hours)
- **refresh_timeout_days:** 1-30 (1 day to 30 days)
- **admin_session_timeout_minutes:** 5-1440 (5 minutes to 24 hours)

## Security Considerations

1. **Minimum Timeout:** 5 minutes prevents too-short sessions that could impact usability
2. **Maximum Timeout:** 24 hours for sessions, 30 days for refresh tokens prevents indefinite sessions
3. **Tenant Isolation:** Each tenant manages their own timeout independently
4. **Existing Sessions:** Changing timeout does NOT invalidate existing sessions
5. **Token Security:** JWT tokens are signed and cannot be modified by clients

## Next Steps (Frontend Implementation)

### Required Frontend Changes:
1. **Settings Page:**
   - Add "Session & Security" section in tenant settings
   - Create form with three input fields for timeout configuration
   - Add validation (min/max values)
   - Show current values on page load
   - Save button to update via API

2. **User Feedback:**
   - Show warning message: "Changes will apply to new sessions only"
   - Display timeout in user-friendly format (e.g., "1 hour", "7 days")
   - Success/error notifications after update

3. **Auto-logout Warning (Optional Enhancement):**
   - Show countdown notification 5 minutes before session expires
   - Offer "Stay logged in" button to refresh the token

## Testing Checklist

- [ ] Create migration and apply to database
- [ ] Test JWT token generation with custom timeouts
- [ ] Test Django admin session with custom timeouts
- [ ] Test API endpoint for getting current settings
- [ ] Test API endpoint for updating settings
- [ ] Test validation (values outside allowed ranges)
- [ ] Test with platform admin (no tenant)
- [ ] Test tenant isolation (Tenant A changes don't affect Tenant B)
- [ ] Frontend: Create settings UI
- [ ] Frontend: Test form validation
- [ ] Frontend: Test API integration

## Files Modified/Created

**Modified:**
- `backend/tenants/models.py` - Added session timeout fields
- `backend/users/serializers.py` - Updated JWT token generation
- `backend/config/settings/base.py` - Added middleware
- `backend/tenants/urls.py` - Added URL routing

**Created:**
- `backend/tenants/migrations/0003_add_session_timeout_fields.py`
- `backend/users/middleware_session.py`
- `backend/tenants/session_timeout_views.py`

## Default Values

If a tenant doesn't change these settings, the defaults are:
- **Session Timeout:** 60 minutes (1 hour)
- **Refresh Timeout:** 7 days (1 week)
- **Admin Session Timeout:** 120 minutes (2 hours)

These default values are backward-compatible with the previous hardcoded settings.
