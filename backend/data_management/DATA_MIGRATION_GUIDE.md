# Data Migration System - User Guide

## Overview

The Data Migration System allows you to import existing school data into the nucleIQ ERP software using CSV, XLSX (Excel 2007+), or XLS (Legacy Excel) files. This guide covers all supported modules, field requirements, and best practices for successful data migration.

---

## Supported File Formats

| Format | Extension | Description |
|--------|-----------|-------------|
| CSV | `.csv` | Comma-separated values (UTF-8 recommended) |
| XLSX | `.xlsx` | Modern Excel format (Excel 2007+) |
| XLS | `.xls` | Legacy Excel format (Excel 97-2003) |

---

## Available Import Modules

### 1. Students (`students`)
Import student basic information and enrollment data.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `first_name` | Student's first name | Text (max 100) | Rahul |
| `admission_number` | Unique admission number | Text (max 50) | STU2024001 |
| `date_of_birth` | Date of birth | DD-MM-YYYY | 15-05-2010 |
| `gender` | Gender | M/F/O | M |
| `father_name` | Father's name | Text (max 100) | Suresh Kumar |
| `mother_name` | Mother's name | Text (max 100) | Sunita Devi |
| `father_phone` | Father's mobile | 10 digits | 9876543210 |

**Optional Fields:**
- `middle_name`, `last_name`, `admission_date`
- `email`, `phone`, `address`
- `blood_group` (A+, A-, B+, B-, AB+, AB-, O+, O-)
- `mother_phone`, `father_email`, `mother_email`
- `father_occupation`, `mother_occupation`
- `guardian_name`, `guardian_phone`, `guardian_relation`
- `aadhar_number` (12 digits)
- `pen_number`, `nationality`, `religion`, `caste`
- `class_name`, `section_name`, `roll_number`
- `previous_school_name`, `transfer_certificate_number`
- `notes`

---

### 2. Staff (`staff`)
Import staff and employee information.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `first_name` | First name | Text | Priya |
| `last_name` | Last name | Text | Sharma |
| `employee_id` | Unique employee ID | Text | EMP001 |
| `joining_date` | Date of joining | DD-MM-YYYY | 01-04-2020 |
| `designation` | Job designation | See options below | TEACHER |

**Designation Options:**
- PRINCIPAL, VICE_PRINCIPAL, HEAD_TEACHER
- TEACHER, ASSISTANT_TEACHER
- LIBRARIAN, LAB_ASSISTANT, COUNSELOR
- ACCOUNTANT, CLERK, RECEPTIONIST
- SECURITY, PEON, DRIVER, OTHER

**Optional Fields:**
- `middle_name`, `email`, `phone`, `alternate_phone`
- `date_of_birth`, `gender`, `blood_group`
- `employment_type` (PERMANENT, CONTRACT, TEMPORARY, PART_TIME)
- `department`, `address`, `city`, `state`, `postal_code`
- `aadhar_number`, `pan_number`
- `salary`, `bank_account_number`, `bank_name`, `bank_ifsc`
- `emergency_contact_name`, `emergency_contact_phone`
- `experience_years`

---

### 3. Classes & Sections (`classes`)
Import class/grade levels and their sections.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `class_name` | Class/Grade name | Text | Class 10 |
| `section_name` | Section name | Text | A |

**Optional Fields:**
- `room_number` - Classroom number
- `capacity` - Maximum students (default: 40)

**Note:** Create one row for each class-section combination:
```
Class 10, A
Class 10, B
Class 10, C
```

---

### 4. Subjects (`subjects`)
Import subject master data.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `subject_name` | Subject name | Text | Mathematics |
| `subject_code` | Unique code | Text | MATH10 |
| `class_name` | Class for subject | Text | Class 10 |

**Optional Fields:**
- `credit_hours` - Weekly teaching hours
- `is_elective` - true/false
- `max_marks` - Maximum marks (default: 100)

---

### 5. Fee Structures (`fee_structures`)
Import fee structure definitions.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `fee_type` | Fee category name | Text | Tuition Fee |
| `class_name` | Class for fee | Text | Class 10 |
| `amount` | Fee amount | Number | 5000 |
| `frequency` | Collection frequency | See options | MONTHLY |

**Frequency Options:**
- ONE_TIME - One-time fees
- MONTHLY - Collected every month
- TERM - Collected per term
- QUARTERLY - Every 3 months
- HALF_YEARLY - Every 6 months
- YEARLY - Once a year

**Optional Fields:**
- `due_day` - Day of month (1-28)
- `is_mandatory` - true/false
- `description`

---

### 6. Student Enrollments (`student_enrollments`)
Import or update student class/section assignments.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `admission_number` | Student admission number | Text | STU2024001 |
| `class_name` | Class to enroll in | Text | Class 10 |
| `section_name` | Section to enroll in | Text | A |

**Optional Fields:**
- `roll_number`
- `enrollment_date` (DD-MM-YYYY)

**Prerequisites:** Students and Classes must exist first.

---

### 7. Transport Allocations (`transport`)
Import student transport/bus assignments.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `admission_number` | Student ID | Text | STU2024001 |
| `route_name` | Route name | Text | Route 5 |
| `stop_name` | Pickup stop | Text | Main Market |

**Optional Fields:**
- `start_date` (DD-MM-YYYY)

**Prerequisites:** Routes, stops, and students must exist.

---

### 8. Parent Information (`parents`)
Update parent/guardian information for existing students.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `admission_number` | Student ID | Text | STU2024001 |
| `father_name` | Father's name | Text | Suresh Kumar |
| `mother_name` | Mother's name | Text | Sunita Devi |
| `father_phone` | Father's phone | 10 digits | 9876543210 |

**Optional Fields:**
- `mother_phone`, `father_email`, `mother_email`
- `father_occupation`, `mother_occupation`

---

### 9. Attendance Records (`attendance`)
Import historical attendance data.

**Required Fields:**
| Field | Description | Format | Example |
|-------|-------------|--------|---------|
| `admission_number` | Student ID | Text | STU2024001 |
| `date` | Attendance date | DD-MM-YYYY | 15-01-2024 |
| `status` | Attendance status | See options | PRESENT |

**Status Options:**
- PRESENT, ABSENT, LATE, HALF_DAY, LEAVE

**Optional Fields:**
- `remarks`

---

## Date Format Support

The system accepts dates in multiple formats:

| Format | Example | Recommended |
|--------|---------|-------------|
| DD-MM-YYYY | 15-05-2010 | ✅ Yes |
| DD/MM/YYYY | 15/05/2010 | ✅ Yes |
| YYYY-MM-DD | 2010-05-15 | ISO format |
| DD.MM.YYYY | 15.05.2010 | European |
| DD-MM-YY | 15-05-10 | Short year |

---

## Phone Number Format

- Indian mobile: 10 digits starting with 6-9
- Prefixes `+91`, `91`, or `0` are automatically removed
- Spaces and dashes are removed

**Examples:**
- ✅ `9876543210`
- ✅ `+91 98765 43210` → `9876543210`
- ✅ `0-9876543210` → `9876543210`

---

## API Endpoints

### Get Available Modules
```
GET /api/data-management/modules/
```

### Get Module Field Specifications
```
GET /api/data-management/modules/{module}/fields/
```

### Download Import Template
```
GET /api/data-management/template/{module}/?format=xlsx
GET /api/data-management/template/{module}/?format=csv
```

### Validate Data (Preview)
```
POST /api/data-management/validate/
Content-Type: multipart/form-data

module: students
file: [file upload]
```

### Import Data
```
POST /api/data-management/import/
Content-Type: multipart/form-data

module: students
file: [file upload]
skip_duplicates: true
update_existing: false
```

### Check Import Job Status
```
GET /api/data-management/import/{job_id}/status/
```

### View Import History
```
GET /api/data-management/import/history/
```

### Rollback Import
```
POST /api/data-management/import/{job_id}/rollback/
```

### Export Data
```
GET /api/data-management/export/{module}/?format=xlsx
GET /api/data-management/export/{module}/?format=csv
```

### Full School Backup
```
GET /api/data-management/backup/
```

---

## Import Workflow

### Step 1: Download Template
Download the template for your module with sample data and field specifications.

### Step 2: Prepare Your Data
1. Fill in your data following the template format
2. Ensure required fields are complete
3. Use correct date and phone formats
4. Validate unique fields (admission numbers, employee IDs)

### Step 3: Validate (Preview)
Upload your file for validation to check for:
- Missing required fields
- Invalid data formats
- Duplicate records
- Foreign key references (classes, sections)

### Step 4: Import
After successful validation, proceed with import:
- **Skip duplicates**: Ignore records that already exist
- **Update existing**: Update matching records with new data

### Step 5: Monitor Progress
Track import progress and view any errors in the job status.

### Step 6: Rollback (if needed)
If something goes wrong, use the rollback feature to undo the import.

---

## Best Practices

1. **Import in Order:**
   - Classes & Sections first
   - Staff members
   - Students (after classes exist)
   - Enrollments
   - Fee structures
   - Transport allocations

2. **Validate Before Import:**
   Always use the validation endpoint to check data before importing.

3. **Start Small:**
   Test with a small batch (10-20 records) before importing the full dataset.

4. **Backup First:**
   Create a backup before large imports.

5. **Clean Your Data:**
   Remove duplicates and fix formatting issues in your source file.

6. **Use Templates:**
   Always download and use the official templates for best results.

---

## Troubleshooting

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Missing required field" | Required column empty | Fill in all required fields |
| "Invalid date format" | Wrong date format | Use DD-MM-YYYY |
| "Invalid phone number" | Not 10 digits | Enter 10-digit mobile |
| "Duplicate found" | Record already exists | Enable "Update existing" or skip |
| "Class not found" | Referenced class missing | Import classes first |

### File Issues

- **Excel dates showing as numbers:** Save as CSV with proper formatting
- **Special characters corrupted:** Save file as UTF-8 encoded CSV
- **Empty rows imported:** Remove blank rows from source file

---

## Technical Notes

- Maximum file size: 10MB
- Maximum rows per import: 5,000
- Supported encodings: UTF-8, UTF-8-BOM, Windows-1252
- All imports are wrapped in database transactions for data integrity
- Import job history is retained for audit purposes
