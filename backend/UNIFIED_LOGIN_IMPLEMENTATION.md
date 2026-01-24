# Unified Login System - Implementation Summary

## Overview

This document describes the unified login system implementation that consolidates all authentication into a single endpoint and login page.

## Problem Solved

**Before:**
- Multiple login pages (`/login`, `/parent/login`)
- Multiple API endpoints (`/api/auth/login/`, `/api/parent/auth/login/`)
- Users needed to know which login page to use
- Mobile app would need separate apps or complex routing

**After:**
- Single unified login page at `/login`
- Single API endpoint at `/api/auth/unified-login/`
- Automatic routing based on user type
- Mobile app uses single login flow

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SINGLE LOGIN PAGE                             │
│                    /login (unified)                              │
│            Accepts: Email OR Phone Number                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               UNIFIED LOGIN API                                  │
│            /api/auth/unified-login/                              │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
     │ Platform Admin│ │ Tenant User   │ │ Parent User   │
     │ → /dashboard  │ │ → /dashboard  │ │ → /parent/    │
     │               │ │               │ │   portal      │
     └───────────────┘ └───────────────┘ └───────────────┘
```

## API Changes

### New Endpoint: `/api/auth/unified-login/`

**Request:**
```json
{
    "username": "email@example.com or phone_number",
    "password": "password123"
}
```

**Response:**
```json
{
    "access": "jwt_access_token",
    "refresh": "jwt_refresh_token",
    "user_type": "platform_admin|tenant_admin|teacher|staff|parent",
    "redirect_url": "/dashboard or /parent/portal",
    "tenant": "tenant_id or null",
    "tenant_name": "Tenant Name or null",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "full_name": "John Doe",
        "phone_number": "1234567890",
        "is_platform_admin": false,
        "is_parent": true,
        "tenant": "tenant_id",
        "roles": [{"id": "uuid", "name": "Teacher", "code": "teacher"}],
        "permissions": ["student.read", "attendance.create"],
        "user_type": "parent",
        // Parent-specific fields (if user_type is 'parent'):
        "parent_id": 123,
        "relation_type": "FATHER",
        "students": [
            {
                "id": "uuid",
                "admission_number": "ADM001",
                "first_name": "Jane",
                "last_name": "Doe",
                "full_name": "Jane Doe",
                "class": "Grade 5",
                "section": "A"
            }
        ],
        "students_count": 1
    }
}
```

## User Type Detection Logic

The system determines user type in this priority order:

1. **Platform Admin**: `is_platform_admin=True` or `is_superuser=True`
2. **Parent**: Has `ParentUser` profile with `portal_access_enabled=True`
3. **Tenant Admin**: Has role with code `tenant_admin`, `admin`, or `principal`
4. **Teacher**: Has role with code `teacher`
5. **Staff**: Default for all other tenant users

## Files Modified

### Backend

| File | Changes |
|------|---------|
| `backend/users/serializers.py` | Added `UnifiedLoginSerializer` |
| `backend/users/views.py` | Added `UnifiedLoginView` |
| `backend/users/urls.py` | Added route `/api/auth/unified-login/` |

### Frontend (Web)

| File | Changes |
|------|---------|
| `frontend/src/pages/auth/Login.tsx` | Updated to use unified login API, support email/phone |
| `frontend/src/pages/parent/ParentLogin.tsx` | Updated to use unified login API |
| `frontend/src/locales/en.json` | Added new translation keys |

### Mobile

| File | Changes |
|------|---------|
| `mobile/src/services/api.ts` | Updated `authAPI.login` to use unified endpoint |
| `mobile/src/contexts/AuthContext.tsx` | Updated to handle `user_type` and parent data |
| `mobile/src/screens/auth/LoginScreen.tsx` | Updated to accept email/phone, relaxed validation |

## Backward Compatibility

All existing endpoints are preserved:

- `/api/auth/login/` - Still works (original staff login)
- `/api/parent/auth/login/` - Still works (original parent login)
- `/parent/login` - Still accessible, now uses unified API

## Testing Checklist

- [ ] Platform Admin login → redirects to `/dashboard`
- [ ] Tenant Admin login → redirects to `/dashboard`
- [ ] Teacher login → redirects to `/dashboard`
- [ ] Staff login → redirects to `/dashboard`
- [ ] Parent login → redirects to `/parent/portal`
- [ ] Login with email works
- [ ] Login with phone number works
- [ ] Invalid credentials show proper error
- [ ] Inactive user shows proper error
- [ ] Mobile app login works with email
- [ ] Mobile app login works with phone

## Security Notes

1. Password validation remains unchanged
2. User active status is checked before login
3. Platform admin flag cannot be assigned by non-platform-admins
4. Parent-specific data only returned when user is a parent

## Rollback Plan

If issues arise, the system can be rolled back by:

1. Changing frontend to use `/api/auth/login/` instead of `/api/auth/unified-login/`
2. Restoring the original Login.tsx and ParentLogin.tsx
3. The backend changes don't affect existing endpoints

## Date Implemented

2026-01-21
