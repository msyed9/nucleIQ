# NucleIQ Quick Start Guide

## 🚀 Get Started in 3 Minutes

### Step 1: Start All Services
```bash
docker compose up -d
```

Wait for all services to be healthy (about 30-60 seconds).

### Step 2: Run Migrations
```bash
docker compose exec backend python manage.py migrate
```

### Step 3: Create Superuser
```bash
docker compose exec backend python manage.py createsuperuser
```
*(Default: admin / admin@nucleiq.com / admin123)*

### Step 4: Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/api/docs/

## 📝 Create Your First Tenant

### Via Django Admin
1. Go to http://localhost:8000/admin
2. Login with superuser credentials
3. Click "Tenants" → "Add Tenant"
4. Fill in:
   - Name: "Demo School"
   - Subdomain: "demo"
   - Admin Email: "admin@demo.com"
   - Plan: "Trial"
5. Save

### Via Django Shell
```bash
docker compose exec backend python manage.py shell
```

```python
from tenants.models import Tenant, TenantBranding, AcademicYear
from datetime import date

# Create tenant
tenant = Tenant.objects.create(
    name="Demo School",
    subdomain="demo",
    admin_email="admin@demo.com",
    plan="trial",
    max_students=500,
    max_staff=50
)

# Create branding
branding = TenantBranding.objects.create(
    tenant=tenant,
    primary_color="#1976D2",
    secondary_color="#424242",
    sidebar_color="#263238",
    font_family="Inter, sans-serif"
)

# Create academic year
academic_year = AcademicYear.objects.create(
    tenant=tenant,
    name="2024-2025",
    start_date=date(2024, 4, 1),
    end_date=date(2025, 3, 31),
    is_active=True
)

print(f"✅ Tenant created: {tenant.name}")
print(f"✅ Access at: http://{tenant.subdomain}.localhost:5173")
```

## 🧪 Test Tenant Isolation

### Test with Headers
```bash
# Get tenant ID from admin or shell
TENANT_ID="<your-tenant-uuid>"

# Make API request with tenant header
curl -H "X-Tenant-ID: $TENANT_ID" http://localhost:8000/api/
```

### Test with Subdomain (requires hosts file)
Add to `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
```
127.0.0.1 demo.localhost
```

Then access: http://demo.localhost:5173

## 🛠️ Common Commands

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f celery
```

### Restart Services
```bash
# All services
docker compose restart

# Specific service
docker compose restart backend
```

### Stop Everything
```bash
docker compose down
```

### Stop and Remove Volumes (Fresh Start)
```bash
docker compose down -v
```

## 🔍 Verify Installation

### Check Database
```bash
docker compose exec db psql -U nucleiq_user -d nucleiq -c "\dt"
```

You should see tables like:
- tenants
- tenant_branding
- tenant_domains
- academic_years

### Check Redis
```bash
docker compose exec redis redis-cli ping
```

Should return: `PONG`

### Check Celery
```bash
docker compose exec backend celery -A config inspect ping
```

Should show active worker.

## 📊 Next Steps

1. **Explore the Admin Panel**
   - Create more tenants
   - Configure branding
   - Add academic years

2. **Test the API**
   - Visit http://localhost:8000/api/docs/
   - Try authenticated endpoints
   - Test tenant isolation

3. **Customize Frontend**
   - Edit `frontend/src/App.tsx`
   - Add new components
   - Test hot reload

4. **Add New Modules**
   - Create Django apps
   - Inherit from TenantAwareModel
   - Build APIs and frontend

## 🆘 Troubleshooting

### "Port already in use"
```bash
docker compose down
# Change ports in docker-compose.yml if needed
```

### "Cannot connect to database"
```bash
docker compose logs db
docker compose restart db
```

### "Frontend not loading"
```bash
docker compose exec frontend npm install
docker compose restart frontend
```

### "Migrations not applying"
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

## 🎓 Learn More

- Read `README.md` for comprehensive documentation
- Check `IMPLEMENTATION_SUMMARY.md` for architecture details
- Review code comments in `core/models.py` and `core/middleware.py`

---

**Happy Coding! 🚀**
