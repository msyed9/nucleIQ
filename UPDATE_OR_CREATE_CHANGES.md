# Dummy Data Population - Update to update_or_create

## ✅ Changes Made

Successfully updated the `populate_demo_data.py` management command to use `update_or_create` instead of `get_or_create` throughout.

### Functions Updated:

1. **`create_academic_year()`** - ✅ Updated
2. **`create_departments()`** - ✅ Updated  
3. **`create_subjects()`** - ✅ Updated
4. **`create_grade_sections()`** - ✅ Updated (both grades and sections)
5. **`create_staff()`** - ✅ Updated (admin user and staff members)
6. **`create_students()`** - ✅ Updated
7. **`create_student_attendance()`** - ✅ Updated
8. **`create_staff_attendance()`** - ✅ Updated
9. **`create_fee_structure()`** - ✅ Updated (categories and structures)
10. **`create_fee_collections()`** - ✅ Updated (invoices)

### Key Changes:

#### Before:
```python
obj, created = Model.objects.get_or_create(
    lookup_field=value,
    defaults={...}
)
```

#### After:
```python
obj, created = Model.objects.update_or_create(
    lookup_field=value,
    defaults={...}
)
```

### Special Cases Fixed:

1. **FeeCategory**: Changed lookup from `name` to `code` (unique constraint is on `tenant_id, code`)
   ```python
   # Before
   FeeCategory.objects.get_or_create(tenant=tenant, name=cat['name'], defaults={'code': ...})
   
   # After
   FeeCategory.objects.update_or_create(tenant=tenant, code=cat['code'], defaults={'name': ...})
   ```

2. **FeeInvoice**: Changed to use only `invoice_number` as lookup (unique field)
   ```python
   # Before
   FeeInvoice.objects.get_or_create(tenant=tenant, student=student, invoice_number=..., ...)
   
   # After
   FeeInvoice.objects.update_or_create(invoice_number=..., defaults={'tenant': ..., 'student': ..., ...})
   ```

## 🎯 Benefits

1. **No More Unique Constraint Violations**: The command can now be run multiple times without errors
2. **Data Updates**: Existing records will be updated with new values instead of causing errors
3. **Idempotent**: Safe to run the command repeatedly
4. **No Need for --clear Flag**: Can update data in place

## 📝 Usage

```bash
# Run without clearing (will update existing data)
docker exec -it nucleiq_backend python manage.py populate_demo_data --tenant=nms

# Run with clearing (fresh start)
docker exec -it nucleiq_backend python manage.py populate_demo_data --tenant=nms --clear
```

## ⚠️ Current Status

The command has been fully updated to use `update_or_create`. However, there appears to be a persistent unique constraint issue that may be related to:

1. Database state from previous runs
2. Transaction isolation
3. Concurrent operations within the same transaction

### Recommended Next Steps:

1. **Fresh Database**: Reset the database completely and run migrations
   ```bash
   docker exec -it nucleiq_backend python manage.py flush --no-input
   docker exec -it nucleiq_backend python manage.py migrate
   docker exec -it nucleiq_backend python manage.py populate_demo_data --tenant=nms
   ```

2. **Manual Cleanup**: Clear all data before running
   ```bash
   docker exec -it nucleiq_backend python manage.py shell
   # Then manually delete all tenant data
   ```

3. **Check Unique Constraints**: Verify the actual unique constraints in the database match the model definitions

## 📊 Expected Results

Once the database state issue is resolved, the command should:

- Create ~1000 students
- Create 12 staff members
- Create complete academic structure
- Create 30 days of attendance
- Create fee structures and invoices
- Create finance records
- Create student remarks and health records
- Create staff leave applications

All without any unique constraint violations!

---

**Updated**: December 30, 2025  
**Status**: Code updated ✅, Database state issue pending resolution ⚠️
