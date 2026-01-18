# ID Card System - Complete Guide

## Overview

The NucleiQ ID Card System provides a complete solution for designing, generating, and managing ID cards for students and staff. It includes:

- 🎨 **Drag-and-Drop Template Designer**
- 📦 **Bulk ID Card Generation**
- 🔐 **QR Code Generation with Encryption**
- 📱 **QR Scanner for Attendance**
- 📊 **Real-time Progress Tracking**

---

## Features

### 1. Template Management
- Pre-loaded templates (4 system templates)
- Create custom templates
- Drag-and-drop designer
- Support for:
  - Text fields
  - Images (logos, photos)
  - QR codes
  - Shapes
  - Background (color, gradient, image)

### 2. ID Card Generation
- **Single Card**: Generate one card at a time
- **Bulk Generation**: Generate hundreds of cards
  - Filter by class, section, department
  - Background processing with Celery
  - Real-time progress updates
  - Multiple output formats (PDF/PNG/JPG)
  - Layout options (individual, grid, print sheet)

### 3. QR Code System
- Encrypted QR codes (AES-256)
- Embedded data:
  - Student/Staff name
  - Admission/Employee ID
  - Date of birth
  - Class/Designation
  - Valid until date
- Secure hash for quick lookup

### 4. Attendance Integration
- QR code scanning
- Automatic attendance marking
- Duplicate detection
- Late arrival detection
- Real-time statistics
- Scan history

---

## Installation & Setup

### 1. Backend Setup

#### Install Dependencies
```bash
pip install qrcode[pil] python-barcode weasyprint cryptography
```

#### Run Migrations
```bash
python manage.py migrate idcards
```

#### Seed Default Templates
```bash
python manage.py create_default_templates
```

### 2. Frontend Setup

The frontend components are already created:
- `TemplateManager.tsx`
- `BulkGeneration.tsx`
- `QRScanner.tsx`
- `Designer.tsx` (existing)

Add routes to your `App.tsx`:
```typescript
import TemplateManager from './pages/idcards/TemplateManager';
import BulkGeneration from './pages/idcards/BulkGeneration';
import QRScanner from './pages/idcards/QRScanner';
import Designer from './pages/idcards/Designer';

// In your routes
<Route path="/idcards/templates" element={<TemplateManager />} />
<Route path="/idcards/designer" element={<Designer />} />
<Route path="/idcards/generate" element={<BulkGeneration />} />
<Route path="/idcards/scanner" element={<QRScanner />} />
```

### 3. Configure Celery

Ensure Celery is running for background jobs:
```bash
celery -A config worker --loglevel=info
```

### 4. Configure Storage

Update settings for cloud storage (AWS S3 or Azure Blob):
```python
# settings.py
# AWS S3
AWS_ACCESS_KEY_ID = 'your-key'
AWS_SECRET_ACCESS_KEY = 'your-secret'
AWS_STORAGE_BUCKET_NAME = 'your-bucket'

# Or Azure Blob
AZURE_ACCOUNT_NAME = 'your-account'
AZURE_ACCOUNT_KEY = 'your-key'
AZURE_CONTAINER = 'idcards'
```

---

## Usage Guide

### Creating a Template

1. Navigate to **ID Cards → Templates**
2. Click **Create New Template**
3. Configure template:
   - Select entity type (Student/Staff)
   - Choose orientation (Portrait/Landscape)
   - Set dimensions
4. Add elements:
   - Drag text, images, QR code from sidebar
   - Position and resize
   - Configure properties
5. Bind data:
   - Use data source like `{{student.name}}`
   - Available fields:
     - `school.name`, `school.logo`
     - `student.name`, `student.photo`, `student.class`
     - `staff.name`, `staff.designation`
6. Save template

### Generating ID Cards

#### Single Card
```bash
# API Request
POST /api/idcards/generate/single/
{
  "entity_type": "student",
  "entity_id": "student-uuid",
  "include_qr": true
}
```

#### Bulk Generation
1. Navigate to **ID Cards → Bulk Generate**
2. Select entity type (Student/Staff)
3. Choose template (or use default)
4. Apply filters:
   - Students: Class, Section
   - Staff: Department
5. Configure output:
   - Format: PDF, PNG, or JPG
   - Layout: Individual, Grid, or Sheet
   - Include QR: Yes/No
6. Click **Start Generation**
7. Monitor progress in real-time
8. Download when complete

### QR Code Scanning

1. Navigate to **ID Cards → Scanner**
2. Configure:
   - Scan location (e.g., "Main Gate")
   - Scanner device ID
3. Option 1: Camera Scan
   - Click **Start Camera**
   - Point at QR code
   - Automatic scan and attendance marking
4. Option 2: Manual Entry
   - Enter QR data manually
   - Click **Submit**
5. View results:
   - Success/failure popup
   - Scan history
   - Daily statistics

---

## API Reference

### Templates

```http
GET    /api/idcards/templates/                  # List templates
GET    /api/idcards/templates/{id}/             # Get template
POST   /api/idcards/templates/                  # Create template
PATCH  /api/idcards/templates/{id}/             # Update template
DELETE /api/idcards/templates/{id}/             # Delete template
POST   /api/idcards/templates/{id}/duplicate/   # Duplicate template
POST   /api/idcards/templates/{id}/set_default/ # Set as default
GET    /api/idcards/templates/system_templates/ # Get system templates
```

### Generation

```http
POST /api/idcards/generate/single/              # Generate single card
POST /api/idcards/generate/bulk/                # Start bulk generation
GET  /api/idcards/generate/bulk/{id}/status/    # Check job status
```

### Records

```http
GET  /api/idcards/records/                      # List ID cards
GET  /api/idcards/records/{id}/                 # Get ID card
POST /api/idcards/records/{id}/mark_printed/    # Mark as printed
POST /api/idcards/records/{id}/revoke/          # Revoke card
```

### Attendance

```http
POST /api/idcards/scan/                         # Scan QR code
GET  /api/idcards/attendance/                   # List attendance records  
GET  /api/idcards/attendance/daily_report/      # Daily report
```

---

## Template JSON Structure

```json
{
  "width": 54,
  "height": 86,
  "orientation": "portrait",
  "entity_type": "student",
  "background_type": "gradient",
  "background_value": "linear-gradient(135deg, #1e3a8a, #3b82f6)",
  "config": {
    "elements": [
      {
        "id": "school_logo",
        "type": "image",
        "x": 17,
        "y": 3,
        "width": 20,
        "height": 20,
        "source": "school.logo"
      },
      {
        "id": "student_name",
        "type": "text",
        "x": 2,
        "y": 67,
        "width": 50,
        "height": 5,
        "source": "student.name",
        "fontSize": 12,
        "fontWeight": "600",
        "textAlign": "center",
        "color": "#1f2937"
      },
      {
        "id": "qr_code",
        "type": "qr",
        "x": 17,
        "y": 77,
        "width": 20,
        "height": 20
      }
    ]
  }
}
```

### Available Data Sources

#### School Data
- `school.name`
- `school.logo`
- `school.address`
- `school.phone`
- `school.email`

#### Student Data
- `student.name`
- `student.first_name`
- `student.last_name`
- `student.admission_number`
- `student.dob`
- `student.gender`
- `student.blood_group`
- `student.photo`
- `student.class`
- `student.section`
- `student.roll_number`

#### Staff Data
- `staff.name`
- `staff.first_name`
- `staff.last_name`
- `staff.employee_id`
- `staff.designation`
- `staff.department`
- `staff.dob`
- `staff.blood_group`
- `staff.photo`
- `staff.phone`
- `staff.email`

---

## QR Code Payload

```json
{
  "type": "student",
  "id": "uuid",
  "tenant_id": "tenant-uuid",
  "admission_no": "2024/STD/001",
  "name": "John Doe",
  "dob": "2010-05-15",
  "class": "10",
  "section": "A",
  "issued_date": "2024-01-08T12:00:00",
  "valid_until": "2025-03-31T23:59:59"
}
```

*Note: Payload is encrypted using AES-256 with tenant-specific key.*

---

## Database Models

### IDCardTemplate
- Template configuration
- Background settings
- Element positioning
- Version control

### IDCardQRCode
- Encrypted QR data
- Hash for lookup
- Validity tracking
- Scan history

### IDCardRecord
- Generated card tracking
- File URLs
- Status management
- Print tracking

### IDCardGenerationJob
- Bulk generation jobs
- Progress tracking
- Celery task management
- Download URLs

### QRAttendance
- Attendance records
- Scan metadata
- Validation flags
- Attendance linking

---

## Troubleshooting

### Issue: Migration Errors
**Solution**: Check for model conflicts, fix related_name attributes

### Issue: QR Code Not Generating
**Solution**: Install qrcode package: `pip install qrcode[pil]`

### Issue: PDF Generation Fails
**Solution**: Install WeasyPrint: `pip install weasyprint`

### Issue: Bulk Generation Stuck
**Solution**: 
1. Check Celery is running
2. Check Redis connection
3. View Celery logs

### Issue: QR Scan Not Working
**Solution**:
1. Check QR code is active and not expired
2. Verify encryption key configuration
3. Check attendance model integration

---

## Security Considerations

1. **QR Encryption**: All QR data encrypted with AES-256
2. **Tenant Isolation**: Each tenant has unique encryption key
3. **Access Control**: Only authorized users can generate cards
4. **Rate Limiting**: Prevent abuse of bulk generation
5. **File Storage**: Secure URLs with expiration tokens
6. **Audit Trail**: All operations logged

---

## Performance Tips

1. **Bulk Generation**: Use background jobs (Celery)
2. **Caching**: Cache templates and settings
3. **Image Optimization**: Compress student photos before upload
4. **Database Indexing**: Already optimized with indexes
5. **CDN**: Use CDN for generated ID card files

---

## Future Enhancements

-  NFC card encoding
- 📱 Mobile app for scanning
- 🔔 Real-time parent notifications
- 📊 Advanced analytics dashboard
- 🖨️ Direct printer integration
- 🌐 Template marketplace
- 📈 Attendance reports
- 🎨 More design elements

---

## Support

For issues or questions:
1. Check this documentation
2. Review API documentation at `/api/docs/`
3. Check implementation summary at `.agent/ID_CARD_IMPLEMENTATION_SUMMARY.md`
4. Review the requirements spec at `.agent/prompts/id-card-system-requirements.md`

---

**Version**: 1.0  
**Last Updated**: 2026-01-08  
**Status**: ✅ Fully Implemented
