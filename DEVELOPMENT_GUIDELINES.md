# nucleIQ Development Guidelines
**Version:** 1.0  
**Last Updated:** 2026-01-19

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [Multi-Tenancy Guidelines](#2-multi-tenancy-guidelines)
3. [Backend Development](#3-backend-development)
4. [Frontend Development](#4-frontend-development)
5. [Mobile Development](#5-mobile-development)
6. [Database & Migrations](#6-database--migrations)
7. [API Development](#7-api-development)
8. [Security Guidelines](#8-security-guidelines)
9. [Testing Guidelines](#9-testing-guidelines)
10. [Deployment Guidelines](#10-deployment-guidelines)

---

## 1. Architecture Overview

### 1.1 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 5.x, Django REST Framework |
| Database | PostgreSQL 16 with RLS |
| Cache/Broker | Redis 7 |
| Task Queue | Celery |
| Frontend | React 18, Vite, TypeScript, TailwindCSS |
| Mobile | React Native, Expo |
| Containers | Docker, Docker Compose |

### 1.2 Project Structure

```
nucleIQ/
├── backend/                 # Django backend
│   ├── config/             # Django settings and configuration
│   │   ├── settings/       # Environment-specific settings
│   │   ├── urls.py         # Root URL configuration
│   │   └── celery.py       # Celery configuration
│   ├── core/               # Core utilities, base models, middleware
│   ├── tenants/            # Multi-tenancy models (Tenant, AcademicYear, Section, etc.)
│   ├── users/              # User authentication and RBAC
│   ├── students/           # Student management module
│   ├── staff/              # Staff management module
│   ├── fees/               # Fee collection module
│   ├── attendance/         # Attendance tracking module
│   ├── [other_apps]/       # Feature-specific apps
│   └── scripts/            # Database scripts (RLS, etc.)
├── frontend/               # React web application
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── pages/          # Page components
│       ├── services/       # API service layer
│       ├── contexts/       # React contexts
│       ├── hooks/          # Custom React hooks
│       └── design-system/  # Design system components
├── mobile/                 # React Native mobile app
│   └── src/
│       ├── components/     # Mobile components
│       ├── screens/        # Screen components
│       ├── navigation/     # Navigation configuration
│       └── services/       # API services
├── scripts/                # Deployment and utility scripts
└── docker-compose.yml      # Container orchestration
```

---

## 2. Multi-Tenancy Guidelines

### 2.1 Core Principle: RLS (Row Level Security)

All tenant data is isolated using PostgreSQL Row Level Security. Every request:
1. Detects tenant from header/subdomain/domain
2. Sets PostgreSQL session variable `app.current_tenant_id`
3. RLS policies automatically filter data

### 2.2 Creating Tenant-Aware Models

**ALWAYS inherit from `TenantAwareModel` for tenant-specific data:**

```python
# ✅ CORRECT - Use TenantAwareModel
from core.models import TenantAwareModel

class MyNewModel(TenantAwareModel):
    """
    This model inherits tenant FK and managers from TenantAwareModel.
    No need to manually add tenant field.
    """
    name = models.CharField(max_length=100)
    # ... other fields
    
    class Meta:
        db_table = 'my_new_models'
        # Add tenant + common query field index
        indexes = [
            models.Index(fields=['tenant', 'name']),
        ]
```

```python
# ❌ WRONG - Don't manually add tenant FK
class MyNewModel(BaseModel):
    tenant = models.ForeignKey('tenants.Tenant', ...)  # DON'T DO THIS
```

### 2.3 Global (Non-Tenant) Models

For system-wide models that don't belong to any tenant:

```python
from core.models import BaseModel

class SystemConfiguration(BaseModel):
    """Global configuration not tied to any tenant."""
    key = models.CharField(max_length=100, unique=True)
    value = models.JSONField()
```

### 2.4 Accessing Current Tenant

```python
from core.middleware import get_current_tenant

# In views/serializers
tenant = get_current_tenant()

# In viewsets (preferred)
tenant = self.request.tenant
```

### 2.5 Creating Tenant-Aware ViewSets

```python
from rest_framework import viewsets
from core.permissions import IsTenantUser

class MyModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTenantUser]
    
    def get_queryset(self):
        # TenantAwareManager automatically filters by tenant
        return MyModel.objects.all()
    
    def perform_create(self, serializer):
        # Tenant is auto-set by TenantAwareModel.save()
        serializer.save()
```

---

## 3. Backend Development

### 3.1 Creating a New App

```bash
# 1. Create the app
cd backend
python manage.py startapp new_feature

# 2. Add to INSTALLED_APPS in config/settings/base.py
INSTALLED_APPS = [
    ...
    'new_feature',
]

# 3. Create models inheriting from TenantAwareModel
# 4. Create migrations
python manage.py makemigrations new_feature

# 5. Create serializers, views, urls
# 6. Register URLs in config/urls.py
```

### 3.2 Model Naming Conventions

```python
# Models: PascalCase, singular
class FeatureItem(TenantAwareModel):
    pass

# Database tables: snake_case, plural
class Meta:
    db_table = 'feature_items'

# Related names: lowercase, descriptive
related_name = 'feature_items'  # or 'items' if context is clear
```

### 3.3 Required Model Fields

Every model should have these via BaseModel/TenantAwareModel:
- `id` (UUID primary key)
- `created_at` (auto timestamp)
- `updated_at` (auto timestamp)
- `is_deleted` (soft delete flag)
- `deleted_at` (soft delete timestamp)
- `tenant` (for TenantAwareModel only)

### 3.4 ViewSet Standard Pattern

```python
from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.decorators import action
from rest_framework.response import Response

class MyModelViewSet(viewsets.ModelViewSet):
    """
    CRUD operations for MyModel.
    
    Endpoints:
    - GET /api/v1/my-models/ - List
    - POST /api/v1/my-models/ - Create
    - GET /api/v1/my-models/{id}/ - Retrieve
    - PUT/PATCH /api/v1/my-models/{id}/ - Update
    - DELETE /api/v1/my-models/{id}/ - Delete
    """
    serializer_class = MyModelSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_queryset(self):
        return MyModel.objects.select_related('related_model').all()
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Custom action for summary statistics."""
        qs = self.get_queryset()
        return Response({
            'total': qs.count(),
            'active': qs.filter(is_active=True).count(),
        })
```

### 3.5 Serializer Pattern

```python
from rest_framework import serializers

class MyModelSerializer(serializers.ModelSerializer):
    # Read-only computed fields
    full_name = serializers.SerializerMethodField()
    
    # Nested serializers for reads
    category_details = CategorySerializer(source='category', read_only=True)
    
    # Write-only fields for creates/updates
    category_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = MyModel
        fields = [
            'id', 'name', 'full_name',
            'category_details', 'category_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def validate_name(self, value):
        if len(value) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters.")
        return value
```

---

## 4. Frontend Development

### 4.1 Component Structure

```
src/pages/NewFeature/
├── NewFeatureList.tsx        # List/table view
├── NewFeatureDetail.tsx      # Detail view
├── NewFeatureForm.tsx        # Create/edit form
├── NewFeatureFilters.tsx     # Filter component
├── components/               # Feature-specific components
│   ├── NewFeatureCard.tsx
│   └── NewFeatureStats.tsx
└── index.ts                  # Export barrel
```

### 4.2 Page Component Pattern

```typescript
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageLayout } from '@/design-system/layout/PageLayout';
import { Button, Card, Table } from '@/design-system';
import { api } from '@/services/api';
import toast from 'react-hot-toast';

interface NewFeatureProps {}

const NewFeatureList: React.FC<NewFeatureProps> = () => {
  const queryClient = useQueryClient();
  
  // Fetch data
  const { data, isLoading, error } = useQuery({
    queryKey: ['new-features'],
    queryFn: () => api.get('/api/v1/new-features/'),
  });
  
  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/new-features/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['new-features'] });
      toast.success('Deleted successfully');
    },
    onError: () => toast.error('Failed to delete'),
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading data</div>;
  
  return (
    <PageLayout
      title="New Features"
      subtitle="Manage your new features"
      actions={
        <Button href="/new-features/create">Add New</Button>
      }
    >
      <Card>
        {/* Table or list content */}
      </Card>
    </PageLayout>
  );
};

export default NewFeatureList;
```

### 4.3 Form Component Pattern

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  category_id: z.string().uuid('Select a category'),
});

type FormData = z.infer<typeof schema>;

const NewFeatureForm: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = (data: FormData) => {
    // Handle form submission
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Name"
        {...register('name')}
        error={errors.name?.message}
      />
      {/* More fields */}
      <Button type="submit">Save</Button>
    </form>
  );
};
```

### 4.4 API Service Pattern

```typescript
// src/services/newFeatureService.ts
import { api } from './api';

export interface NewFeature {
  id: string;
  name: string;
  category: string;
  created_at: string;
}

export interface CreateNewFeatureDTO {
  name: string;
  category_id: string;
}

export const newFeatureService = {
  getAll: (params?: { search?: string; page?: number }) => 
    api.get<{ results: NewFeature[]; count: number }>('/api/v1/new-features/', { params }),
  
  getById: (id: string) => 
    api.get<NewFeature>(`/api/v1/new-features/${id}/`),
  
  create: (data: CreateNewFeatureDTO) => 
    api.post<NewFeature>('/api/v1/new-features/', data),
  
  update: (id: string, data: Partial<CreateNewFeatureDTO>) => 
    api.patch<NewFeature>(`/api/v1/new-features/${id}/`, data),
  
  delete: (id: string) => 
    api.delete(`/api/v1/new-features/${id}/`),
};
```

### 4.5 Adding Routes

```typescript
// In App.tsx or routes configuration
import NewFeatureList from '@/pages/NewFeature/NewFeatureList';
import NewFeatureDetail from '@/pages/NewFeature/NewFeatureDetail';
import NewFeatureForm from '@/pages/NewFeature/NewFeatureForm';

// Add routes
<Route path="/new-features" element={<NewFeatureList />} />
<Route path="/new-features/:id" element={<NewFeatureDetail />} />
<Route path="/new-features/create" element={<NewFeatureForm />} />
<Route path="/new-features/:id/edit" element={<NewFeatureForm />} />
```

### 4.6 Adding Sidebar Menu Items

```typescript
// In components/Sidebar.tsx - Add to menu items array
{
  name: 'New Feature',
  icon: 'feature-icon',
  path: '/new-features',
  permission: 'new_feature.read',  // Match with backend permission
}
```

---

## 5. Mobile Development

### 5.1 Screen Structure

```
src/screens/NewFeature/
├── NewFeatureListScreen.tsx
├── NewFeatureDetailScreen.tsx
├── NewFeatureFormScreen.tsx
└── index.ts
```

### 5.2 Screen Component Pattern

```typescript
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

const NewFeatureListScreen: React.FC = ({ navigation }) => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['new-features'],
    queryFn: () => api.get('/api/v1/new-features/'),
  });
  
  return (
    <View style={styles.container}>
      <FlatList
        data={data?.results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            onPress={() => navigation.navigate('NewFeatureDetail', { id: item.id })}
          >
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        onRefresh={refetch}
        refreshing={isLoading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default NewFeatureListScreen;
```

### 5.3 Adding Navigation

```typescript
// In navigation/AppNavigator.tsx
import NewFeatureListScreen from '../screens/NewFeature/NewFeatureListScreen';

// Add to stack navigator
<Stack.Screen 
  name="NewFeatureList" 
  component={NewFeatureListScreen}
  options={{ title: 'New Features' }}
/>
```

---

## 6. Database & Migrations

### 6.1 Migration Commands

```bash
# Create migrations for specific app
python manage.py makemigrations app_name

# Apply all migrations
python manage.py migrate

# Apply specific app migrations
python manage.py migrate app_name

# Show migration status
python manage.py showmigrations

# Rollback to specific migration
python manage.py migrate app_name 0001_initial
```

### 6.2 Migration Best Practices

1. **Never delete migrations in production** - Always create new ones
2. **Review auto-generated migrations** - Check for data loss operations
3. **Add data migrations for complex changes**:

```python
from django.db import migrations

def forward_func(apps, schema_editor):
    MyModel = apps.get_model('myapp', 'MyModel')
    for obj in MyModel.objects.all():
        obj.new_field = calculate_value(obj)
        obj.save()

class Migration(migrations.Migration):
    dependencies = [...]
    
    operations = [
        migrations.RunPython(forward_func, migrations.RunPython.noop),
    ]
```

### 6.3 Adding RLS Policy for New Tables

After creating a new tenant-aware table, add RLS policy:

```sql
-- Add to backend/scripts/init_rls.sql or run manually
ALTER TABLE new_table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON new_table_name
    FOR ALL
    USING (
        tenant_id = get_current_tenant_id() 
        OR is_super_admin() 
        OR get_current_tenant_id() IS NULL
    )
    WITH CHECK (
        tenant_id = get_current_tenant_id() 
        OR is_super_admin()
    );
```

---

## 7. API Development

### 7.1 URL Patterns

```python
# app/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MyModelViewSet

router = DefaultRouter()
router.register(r'my-models', MyModelViewSet, basename='my-models')

urlpatterns = [
    path('', include(router.urls)),
]

# config/urls.py - Register app URLs
urlpatterns = [
    path('api/v1/new-feature/', include('new_feature.urls')),
]
```

### 7.2 API Response Standards

```python
# Success Response
{
    "id": "uuid",
    "name": "Example",
    "created_at": "2026-01-19T12:00:00Z"
}

# List Response (paginated)
{
    "count": 100,
    "next": "http://api/v1/items/?page=2",
    "previous": null,
    "results": [...]
}

# Error Response
{
    "error": "Validation Error",
    "detail": {
        "name": ["This field is required."]
    }
}
```

### 7.3 Permission System

```python
# Define permission in users/management/commands/seed_permissions.py
PERMISSIONS = [
    {
        'resource': 'new_feature',
        'action': 'create',
        'group': 'New Features',
        'display_name': 'New Feature - Create',
    },
    {
        'resource': 'new_feature',
        'action': 'read',
        'group': 'New Features',
        'display_name': 'New Feature - View',
    },
    # ... update, delete, export
]

# Use in ViewSet
from core.permissions import HasModulePermission

class MyModelViewSet(viewsets.ModelViewSet):
    permission_classes = [HasModulePermission]
    permission_resource = 'new_feature'
```

---

## 8. Security Guidelines

### 8.1 Authentication

- All API endpoints require JWT authentication (except public endpoints)
- Token lifetime: 1 hour access, 7 days refresh
- Always use HTTPS in production

### 8.2 Authorization Checklist

- [ ] Model inherits from TenantAwareModel (for tenant data)
- [ ] ViewSet has proper permission_classes
- [ ] RLS policy exists on database table
- [ ] Permissions seeded in database
- [ ] Frontend checks permissions before showing UI

### 8.3 Data Validation

```python
# Always validate in serializers
class MySerializer(serializers.ModelSerializer):
    def validate(self, attrs):
        # Cross-field validation
        if attrs.get('start_date') > attrs.get('end_date'):
            raise serializers.ValidationError("End date must be after start date")
        return attrs
```

### 8.4 Sensitive Data

```python
# Use EncryptedCharField for sensitive data
from core.fields import EncryptedCharField

class MyModel(TenantAwareModel):
    aadhar_number = EncryptedCharField(max_length=255)
```

---

## 9. Testing Guidelines

### 9.1 Backend Tests

```python
# app/tests/test_views.py
from django.test import TestCase
from rest_framework.test import APIClient
from tenants.models import Tenant
from users.models import User

class MyModelViewSetTestCase(TestCase):
    def setUp(self):
        self.tenant = Tenant.objects.create(name='Test School', subdomain='test')
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            tenant=self.tenant
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_my_models(self):
        response = self.client.get('/api/v1/my-models/')
        self.assertEqual(response.status_code, 200)
    
    def test_create_my_model(self):
        data = {'name': 'Test Item'}
        response = self.client.post('/api/v1/my-models/', data)
        self.assertEqual(response.status_code, 201)
```

### 9.2 Running Tests

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test app_name

# Run with coverage
coverage run manage.py test
coverage report
```

---

## 10. Deployment Guidelines

### 10.1 Environment Variables

Required environment variables (set in `.env.prod`):

```env
SECRET_KEY=your-production-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379/0
CORS_ALLOWED_ORIGINS=https://yourdomain.com
```

### 10.2 Pre-Deployment Checklist

- [ ] All migrations are created and tested
- [ ] RLS policies are in place
- [ ] Environment variables are set
- [ ] Static files are collected (`collectstatic`)
- [ ] HTTPS is configured
- [ ] Backup strategy is in place
- [ ] Monitoring is configured

### 10.3 Docker Deployment

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

---

## Quick Reference: Adding a New Feature

1. **Backend:**
   - Create app: `python manage.py startapp feature_name`
   - Add to `INSTALLED_APPS`
   - Create model (inherit `TenantAwareModel`)
   - Create migration: `python manage.py makemigrations feature_name`
   - Create serializer, views, URLs
   - Add permissions to seed script
   - Add RLS policy to database

2. **Frontend:**
   - Create page components in `src/pages/FeatureName/`
   - Create API service in `src/services/`
   - Add routes to `App.tsx`
   - Add menu item to Sidebar

3. **Mobile:**
   - Create screens in `src/screens/FeatureName/`
   - Add navigation routes
   - Add menu item to drawer

---

*Document maintained by the nucleIQ Development Team*
