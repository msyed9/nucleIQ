# NucleIQ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Browser (school1.nucleiq.com)  ←→  Browser (school2.nucleiq.com)           │
│         ↓                                      ↓                              │
│    React App (Port 5173)                 React App (Port 5173)               │
│    - TypeScript                          - TypeScript                        │
│    - TailwindCSS                         - TailwindCSS                       │
│    - TanStack Query                      - TanStack Query                    │
│    - Tenant Branding Applied             - Tenant Branding Applied           │
│                                                                               │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS + X-Tenant-ID Header
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                        APPLICATION LAYER                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Django Backend (Port 8000)                              │   │
│  │                                                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  TenantMiddleware                                             │  │   │
│  │  │  1. Detect tenant (subdomain/header/domain)                  │  │   │
│  │  │  2. Set PostgreSQL RLS context                               │  │   │
│  │  │  3. Store in thread-local                                    │  │   │
│  │  │  4. Inject branding to request                               │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                              ↓                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  Django REST Framework                                        │  │   │
│  │  │  - JWT Authentication                                         │  │   │
│  │  │  - API Views & Serializers                                    │  │   │
│  │  │  - Permissions & Filters                                      │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                              ↓                                       │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │  Business Logic Layer                                         │  │   │
│  │  │  - TenantAwareModel (auto-filters by tenant)                 │  │   │
│  │  │  - BaseModel (audit trail + soft delete)                     │  │   │
│  │  │  - Custom Managers                                            │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              Celery Workers                                          │   │
│  │  - Background tasks                                                  │   │
│  │  - Email sending                                                     │   │
│  │  - Report generation                                                 │   │
│  │  - Scheduled jobs (Celery Beat)                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │
                                │ SQL Queries with RLS Context
                                │
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                          DATA LAYER                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  PostgreSQL 16 (Port 5432)                                           │   │
│  │                                                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐ │   │
│  │  │  Row Level Security (RLS) Policies                             │ │   │
│  │  │  - get_current_tenant_id() from session variable              │ │   │
│  │  │  - Automatic filtering: WHERE tenant_id = current_tenant      │ │   │
│  │  │  - Super admin bypass capability                              │ │   │
│  │  └────────────────────────────────────────────────────────────────┘ │   │
│  │                                                                       │   │
│  │  Tables:                                                              │   │
│  │  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐       │   │
│  │  │   tenants    │  │ tenant_branding  │  │ academic_years  │       │   │
│  │  │ ─────────────│  │ ────────────────│  │ ───────────────│       │   │
│  │  │ id (UUID)    │  │ tenant_id (FK)   │  │ tenant_id (FK)  │       │   │
│  │  │ name         │  │ logo_url         │  │ name            │       │   │
│  │  │ subdomain    │  │ primary_color    │  │ start_date      │       │   │
│  │  │ plan         │  │ sidebar_color    │  │ end_date        │       │   │
│  │  │ is_active    │  │ font_family      │  │ is_active       │       │   │
│  │  │ ...          │  │ gallery_images   │  │ is_locked       │       │   │
│  │  └──────────────┘  └──────────────────┘  └─────────────────┘       │   │
│  │                                                                       │   │
│  │  All tenant-aware tables have:                                       │   │
│  │  - tenant_id (FK) ← RLS enforces isolation                          │   │
│  │  - id, created_at, updated_at, created_by, updated_by               │   │
│  │  - is_deleted, deleted_at, deleted_by (soft delete)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Redis (Port 6379)                                                   │   │
│  │  - Session cache                                                     │   │
│  │  - Celery message broker                                             │   │
│  │  - Query result cache                                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                    TENANT ISOLATION - 3 LAYERS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  Layer 1: DATABASE (PostgreSQL RLS)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CREATE POLICY tenant_isolation ON table_name                        │   │
│  │      USING (tenant_id = get_current_tenant_id());                    │   │
│  │                                                                       │   │
│  │  ✅ Enforced at database level                                       │   │
│  │  ✅ Cannot be bypassed by application bugs                           │   │
│  │  ✅ Works with any database client                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Layer 2: APPLICATION (Custom Managers)                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  class TenantAwareManager(BaseModelManager):                         │   │
│  │      def get_queryset(self):                                         │   │
│  │          qs = super().get_queryset()                                 │   │
│  │          tenant = get_current_tenant()                               │   │
│  │          if tenant:                                                   │   │
│  │              qs = qs.filter(tenant=tenant)                           │   │
│  │          return qs                                                    │   │
│  │                                                                       │   │
│  │  ✅ Safety net for RLS                                               │   │
│  │  ✅ Automatic filtering in Python code                               │   │
│  │  ✅ Developer-friendly                                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  Layer 3: REQUEST (Middleware)                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  class TenantMiddleware:                                             │   │
│  │      1. Extract tenant from subdomain/header/domain                  │   │
│  │      2. Validate tenant is active                                    │   │
│  │      3. Set PostgreSQL session variable                              │   │
│  │      4. Store in thread-local storage                                │   │
│  │      5. Attach branding to request                                   │   │
│  │                                                                       │   │
│  │  ✅ Sets context for entire request                                  │   │
│  │  ✅ Injects branding for white-label                                 │   │
│  │  ✅ Cleans up after response                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────┐
│                      DATA FLOW EXAMPLE                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  1. User visits: http://school1.nucleiq.com/students                         │
│                                                                               │
│  2. TenantMiddleware:                                                        │
│     - Extracts "school1" from subdomain                                      │
│     - Queries: SELECT * FROM tenants WHERE subdomain='school1'               │
│     - Sets: SET app.current_tenant_id = '<tenant-uuid>'                      │
│     - Stores tenant in thread-local                                          │
│                                                                               │
│  3. View executes: Student.objects.all()                                     │
│                                                                               │
│  4. TenantAwareManager adds: .filter(tenant=current_tenant)                  │
│                                                                               │
│  5. PostgreSQL RLS enforces:                                                 │
│     SELECT * FROM students                                                   │
│     WHERE tenant_id = '<tenant-uuid>'  ← Added by RLS                        │
│     AND is_deleted = false             ← Added by BaseModelManager           │
│                                                                               │
│  6. Response includes tenant branding (colors, logo)                         │
│                                                                               │
│  ✅ Result: User only sees their school's students                           │
│  ✅ Complete isolation at all layers                                         │
│                                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🔐 Security
- **3-Layer Isolation**: Database RLS + Application Managers + Middleware
- **Soft Delete**: Never lose data, audit trail for deletions
- **Audit Trail**: Track who created/modified every record
- **JWT Authentication**: Secure token-based auth

### 🎨 Customization
- **White-Label**: Each tenant has custom branding
- **Colors**: Primary, secondary, sidebar colors
- **Assets**: Logo, favicon, backgrounds, gallery
- **Fonts**: Custom font families

### 🚀 Performance
- **Connection Pooling**: Efficient database connections
- **Redis Caching**: Fast data retrieval
- **Celery**: Async background tasks
- **Optimized Queries**: Composite indexes on tenant_id

### 🛠️ Developer Experience
- **Hot Reload**: Instant feedback on code changes
- **Type Safety**: TypeScript on frontend
- **API Docs**: Auto-generated Swagger/ReDoc
- **Docker**: Consistent dev/prod environments
