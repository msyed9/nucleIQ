# Sidebar Links Fix - Staff and Student Pages

## Issue Found ✅

The **Staff** and **Student** links in the sidebar were not working properly due to **two separate issues**:

### Issue 1: API Authentication Mismatch

The project has **two different API configuration files**:

1. **`frontend/src/utils/api.ts`** (Incorrect/Legacy)
   - Uses `token` and `refresh` from localStorage
   - Missing tenant header support
   - Basic authentication only

2. **`frontend/src/services/api.ts`** (Correct/Current)
   - Uses `access_token` and `refresh_token` from localStorage
   - Includes `X-Tenant-ID` header for multi-tenant support
   - Has token refresh logic
   - Matches the login implementation

**The Problem:** Several pages were importing from the **wrong API file** (`utils/api.ts`), which meant:
- Authentication headers were not being sent correctly
- The token name mismatch (`token` vs `access_token`) caused API calls to fail
- Pages appeared to load but couldn't fetch data from the backend

### Issue 2: API Response Structure Handling

**Error:** `TypeError: staff.filter is not a function` and `students.filter is not a function`

**The Problem:** The API was returning an **object** (possibly with pagination metadata) instead of a direct array, but the code was setting the entire response object to the state variable, causing `.filter()` to fail.

**The Fix:** Updated both components to properly handle different API response structures:
- Direct array response: `[{...}, {...}]`
- Paginated response: `{results: [{...}, {...}], count: 10, next: null, previous: null}`
- Empty/error response: `{}`

## Files Fixed 🔧

### Phase 1: API Import Fixes

Updated the following files to use the correct API import (`services/api.ts`):

1. ✅ **`frontend/src/pages/students/StudentList.tsx`**
   - Changed: `import api from '../../utils/api';`
   - To: `import api from '../../services/api';`

2. ✅ **`frontend/src/pages/users/UserList.tsx`**
   - Changed: `import api from '../../utils/api';`
   - To: `import api from '../../services/api';`
   - Also removed unused `useNavigate` import

3. ✅ **`frontend/src/pages/dashboard/Dashboard.tsx`**
   - Changed: `import api from '../../utils/api';`
   - To: `import api from '../../services/api';`

4. ✅ **`frontend/src/pages/attendance/MarkAttendance.tsx`**
   - Changed: `import api from '../../utils/api';`
   - To: `import api from '../../services/api';`

5. ✅ **`frontend/src/pages/finance/ExpenseManager.tsx`**
   - Changed: `import api from '../../utils/api';`
   - To: `import api from '../../services/api';`

### Phase 2: Response Structure Handling Fixes

1. ✅ **`frontend/src/pages/students/StudentList.tsx`**
   - Added proper response structure handling in `fetchStudents()`
   - Now handles: direct arrays, paginated responses, and edge cases

2. ✅ **`frontend/src/pages/staff/StaffList.tsx`**
   - Added proper response structure handling in `fetchStaff()`
   - Now handles: direct arrays, paginated responses, and edge cases

## Already Using Correct API ✅

These pages were already using the correct API:
- `frontend/src/pages/staff/StaffList.tsx` ✅
- `frontend/src/pages/fees/CollectFees.tsx` ✅
- `frontend/src/pages/idcards/Designer.tsx` ✅

## Routes Configuration ✅

The routing in `App.tsx` is correctly configured:
- `/students` → `StudentList` component ✅
- `/staff` → `StaffList` component ✅
- Both routes are properly wrapped in `ProtectedRoute` ✅

## Expected Behavior After Fix

After these changes:
1. ✅ Staff link in sidebar will navigate to `/staff` and load staff data
2. ✅ Student link in sidebar will navigate to `/students` and load student data
3. ✅ All API calls will include proper authentication headers
4. ✅ Tenant-specific data will be fetched correctly
5. ✅ Token refresh will work automatically when tokens expire

## Recommendation

Consider **removing or deprecating** the `frontend/src/utils/api.ts` file to prevent future confusion and ensure all pages use the correct API configuration from `services/api.ts`.

## Testing Checklist

- [ ] Login to the application
- [ ] Click on "Students" in the sidebar
- [ ] Verify student list loads correctly
- [ ] Click on "Staff" in the sidebar
- [ ] Verify staff list loads correctly
- [ ] Check browser console for any authentication errors
- [ ] Verify API calls include `Authorization: Bearer <token>` header
- [ ] Verify API calls include `X-Tenant-ID` header

---

**Fixed on:** December 30, 2025
**Status:** ✅ Complete
