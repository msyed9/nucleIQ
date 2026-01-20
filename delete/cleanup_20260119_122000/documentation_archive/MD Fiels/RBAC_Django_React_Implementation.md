# RBAC Implementation Guide: Django + React

## Complete Implementation Prompts for Django Backend and React Frontend

This document provides detailed, copy-paste ready prompts to implement the RBAC system analyzed from the PHP codebase into a Django backend with React frontend.

---

## Table of Contents
1. [Django Backend Implementation](#django-backend-implementation)
2. [React Frontend Implementation](#react-frontend-implementation)
3. [Integration Guide](#integration-guide)
4. [Testing Scenarios](#testing-scenarios)

---

## Django Backend Implementation

### Phase 1: Database Models and Setup

**Prompt 1.1: Create Django App and Models**

```
Create a Django app called 'rbac' with the following models based on this RBAC system:

REQUIREMENTS:
1. Create models.py with these models:

Role Model:
- name: CharField(max_length=255)
- prefix: SlugField(unique=True)
- is_system: BooleanField(default=False)
- created_at, updated_at: auto timestamps

PermissionModule Model:
- name: CharField(max_length=255)
- prefix: SlugField(unique=True)
- sorted: IntegerField(default=0) for display ordering
- created_at, updated_at: auto timestamps

Permission Model:
- module: ForeignKey to PermissionModule (on_delete=CASCADE)
- name: CharField(max_length=255)
- prefix: SlugField(unique=True)
- show_view: BooleanField(default=True)
- show_add: BooleanField(default=True)
- show_edit: BooleanField(default=True)
- show_delete: BooleanField(default=True)
- created_at, updated_at: auto timestamps

StaffPrivilege Model:
- role: ForeignKey to Role (on_delete=CASCADE)
- permission: ForeignKey to Permission (on_delete=CASCADE)
- is_view: BooleanField(default=False)
- is_add: BooleanField(default=False)
- is_edit: BooleanField(default=False)
- is_delete: BooleanField(default=False)
- created_at, updated_at: auto timestamps
- Meta: unique_together = [['role', 'permission']]

2. Extend the default User model:
Create a CustomUser model extending AbstractUser with:
- role: ForeignKey to Role (on_delete=PROTECT, null=True)
- active: BooleanField(default=True)
- branch_id: IntegerField(null=True, blank=True)

3. Add __str__ methods to all models for admin display

4. Create admin.py registrations for all models with:
- List display for key fields
- Search fields
- Filters
- Inline editing for StaffPrivilege in Role admin

5. Create migrations and apply them

SYSTEM ROLES TO SEED:
1. Superadmin (id=1, prefix='superadmin')
2. Admin (id=2, prefix='admin')
3. Teacher (id=3, prefix='teacher')
4. Accountant (id=4, prefix='accountant')
5. Librarian (id=5, prefix='librarian')
6. Parent (id=6, prefix='parent')
7. Student (id=7, prefix='student')

Mark roles 1, 6, 7 as is_system=True
```

**Prompt 1.2: Create Management Commands for Seeding**

```
Create Django management commands to seed the RBAC system:

1. Command: seed_roles
Location: rbac/management/commands/seed_roles.py
- Create the 7 system roles listed above
- Use get_or_create to avoid duplicates
- Print success messages

2. Command: seed_permission_modules
Location: rbac/management/commands/seed_permission_modules.py
- Create these modules (with sorted order):
  * Student Management (prefix='student_management', sorted=1)
  * Employee Management (prefix='employee_management', sorted=2)
  * Academic (prefix='academic', sorted=3)
  * Examination (prefix='examination', sorted=4)
  * Finance & Accounting (prefix='finance', sorted=5)
  * Library (prefix='library', sorted=6)
  * Transport (prefix='transport', sorted=7)
  * Hostel (prefix='hostel', sorted=8)
  * Communication (prefix='communication', sorted=9)
  * Reports (prefix='reports', sorted=10)

3. Command: seed_permissions
Location: rbac/management/commands/seed_permissions.py
- Create permissions for each module:

Student Management module:
- Student (prefix='student', all CRUD enabled)
- Student Admission (prefix='student_admission', all CRUD enabled)
- Student Attendance (prefix='student_attendance', all CRUD enabled)
- Student ID Card (prefix='student_idcard', view and add only)

Employee Management module:
- Employee (prefix='employee', all CRUD enabled)
- Department (prefix='department', all CRUD enabled)
- Designation (prefix='designation', all CRUD enabled)
- Employee Disable Authentication (prefix='employee_disable_authentication', view and add only)

Academic module:
- Class (prefix='class', all CRUD enabled)
- Section (prefix='section', all CRUD enabled)
- Subject (prefix='subject', all CRUD enabled)
- Class Timetable (prefix='class_timetable', all CRUD enabled)
- Assign Teacher (prefix='assign_teacher', all CRUD enabled)

Finance module:
- Fee Type (prefix='fee_type', all CRUD enabled)
- Fee Allocation (prefix='fee_allocation', all CRUD enabled)
- Collect Fees (prefix='collect_fees', view and add only)
- Expenses (prefix='expenses', all CRUD enabled)

4. Command: seed_superadmin
- Create a superadmin user with:
  * username: 'admin'
  * email: 'admin@school.com'
  * password: 'admin123' (hashed)
  * role: Superadmin (id=1)
  * is_staff: True
  * is_superuser: True
  * active: True

Each command should:
- Use transaction.atomic()
- Print progress messages
- Handle errors gracefully
- Be idempotent (safe to run multiple times)
```

### Phase 2: Permission Checking Logic

**Prompt 2.1: Create Permission Utilities**

```
Create rbac/utils.py with permission checking utilities:

1. Function: has_permission(user, module_prefix, action)
Parameters:
- user: User instance
- module_prefix: string (e.g., 'employee')
- action: string ('is_view', 'is_add', 'is_edit', 'is_delete')

Logic:
- If user is None or not authenticated, return False
- If user.role is None, return False
- If user.role.id == 1 (Superadmin), return True
- Query StaffPrivilege:
  * Filter by role=user.role
  * Join with Permission where prefix=module_prefix
  * Check if the action field is True
- Return boolean

2. Function: get_user_permissions(user)
Returns a dictionary of all permissions for the user:
{
  'employee': {'is_view': True, 'is_add': True, 'is_edit': False, 'is_delete': False},
  'student': {'is_view': True, 'is_add': False, 'is_edit': False, 'is_delete': False},
  ...
}

Logic:
- If Superadmin, return all permissions as True
- Query all StaffPrivilege for user's role
- Build dictionary structure
- Cache result in user session

3. Function: is_superadmin(user)
- Return user.role.id == 1 if role exists, else False

4. Function: is_role(user, role_name)
- Return user.role.prefix == role_name if role exists, else False

5. Class: PermissionDenied(Exception)
- Custom exception for permission denials
- Include message and redirect_url attributes

All functions should handle edge cases:
- User not logged in
- User has no role assigned
- Role has been deleted
- Permission doesn't exist
```

**Prompt 2.2: Create Decorators**

```
Create rbac/decorators.py with permission decorators:

1. Decorator: @permission_required(module, action)
Usage: @permission_required('employee', 'is_view')

Implementation:
- Check if user is authenticated
- Call has_permission(request.user, module, action)
- If False:
  * For AJAX requests: return JsonResponse({'error': 'Access denied'}, status=403)
  * For regular requests: redirect to dashboard with error message
- If True: call the view function

2. Decorator: @role_required(*roles)
Usage: @role_required('admin', 'teacher')

Implementation:
- Check if user is authenticated
- Check if user.role.prefix in roles
- Handle access denial same as above

3. Decorator: @superadmin_required
Usage: @superadmin_required

Implementation:
- Check if user is authenticated
- Check if is_superadmin(user)
- Handle access denial same as above

4. Decorator: @any_permission(*permissions)
Usage: @any_permission(('employee', 'is_view'), ('student', 'is_view'))

Implementation:
- Check if user has ANY of the listed permissions
- Useful for dashboard views that multiple roles can access

All decorators should:
- Work with both function-based and class-based views
- Preserve function metadata using functools.wraps
- Log permission denials for security auditing
- Support custom redirect URLs
```

### Phase 3: API Views and Serializers

**Prompt 3.1: Create Serializers**

```
Create rbac/serializers.py with DRF serializers:

1. RoleSerializer:
- Include all fields
- Add read-only field 'permission_count' (count of associated privileges)
- Add method field 'can_delete' (False if is_system=True)

2. PermissionModuleSerializer:
- Include all fields
- Add nested 'permissions' field (list of permissions in this module)

3. PermissionSerializer:
- Include all fields
- Add 'module_name' field (from related module)

4. StaffPrivilegeSerializer:
- Include all fields
- Add 'permission_name' and 'module_name' fields

5. PermissionMatrixSerializer:
For the permission matrix view, create a custom serializer:
- role_id
- role_name
- modules: list of:
  * module_id
  * module_name
  * permissions: list of:
    - permission_id
    - permission_name
    - show_view, show_add, show_edit, show_delete
    - is_view, is_add, is_edit, is_delete (current values for this role)

6. UserPermissionSerializer:
For frontend permission checking:
- permissions: dictionary format as described in utils.py
- role: nested role data
- is_superadmin: boolean

All serializers should:
- Use ModelSerializer where applicable
- Include proper validation
- Handle nested relationships efficiently
- Use select_related and prefetch_related for optimization
```

**Prompt 3.2: Create API Views**

```
Create rbac/views.py with Django REST Framework views:

1. RoleViewSet (ModelViewSet):
Endpoints:
- GET /api/roles/ - List all roles (exclude system roles for non-superadmin)
- POST /api/roles/ - Create role (superadmin only)
- GET /api/roles/{id}/ - Get role details
- PUT/PATCH /api/roles/{id}/ - Update role (superadmin only, cannot update system roles)
- DELETE /api/roles/{id}/ - Delete role (superadmin only, cannot delete system roles)

Permissions:
- List/Retrieve: Authenticated users
- Create/Update/Delete: Superadmin only

Filters:
- is_system (boolean)
- Search by name

2. PermissionModuleViewSet (ReadOnlyModelViewSet):
Endpoints:
- GET /api/permission-modules/ - List all modules (ordered by 'sorted')
- GET /api/permission-modules/{id}/ - Get module with permissions

3. PermissionViewSet (ReadOnlyModelViewSet):
Endpoints:
- GET /api/permissions/ - List all permissions
- GET /api/permissions/{id}/ - Get permission details

Filters:
- module_id
- Search by name

4. PermissionMatrixView (APIView):
GET /api/roles/{role_id}/permission-matrix/
- Return complete permission matrix for a role
- Use PermissionMatrixSerializer
- Superadmin only

POST /api/roles/{role_id}/permission-matrix/
- Update all permissions for a role
- Accept format:
  {
    "permissions": {
      "permission_id_1": {"is_view": true, "is_add": false, ...},
      "permission_id_2": {"is_view": true, "is_add": true, ...},
      ...
    }
  }
- Use transaction.atomic()
- Update or create StaffPrivilege records
- Superadmin only

5. UserPermissionsView (APIView):
GET /api/auth/permissions/
- Return current user's permissions
- Use UserPermissionSerializer
- Authenticated users only

6. CheckPermissionView (APIView):
POST /api/auth/check-permission/
- Accept: {"module": "employee", "action": "is_view"}
- Return: {"has_permission": true/false}
- Authenticated users only

All views should:
- Use proper authentication (JWT or Session)
- Include pagination for list views
- Return consistent error responses
- Log important actions (create, update, delete)
- Use select_related and prefetch_related for optimization
```

**Prompt 3.3: Create URLs**

```
Create rbac/urls.py with URL patterns:

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoleViewSet, PermissionModuleViewSet, PermissionViewSet,
    PermissionMatrixView, UserPermissionsView, CheckPermissionView
)

router = DefaultRouter()
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permission-modules', PermissionModuleViewSet, basename='permission-module')
router.register(r'permissions', PermissionViewSet, basename='permission')

urlpatterns = [
    path('', include(router.urls)),
    path('roles/<int:role_id>/permission-matrix/', PermissionMatrixView.as_view(), name='permission-matrix'),
    path('auth/permissions/', UserPermissionsView.as_view(), name='user-permissions'),
    path('auth/check-permission/', CheckPermissionView.as_view(), name='check-permission'),
]

Include in main urls.py:
path('api/rbac/', include('rbac.urls')),
```

### Phase 4: Middleware and Context Processors

**Prompt 4.1: Create Middleware**

```
Create rbac/middleware.py:

1. PermissionMiddleware:
Purpose: Load user permissions into request object for easy access

Implementation:
- In process_request:
  * If user is authenticated:
    - Load permissions using get_user_permissions(user)
    - Attach to request.permissions
    - Attach helper methods to request:
      * request.has_permission(module, action)
      * request.is_superadmin()
      * request.is_role(role_name)

2. RoleCheckMiddleware:
Purpose: Ensure user has an active role

Implementation:
- In process_request:
  * If user is authenticated and user.role is None:
    - Log warning
    - Redirect to 'no-role-assigned' page
  * If user is authenticated and user.active is False:
    - Logout user
    - Redirect to login with message 'Account deactivated'

Add to MIDDLEWARE in settings.py:
'rbac.middleware.PermissionMiddleware',
'rbac.middleware.RoleCheckMiddleware',
```

**Prompt 4.2: Create Context Processors**

```
Create rbac/context_processors.py:

1. permissions_processor(request):
Return:
{
    'user_permissions': request.permissions if hasattr(request, 'permissions') else {},
    'is_superadmin': is_superadmin(request.user) if request.user.is_authenticated else False,
    'user_role': request.user.role if request.user.is_authenticated and request.user.role else None,
}

Add to TEMPLATES context_processors in settings.py:
'rbac.context_processors.permissions_processor',

This makes permissions available in all Django templates.
```

### Phase 5: Authentication Integration

**Prompt 5.1: Create Custom Authentication Backend**

```
Create rbac/backends.py:

class RoleBasedAuthBackend(ModelBackend):
    Purpose: Custom authentication that includes role checking

    Override authenticate method:
    - Call super().authenticate()
    - If user exists:
      * Check if user.active is True
      * Check if user.role is not None
      * If checks pass, return user
      * If checks fail, return None and set appropriate error message

    Override get_user method:
    - Call super().get_user()
    - Prefetch user.role to avoid extra queries

Add to AUTHENTICATION_BACKENDS in settings.py:
'rbac.backends.RoleBasedAuthBackend',
```

**Prompt 5.2: Extend Login View**

```
Create rbac/auth_views.py:

1. CustomLoginView(APIView):
POST /api/auth/login/
Accept:
{
  "username": "string",
  "password": "string"
}

Logic:
- Authenticate user
- Check if user.active is True
- Check if user.role is not None
- Generate JWT token (or create session)
- Return:
  {
    "token": "jwt_token",
    "user": {
      "id": user.id,
      "username": user.username,
      "email": user.email,
      "role": {
        "id": role.id,
        "name": role.name,
        "prefix": role.prefix
      }
    },
    "permissions": get_user_permissions(user)
  }

2. CustomLogoutView(APIView):
POST /api/auth/logout/
- Invalidate token/session
- Return success message

3. CurrentUserView(APIView):
GET /api/auth/me/
- Return current user data with role and permissions
- Authenticated users only
```

---

## React Frontend Implementation

### Phase 1: Setup and Context

**Prompt 1.1: Create Auth Context**

```
Create src/contexts/AuthContext.jsx:

Implement AuthContext with:

State:
- user: null | User object
- permissions: {} | Permissions object
- isAuthenticated: boolean
- loading: boolean
- error: string | null

Functions:
- login(username, password): async
  * Call POST /api/auth/login/
  * Store token in localStorage
  * Set user and permissions in state
  * Navigate to dashboard

- logout(): async
  * Call POST /api/auth/logout/
  * Clear token from localStorage
  * Reset state
  * Navigate to login

- loadUser(): async
  * Call GET /api/auth/me/
  * Set user and permissions in state
  * Called on app mount if token exists

- hasPermission(module, action): boolean
  * Check permissions object
  * Return true if user is superadmin OR has specific permission

- isRole(roleName): boolean
  * Check user.role.prefix === roleName

- isSuperadmin(): boolean
  * Check user.role.id === 1

Provider component:
- Wrap children with AuthContext.Provider
- Call loadUser() on mount if token exists
- Show loading spinner while loading

Export:
- AuthProvider component
- useAuth hook for consuming context
```

**Prompt 1.2: Create RBAC Context**

```
Create src/contexts/RBACContext.jsx:

Implement RBACContext for permission management:

State:
- roles: [] | Array of roles
- modules: [] | Array of permission modules
- permissions: [] | Array of permissions
- loading: boolean
- error: string | null

Functions:
- fetchRoles(): async
  * Call GET /api/rbac/roles/
  * Update roles state

- fetchModules(): async
  * Call GET /api/rbac/permission-modules/
  * Update modules state

- fetchPermissions(): async
  * Call GET /api/rbac/permissions/
  * Update permissions state

- createRole(roleData): async
  * Call POST /api/rbac/roles/
  * Refresh roles list

- updateRole(roleId, roleData): async
  * Call PUT /api/rbac/roles/{roleId}/
  * Refresh roles list

- deleteRole(roleId): async
  * Call DELETE /api/rbac/roles/{roleId}/
  * Refresh roles list

- getPermissionMatrix(roleId): async
  * Call GET /api/rbac/roles/{roleId}/permission-matrix/
  * Return matrix data

- updatePermissionMatrix(roleId, permissionsData): async
  * Call POST /api/rbac/roles/{roleId}/permission-matrix/
  * Return success/error

Provider component:
- Wrap children with RBACContext.Provider
- Fetch initial data on mount (if user is superadmin)

Export:
- RBACProvider component
- useRBAC hook for consuming context
```

### Phase 2: Custom Hooks

**Prompt 2.1: Create Permission Hooks**

```
Create src/hooks/usePermission.js:

1. usePermission(module, action):
Returns: boolean

Implementation:
- Use useAuth() to get hasPermission function
- Return hasPermission(module, action)
- Memoize result to avoid unnecessary re-renders

2. useRole():
Returns: {
  role: Role object | null,
  isRole: (roleName) => boolean,
  isSuperadmin: () => boolean,
  isAdmin: () => boolean,
  isTeacher: () => boolean,
  // ... other role checks
}

Implementation:
- Use useAuth() to get user
- Return helper object with role checks
- Memoize result

3. usePermissionCheck():
Returns: {
  checkPermission: async (module, action) => Promise<boolean>,
  loading: boolean
}

Implementation:
- Call POST /api/rbac/auth/check-permission/
- Useful for dynamic permission checks
- Cache results to avoid repeated API calls
```

**Prompt 2.2: Create RBAC Hooks**

```
Create src/hooks/useRBACHooks.js:

1. useRoles():
Returns: {
  roles: Role[],
  loading: boolean,
  error: string | null,
  refetch: () => void
}

Implementation:
- Use useRBAC() context
- Return roles state and refetch function

2. usePermissionMatrix(roleId):
Returns: {
  matrix: PermissionMatrix | null,
  loading: boolean,
  error: string | null,
  updateMatrix: (data) => Promise<void>
}

Implementation:
- Fetch permission matrix for roleId
- Provide update function
- Handle loading and error states

3. useRoleForm():
Returns: {
  createRole: (data) => Promise<void>,
  updateRole: (id, data) => Promise<void>,
  deleteRole: (id) => Promise<void>,
  loading: boolean,
  error: string | null
}

Implementation:
- Use useRBAC() context
- Wrap CRUD operations with loading/error handling
```

### Phase 3: Protected Components

**Prompt 3.1: Create Permission Gate Components**

```
Create src/components/rbac/PermissionGate.jsx:

Component: PermissionGate

Props:
- module: string (required)
- action: string (required)
- children: ReactNode (required)
- fallback: ReactNode (optional, default null)
- showMessage: boolean (optional, default false)

Implementation:
- Use usePermission(module, action)
- If has permission: render children
- If no permission:
  * If showMessage: render "Access Denied" message
  * Else if fallback: render fallback
  * Else: render null

Usage:
<PermissionGate module="employee" action="is_add">
  <button>Add Employee</button>
</PermissionGate>
```

**Prompt 3.2: Create Role Gate Component**

```
Create src/components/rbac/RoleGate.jsx:

Component: RoleGate

Props:
- roles: string[] (required) - array of role prefixes
- children: ReactNode (required)
- fallback: ReactNode (optional, default null)
- requireAll: boolean (optional, default false)

Implementation:
- Use useRole()
- If requireAll: check if user has ALL roles
- Else: check if user has ANY role
- Render children or fallback based on check

Usage:
<RoleGate roles={['admin', 'teacher']}>
  <AdminPanel />
</RoleGate>
```

**Prompt 3.3: Create Protected Route Component**

```
Create src/components/rbac/ProtectedRoute.jsx:

Component: ProtectedRoute

Props:
- permission: {module: string, action: string} (optional)
- roles: string[] (optional)
- children: ReactNode (required)
- redirectTo: string (optional, default '/dashboard')

Implementation:
- Use useAuth() to check authentication
- If not authenticated: redirect to /login
- If permission prop: check permission
- If roles prop: check role
- If checks pass: render children
- If checks fail: redirect to redirectTo with error message

Usage:
<Route 
  path="/employees" 
  element={
    <ProtectedRoute permission={{module: 'employee', action: 'is_view'}}>
      <EmployeeList />
    </ProtectedRoute>
  } 
/>
```

### Phase 4: RBAC Management UI

**Prompt 4.1: Create Role List Component**

```
Create src/pages/rbac/RoleList.jsx:

Component: RoleList

Features:
- Display roles in a table with columns:
  * Name
  * Prefix
  * System Role (Yes/No)
  * Actions (Edit, Permissions, Delete)

- "Add Role" button (superadmin only)
- Delete confirmation modal
- Cannot delete system roles
- Search/filter functionality

State:
- roles (from useRoles hook)
- searchTerm
- showDeleteModal
- selectedRole

Functions:
- handleDelete(roleId)
- handleSearch(term)
- navigateToPermissions(roleId)
- navigateToEdit(roleId)

UI Libraries: Use Material-UI or Ant Design for table and modals
```

**Prompt 4.2: Create Role Form Component**

```
Create src/pages/rbac/RoleForm.jsx:

Component: RoleForm

Props:
- roleId: number | null (null for create, number for edit)
- onSuccess: () => void
- onCancel: () => void

Features:
- Form fields:
  * Name (required, text input)
  * Prefix (required, auto-generated from name, editable)

- Validation:
  * Name: required, max 255 characters
  * Prefix: required, unique, lowercase, no spaces

- Submit button
- Cancel button

State:
- formData: {name, prefix}
- errors: {name, prefix}
- loading: boolean

Functions:
- handleChange(field, value)
- handleSubmit()
- validateForm()

Use React Hook Form or Formik for form management
```

**Prompt 4.3: Create Permission Matrix Component**

```
Create src/pages/rbac/PermissionMatrix.jsx:

Component: PermissionMatrix

Props:
- roleId: number (required)

Features:
- Display permission matrix in a table:
  * Columns: Feature, View, Add, Edit, Delete
  * Rows grouped by module
  * Checkboxes for each permission action
  * "Select All" checkboxes in column headers

- Save button (bottom right)
- Loading state while fetching/saving
- Success/error notifications

State:
- matrix: PermissionMatrix object
- changes: Map of permission_id -> {is_view, is_add, is_edit, is_delete}
- loading: boolean
- saving: boolean

Functions:
- handleCheckboxChange(permissionId, action, checked)
- handleSelectAll(action, checked)
- handleSave()
- hasChanges(): boolean

UI:
- Use sticky header for table
- Highlight changed rows
- Disable save button if no changes
- Show unsaved changes warning on navigation

Example structure:
```jsx
<Table>
  <TableHead>
    <TableRow>
      <TableCell>Feature</TableCell>
      <TableCell>
        <Checkbox onChange={(e) => handleSelectAll('is_view', e.target.checked)} />
        View
      </TableCell>
      {/* ... other columns */}
    </TableRow>
  </TableHead>
  <TableBody>
    {modules.map(module => (
      <>
        <TableRow key={module.id}>
          <TableCell colSpan={5}><strong>{module.name}</strong></TableCell>
        </TableRow>
        {module.permissions.map(permission => (
          <TableRow key={permission.id}>
            <TableCell>{permission.name}</TableCell>
            <TableCell>
              {permission.show_view && (
                <Checkbox 
                  checked={getPermissionValue(permission.id, 'is_view')}
                  onChange={(e) => handleCheckboxChange(permission.id, 'is_view', e.target.checked)}
                />
              )}
            </TableCell>
            {/* ... other actions */}
          </TableRow>
        ))}
      </>
    ))}
  </TableBody>
</Table>
```
```

### Phase 5: API Service Layer

**Prompt 5.1: Create API Client**

```
Create src/services/api.js:

Setup axios instance with:
- Base URL from environment variable
- Request interceptor to add JWT token
- Response interceptor to handle errors
- Automatic token refresh logic

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - logout user
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```
```

**Prompt 5.2: Create RBAC Service**

```
Create src/services/rbacService.js:

Implement API service for RBAC operations:

```javascript
import api from './api';

const rbacService = {
  // Roles
  getRoles: () => api.get('/rbac/roles/'),
  getRole: (id) => api.get(`/rbac/roles/${id}/`),
  createRole: (data) => api.post('/rbac/roles/', data),
  updateRole: (id, data) => api.put(`/rbac/roles/${id}/`, data),
  deleteRole: (id) => api.delete(`/rbac/roles/${id}/`),

  // Permission Modules
  getModules: () => api.get('/rbac/permission-modules/'),
  getModule: (id) => api.get(`/rbac/permission-modules/${id}/`),

  // Permissions
  getPermissions: (params) => api.get('/rbac/permissions/', { params }),

  // Permission Matrix
  getPermissionMatrix: (roleId) => api.get(`/rbac/roles/${roleId}/permission-matrix/`),
  updatePermissionMatrix: (roleId, data) => api.post(`/rbac/roles/${roleId}/permission-matrix/`, data),

  // User Permissions
  getUserPermissions: () => api.get('/rbac/auth/permissions/'),
  checkPermission: (module, action) => api.post('/rbac/auth/check-permission/', { module, action }),
};

export default rbacService;
```
```

**Prompt 5.3: Create Auth Service**

```
Create src/services/authService.js:

Implement authentication service:

```javascript
import api from './api';

const authService = {
  login: async (username, password) => {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    await api.post('/auth/logout/');
    localStorage.removeItem('token');
  },

  getCurrentUser: () => api.get('/auth/me/'),

  register: (userData) => api.post('/auth/register/', userData),

  changePassword: (oldPassword, newPassword) => 
    api.post('/auth/change-password/', { old_password: oldPassword, new_password: newPassword }),
};

export default authService;
```
```

---

## Integration Guide

### Step-by-Step Integration

**Step 1: Django Setup**
```bash
# Create Django project
django-admin startproject school_management
cd school_management

# Create rbac app
python manage.py startapp rbac

# Install dependencies
pip install djangorestframework djangorestframework-simplejwt django-cors-headers

# Add to INSTALLED_APPS in settings.py
INSTALLED_APPS = [
    ...
    'rest_framework',
    'corsheaders',
    'rbac',
]

# Add middleware
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    ...
    'rbac.middleware.PermissionMiddleware',
    'rbac.middleware.RoleCheckMiddleware',
]

# Configure REST framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# Configure CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

# Set custom user model
AUTH_USER_MODEL = 'rbac.CustomUser'
```

**Step 2: Run Migrations and Seed Data**
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py seed_roles
python manage.py seed_permission_modules
python manage.py seed_permissions
python manage.py seed_superadmin
```

**Step 3: React Setup**
```bash
# Create React app
npx create-react-app school-management-frontend
cd school-management-frontend

# Install dependencies
npm install axios react-router-dom @mui/material @emotion/react @emotion/styled

# Create .env file
REACT_APP_API_URL=http://localhost:8000/api
```

**Step 4: Setup Contexts**
```javascript
// src/App.js
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { RBACProvider } from './contexts/RBACContext';
import AppRoutes from './routes';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <RBACProvider>
          <AppRoutes />
        </RBACProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

**Step 5: Setup Routes**
```javascript
// src/routes/index.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Login from '../pages/auth/Login';
import Dashboard from '../pages/Dashboard';
import RoleList from '../pages/rbac/RoleList';
import PermissionMatrix from '../pages/rbac/PermissionMatrix';
import ProtectedRoute from '../components/rbac/ProtectedRoute';

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />

      <Route path="/rbac/roles" element={
        <ProtectedRoute roles={['superadmin']}>
          <RoleList />
        </ProtectedRoute>
      } />

      <Route path="/rbac/roles/:roleId/permissions" element={
        <ProtectedRoute roles={['superadmin']}>
          <PermissionMatrix />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        isAuthenticated ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default AppRoutes;
```

---

## Testing Scenarios

### Backend Tests

**Test 1: Permission Checking**
```python
# rbac/tests/test_permissions.py
from django.test import TestCase
from rbac.models import Role, Permission, PermissionModule, StaffPrivilege, CustomUser
from rbac.utils import has_permission, is_superadmin

class PermissionTestCase(TestCase):
    def setUp(self):
        # Create roles
        self.superadmin_role = Role.objects.create(id=1, name='Superadmin', prefix='superadmin', is_system=True)
        self.admin_role = Role.objects.create(id=2, name='Admin', prefix='admin', is_system=True)
        
        # Create module and permission
        self.module = PermissionModule.objects.create(name='Employee Management', prefix='employee_management')
        self.permission = Permission.objects.create(
            module=self.module,
            name='Employee',
            prefix='employee',
            show_view=True,
            show_add=True
        )
        
        # Create users
        self.superadmin = CustomUser.objects.create_user(
            username='superadmin',
            password='test123',
            role=self.superadmin_role
        )
        self.admin = CustomUser.objects.create_user(
            username='admin',
            password='test123',
            role=self.admin_role
        )
        
        # Create privilege for admin
        StaffPrivilege.objects.create(
            role=self.admin_role,
            permission=self.permission,
            is_view=True,
            is_add=False
        )
    
    def test_superadmin_has_all_permissions(self):
        self.assertTrue(has_permission(self.superadmin, 'employee', 'is_view'))
        self.assertTrue(has_permission(self.superadmin, 'employee', 'is_add'))
        self.assertTrue(is_superadmin(self.superadmin))
    
    def test_admin_has_specific_permissions(self):
        self.assertTrue(has_permission(self.admin, 'employee', 'is_view'))
        self.assertFalse(has_permission(self.admin, 'employee', 'is_add'))
        self.assertFalse(is_superadmin(self.admin))
    
    def test_user_without_role_has_no_permissions(self):
        user = CustomUser.objects.create_user(username='norole', password='test123')
        self.assertFalse(has_permission(user, 'employee', 'is_view'))
```

**Test 2: API Endpoints**
```python
# rbac/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from rbac.models import Role, CustomUser

class RoleAPITestCase(APITestCase):
    def setUp(self):
        self.superadmin_role = Role.objects.create(id=1, name='Superadmin', prefix='superadmin')
        self.superadmin = CustomUser.objects.create_user(
            username='superadmin',
            password='test123',
            role=self.superadmin_role
        )
        self.client.force_authenticate(user=self.superadmin)
    
    def test_list_roles(self):
        response = self.client.get('/api/rbac/roles/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_create_role(self):
        data = {'name': 'Custom Role', 'prefix': 'custom_role'}
        response = self.client.post('/api/rbac/roles/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Role.objects.count(), 2)
    
    def test_cannot_delete_system_role(self):
        response = self.client.delete(f'/api/rbac/roles/{self.superadmin_role.id}/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
```

### Frontend Tests

**Test 1: Permission Gate Component**
```javascript
// src/components/rbac/__tests__/PermissionGate.test.jsx
import { render, screen } from '@testing-library/react';
import { AuthProvider } from '../../../contexts/AuthContext';
import PermissionGate from '../PermissionGate';

const mockUser = {
  id: 1,
  role: { id: 2, name: 'Admin', prefix: 'admin' },
  permissions: {
    employee: { is_view: true, is_add: false, is_edit: false, is_delete: false }
  }
};

test('renders children when user has permission', () => {
  render(
    <AuthProvider value={{ user: mockUser, hasPermission: () => true }}>
      <PermissionGate module="employee" action="is_view">
        <button>Add Employee</button>
      </PermissionGate>
    </AuthProvider>
  );
  
  expect(screen.getByText('Add Employee')).toBeInTheDocument();
});

test('does not render children when user lacks permission', () => {
  render(
    <AuthProvider value={{ user: mockUser, hasPermission: () => false }}>
      <PermissionGate module="employee" action="is_add">
        <button>Add Employee</button>
      </PermissionGate>
    </AuthProvider>
  );
  
  expect(screen.queryByText('Add Employee')).not.toBeInTheDocument();
});
```

**Test 2: usePermission Hook**
```javascript
// src/hooks/__tests__/usePermission.test.js
import { renderHook } from '@testing-library/react-hooks';
import { AuthProvider } from '../../contexts/AuthContext';
import usePermission from '../usePermission';

test('returns true when user has permission', () => {
  const wrapper = ({ children }) => (
    <AuthProvider value={{ hasPermission: () => true }}>
      {children}
    </AuthProvider>
  );
  
  const { result } = renderHook(() => usePermission('employee', 'is_view'), { wrapper });
  expect(result.current).toBe(true);
});
```

---

## Summary

This document provides complete implementation prompts for:

1. **Django Backend**: Models, views, serializers, utilities, decorators, middleware
2. **React Frontend**: Contexts, hooks, components, services, routing
3. **Integration**: Step-by-step setup and configuration
4. **Testing**: Unit tests for both backend and frontend

Each prompt is designed to be copy-pasted directly to an AI assistant or used as a development guide. The implementation follows the RBAC patterns analyzed from the PHP codebase while adapting to Django and React best practices.
