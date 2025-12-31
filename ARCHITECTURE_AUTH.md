# 🎨 Authentication & RBAC - Visual Architecture

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ AuthContext  │  │ ThemeContext │  │  i18n (4     │         │
│  │              │  │              │  │  languages)  │         │
│  │ - Login      │  │ - Branding   │  │              │         │
│  │ - Logout     │  │ - Theme Mode │  │ - en, hi     │         │
│  │ - Permissions│  │ - RTL        │  │ - ar, ur     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│         │                  │                  │                 │
│         └──────────────────┴──────────────────┘                 │
│                            │                                     │
│                    ┌───────▼────────┐                           │
│                    │  API Client    │                           │
│                    │  (Axios)       │                           │
│                    │                │                           │
│                    │ - Auto Refresh │                           │
│                    │ - Tenant Header│                           │
│                    └───────┬────────┘                           │
└────────────────────────────┼────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   HTTP/HTTPS    │
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                        BACKEND (Django)                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Middleware Layer                       │  │
│  │  ┌────────────────┐  ┌────────────────┐                 │  │
│  │  │ JWT Auth       │  │ Tenant         │                 │  │
│  │  │ Middleware     │  │ Middleware     │                 │  │
│  │  └────────────────┘  └────────────────┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │                      Views Layer                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ UserView │  │ RoleView │  │ PermView │             │  │
│  │  │ Set      │  │ Set      │  │ Set      │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │ Login    │  │ Password │  │ Imperson │             │  │
│  │  │ View     │  │ Reset    │  │ View     │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │                    Permissions Layer                     │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │  check_permission(user, resource, action)      │    │  │
│  │  │  - IsTenantUser                                │    │  │
│  │  │  - IsPlatformAdmin                             │    │  │
│  │  │  - HasModulePermission                         │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
│  ┌──────────────────────────▼──────────────────────────────┐  │
│  │                      Models Layer                        │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │   User   │  │   Role   │  │Permission│             │  │
│  │  │          │  │          │  │          │             │  │
│  │  │ - email  │  │ - name   │  │ - resource│            │  │
│  │  │ - tenant │  │ - code   │  │ - action │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  │                                                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │  │
│  │  │  User    │  │   Role   │  │Imperson  │             │  │
│  │  │Preference│  │Permission│  │ Log      │             │  │
│  │  └──────────┘  └──────────┘  └──────────┘             │  │
│  └──────────────────────────────────────────────────────────┘  │
│                             │                                    │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   PostgreSQL DB   │
                    │                   │
                    │ - Row Level       │
                    │   Security (RLS)  │
                    │ - Tenant Isolation│
                    └───────────────────┘
```

## 🔐 Authentication Flow

```
┌──────────┐                                    ┌──────────┐
│  User    │                                    │ Backend  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. POST /api/auth/login/                     │
     │     { email, password }                       │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          2. Validate
     │                                          credentials
     │                                                │
     │  3. Return tokens + user profile              │
     │     { access, refresh, user }                 │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  4. Store in localStorage                     │
     │     - auth_tokens                             │
     │     - user                                    │
     │                                                │
     │  5. Subsequent requests                       │
     │     Authorization: Bearer <access_token>      │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          6. Verify
     │                                          JWT token
     │                                                │
     │  7. Return data                               │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  8. Token expires (401)                       │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  9. Auto-refresh with refresh token           │
     │     POST /api/auth/refresh/                   │
     ├──────────────────────────────────────────────►│
     │                                                │
     │  10. New access token                         │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  11. Retry original request                   │
     ├──────────────────────────────────────────────►│
     │                                                │
```

## 🔑 Permission Check Flow

```
┌──────────┐                                    ┌──────────┐
│  User    │                                    │ Backend  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. Request protected resource                │
     │     GET /api/students/                        │
     ├──────────────────────────────────────────────►│
     │                                                │
     │                                          2. Extract
     │                                          user from
     │                                          JWT token
     │                                                │
     │                                          3. Check if
     │                                          platform admin
     │                                          or superuser
     │                                          ├─ Yes → Allow
     │                                          └─ No → Continue
     │                                                │
     │                                          4. Get user's
     │                                          roles
     │                                                │
     │                                          5. Check role
     │                                          permissions
     │                                          for resource
     │                                          & action
     │                                                │
     │                                          6. Permission
     │                                          found?
     │                                          ├─ Yes → Allow
     │                                          └─ No → 403
     │                                                │
     │  7. Return data or 403 Forbidden              │
     │◄──────────────────────────────────────────────┤
     │                                                │
```

## 🎨 Theme & Branding Flow

```
┌──────────┐                                    ┌──────────┐
│  User    │                                    │ Backend  │
└────┬─────┘                                    └────┬─────┘
     │                                                │
     │  1. Login                                     │
     ├──────────────────────────────────────────────►│
     │                                                │
     │  2. Return user with tenant_branding          │
     │     {                                         │
     │       logo_url, primary_color,                │
     │       sidebar_color, font_family              │
     │     }                                         │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  3. ThemeContext applies branding             │
     │     - Set CSS variables                       │
     │     - Update favicon                          │
     │     - Apply font family                       │
     │                                                │
     │  4. User changes theme preference             │
     │     PATCH /api/users/preferences/             │
     │     { theme_mode: 'dark' }                    │
     ├──────────────────────────────────────────────►│
     │                                                │
     │  5. Update UserPreference                     │
     │◄──────────────────────────────────────────────┤
     │                                                │
     │  6. ThemeContext updates                      │
     │     - Apply dark mode                         │
     │     - Update document class                   │
     │                                                │
```

## 🌍 Internationalization Flow

```
User Preference Language: 'ar' (Arabic)
                │
                ▼
        ┌───────────────┐
        │ ThemeContext  │
        └───────┬───────┘
                │
                ├─► Detect RTL language (ar, ur)
                │
                ├─► Set document.dir = 'rtl'
                │
                ├─► Set document.lang = 'ar'
                │
                └─► i18next loads 'ar' translations
                        │
                        ▼
                ┌───────────────┐
                │  UI renders   │
                │  in Arabic    │
                │  with RTL     │
                │  layout       │
                └───────────────┘
```

## 📊 Data Model Relationships

```
┌─────────────┐
│   Tenant    │
└──────┬──────┘
       │
       │ 1:N
       │
       ▼
┌─────────────┐         ┌─────────────┐
│    User     │◄────────┤ UserPreference│
└──────┬──────┘   1:1   └─────────────┘
       │
       │ M:N (through UserRole)
       │
       ▼
┌─────────────┐
│    Role     │
└──────┬──────┘
       │
       │ M:N (through RolePermission)
       │
       ▼
┌─────────────┐
│ Permission  │
└─────────────┘

Impersonation:
┌─────────────┐         ┌─────────────┐
│Platform Admin│────────►│ImpersonationLog│
└─────────────┘         └──────┬──────┘
                               │
                               ▼
                        ┌─────────────┐
                        │Target User  │
                        └─────────────┘
```

## 🔄 State Management

```
Frontend State Flow:

localStorage
    │
    ├─► auth_tokens { access, refresh }
    ├─► user { ...profile, preference, roles, permissions }
    └─► current_tenant
            │
            ▼
    ┌───────────────┐
    │ AuthContext   │
    │               │
    │ - user        │
    │ - tokens      │
    │ - login()     │
    │ - logout()    │
    │ - checkPerm() │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ ThemeContext  │
    │               │
    │ - theme       │
    │ - branding    │
    │ - language    │
    │ - isRTL       │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Components   │
    │               │
    │ - useAuth()   │
    │ - useTheme()  │
    └───────────────┘
```

## 📁 File Organization

```
backend/
├── users/
│   ├── models.py              ⭐ Core models
│   ├── serializers.py         ⭐ API serializers
│   ├── views.py               ⭐ API views
│   ├── urls.py                ⭐ URL routing
│   ├── admin.py               Django admin
│   ├── signals.py             Auto-create preferences
│   └── management/
│       └── commands/
│           └── create_initial_permissions.py
└── core/
    └── permissions.py         ⭐ Permission utilities

frontend/src/
├── types/
│   └── auth.ts                ⭐ TypeScript types
├── lib/
│   ├── api.ts                 ⭐ API client
│   └── i18n.ts                ⭐ i18n config
├── context/
│   ├── AuthContext.tsx        ⭐ Auth state
│   └── ThemeContext.tsx       ⭐ Theme state
├── components/
│   └── auth/
│       └── ProtectedRoute.tsx ⭐ Route guard
└── pages/
    └── auth/
        ├── LoginPage.tsx      ⭐ Login UI
        └── ForgotPasswordPage.tsx
```

## 🎯 Key Features Summary

| Feature | Backend | Frontend |
|---------|---------|----------|
| **JWT Auth** | ✅ SimpleJWT | ✅ Auto-refresh |
| **RBAC** | ✅ Resource-Action | ✅ Permission checks |
| **Multi-Tenant** | ✅ Tenant isolation | ✅ Tenant header |
| **Preferences** | ✅ UserPreference model | ✅ Live updates |
| **Branding** | ✅ TenantBranding | ✅ CSS variables |
| **i18n** | ✅ Django i18n | ✅ i18next (4 langs) |
| **RTL** | N/A | ✅ Auto-detect |
| **Impersonation** | ✅ Full logging | ✅ Platform admin |
| **2FA** | ✅ TOTP support | 🔜 Coming soon |
| **Audit Trail** | ✅ Full tracking | N/A |

---

**Legend:**
- ⭐ = Core/Essential file
- ✅ = Implemented
- 🔜 = Planned/Optional
