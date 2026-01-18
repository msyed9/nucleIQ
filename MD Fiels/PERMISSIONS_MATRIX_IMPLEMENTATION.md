# Permissions Matrix Feature - Implementation Guide

## Overview
This document provides a complete guide to the Role-Based Access Control (RBAC) permissions matrix feature implemented for the NucleiQ School ERP system.

## Features Implemented

### Backend (Django)
1. **Enhanced Permission Model** (`backend/users/models.py`)
   - Added `group` field for UI organization (Dashboard, Website, Students, etc.)
   - Added `display_name` field for human-readable names
   - Added `sort_order` field for controlling display order within groups

2. **API Endpoints** (`backend/users/views.py`)
   - `GET /api/users/permissions-matrix/` - Fetch complete permissions matrix
   - `PATCH /api/users/permissions-matrix/bulk_update/` - Bulk update role permissions
   
3. **Serializers** (`backend/users/serializers.py`)
   - `PermissionMatrixSerializer` - Returns grouped permissions and roles with their current permissions
   - `BulkRolePermissionUpdateSerializer` - Validates and processes bulk updates

4. **Management Command**
   - `python manage.py seed_permissions` - Seeds 160+ default permissions for school ERP
   - Organized into groups: Dashboard, Website, Students, Staff, Attendance, Fees, Exams, Library, Transport, Hostel, HR, Inventory, Reports, Settings, Communication

5. **Security Features**
   - Prevents self-downgrade: Users cannot remove their own admin permissions
   - Tenant isolation: Users can only manage roles within their tenant
   - Platform admin override: Platform admins can manage all roles

### Frontend (React + TypeScript)
1. **PermissionsMatrix Component** (`frontend/src/components/permissions/PermissionsMatrix.tsx`)
   - Dark theme UI matching screenshot (bg-gray-900, red accents #ef4444)
   - Grouped permissions with expandable/collapsible groups
   - Search/filter functionality
   - Bulk select: Toggle all in row/column
   - Optimistic UI updates
   - Loading and error states

2. **Features**
   - Real-time search filtering
   - Group expansion/collapse
   - Checkbox grid for permission assignment
   - Bulk save with success feedback
   - Responsive design with horizontal scroll
   - Sticky headers and left column

## Installation & Setup

### 1. Database Migration
```powershell
cd backend
python manage.py makemigrations users
python manage.py migrate users
```

### 2. Seed Permissions
```powershell
cd backend
python manage.py seed_permissions
```

Expected output:
```
Seeding permissions...
   Created: monthly_income_expense.read
   Created: annual_fees_summary.read
  ...
Completed! Created: 160, Updated: 0
```

### 3. Create Test Roles (Optional)
```powershell
cd backend
python manage.py shell
```

```python
from users.models import Role, Permission, RolePermission
from tenants.models import Tenant

# Get your tenant
tenant = Tenant.objects.first()

# Create Admin role
admin_role = Role.objects.create(
    name='Admin',
    code='admin',
    description='Full administrative access',
    tenant=tenant
)

# Assign all permissions to Admin
all_perms = Permission.objects.all()
for perm in all_perms:
    RolePermission.objects.create(role=admin_role, permission=perm)

# Create Teacher role
teacher_role = Role.objects.create(
    name='Teacher',
    code='teacher',
    description='Teaching staff access',
    tenant=tenant
)

# Assign limited permissions to Teacher
teacher_perms = Permission.objects.filter(
    resource__in=['student', 'attendance', 'exam', 'result']
)
for perm in teacher_perms:
    RolePermission.objects.create(role=teacher_role, permission=perm)

# Create Accountant role
accountant_role = Role.objects.create(
    name='Accountant',
    code='accountant',
    description='Finance team access',
    tenant=tenant
)

# Assign finance permissions to Accountant
finance_perms = Permission.objects.filter(
    group__in=['Fees', 'Finance', 'Reports']
)
for perm in finance_perms:
    RolePermission.objects.create(role=accountant_role, permission=perm)
```

### 4. Frontend Setup
No additional setup required. The component is already integrated into the routing.

## Usage

### Access the Permissions Matrix
1. Login as a platform admin or school admin
2. Navigate to: **Settings > Permissions** or directly to `/settings/permissions`

### Managing Permissions
1. **Search**: Type in the search box to filter permissions by name, resource, or description
2. **Expand/Collapse**: Click on group headers to show/hide permissions
3. **Toggle Permission**: Click individual checkboxes to grant/revoke permissions
4. **Bulk Select Row**: Click "All" button next to a permission to toggle all roles
5. **Bulk Select Column**: Click "Select All" under a role name to toggle all permissions
6. **Save**: Click "Save Changes" button to persist all modifications

### API Testing (Postman/cURL)

#### Get Permissions Matrix
```bash
curl -X GET http://localhost:8000/api/users/permissions-matrix/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Expected Response:
```json
{
  "groups": [
    {
      "name": "Dashboard",
      "permissions": [
        {
          "id": "uuid-here",
          "resource": "monthly_income_expense",
          "action": "read",
          "code": "monthly_income_expense.read",
          "display_name": "Monthly Income Expense - Read",
          "description": "View monthly income vs expense pie chart"
        }
      ]
    }
  ],
  "roles": [
    {
      "id": "uuid-here",
      "name": "Admin",
      "code": "admin",
      "description": "Full administrative access",
      "permission_ids": ["uuid1", "uuid2", ...]
    }
  ]
}
```

#### Bulk Update Permissions
```bash
curl -X PATCH http://localhost:8000/api/users/permissions-matrix/bulk_update/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "role_id": "role-uuid-here",
    "permission_ids": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-3"]
  }'
```

Expected Response:
```json
{
  "status": "success",
  "message": "Updated permissions for role Admin",
  "role_id": "uuid-here",
  "permission_count": 3
}
```

## Permission Enforcement (Coming in Next Phase)

### In Django Views
```python
from core.permissions import HasModulePermission

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, HasModulePermission]
    required_permissions = ['student.read']
    
    def create(self, request, *args, **kwargs):
        # Requires student.create permission
        pass
```

### In React Components
```typescript
import { useAuth } from './contexts/AuthContext';

const StudentList: React.FC = () => {
  const { hasPermission } = useAuth();
  
  return (
    <div>
      {hasPermission('student.read') && <StudentTable />}
      {hasPermission('student.create') && <AddStudentButton />}
    </div>
  );
};
```

## UI Styling Details

The permissions matrix uses the following dark theme colors to match your screenshot:

- **Background**: `bg-gray-900` (#111827)
- **Card/Table**: `bg-gray-800` (#1F2937)
- **Group Headers**: `bg-gray-850` (custom)
- **Borders**: `border-gray-700` (#374151)
- **Text Primary**: `text-gray-100` (#F3F4F6)
- **Text Secondary**: `text-gray-400` (#9CA3AF)
- **Accent/Checked**: `bg-red-600` (#DC2626)  Red checkboxes
- **Hover**: `hover:bg-gray-750`

## Troubleshooting

### Issue: "Module not found: xlsxwriter"
**Solution**: 
```powershell
pip install xlsxwriter
```

### Issue: Migration errors
**Solution**: 
```powershell
cd backend
python manage.py makemigrations users
python manage.py migrate users --fake-initial
```

### Issue: Permissions not showing in frontend
**Solutions**:
1. Check browser console for API errors
2. Verify backend is running: `python manage.py runserver`
3. Check authentication token is valid
4. Verify user has platform admin or admin role

### Issue: Cannot save permissions
**Solutions**:
1. Check user has permission to edit roles
2. Verify API endpoint is reachable
3. Check browser network tab for 403/500 errors
4. Ensure tenant context is correct

## File Structure

```
backend/
 users/
    models.py (Permission, Role, RolePermission with enhancements)
    serializers.py (PermissionMatrixSerializer, BulkRolePermissionUpdateSerializer)
    views.py (PermissionsMatrixViewSet)
    urls.py (routes added)
    management/
        commands/
            seed_permissions.py

frontend/
 src/
    components/
       permissions/
           PermissionsMatrix.tsx
           index.ts
    pages/
       settings/
           PermissionsMatrix.tsx
    App.tsx (route added)
```

## Next Steps

1. **Run Migrations**: Apply the database changes
2. **Seed Permissions**: Populate initial permission data
3. **Create Roles**: Set up your school's role structure
4. **Test UI**: Access /settings/permissions and test the matrix
5. **Implement Enforcement**: Add permission checks to views and components
6. **Train Users**: Educate admins on using the permissions system

## Security Best Practices

1. **Never expose platform admin access** to regular school admins
2. **Audit permission changes** using Django admin or custom logging
3. **Regular reviews** of role assignments
4. **Principle of least privilege**: Grant minimum required permissions
5. **Test in staging** before modifying production permissions

## Support

For issues or questions:
1. Check Django logs: `backend/logs/` or console output
2. Check browser console for frontend errors
3. Verify API responses in Network tab
4. Review this documentation

---

**Version**: 1.0  
**Last Updated**: January 4, 2026  
**Author**: NucleiQ Development Team
