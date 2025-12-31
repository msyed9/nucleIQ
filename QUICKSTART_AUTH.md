# 🚀 Quick Start Guide - Authentication & RBAC

## 📋 Table of Contents
1. [Installation](#installation)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Common Operations](#common-operations)
5. [Testing](#testing)

## 🔧 Installation

### Backend
```bash
# Already included in requirements
docker compose exec backend pip install -r requirements/dev.txt
```

### Frontend
```bash
cd frontend
npm install
# Dependencies: axios, react-router-dom, i18next, react-i18next
```

## 🔨 Backend Setup

### 1. Update Settings

Add to `backend/config/settings/base.py`:

```python
INSTALLED_APPS = [
    # ... existing apps
    'rest_framework_simplejwt.token_blacklist',
    'users',
]

AUTH_USER_MODEL = 'users.User'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Email settings (for password reset)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'  # Dev
DEFAULT_FROM_EMAIL = 'noreply@nucleiq.com'
FRONTEND_URL = 'http://localhost:5173'
```

### 2. Update URLs

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

```bash
docker compose exec backend python manage.py create_initial_permissions
```

### 5. Create Superuser

```bash
docker compose exec backend python manage.py createsuperuser
# Enter email and password
```

## 🎨 Frontend Setup

### 1. Create Environment File

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

### 2. Update main.tsx

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './lib/i18n';
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

### 3. Update App.tsx

See `App.example.tsx` for a complete example, or use this minimal version:

```tsx
import { Routes, Route } from 'react-router-dom';
import { LoginPage } from './pages/auth/LoginPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <div>Dashboard</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
```

## 💡 Common Operations

### Backend

#### Create a Role with Permissions

```python
from users.models import Role, Permission, RolePermission
from tenants.models import Tenant

# Get tenant
tenant = Tenant.objects.first()

# Create role
teacher_role = Role.objects.create(
    tenant=tenant,
    name='Teacher',
    code='teacher',
    description='Teaching staff with limited access'
)

# Get permissions
student_read = Permission.objects.get(resource='student_module', action='read')
student_update = Permission.objects.get(resource='student_module', action='update')

# Assign permissions
RolePermission.objects.create(role=teacher_role, permission=student_read)
RolePermission.objects.create(role=teacher_role, permission=student_update)
```

#### Create a User with Role

```python
from users.models import User, UserRole

# Create user
user = User.objects.create_user(
    email='teacher@school.com',
    password='secure_password',
    first_name='John',
    last_name='Doe',
    tenant=tenant
)

# Assign role
UserRole.objects.create(user=user, role=teacher_role)
```

#### Check Permission in View

```python
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from core.permissions import HasModulePermission

@api_view(['POST'])
@permission_classes([HasModulePermission])
def create_student(request):
    # This view requires 'student_module.create' permission
    # Set in view class:
    # required_permission = ('student_module', 'create')
    pass
```

Or use the utility function:

```python
from core.permissions import check_permission

def my_view(request):
    if check_permission(request.user, 'student_module', 'create'):
        # User has permission
        pass
```

### Frontend

#### Login

```tsx
import { useAuth } from './context/AuthContext';

function LoginForm() {
  const { login } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ email, password });
      // Redirect handled by LoginPage
    } catch (error) {
      console.error('Login failed:', error);
    }
  };
}
```

#### Check Permission

```tsx
import { useAuth } from './context/AuthContext';

function CreateStudentButton() {
  const { checkPermission } = useAuth();
  
  if (!checkPermission('student_module', 'create')) {
    return null; // Hide button
  }
  
  return <button>Create Student</button>;
}
```

#### Update User Preferences

```tsx
import { useAuth } from './context/AuthContext';

function ThemeToggle() {
  const { updatePreferences, user } = useAuth();
  
  const toggleTheme = async () => {
    const newTheme = user?.preference.theme_mode === 'dark' ? 'light' : 'dark';
    await updatePreferences({ theme_mode: newTheme });
  };
  
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

#### Use Translations

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('auth.login')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
}
```

#### Protected Route with Permission

```tsx
<Route
  path="/students/create"
  element={
    <ProtectedRoute
      requiredPermission={{ resource: 'student_module', action: 'create' }}
    >
      <CreateStudentPage />
    </ProtectedRoute>
  }
/>
```

## 🧪 Testing

### Test Login API

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'

# Response:
# {
#   "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
#   "user": { ... }
# }
```

### Test Protected Endpoint

```bash
# Get current user profile
curl -X GET http://localhost:8000/api/users/me/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Permission Check

```bash
# List roles
curl -X GET http://localhost:8000/api/roles/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Test Preference Update

```bash
# Update preferences
curl -X PATCH http://localhost:8000/api/users/preferences/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "theme_mode": "dark",
    "language": "hi"
  }'
```

## 🔍 Troubleshooting

### Issue: "Cannot save User without a tenant context"
**Solution**: Set `is_platform_admin=True` for platform admins, or ensure tenant is set.

### Issue: Token refresh fails
**Solution**: 
1. Check `rest_framework_simplejwt.token_blacklist` is in `INSTALLED_APPS`
2. Run migrations: `python manage.py migrate`

### Issue: Frontend can't connect to backend
**Solution**: 
1. Check `VITE_API_URL` in `.env`
2. Ensure CORS is configured in Django settings
3. Check docker-compose networking

### Issue: RTL not working
**Solution**: Ensure language is 'ar' or 'ur' in user preferences and `ThemeContext` is wrapped around app.

### Issue: Permissions not working
**Solution**:
1. Run `create_initial_permissions` command
2. Assign permissions to roles
3. Assign roles to users
4. Check permission code matches (e.g., 'student_module.create')

## 📚 Next Steps

1. ✅ Create sample roles and permissions
2. ✅ Create test users with different roles
3. ✅ Test login and permission flows
4. ✅ Customize tenant branding
5. ✅ Add more translations to i18n
6. ✅ Implement 2FA (optional)
7. ✅ Add social authentication (optional)

## 🎯 Key Files Reference

- **Backend Models**: `backend/users/models.py`
- **Backend Views**: `backend/users/views.py`
- **Backend Permissions**: `backend/core/permissions.py`
- **Frontend Auth**: `frontend/src/context/AuthContext.tsx`
- **Frontend Theme**: `frontend/src/context/ThemeContext.tsx`
- **API Client**: `frontend/src/lib/api.ts`
- **Types**: `frontend/src/types/auth.ts`

## 💬 Support

For detailed documentation, see:
- `AUTH_RBAC_IMPLEMENTATION.md` - Complete implementation guide
- `IMPLEMENTATION_COMPLETE.md` - Summary and overview

---

**Happy Coding! 🚀**
