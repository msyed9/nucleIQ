# 🔍 Manual Testing Guide - Debug Login Issue

## Step-by-Step Debugging

### Step 1: Open Browser DevTools
1. Open Chrome/Edge
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Go to **Network** tab
5. Keep DevTools open for all steps

### Step 2: Clear Everything
In the Console tab, run:
```javascript
localStorage.clear()
console.log('LocalStorage cleared')
```

### Step 3: Navigate to Login
1. Go to: `http://localhost:5173`
2. You should see the login page
3. Check Console for any errors

### Step 4: Attempt Login
1. Enter email: `admin@nucleiq.com`
2. Enter password: `admin123`
3. Click "Login" button
4. **WATCH CAREFULLY** what happens

### Step 5: Check Network Tab
In Network tab, look for:
1. **POST** to `/api/auth/login/`
   - Status should be **200 OK**
   - Response should have: `{ access, refresh, user }`
   
2. **GET** to `/api/users/me/`
   - What status? (200, 401, 403?)
   - When does it happen?

### Step 6: Check Console
Look for errors like:
- `Failed to load preferences`
- `403 Forbidden`
- `401 Unauthorized`
- Any React errors

### Step 7: Check localStorage
In Console, run:
```javascript
console.log('access_token:', localStorage.getItem('access_token'))
console.log('refresh_token:', localStorage.getItem('refresh_token'))
console.log('user:', localStorage.getItem('user'))
```

### Step 8: Check Current URL
In Console, run:
```javascript
console.log('Current URL:', window.location.href)
```

### Step 9: Watch for Redirects
1. After clicking Login, does the URL change?
2. Does it go to `/dashboard` then back to `/login`?
3. Or does it stay on `/login`?

---

## What to Report

Please provide:

### 1. Console Errors
Copy any red errors from Console tab

### 2. Network Calls
For `/api/auth/login/`:
- Status code?
- Response body?

For `/api/users/me/`:
- Status code?
- When does it get called?
- Response or error?

### 3. localStorage Contents
```javascript
localStorage.getItem('access_token')
localStorage.getItem('refresh_token')
```

### 4. URL Behavior
- What URL are you on after clicking Login?
- Does it redirect multiple times?

### 5. Timing
- Does login succeed but then redirect back?
- Or does it never leave the login page?

---

## Common Issues & Quick Fixes

### Issue 1: Login API Returns Error
**Check**: Network tab → `/api/auth/login/` response
**Fix**: Verify backend is running, check credentials

### Issue 2: 403 on /users/me/
**Check**: Network tab → `/api/users/me/` status
**Fix**: Backend needs restart (we fixed this)

### Issue 3: No Token in localStorage
**Check**: Console → `localStorage.getItem('access_token')`
**Fix**: Login API might be failing

### Issue 4: Token Exists but Still Redirects
**Check**: ProtectedRoute component
**Fix**: Verify App.tsx has ProtectedRoute wrapper

### Issue 5: PreferencesContext Error
**Check**: Console for "Failed to load preferences"
**Fix**: This is OK if not logged in, but should work after login

---

## Quick Test Script

Run this in Console **AFTER** attempting login:

```javascript
// Check authentication state
console.log('=== AUTH STATE ===')
console.log('Token:', localStorage.getItem('access_token') ? 'EXISTS' : 'MISSING')
console.log('User:', localStorage.getItem('user') ? 'EXISTS' : 'MISSING')
console.log('Current URL:', window.location.pathname)

// Test API call
fetch('http://localhost:8000/api/users/me/', {
    headers: {
        'Authorization': 'Bearer ' + localStorage.getItem('access_token')
    }
})
.then(r => r.json())
.then(data => console.log('API Test Success:', data))
.catch(err => console.error('API Test Failed:', err))
```

---

## Expected Behavior

### ✅ Successful Login Flow:
1. Click Login
2. Network: POST `/api/auth/login/` → 200 OK
3. localStorage: tokens stored
4. URL changes to `/dashboard`
5. Network: GET `/api/users/me/` → 200 OK
6. Dashboard loads
7. Stays on dashboard

### ❌ Failed Login (Redirect Loop):
1. Click Login
2. Network: POST `/api/auth/login/` → 200 OK
3. localStorage: tokens stored
4. URL changes to `/dashboard`
5. Network: GET `/api/users/me/` → 403/401
6. URL changes back to `/login`
7. Loop repeats

---

## Verification Commands

### Check if Backend is Running:
```bash
docker-compose ps
```
All services should show "Up"

### Check Backend Logs:
```bash
docker-compose logs backend --tail=20
```
Look for errors

### Restart Backend:
```bash
docker-compose restart backend
```

### Check Frontend Logs:
```bash
docker-compose logs frontend --tail=20
```

---

## Report Template

Please copy this and fill in:

```
### Login Test Results:

1. **Login API Call**:
   - Status: [200/400/500/etc]
   - Response: [paste response or error]

2. **localStorage After Login**:
   - access_token: [EXISTS/MISSING]
   - refresh_token: [EXISTS/MISSING]
   - user: [EXISTS/MISSING]

3. **URL After Login**:
   - Current URL: [/login or /dashboard or other]

4. **Console Errors**:
   [paste any red errors]

5. **Network Tab - /users/me/**:
   - Called: [YES/NO]
   - Status: [200/403/401/etc]
   - Response: [paste response or error]

6. **Behavior**:
   - [ ] Stays on login page
   - [ ] Goes to dashboard then back to login
   - [ ] Goes to dashboard and stays there
   - [ ] Other: [describe]
```

---

**Please test and report back with the results!** 🔍
