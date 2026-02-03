# API Versioning Guide for NucleiQ

This project uses **URL Path Versioning** for its REST APIs. This allows us to evolve the API without breaking existing client integrations.

## Architecture

The API routing is structured in `backend/config/urls.py` into distinct pattern groups:

- `v1_patterns`: The current stable version of the API.
- `v2_patterns`: Future breaking changes or significantly updated modules.

### URL Structure

- `/api/v1/` - Explicitly version 1.
- `/api/v2/` - Explicitly version 2.
- `/api/` - Fallback to Version 1 (Backward compatible).

## How to use in Development

### 1. Adding a new version for a module

Suppose you want to update the `students` module to version 2.

1.  **Create `urls_v2.py`** in the `students` app:
    ```python
    # backend/students/urls_v2.py
    from django.urls import path, include
    from rest_framework.routers import DefaultRouter
    from .views_v2 import StudentViewSetV2

    router = DefaultRouter()
    router.register(r'students', StudentViewSetV2, basename='student-v2')

    urlpatterns = [
        path('', include(router.urls)),
    ]
    ```

2.  **Register it in `backend/config/urls.py`**:
    ```python
    v2_patterns = [
        path('students/', include('students.urls_v2')),
        # ... other v2 overrides
    ]
    ```

### 2. Sharing Serializers across versions

If only a few fields change, you can inherit from the v1 serializer:

```python
# backend/students/serializers_v2.py
from .serializers import StudentSerializer

class StudentSerializerV2(StudentSerializer):
    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['new_extra_field']
```

## How to use in Production

- **Stable Clients**: Should point to `/api/v1/` or leave it as `/api/`.
- **New Clients/Features**: Can start using `/api/v2/` as soon as it's deployed.
- **Monitoring**: You can track version usage by inspecting the `version` attribute in your views via `self.request.version`.

## Tenant-Aware Version Routing (Mixed Module Versions)

This codebase supports **per-tenant, per-module version overrides** while keeping older versions stable.

### How it works

1. Requests to explicit versioned paths (e.g., `/api/v1/`, `/api/v2/`) are **never modified**.
2. Requests to `/api/` are **auto-routed** based on tenant settings.
3. Each module can be pinned independently (e.g., `students=v2`, `fees=v1`).

### Tenant Settings Fields

Stored on `TenantSettings`:

- `api_default_version`: Default version for the tenant (e.g., `v1` or `v2`).
- `api_module_versions`: JSON override map. Example:

```json
{
    "students": "v2",
    "fees": "v1",
    "users": "v2"
}
```

> **Access control**: Updating tenant API version settings is restricted to tenant admins (or platform admins) via the Tenant Settings API.

### Validation

- `api_default_version` must be in `ALLOWED_VERSIONS` (currently `v1`, `v2`).
- `api_module_versions` keys must be one of `API_VERSION_ALLOWED_MODULES`.

### URL Prefix Aliases

Some URL prefixes map to a module key (configured in `API_MODULE_VERSION_ALIASES`):

- `auth`, `users`, `roles`, `permissions` → `users`
- `parent` → `students`
- `recycle-bin`, `audit-logs`, `advanced-reports` → `admin`

### Excluded Paths

System endpoints are excluded from version routing (configured in `API_VERSION_EXCLUDED_PREFIXES`), including:

`/api/health/`, `/api/schema/`, `/api/docs/`, `/api/redoc/`, `/api/mobile/`

## Best Practices

1.  **Don't skip versions**: Go from v1 to v2, not v1 to v3.
2.  **Version Serializers**: Usually, the main difference between API versions is the data structure. Keep versioned serializers in separate files if they differ significantly.
3.  **Deprecation**: When a version is deprecated, add a custom header or warning in the response.
4.  **Graceful Fallback**: The current configuration ensures `/api/` always points to the latest stable legacy version (v1).

## Database Migrations & Versioning

API versioning handles the **Interface**, but the **Data Source** (Database) is usually shared.

- **Backward Compatible Changes**: Adding a new column or table is usually safe for all API versions.
- **Breaking Changes**: If you need to rename or delete a field:
    1.  Add the new field.
    2.  Update both v1 and v2 serializers to handle the change (v1 might use a property to map the old field name to the new field).
    3.  Run migrations to migrate data.
    4.  Eventually, retire v1 and then remove the old field/mapping.

This ensures that while the database evolves, all active API versions remain functional.
