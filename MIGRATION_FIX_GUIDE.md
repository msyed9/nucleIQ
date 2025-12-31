# Migration Fix Guide

## Problem
Circular dependency between `users` and `tenants` apps because:
- User model references Tenant (tenant foreign key)
- Tenant model (via BaseModel) references User (created_by, updated_by, deleted_by)

## Solution

We need to create migrations in a specific order. Follow these steps:

### Step 1: Remove all existing migrations
```bash
docker compose exec backend rm -rf users/migrations/000*.py
docker compose exec backend rm -rf tenants/migrations/000*.py
```

### Step 2: Temporarily comment out audit fields in BaseModel

Edit `backend/core/models.py` and comment out the user foreign keys (lines 52-67 and 80-87):

```python
# TEMPORARILY COMMENTED FOR INITIAL MIGRATION
# created_by = models.ForeignKey(
#     'users.User',
#     ...
# )
# updated_by = models.ForeignKey(
#     'users.User',
#     ...
# )
# deleted_by = models.ForeignKey(
#     'users.User',
#     ...
# )
```

### Step 3: Create tenants migrations
```bash
docker compose exec backend python manage.py makemigrations tenants
```

### Step 4: Create users migrations
```bash
docker compose exec backend python manage.py makemigrations users
```

### Step 5: Run migrations
```bash
docker compose exec backend python manage.py migrate
```

### Step 6: Uncomment audit fields in BaseModel

Restore the commented lines in `backend/core/models.py`

### Step 7: Create final migration for audit fields
```bash
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```

## Alternative: Quick Fix (Recommended)

Just remove the audit trail fields from BaseModel entirely for now. They can be added later if needed.

The system will work fine without created_by, updated_by, deleted_by fields.
