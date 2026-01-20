# ERP Migration Guide - NucleiQ

Complete guide for migrating your school/institution data from existing ERP systems to NucleiQ.

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Supported File Formats](#supported-file-formats)
4. [Data Export Templates](#data-export-templates)
5. [Import Sequence](#import-sequence)
6. [Step-by-Step Instructions](#step-by-step-instructions)
7. [API Reference](#api-reference)
8. [Validation & Verification](#validation--verification)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Rollback Procedures](#rollback-procedures)

---

## Quick Start

1. **Download Template**: `GET /api/data-management/template/{module}/`
2. **Fill Your Data**: Use the template with sample data as reference
3. **Validate First**: `POST /api/data-management/validate/` - Preview errors before import
4. **Import**: `POST /api/data-management/import/` - Execute the import
5. **Verify**: Check import status and review any errors

---

## Pre-Migration Checklist

### Before You Begin

- [ ] **Admin Access**: Ensure you have tenant admin access to NucleiQ
- [ ] **Current ERP Backup**: Create a full backup of your existing ERP data
- [ ] **Academic Year Setup**: Create the current academic year in NucleiQ (Settings → Academic Setup)
- [ ] **Classes & Sections**: Set up all classes and sections first (Settings → Academic Setup)
- [ ] **Fee Categories**: Create fee categories if importing fee data (Fees → Configure)
- [ ] **Estimated Time**: Plan for 2-4 hours depending on data volume

### Required Information per Module

| Module | Required Fields |
|--------|-----------------|
| Students | admission_number, first_name, date_of_birth, gender, father_name, mother_name, father_phone |
| Staff | employee_id, first_name, last_name, joining_date, designation |
| Classes | class_name, section_name |
| Subjects | subject_name, subject_code, class_name |
| Fee Structures | fee_type, class_name, amount, frequency |
| Enrollments | admission_number, class_name, section_name |
| Transport | admission_number, route_name, stop_name |
| Attendance | admission_number, date, status |

---

## Supported File Formats

The system accepts multiple file formats:

| Format | Extension | Library | Description |
|--------|-----------|---------|-------------|
| **CSV** | `.csv` | Built-in | UTF-8 recommended, Excel-compatible |
| **XLSX** | `.xlsx` | openpyxl | Modern Excel (2007+) |
| **XLS** | `.xls` | xlrd | Legacy Excel (97-2003) |

### Date Format Support

All date fields accept multiple formats:

| Format | Example | Recommended |
|--------|---------|-------------|
| DD-MM-YYYY | 15-05-2010 | ✅ Yes |
| DD/MM/YYYY | 15/05/2010 | ✅ Yes |
| YYYY-MM-DD | 2010-05-15 | ISO format |
| DD.MM.YYYY | 15.05.2010 | European |
| DD-MM-YY | 15-05-10 | Short year |

### Phone Number Format

- 10-digit Indian mobile numbers
- Prefixes (+91, 91, 0) automatically removed
- Spaces and dashes removed automatically

---

## Data Export Templates

### Downloading Templates

**Via API:**
```bash
# Download Excel template
GET /api/data-management/template/students/?format=xlsx

# Download CSV template
GET /api/data-management/template/students/?format=csv
```

**Via UI:**
1. Login to NucleiQ as Tenant Admin
2. Navigate to **Settings → Data Management**
3. Select the module you want to import
4. Click **"Download Template"**

### Available Templates

| Template | Endpoint | Unique Key | Notes |
|----------|----------|------------|-------|
| Students | `/template/students/` | admission_number | Includes parent info |
| Staff | `/template/staff/` | employee_id | All employee types |
| Classes & Sections | `/template/classes/` | class_name + section_name | Import first |
| Subjects | `/template/subjects/` | subject_code | Requires classes |
| Fee Structures | `/template/fee_structures/` | - | Requires classes |
| Enrollments | `/template/student_enrollments/` | - | Links students to classes |
| Transport | `/template/transport/` | - | Requires routes & stops |
| Parents | `/template/parents/` | admission_number | Updates existing students |
| Attendance | `/template/attendance/` | - | Historical attendance |

### Template Structure

Each Excel template contains:
- **Main Sheet**: Data columns with sample row (blue = required, gray = optional)
- **Instructions Sheet**: Field descriptions, formats, and validation rules

---

## Import Sequence

> **IMPORTANT**: Follow this exact order to avoid dependency errors.

```
┌─────────────────────┐
│ 1. Classes/Sections │
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌────────┐  ┌──────────────┐
│ Staff  │  │ Fee Category │
└────┬───┘  └──────┬───────┘
     │             │
     │     ┌───────┘
     │     │
     ▼     ▼
┌──────────────────┐
│ Fee Structures   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Students         │
└────────┬─────────┘
         │
    ┌────┴────┬──────────┐
    │         │          │
    ▼         ▼          ▼
┌─────────┐ ┌────────┐ ┌──────────────┐
│ Parents │ │ Photos │ │ Fee Allocate │
└─────────┘ └────────┘ └──────────────┘
```

### Recommended Import Order

1. **Classes & Sections** - Required for student enrollment
2. **Subjects** - Requires classes to exist
3. **Staff/Teachers** - Teachers for class assignments
4. **Fee Categories** - Required for fee structures
5. **Fee Structures** - Requires classes and categories
6. **Students** - Core data with class enrollment
7. **Student Enrollments** - Update/fix enrollments
8. **Parents** - Update parent info for existing students
9. **Student Photos** - Upload as ZIP after students exist
10. **Transport** - Assign transport to students
11. **Attendance** - Historical attendance data

---

## Step-by-Step Instructions

### Step 1: Export Data from Existing ERP

#### Generic Database Export
```sql
-- Students export example
SELECT 
    admission_number, first_name, last_name, 
    date_of_birth, gender, email, phone,
    father_name, mother_name, father_phone, mother_phone,
    class_name, section_name
FROM students
WHERE status = 'Active';
```

#### Common ERP Exports

| ERP System | Export Method |
|------------|---------------|
| Fedena | Reports → Student Details → Export to Excel |
| OpenSIS | Students → Reports → Export Data |
| SARAL | Administration → Data Export |
| Custom | Contact your IT team for database export |

### Step 2: Map Data to NucleiQ Format

1. Open the downloaded NucleiQ template (XLSX or CSV)
2. Open your exported data
3. Copy data column by column, matching headers
4. The system auto-detects common field name variations:

#### Auto-Detected Field Aliases

| NucleiQ Field | Also Accepts |
|---------------|--------------|
| admission_number | admn_no, admission_no, reg_no, student_id, roll_no |
| first_name | firstname, fname, given_name, name |
| date_of_birth | dob, birth_date, birthdate |
| father_phone | father_mobile, fathers_mobile |
| class_name | class, grade, standard, grade_level |
| section_name | section, division, div |

### Step 3: Validate Before Import

**API Validation (Recommended):**
```bash
POST /api/data-management/validate/
Content-Type: multipart/form-data

module: students
file: [your_file.xlsx]
```

**Response:**
```json
{
  "valid": true,
  "total_rows": 150,
  "error_count": 0,
  "duplicate_count": 3,
  "preview": [
    {"row_number": 2, "data": {...}, "has_errors": false},
    ...
  ],
  "errors": [],
  "duplicates": [
    {"row": 45, "field": "admission_number", "value": "STU2024001"}
  ]
}
```

### Step 4: Import Data

```bash
POST /api/data-management/import/
Content-Type: multipart/form-data

module: students
file: [your_file.xlsx]
skip_duplicates: true
update_existing: false
```

**Response:**
```json
{
  "success": true,
  "job_id": "uuid-here",
  "success": 147,
  "failed": 0,
  "updated": 0,
  "duplicates_skipped": 3,
  "total": 150,
  "errors": []
}
```

### Step 5: Monitor Import Progress

```bash
GET /api/data-management/import/{job_id}/status/
```

### Step 6: Verify Import

After each import:
1. Check total count matches expected
2. Open a few random records to verify data
3. Check the **Import History** for job details
4. Test linked features (e.g., fee collection for students)

---

## API Reference

### List Available Modules
```
GET /api/data-management/modules/
```
Returns list of all importable modules with field counts.

### Get Module Fields
```
GET /api/data-management/modules/{module}/fields/
```
Returns detailed field specifications including types, validation rules.

### Download Template
```
GET /api/data-management/template/{module}/?format=xlsx
GET /api/data-management/template/{module}/?format=csv
```

### Validate Data
```
POST /api/data-management/validate/
```
Preview import with validation errors without making changes.

### Import Data
```
POST /api/data-management/import/
```
Execute import with options:
- `skip_duplicates`: Skip records with existing unique keys
- `update_existing`: Update existing records instead of skipping

### Import Job Status
```
GET /api/data-management/import/{job_id}/status/
```
Check progress and results of an import job.

### Import History
```
GET /api/data-management/import/history/
```
List recent import jobs with stats.

### Rollback Import
```
POST /api/data-management/import/{job_id}/rollback/
```
Delete all records created by a specific import job.

### Export Data
```
GET /api/data-management/export/{module}/?format=xlsx
GET /api/data-management/export/{module}/?format=csv
```
Export current data for a module.

### Full Backup
```
GET /api/data-management/backup/
```
Download ZIP with all module data as CSV files.

---

## Validation & Verification

### Post-Import Checklist

| Check | How to Verify |
|-------|---------------|
| Student Count | Students → Count matches your records |
| Class Enrollment | Check students appear in correct classes |
| Parent Linking | Parent phone numbers show linked students |
| Fee Structures | Fee collection shows correct amounts |
| Staff Directory | Staff list shows all imported employees |

### Data Integrity Verification

```
Total Expected Students: ___
Total Imported: ___
Duplicates Skipped: ___
Failed Records: ___
Success Rate: ___%
```

---

## Common Issues & Solutions

### Issue: "Class not found" Error
**Solution**: Ensure the class name in your import file exactly matches the class name in NucleiQ. Import classes first.

### Issue: "Duplicate admission number"
**Solution**: 
- Check if student already exists in NucleiQ
- Use `update_existing: true` to update existing records
- Or use `skip_duplicates: true` to ignore duplicates

### Issue: Date Parsing Error
**Solution**: Ensure all dates use `dd-mm-yyyy` or `dd/mm/yyyy` format. Excel sometimes converts dates to serial numbers - save as CSV to fix.

### Issue: Phone Number Invalid
**Solution**: Phone numbers should be 10 digits without country code or spaces. Remove +91 prefix.

### Issue: Import Times Out
**Solution**: Split large files into batches of 1000-2000 records. Use async import for large datasets.

### Issue: Excel File Not Reading
**Solution**: 
- For .xls files, ensure xlrd is installed
- For .xlsx files, ensure openpyxl is installed
- Try saving as CSV from Excel

### Issue: Special Characters Corrupted
**Solution**: Save your file as UTF-8 encoded CSV. In Excel: Save As → CSV UTF-8.

---

## Rollback Procedures

### Using API Rollback

If an import goes wrong, you can rollback using the job ID:

```bash
POST /api/data-management/import/{job_id}/rollback/
```

This deletes all records created during that specific import job.

### Manual Rollback

1. **Use Audit Logs**: 
   - Navigate to **Admin → Audit Logs**
   - Filter by import date and module
   - Export record IDs for manual deletion

2. **Use Recycle Bin**: 
   - Navigate to **Admin → Recycle Bin**
   - Filter by date and entity type
   - Bulk restore or delete as needed

3. **Re-import with Corrections**:
   - Fix errors in your import file
   - Use `update_existing: true` to correct data

### Emergency Procedures

For critical issues:
1. Stop all imports immediately
2. Note the job IDs of problem imports
3. Use rollback API for each job
4. Contact support with audit logs

---

## Best Practices

1. **Always Validate First**: Use the validation endpoint before any import
2. **Import in Order**: Follow the dependency order (classes → students → fees)
3. **Start Small**: Test with 10-20 records before full import
4. **Backup First**: Create a full backup before large imports
5. **Clean Your Data**: Remove duplicates and fix formatting in source files
6. **Use Templates**: Always use official templates for best results
7. **Track Job IDs**: Save job IDs for potential rollback needs
8. **Verify Incrementally**: Verify data after each module import

---

## Support

For migration assistance:
- **Email**: support@nucleiq.io
- **Documentation**: https://docs.nucleiq.io
- **In-App Help**: Click the help icon in any module
- **API Docs**: `/api/docs/` (Swagger UI)

---

*Last Updated: January 2026*
*System Version: Enhanced Data Migration v2.0*
