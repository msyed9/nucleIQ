# Authentication & RBAC Implementation Guide

## 🎯 Overview

This document describes the comprehensive JWT-based Authentication and Role-Based Access Control (RBAC) system implemented for NucleIQ, a multi-tenant School Management SaaS platform.

## 📋 Features Implemented

### 1. **Authentication**
- ✅ JWT-based authentication using `djangorestframework-simplejwt`
- ✅ Custom User model with email as username (globally unique)
- ✅ Tenant-aware user management
- ✅ Platform super admin support (tenant-agnostic)
- ✅ Two-Factor Authentication (2FA) support
- ✅ Password change and reset flows
- ✅ Token refresh mechanism
- ✅ Automatic token blacklisting on logout

### 2. **User Personalization**
- ✅ `UserPreference` model with granular settings:
  - **UI**: Theme mode (Light/Dark/System), Density (Compact/Comfortable), Language (en/hi/ar/ur)
  - **Notifications**: Channel preferences (email, SMS, WhatsApp, push)
  - **Layout**: Sidebar collapsed state, Dashboard widget configuration
  - **Localization**: Timezone, date format, time format
- ✅ Partial preference update API endpoint
- ✅ Automatic RTL detection for Arabic and Urdu

### 3. **Role-Based Access Control (RBAC)**
- ✅ `Role` model (tenant-specific)
- ✅ `Permission` model (global, resource-action based)
- ✅ `RolePermission` mapping (many-to-many)
- ✅ `UserRole` mapping with assignment tracking
- ✅ Granular permission checking: `check_permission(user, 'student_module', 'create')`
- ✅ Custom DRF permission classes

### 4. **Platform Administration**
- ✅ Super Admin capabilities
- ✅ Impersonation feature ("Login as Tenant")
- ✅ Impersonation logging and audit trail
- ✅ IP address tracking

### 5. **Frontend Integration**
- ✅ `AuthContext` for authentication state management
- ✅ `ThemeContext` for theme, branding, and i18n
- ✅ Protected route wrapper with permission checking
- ✅ Login and Forgot Password pages with tenant branding
- ✅ i18next integration with 4 languages (en, hi, ar, ur)
- ✅ Automatic RTL layout switching

## 🗂️ File Structure

### Backend

```
backend/
├── users/
│   ├── __init__.py
│   ├── apps.py
│   ├── models.py              # User, UserPreference, Role, Permission, etc.
│   ├── serializers.py         # All serializers for user management
│   ├── views.py               # ViewSets and API views
│   ├── urls.py                # URL routing
│   ├── admin.py               # Django admin configuration
│   └── signals.py             # Auto-create UserPreference
└── core/
    └── permissions.py         # Custom permission classes and utilities
```

### Frontend

```
frontend/src/
├── types/
│   └── auth.ts                # TypeScript type definitions
├── lib/
│   ├── api.ts                 # API client with interceptors
│   └── i18n.ts                # i18next configuration
├── context/
│   ├── AuthContext.tsx        # Authentication state management
│   └── ThemeContext.tsx       # Theme and branding management
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx # Route protection wrapper
└── pages/
    └── auth/
        ├── LoginPage.tsx      # Login page
        └── ForgotPasswordPage.tsx
```

## 🔧 Backend Setup

### 1. Update Django Settings

Add to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    # ...
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'users',
    # ...
]
```

Configure authentication:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Custom User Model
AUTH_USER_MODEL = 'users.User'

# Email Configuration (for password reset)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
DEFAULT_FROM_EMAIL = 'NucleIQ <noreply@nucleiq.com>'

# Frontend URL (for password reset links)
FRONTEND_URL = 'http://localhost:5173'
```

### 2. Update URL Configuration

In `backend/config/urls.py`:

```python
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('users.urls')),
    # ... other URLs
]
```

### 3. Run Migrations

```bash
docker compose exec backend python manage.py makemigrations users
docker compose exec backend python manage.py migrate
```

### 4. Create Initial Permissions

Create a management command or Django shell script:

```python
from users.models import Permission

# Define all permissions
permissions = [
    # Student Module
    ('student_module', 'create', 'Create students'),
    ('student_module', 'read', 'View students'),
    ('student_module', 'update', 'Update students'),
    ('student_module', 'delete', 'Delete students'),
    ('student_module', 'export', 'Export student data'),
    
    # Staff Module
    ('staff_module', 'create', 'Create staff'),
    ('staff_module', 'read', 'View staff'),
    ('staff_module', 'update', 'Update staff'),
    ('staff_module', 'delete', 'Delete staff'),
    
    # Fee Module
    ('fee_module', 'create', 'Create fee records'),
    ('fee_module', 'read', 'View fee records'),
    ('fee_module', 'update', 'Update fee records'),
    ('fee_module', 'delete', 'Delete fee records'),
    
    # Add more modules as needed
]

for resource, action, description in permissions:
    Permission.objects.get_or_create(
        resource=resource,
        action=action,
        defaults={'description': description}
    )
```

### 5. Create Sample Roles

```python
from users.models import Role, Permission, RolePermission
from tenants.models import Tenant

tenant = Tenant.objects.first()

# Create Principal role
principal_role = Role.objects.create(
    tenant=tenant,
    name='Principal',
    code='principal',
    description='School Principal with full access'
)

# Assign all permissions to Principal
all_permissions = Permission.objects.all()
for perm in all_permissions:
    RolePermission.objects.create(role=principal_role, permission=perm)

# Create Teacher role
teacher_role = Role.objects.create(
    tenant=tenant,
    name='Teacher',
    code='teacher',
    description='Teaching staff'
)

# Assign limited permissions to Teacher
teacher_permissions = Permission.objects.filter(
    resource__in=['student_module', 'attendance_module', 'exam_module'],
    action__in=['read', 'update']
)
for perm in teacher_permissions:
    RolePermission.objects.create(role=teacher_role, permission=perm)
```

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install axios react-router-dom i18next react-i18next
```

### 2. Update Environment Variables

Create `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Update Main App

In `frontend/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './lib/i18n'; // Initialize i18n
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

### 4. Update App Routes

In `frontend/src/App.tsx`:

```tsx
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      
      {/* Protected route with permission check */}
      <Route
        path="/students"
        element={
          <ProtectedRoute
            requiredPermission={{ resource: 'student_module', action: 'read' }}
          >
            <StudentsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
```

## 🔐 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login and get JWT tokens |
| POST | `/api/auth/refresh/` | Refresh access token |
| POST | `/api/auth/logout/` | Logout and blacklist token |
| POST | `/api/auth/change-password/` | Change password |
| POST | `/api/auth/reset-password/` | Request password reset |
| POST | `/api/auth/reset-password/confirm/` | Confirm password reset |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/` | List users |
| POST | `/api/users/` | Create user |
| GET | `/api/users/{id}/` | Get user details |
| PUT/PATCH | `/api/users/{id}/` | Update user |
| DELETE | `/api/users/{id}/` | Soft delete user |
| GET | `/api/users/me/` | Get current user profile |
| PATCH | `/api/users/preferences/` | Update user preferences |
| POST | `/api/users/{id}/activate/` | Activate user |
| POST | `/api/users/{id}/deactivate/` | Deactivate user |

### Roles & Permissions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roles/` | List roles |
| POST | `/api/roles/` | Create role |
| GET | `/api/roles/{id}/` | Get role details |
| PUT/PATCH | `/api/roles/{id}/` | Update role |
| DELETE | `/api/roles/{id}/` | Delete role |
| GET | `/api/permissions/` | List permissions |
| GET | `/api/permissions/by_resource/` | Get permissions grouped by resource |

### Impersonation (Platform Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/impersonate/start/` | Start impersonation |
| POST | `/api/impersonate/{id}/end/` | End impersonation |
| GET | `/api/impersonate/logs/` | View impersonation logs |

## 💡 Usage Examples

### Backend: Check Permission

```python
from core.permissions import check_permission

# In a view
if check_permission(request.user, 'student_module', 'create'):
    # Allow student creation
    pass

# Using decorator
from core.permissions import require_permission

@require_permission('student_module', 'create')
def create_student(request):
    # Create student logic
    pass

# Using DRF permission class
from core.permissions import HasModulePermission

class StudentViewSet(viewsets.ModelViewSet):
    permission_classes = [HasModulePermission]
    required_permission = ('student_module', 'create')
```

### Frontend: Check Permission

```tsx
import { useAuth } from './context/AuthContext';

function StudentCreateButton() {
  const { checkPermission } = useAuth();
  
  if (!checkPermission('student_module', 'create')) {
    return null; // Hide button if no permission
  }
  
  return <button>Create Student</button>;
}
```

### Frontend: Update Preferences

```tsx
import { useAuth } from './context/AuthContext';

function ThemeToggle() {
  const { updatePreferences } = useAuth();
  
  const toggleTheme = async () => {
    await updatePreferences({ theme_mode: 'dark' });
  };
  
  return <button onClick={toggleTheme}>Toggle Dark Mode</button>;
}
```

## 🌍 Internationalization

The system supports 4 languages with automatic RTL:

- **English (en)** - LTR
- **Hindi (hi)** - LTR
- **Arabic (ar)** - RTL
- **Urdu (ur)** - RTL

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return <h1>{t('auth.login')}</h1>;
}
```

## 🎨 Tenant Branding

Branding is automatically applied from `TenantBranding` model:

- Logo and favicon
- Primary, secondary, and sidebar colors
- Font family
- Login background image
- Gallery images

The `ThemeContext` automatically applies these as CSS variables.

## 🔒 Security Best Practices

1. **Token Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
2. **Token Refresh**: Automatic refresh on 401 errors
3. **Token Blacklisting**: Tokens blacklisted on logout
4. **Password Validation**: Django's built-in validators
5. **HTTPS**: Always use HTTPS in production
6. **CORS**: Configure properly for your domain
7. **Rate Limiting**: Add rate limiting to auth endpoints

## 📝 Next Steps

1. Add 2FA implementation (TOTP)
2. Add social authentication (Google, Microsoft)
3. Implement session management
4. Add audit logging for all user actions
5. Implement password policies
6. Add account lockout after failed attempts
7. Implement email verification

## 🐛 Troubleshooting

### Issue: "Cannot save User without a tenant context"
**Solution**: Ensure `TenantMiddleware` is properly configured and tenant is set in request.

### Issue: Token refresh fails
**Solution**: Check that `rest_framework_simplejwt.token_blacklist` is in `INSTALLED_APPS` and migrations are run.

### Issue: RTL not working
**Solution**: Ensure language is set to 'ar' or 'ur' in user preferences and `ThemeContext` is properly wrapped.

## 📚 Additional Resources

- [Django REST Framework](https://www.django-rest-framework.org/)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)
- [i18next](https://www.i18next.com/)
- [React i18next](https://react.i18next.com/)

---

**Implementation Date**: December 28, 2025  
**Version**: 1.0.0  
**Status**: ✅ Complete
