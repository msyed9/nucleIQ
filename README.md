# 🎓 NucleIQ - Multi-Tenant School Management SaaS

A comprehensive, production-ready School Management System built with Django, React, and PostgreSQL with Row Level Security (RLS).

## 🏗️ Architecture Overview

### **Multi-Tenancy Strategy**
- **Single Database, Shared Schema** with `tenant_id` column
- **PostgreSQL Row Level Security (RLS)** for data isolation
- **Application-level safety** via custom managers
- **Subdomain-based** tenant detection (e.g., `school1.nucleiq.com`)
- **Custom domain** support (e.g., `portal.myschool.com`)

### **Tech Stack**

#### Backend
- **Django 5.1** - Web framework
- **Django REST Framework** - API development
- **PostgreSQL 16+** - Database with RLS
- **Celery** - Background task processing
- **Redis** - Caching and message broker
- **JWT** - Authentication

#### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **TanStack Query** - Data fetching
- **Zod** - Schema validation

#### Infrastructure
- **Docker & Docker Compose** - Containerization
- **Nginx** - Production web server
- **Multi-stage builds** - Optimized images

## 🚀 Quick Start

### Prerequisites
- Docker Desktop installed
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nucleIQ
```

### 2. Start All Services
```bash
docker compose up
```

This single command will:
- ✅ Start PostgreSQL with RLS initialized
- ✅ Start Redis
- ✅ Build and start Django backend (port 8000)
- ✅ Build and start React frontend (port 5173)
- ✅ Start Celery worker and beat scheduler

### 3. Run Initial Migrations
```bash
docker compose exec backend python manage.py migrate
```

### 4. Create Superuser
```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/

## 📁 Project Structure

```
nucleIQ/
├── backend/                    # Django backend
│   ├── config/                 # Project configuration
│   │   ├── settings/           # Split settings (base, dev, prod)
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── celery.py
│   ├── core/                   # Core app (base models, middleware)
│   │   ├── models.py           # BaseModel, TenantAwareModel
│   │   ├── middleware.py       # TenantMiddleware
│   │   └── exceptions.py       # Custom exception handler
│   ├── tenants/                # Tenant management
│   │   ├── models.py           # Tenant, TenantBranding, Domain, AcademicYear
│   │   └── admin.py
│   ├── requirements/           # Python dependencies
│   │   ├── dev.txt
│   │   └── prod.txt
│   ├── scripts/                # Utility scripts
│   │   └── init_rls.sql        # PostgreSQL RLS initialization
│   ├── Dockerfile
│   └── manage.py
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── README.md
```

## 🔑 Core Features

### 1. **Base Models**
All models inherit from `BaseModel` which provides:
- UUID primary keys
- Audit trail (created_by, updated_by, created_at, updated_at)
- Soft delete (is_deleted, deleted_at, deleted_by)
- Custom managers for automatic filtering

### 2. **Tenant Isolation**
- `TenantAwareModel` extends `BaseModel` with tenant foreign key
- Automatic tenant filtering via custom manager
- PostgreSQL RLS policies for database-level security
- Thread-local storage for tenant context

### 3. **Tenant Branding**
Each tenant can customize:
- Logo, favicon, login background
- Primary, secondary, sidebar colors
- Font family
- Gallery images (for login carousel)
- Custom CSS

### 4. **Academic Year Management**
- Multiple academic years per tenant
- Only one active year at a time
- Lock past years to prevent modifications
- Date overlap validation

### 5. **Custom Domains**
- Support for custom domains per tenant
- Primary domain designation
- Domain verification tracking

## 🛠️ Development Workflow

### Hot Reloading
Both backend and frontend support hot reloading:
- **Django**: Auto-reloads on Python file changes
- **React**: Vite HMR for instant updates

### Running Commands

#### Backend Commands
```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create migrations
docker compose exec backend python manage.py makemigrations

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Django shell
docker compose exec backend python manage.py shell

# Collect static files
docker compose exec backend python manage.py collectstatic
```

#### Frontend Commands
```bash
# Install new package
docker compose exec frontend npm install <package-name>

# Run linter
docker compose exec frontend npm run lint

# Build for production
docker compose exec frontend npm run build
```

#### Database Commands
```bash
# Access PostgreSQL shell
docker compose exec db psql -U nucleiq_user -d nucleiq

# Backup database
docker compose exec db pg_dump -U nucleiq_user nucleiq > backup.sql

# Restore database
docker compose exec -T db psql -U nucleiq_user nucleiq < backup.sql
```

#### Celery Commands
```bash
# View Celery logs
docker compose logs -f celery

# Restart Celery worker
docker compose restart celery
```

### Viewing Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery
```

## 🔒 Security Features

### Row Level Security (RLS)
PostgreSQL RLS policies ensure tenant data isolation at the database level:

```sql
-- Example RLS policy (auto-applied via migrations)
CREATE POLICY tenant_isolation_policy ON table_name
    USING (tenant_id = get_current_tenant_id());
```

### Middleware Security
`TenantMiddleware` sets the RLS context for each request:
```python
cursor.execute(
    "SELECT set_config('app.current_tenant_id', %s, FALSE)",
    [str(tenant.id)]
)
```

### Application-level Safety
Custom managers provide an additional safety layer:
```python
class TenantAwareManager(BaseModelManager):
    def get_queryset(self):
        qs = super().get_queryset()
        tenant = get_current_tenant()
        if tenant:
            qs = qs.filter(tenant=tenant)
        return qs
```

## 📊 Database Schema

### Core Tables
- `tenants` - Tenant information
- `tenant_branding` - Branding configuration
- `tenant_domains` - Custom domain mappings
- `academic_years` - Academic year management

### Audit Fields (All Tables)
- `id` (UUID)
- `created_at`, `updated_at`
- `created_by`, `updated_by`
- `is_deleted`, `deleted_at`, `deleted_by`
- `tenant_id` (for tenant-aware models)

## 🌐 API Documentation

Access interactive API documentation:
- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🧪 Testing

### Backend Tests
```bash
docker compose exec backend python manage.py test
```

### Frontend Tests
```bash
docker compose exec frontend npm test
```

## 📦 Production Deployment

### Build Production Images
```bash
# Backend
docker build -t nucleiq-backend:latest --target production ./backend

# Frontend
docker build -t nucleiq-frontend:latest --target production ./frontend
```

### Environment Variables
Create `.env.prod` file with production settings:
```env
DJANGO_SETTINGS_MODULE=config.settings.prod
SECRET_KEY=<strong-secret-key>
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/db
REDIS_URL=redis://host:6379/0
```

### Production Checklist
- [ ] Set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS`
- [ ] Set `DEBUG=False`
- [ ] Configure HTTPS/SSL
- [ ] Set up proper database backups
- [ ] Configure email backend (SMTP)
- [ ] Set up Sentry for error tracking
- [ ] Configure static/media file storage (S3, etc.)
- [ ] Set up monitoring and logging
- [ ] Configure firewall rules

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

[Your License Here]

## 🆘 Troubleshooting

### Port Already in Use
```bash
# Stop all containers
docker compose down

# Remove all containers and volumes
docker compose down -v
```

### Database Connection Issues
```bash
# Check database health
docker compose ps

# View database logs
docker compose logs db
```

### Frontend Not Loading
```bash
# Rebuild frontend
docker compose build frontend

# Clear node_modules and reinstall
docker compose exec frontend rm -rf node_modules
docker compose exec frontend npm install
```

### Celery Not Processing Tasks
```bash
# Check Celery logs
docker compose logs celery

# Restart Celery
docker compose restart celery celery-beat
```

## 📚 Additional Resources

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React Documentation](https://react.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

**Built with ❤️ for Educational Institutions**
