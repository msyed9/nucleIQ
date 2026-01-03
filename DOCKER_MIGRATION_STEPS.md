# Docker Migration Steps - Attendance Calendar Integration

## Complete the Implementation in Docker

### Step 1: Create Migrations

Run this command to create the migration for the Holiday model:

```bash
docker-compose exec backend python manage.py makemigrations tenants
```

**Expected Output:**
```
Migrations for 'tenants':
  tenants/migrations/0XXX_holiday.py
    - Create model Holiday
```

### Step 2: Apply Migrations

Apply the migration to create the Holiday table:

```bash
docker-compose exec backend python manage.py migrate tenants
```

**Expected Output:**
```
Running migrations:
  Applying tenants.0XXX_holiday... OK
```

### Step 3: Verify Migration

Check that the Holiday model is created:

```bash
docker-compose exec backend python manage.py shell
```

Then in the Python shell:
```python
from tenants.models import Holiday
print(Holiday._meta.db_table)  # Should print: holidays
exit()
```

### Step 4: Create Sample Holidays (Optional)

Create a management command or use Django admin to add holidays:

```bash
docker-compose exec backend python manage.py shell
```

```python
from tenants.models import Tenant, Holiday, AcademicYear
from datetime import date

# Get tenant
tenant = Tenant.objects.first()

# Get academic year (optional)
academic_year = AcademicYear.objects.filter(tenant=tenant, is_active=True).first()

# Create Independence Day
Holiday.objects.create(
    tenant=tenant,
    academic_year=academic_year,
    name="Independence Day",
    holiday_type="PUBLIC",
    start_date=date(2026, 8, 15),
    end_date=date(2026, 8, 15),
    description="National Holiday - India",
    is_attendance_blocked=True,
    applies_to_students=True,
    applies_to_staff=True,
    color="#FF5722"
)

# Create Republic Day
Holiday.objects.create(
    tenant=tenant,
    academic_year=academic_year,
    name="Republic Day",
    holiday_type="PUBLIC",
    start_date=date(2026, 1, 26),
    end_date=date(2026, 1, 26),
    description="National Holiday - India",
    is_attendance_blocked=True,
    applies_to_students=True,
    applies_to_staff=True,
    color="#FF5722"
)

# Create Summer Vacation
Holiday.objects.create(
    tenant=tenant,
    academic_year=academic_year,
    name="Summer Vacation",
    holiday_type="VACATION",
    start_date=date(2026, 5, 15),
    end_date=date(2026, 6, 30),
    description="Annual summer break",
    is_attendance_blocked=True,
    applies_to_students=True,
    applies_to_staff=False,  # Staff may still work
    color="#4CAF50"
)

print("Sample holidays created!")
exit()
```

### Step 5: Test Holiday API

Test the API endpoints:

```bash
# List all holidays
curl -X GET http://localhost:8000/api/tenants/holidays/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get upcoming holidays
curl -X GET http://localhost:8000/api/tenants/holidays/upcoming/ \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get holidays for date range
curl -X GET "http://localhost:8000/api/tenants/holidays/calendar_view/?start_date=2026-01-01&end_date=2026-12-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 6: Test Working Days Calculation

Test that holidays are excluded from working days:

```bash
docker-compose exec backend python manage.py shell
```

```python
from attendance.services import AttendanceCalculationService
from tenants.models import Tenant
from datetime import date

tenant = Tenant.objects.first()

# Calculate working days for January 2026
working_days = AttendanceCalculationService.calculate_working_days(
    start_date=date(2026, 1, 1),
    end_date=date(2026, 1, 31),
    tenant=tenant
)

print(f"Working days in January 2026: {working_days}")
# Should exclude Sundays and Republic Day (Jan 26)

# Check if a specific date is a holiday
is_hol, holiday = AttendanceCalculationService.is_holiday(
    date(2026, 1, 26),
    tenant,
    record_type='STUDENT'
)

if is_hol:
    print(f"January 26 is a holiday: {holiday.name if holiday else 'Sunday'}")
else:
    print("January 26 is a working day")

exit()
```

### Step 7: Add to Django Admin (Optional)

Update `backend/tenants/admin.py`:

```python
from django.contrib import admin
from .models import Holiday

@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ['name', 'holiday_type', 'start_date', 'end_date', 'is_attendance_blocked', 'applies_to_students', 'applies_to_staff']
    list_filter = ['holiday_type', 'academic_year', 'is_attendance_blocked', 'applies_to_students', 'applies_to_staff']
    search_fields = ['name', 'description']
    date_hierarchy = 'start_date'
    ordering = ['-start_date']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'holiday_type', 'academic_year')
        }),
        ('Dates', {
            'fields': ('start_date', 'end_date')
        }),
        ('Settings', {
            'fields': ('is_attendance_blocked', 'applies_to_students', 'applies_to_staff', 'color')
        }),
        ('Details', {
            'fields': ('description',)
        }),
    )
```

Then restart the backend:

```bash
docker-compose restart backend
```

Access admin at: http://localhost:8000/admin/tenants/holiday/

### Troubleshooting

**If migration fails:**

1. Check for syntax errors:
```bash
docker-compose exec backend python manage.py check
```

2. View migration file:
```bash
docker-compose exec backend cat tenants/migrations/0XXX_holiday.py
```

3. Check database connection:
```bash
docker-compose exec backend python manage.py dbshell
```

**If Docker command hangs:**

1. Check container status:
```bash
docker-compose ps
```

2. View logs:
```bash
docker-compose logs backend
```

3. Restart containers:
```bash
docker-compose restart
```

### Verification Checklist

- [ ] Migration created successfully
- [ ] Migration applied to database
- [ ] Holiday model accessible in shell
- [ ] Sample holidays created
- [ ] API endpoints working
- [ ] Working days calculation excludes holidays
- [ ] `is_holiday()` method works correctly
- [ ] Admin interface accessible (if added)

### Next Steps

Once migrations are complete:

1. **Frontend Integration** - Create Holiday Management page
2. **Attendance Update** - Add holiday check before marking attendance
3. **Dashboard Widget** - Show upcoming holidays
4. **Bulk Import** - Add CSV import for holidays
5. **Notifications** - Alert users about upcoming holidays

---

## Quick Reference

### API Endpoints

- `GET /api/tenants/holidays/` - List holidays
- `POST /api/tenants/holidays/` - Create holiday
- `GET /api/tenants/holidays/{id}/` - Get holiday details
- `PUT /api/tenants/holidays/{id}/` - Update holiday
- `DELETE /api/tenants/holidays/{id}/` - Delete holiday
- `GET /api/tenants/holidays/calendar_view/` - Calendar view
- `GET /api/tenants/holidays/upcoming/` - Upcoming holidays

### Holiday Types

- `PUBLIC` - Public holidays (national/state)
- `SCHOOL` - School-specific holidays
- `VACATION` - Vacations/breaks
- `EXAM` - Exam days
- `EVENT` - School events
- `OTHER` - Other types
