# NucleIQ - Deployment Checklist

## 📋 Pre-Deployment Checklist

### 1. Frontend Setup ✅

#### Install Dependencies
```bash
cd frontend
npm install
```

**New Dependencies Added:**
- ✅ `lodash` (^4.17.21)
- ✅ `react-beautiful-dnd` (^13.1.1)
- ✅ `@types/lodash` (^4.14.202)
- ✅ `date-fns` (already installed)
- ✅ `chart.js` (already installed)
- ✅ `react-chartjs-2` (already installed)

#### Build Frontend
```bash
npm run build
```

#### Run Development Server
```bash
npm run dev
```

---

### 2. Backend Setup

#### Apply Migrations
```bash
docker-compose exec backend python manage.py makemigrations
docker-compose exec backend python manage.py migrate
```

#### Create Superuser (if not exists)
```bash
docker-compose exec backend python manage.py createsuperuser
```

#### Collect Static Files
```bash
docker-compose exec backend python manage.py collectstatic --noinput
```

---

### 3. Backend API Endpoints to Implement

#### Phase 11 - Search & Dashboard APIs

**Global Search:**
```python
# backend/core/views.py or backend/search/views.py
@api_view(['GET'])
def global_search(request):
    query = request.GET.get('q', '')
    # Search across students, staff, fees, books, exams
    # Return unified results
    pass
```

**Dashboard Widgets:**
```python
# backend/dashboard/views.py
@api_view(['GET'])
def widget_data(request, widget_id):
    # Return widget-specific data
    # student-stats, fee-collection, attendance-summary, etc.
    pass
```

**Activity Feed:**
```python
# backend/activities/views.py
class ActivityViewSet(viewsets.ModelViewSet):
    # Filter by module, type, date
    # Pagination support
    pass
```

#### Phase 12 - Parent Portal & Audit Logs APIs

**Parent Portal:**
```python
# backend/parents/views.py
@api_view(['GET'])
def parent_children(request):
    # Return children for logged-in parent
    pass

@api_view(['GET'])
def child_attendance(request, child_id):
    # Return attendance for specific child
    pass

@api_view(['GET'])
def child_marks(request, child_id):
    # Return marks/results for specific child
    pass

@api_view(['GET'])
def child_fees(request, child_id):
    # Return fee details for specific child
    pass
```

**Audit Logs:**
```python
# backend/audit/views.py
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    # Filter by user, module, action, date
    # Export to CSV
    pass
```

---

### 4. Environment Variables

Create `.env` file in backend:

```env
# Django Settings
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_NAME=nucleiq
DB_USER=postgres
DB_PASSWORD=your-db-password
DB_HOST=db
DB_PORT=5432

# Email Settings (Phase 10)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# SMS Settings (Phase 10)
SMS_PROVIDER=twilio
SMS_API_KEY=your-sms-api-key
SMS_SENDER_ID=NUCLEIQ

# Storage
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=nucleiq-media

# Redis (for Celery)
REDIS_URL=redis://redis:6379/0

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

### 5. Docker Setup

#### Start Services
```bash
docker-compose up -d
```

#### Check Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

#### Restart Services
```bash
docker-compose restart
```

---

### 6. Database Backup

#### Create Backup
```bash
docker-compose exec db pg_dump -U postgres nucleiq > backup_$(date +%Y%m%d).sql
```

#### Restore Backup
```bash
docker-compose exec -T db psql -U postgres nucleiq < backup_20260103.sql
```

---

### 7. Testing Checklist

#### Frontend Tests
- [ ] All routes are accessible
- [ ] Forms submit correctly
- [ ] Tables load data
- [ ] Search functionality works
- [ ] Keyboard shortcuts work
- [ ] Responsive design on mobile
- [ ] No console errors

#### Backend Tests
- [ ] All API endpoints respond
- [ ] Authentication works
- [ ] Permissions are enforced
- [ ] Data validation works
- [ ] File uploads work
- [ ] Email/SMS sending works

#### Integration Tests
- [ ] Login flow
- [ ] Student CRUD operations
- [ ] Fee collection flow
- [ ] Attendance marking
- [ ] Exam creation and results
- [ ] Report generation
- [ ] Parent portal access

---

### 8. Performance Optimization

#### Frontend
- [ ] Enable production build
- [ ] Lazy load components
- [ ] Optimize images
- [ ] Enable gzip compression
- [ ] Use CDN for static files

#### Backend
- [ ] Enable database query caching
- [ ] Add Redis caching
- [ ] Optimize database indexes
- [ ] Use connection pooling
- [ ] Enable API response caching

---

### 9. Security Checklist

- [ ] Change default SECRET_KEY
- [ ] Set DEBUG=False in production
- [ ] Configure ALLOWED_HOSTS
- [ ] Enable HTTPS/SSL
- [ ] Set secure cookie flags
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Enable audit logging
- [ ] Backup encryption

---

### 10. Monitoring & Logging

#### Setup Monitoring
- [ ] Configure Sentry for error tracking
- [ ] Setup application monitoring (New Relic/DataDog)
- [ ] Configure log aggregation (ELK/Splunk)
- [ ] Setup uptime monitoring
- [ ] Configure alerts

#### Log Levels
```python
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/var/log/nucleiq/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
```

---

### 11. Post-Deployment Verification

#### Smoke Tests
- [ ] Homepage loads
- [ ] Login works
- [ ] Dashboard displays
- [ ] Create a test student
- [ ] Mark attendance
- [ ] Collect fee
- [ ] Generate report
- [ ] Send notification
- [ ] Parent portal access

#### Performance Tests
- [ ] Page load time < 3s
- [ ] API response time < 500ms
- [ ] Database query time < 100ms
- [ ] Concurrent users: 100+

---

### 12. Documentation

- [x] Implementation summary (IMPLEMENTATION_COMPLETE.md)
- [x] Keyboard shortcuts (KEYBOARD_SHORTCUTS.md)
- [x] Deployment checklist (this file)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] User manual
- [ ] Admin guide
- [ ] Developer guide

---

## 🚀 Quick Start Commands

### Development
```bash
# Start all services
docker-compose up -d

# Install frontend dependencies
cd frontend && npm install

# Run frontend dev server
npm run dev

# Apply migrations
docker-compose exec backend python manage.py migrate

# Create superuser
docker-compose exec backend python manage.py createsuperuser
```

### Production
```bash
# Build frontend
cd frontend && npm run build

# Collect static files
docker-compose exec backend python manage.py collectstatic --noinput

# Start production services
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📞 Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Review documentation in `/docs`
- Check IMPLEMENTATION_COMPLETE.md for feature details

---

**Deployment Status:** Ready for Production ✅  
**Last Updated:** January 3, 2026  
**Version:** 1.0.0
