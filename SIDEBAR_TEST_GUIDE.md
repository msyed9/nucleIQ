# Quick Test Guide for Sidebar Links Fix

## Start the Application

1. **Start Backend (if not running):**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Frontend (if not running):**
   ```bash
   cd frontend
   npm run dev
   ```

## Test the Fix

### 1. Login Test
- Navigate to `http://localhost:5173` (or your frontend URL)
- Login with valid credentials
- Verify you reach the dashboard

### 2. Student Link Test
- Click on "Students" (👨‍🎓) in the sidebar
- **Expected:** Page navigates to `/students`
- **Expected:** Student list loads with data (or shows "No students" if empty)
- **Check Console:** Should see API call to `/api/students/` with proper headers

### 3. Staff Link Test
- Click on "Staff" (👨‍🏫) in the sidebar
- **Expected:** Page navigates to `/staff`
- **Expected:** Staff list loads with data (or shows "No staff" if empty)
- **Check Console:** Should see API call to `/api/staff/staff/` with proper headers

### 4. Verify API Headers (Browser DevTools)
Open Browser DevTools → Network Tab:

For any API request, check the **Request Headers**:
```
Authorization: Bearer <your_access_token>
X-Tenant-ID: <your_tenant_id>
Content-Type: application/json
```

### 5. Test Other Links
Verify all sidebar links work:
- ✅ Dashboard
- ✅ Students
- ✅ Staff
- ✅ Attendance
- ✅ Fees
- ✅ Finance
- ✅ Users
- ✅ Settings

## Common Issues & Solutions

### Issue: "401 Unauthorized" errors
**Solution:** Token might be expired. Logout and login again.

### Issue: "403 Forbidden" errors
**Solution:** User might not have permission. Check user roles.

### Issue: "Network Error"
**Solution:** Backend server might not be running. Start it with `python manage.py runserver`

### Issue: Pages load but show no data
**Solution:** Database might be empty. Add test data through Django admin.

## Debug Mode

Both StudentList and StaffList have debug banners showing:
- Mount timestamp
- Loading state
- Number of records loaded
- Current filters (for StaffList)

These will help verify the components are mounting and fetching data correctly.

---

**Note:** After confirming everything works, you can remove the debug banners from:
- `frontend/src/pages/students/StudentList.tsx` (lines 85-87)
- `frontend/src/pages/staff/StaffList.tsx` (lines 73-75)
