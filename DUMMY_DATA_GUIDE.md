# Dummy Data Population Guide

## Overview

The `populate_demo_data` management command creates comprehensive dummy data for the Demo School across all modules.

## What Data is Created?

### 1. **Academic Structure**
- Academic Year (2024-2025)
- 12 Grade Levels (Grade 1-12)
- 36 Sections (A, B, C for each grade)
- 11 Subjects (Math, Science, English, etc.)
- 8 Departments

### 2. **Staff & Users** (~12 staff members)
- Principal
- Vice Principal
- Teachers (6-7)
- Librarian
- Counselor
- Accountant
- Clerk

### 3. **Students** (~900-1200 students)
- 25-35 students per section
- Complete profile with family details
- Enrollment records
- Some students have siblings (linked via family_id)

### 4. **Attendance**
- **Student Attendance**: Last 30 days (weekdays only)
- **Staff Attendance**: Last 30 days (weekdays only)
- Realistic distribution (85% present, 5% absent, etc.)

### 5. **Fee Management**
- Fee Structure for all grades
- 6 Fee Categories (Tuition, Transport, Library, etc.)
- Fee Collections for ~150 students
- Payment records (70% paid, 30% pending)

### 6. **Finance**
- 20 Petty Cash Requests
- Various purposes (supplies, maintenance, events)
- Mix of pending, approved, and rejected requests

### 7. **Student Records**
- Student Remarks (~100-300 remarks)
  - Academic achievements
  - Behavioral notes
  - Discipline issues
  - General observations
- Health Records (~80-160 records)
  - Height, weight, BMI
  - Medical checkups
  - Vaccinations

### 8. **Staff Management**
- Leave Applications (~8-16 applications)
- Mix of casual, sick, and earned leaves
- Pending and approved leaves

## Usage

### Basic Usage (Default tenant: 'demo')

```bash
# From backend directory
python manage.py populate_demo_data
```

### Specify Custom Tenant

```bash
python manage.py populate_demo_data --tenant=myschool
```

### Clear Existing Data Before Populating

```bash
python manage.py populate_demo_data --clear
```

**⚠️ WARNING**: The `--clear` flag will **DELETE ALL EXISTING DATA** for the tenant before creating new data!

## Running in Docker

```bash
# Execute in the backend container
docker exec -it nucleiq_backend python manage.py populate_demo_data

# With clear flag
docker exec -it nucleiq_backend python manage.py populate_demo_data --clear

# For specific tenant
docker exec -it nucleiq_backend python manage.py populate_demo_data --tenant=demo
```

## Expected Output

```
🚀 Starting dummy data population for tenant: demo

📚 Creating Academic Structure...
   ✓ Academic Year: 2024-2025
   ✓ Created 8 departments
   ✓ Created 11 subjects
   ✓ Created 12 grades with 36 sections

👥 Creating Staff & Users...
   ✓ Created 12 staff members

👨‍🎓 Creating Students...
   ✓ Created 950 students with enrollments

📅 Creating Attendance Records...
   ✓ Created 6000 student attendance records
   ✓ Created 360 staff attendance records

💰 Creating Fee Structure & Collections...
   ✓ Created 72 fee structures
   ✓ Created 450 fee collections and 315 payments

💵 Creating Finance Records...
   ✓ Created 20 petty cash requests

📝 Creating Student Remarks & Health Records...
   ✓ Created 250 student remarks
   ✓ Created 120 health records

🏖️  Creating Staff Leave Applications...
   ✓ Created 12 staff leave applications

✅ Dummy data population completed successfully!

📊 Data Summary:
   • Students: 950
   • Staff: 12
   • Sections: 36
   • Student Attendance: 6000
   • Staff Attendance: 360
   • Fee Collections: 450
   • Fee Payments: 315
   • Student Remarks: 250
   • Health Records: 120
   • Staff Leaves: 12
   • Petty Cash Requests: 20
```

## Data Characteristics

### Realistic Data
- **Names**: Common Indian names
- **Dates**: Appropriate age ranges based on grade levels
- **Contact**: Formatted phone numbers and emails
- **Addresses**: Realistic address formats
- **Amounts**: Realistic fee and salary ranges

### Relationships
- Students linked to sections and enrollments
- Staff linked to departments and subjects
- Attendance linked to students/staff and dates
- Fees linked to students and academic year
- Remarks linked to students and staff

### Distribution
- **Attendance**: 85% present, 5% absent, 7% late, 3% half-day
- **Fee Payments**: 70% paid, 30% pending/partial
- **Leave Status**: More approved than pending
- **Siblings**: ~30% of students have siblings

## Verification

After running the command, verify the data:

1. **Login to Django Admin**:
   - URL: http://localhost:8000/admin
   - User: admin@demo.nucleiq.com
   - Password: admin123

2. **Check Frontend**:
   - Students page: Should show ~900+ students
   - Staff page: Should show 12 staff members
   - Attendance: Should show recent records
   - Fees: Should show collections and payments

3. **API Endpoints**:
   ```bash
   # Get students
   curl http://localhost:8000/api/students/
   
   # Get staff
   curl http://localhost:8000/api/staff/staff/
   
   # Get attendance
   curl http://localhost:8000/api/attendance/student/
   ```

## Troubleshooting

### Error: "Tenant not found"
Make sure the tenant exists in the database. Create it first:
```python
from tenants.models import Tenant
Tenant.objects.create(
    name='Demo School',
    subdomain='demo',
    is_active=True
)
```

### Error: "Foreign key constraint"
Run migrations first:
```bash
python manage.py migrate
```

### Performance Issues
The command creates a lot of data. It may take 30-60 seconds to complete. This is normal.

## Customization

To customize the data, edit `backend/core/management/commands/populate_demo_data.py`:

- Modify `first_names` and `last_names` lists for different names
- Change grade ranges in `create_grade_sections()`
- Adjust student count per section in `create_students()`
- Modify fee amounts in `create_fee_structure()`
- Change attendance date ranges in `create_student_attendance()`

## Notes

- The command is **idempotent** with `--clear` flag (can be run multiple times)
- Without `--clear`, it will create duplicate data if run multiple times
- All dates are relative to current date for realistic data
- Random data ensures variety in testing scenarios

---

**Created**: December 30, 2025  
**Version**: 1.0  
**Status**: ✅ Ready to use
