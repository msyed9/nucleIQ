# ID Card Design & Bulk Generation System - Requirements Specification

## 1. SYSTEM OVERVIEW

### 1.1 Core Features
- **Template Designer**: Drag-and-drop + code-based ID card template editor
- **Template Library**: Pre-loaded portrait and landscape templates
- **Bulk Generation**: Single/bulk ID card generation via API
- **QR Code Integration**: Embedded student/staff data with attendance tracking
- **Multi-Entity Support**: Separate templates for students and staff

---

## 2. TEMPLATE DESIGNER MODULE

### 2.1 Functional Requirements

#### 2.1.1 Editor Interface
- **Dual Mode**: Visual drag-and-drop + JSON/code configuration
- **Canvas**: Live preview with exact dimensions (CR80: 85.6mm × 53.98mm)
- **Element Library**:
  - Text fields (school name, student name, class, admission no, DOB, etc.)
  - Images (school logo, student photo, background)
  - QR/Barcode
  - Shapes (rectangles, circles, lines)
  - Static text labels

#### 2.1.2 Drag-and-Drop Features
- Add elements from sidebar to canvas
- Resize elements with handles
- Position elements with pixel precision or grid snap
- Layer management (bring forward, send backward)
- Alignment tools (left, center, right, top, middle, bottom)
- Copy/paste/duplicate elements

#### 2.1.3 Element Properties (Right Panel)
Each element should have configurable:
- **Position**: X, Y coordinates
- **Size**: Width, height
- **Text Properties**: Font family, size, color, weight, alignment
- **Background**: Color, gradient, image, transparency
- **Border**: Color, width, radius
- **Data Binding**: Link to student/staff fields
- **Conditional Display**: Show/hide based on criteria

#### 2.1.4 Canvas Properties
- **Orientation**: Portrait (54mm × 86mm) or Landscape (86mm × 54mm)
- **Background**: Solid color, gradient, or image upload
- **Margins**: Configurable safe zones
- **Grid**: Toggle grid overlay with customizable spacing

### 2.2 Pre-loaded Templates

#### Template 1: Student Portrait - Classic
```json
{
  "name": "Student Portrait Classic",
  "orientation": "portrait",
  "width": 54,
  "height": 86,
  "unit": "mm",
  "background": {
    "type": "gradient",
    "colors": ["#1e3a8a", "#3b82f6"]
  },
  "elements": [
    {
      "id": "school_logo",
      "type": "image",
      "x": 17, "y": 3, "width": 20, "height": 20,
      "source": "{{school.logo}}"
    },
    {
      "id": "school_name",
      "type": "text",
      "x": 2, "y": 24, "width": 50, "height": 6,
      "text": "{{school.name}}",
      "fontSize": 14, "fontWeight": "bold",
      "textAlign": "center", "color": "#ffffff"
    },
    {
      "id": "student_photo",
      "type": "image",
      "x": 12, "y": 31, "width": 30, "height": 35,
      "source": "{{student.photo}}",
      "borderRadius": 4
    },
    {
      "id": "student_name",
      "type": "text",
      "x": 2, "y": 67, "width": 50, "height": 5,
      "text": "{{student.name}}",
      "fontSize": 12, "fontWeight": "600",
      "textAlign": "center", "color": "#1f2937"
    },
    {
      "id": "class_section",
      "type": "text",
      "x": 2, "y": 72, "width": 50, "height": 4,
      "text": "Class: {{student.class}} - {{student.section}}",
      "fontSize": 10, "textAlign": "center"
    },
    {
      "id": "qr_code",
      "type": "qr",
      "x": 17, "y": 77, "width": 20, "height": 20,
      "data": "{{qr_payload}}"
    }
  ]
}
```

#### Template 2: Student Landscape - Modern
- Horizontal layout with photo on left, details on right
- QR code bottom-right corner
- Modern gradient background

#### Template 3: Staff Portrait - Professional
- Professional blue theme
- Designation field
- Department field
- Employee ID

#### Template 4: Staff Landscape - Corporate
- Corporate design with horizontal layout
- Blood group, emergency contact fields

### 2.3 Template Management

#### 2.3.1 Template CRUD
- Create new template from scratch or duplicate existing
- Edit template (saves as new version with history)
- Delete template (with confirmation)
- Set default template per entity type (student/staff)
- Preview template with sample data

#### 2.3.2 Template Storage
```python
# Django Model
class IDCardTemplate(models.Model):
    tenant = models.ForeignKey(Tenant)
    name = models.CharField(max_length=200)
    entity_type = models.CharField(choices=[('student', 'Student'), ('staff', 'Staff')])
    orientation = models.CharField(choices=[('portrait', 'Portrait'), ('landscape', 'Landscape')])
    is_default = models.BooleanField(default=False)
    is_system = models.BooleanField(default=True)  # Pre-loaded templates
    config = models.JSONField()  # Stores the template JSON
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 3. QR/BARCODE GENERATION

### 3.1 Data Encoding

#### 3.1.1 QR Code Payload Structure
```json
{
  "type": "student",  // or "staff"
  "id": "uuid-here",
  "admission_no": "2024/STD/001",
  "name": "John Doe",
  "dob": "2010-05-15",
  "class": "10",
  "section": "A",
  "tenant_id": "tenant-uuid",
  "issued_date": "2024-01-08",
  "valid_until": "2025-03-31"
}
```

#### 3.1.2 Encoding Options
- **QR Code**: Stores full JSON payload (encrypted using AES-256)
- **Barcode (Code128)**: Stores short reference ID linking to database record
- **Encryption Key**: Tenant-specific secret key stored securely

### 3.2 QR Code Table

```python
class IDCardQRCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey(Tenant)
    entity_type = models.CharField(choices=[('student', 'Student'), ('staff', 'Staff')])
    entity_id = models.UUIDField()  # Student or Staff ID
    qr_data = models.TextField()  # Encrypted JSON payload
    qr_hash = models.CharField(max_length=64, unique=True)  # SHA-256 hash for quick lookup
    issued_date = models.DateTimeField(auto_now_add=True)
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    last_scanned = models.DateTimeField(null=True)
    scan_count = models.IntegerField(default=0)
```

---

## 4. BULK ID CARD GENERATION API

### 4.1 API Endpoints

#### 4.1.1 Generate Single ID Card
```http
POST /api/idcards/generate/single/
Content-Type: application/json

{
  "entity_type": "student",
  "entity_id": "uuid-here",
  "template_id": "template-uuid",  // Optional, uses default if not provided
  "include_qr": true
}

Response:
{
  "success": true,
  "id_card": {
    "id": "generated-uuid",
    "entity_type": "student",
    "entity_id": "uuid",
    "file_url": "https://storage/idcards/student_001.pdf",
    "qr_code_id": "qr-uuid",
    "generated_at": "2024-01-08T16:45:00Z"
  }
}
```

#### 4.1.2 Generate Bulk ID Cards
```http
POST /api/idcards/generate/bulk/
Content-Type: application/json

{
  "entity_type": "student",
  "filters": {
    "class": "10",
    "section": "A",
    "academic_year": "2024-25"
  },
  "template_id": "template-uuid",  // Optional
  "include_qr": true,
  "output_format": "pdf",  // pdf, png, jpg
  "layout": "grid"  // grid (9 per A4), individual
}

Response:
{
  "success": true,
  "job_id": "job-uuid",
  "status": "processing",
  "total_cards": 35,
  "estimated_completion": "2024-01-08T16:50:00Z"
}
```

#### 4.1.3 Check Bulk Generation Status
```http
GET /api/idcards/generate/bulk/{job_id}/status/

Response:
{
  "job_id": "job-uuid",
  "status": "completed",  // pending, processing, completed, failed
  "progress": 100,
  "total_cards": 35,
  "completed_cards": 35,
  "failed_cards": 0,
  "download_url": "https://storage/bulk_idcards_class10A.zip",
  "individual_files": [
    {"entity_id": "uuid1", "file_url": "url1"},
    {"entity_id": "uuid2", "file_url": "url2"}
  ]
}
```

### 4.2 Generation Process

#### 4.2.1 Steps
1. Validate template and entity data
2. For each entity:
   - Generate QR code with encrypted payload
   - Store QR record in database
   - Render template with entity data
   - Generate PDF/image using headless browser or library
3. For bulk: Compile individual cards into ZIP or multi-page PDF
4. Upload to cloud storage (AWS S3, Azure Blob)
5. Return download URLs

#### 4.2.2 Background Job (Celery/Redis)
```python
@shared_task
def generate_bulk_id_cards(job_id, entity_type, filters, template_id, tenant_id):
    job = IDCardGenerationJob.objects.get(id=job_id)
    job.status = 'processing'
    job.save()
    
    # Fetch entities based on filters
    entities = get_entities(entity_type, filters, tenant_id)
    job.total_cards = len(entities)
    job.save()
    
    files = []
    for entity in entities:
        try:
            qr_code = create_qr_code(entity, tenant_id)
            pdf_file = render_id_card(entity, template_id, qr_code)
            files.append(pdf_file)
            job.completed_cards += 1
            job.save()
        except Exception as e:
            job.failed_cards += 1
            log_error(e)
    
    zip_file = create_zip(files)
    download_url = upload_to_storage(zip_file)
    
    job.status = 'completed'
    job.download_url = download_url
    job.save()
```

---

## 5. ATTENDANCE INTEGRATION

### 5.1 QR Scanning for Attendance

#### 5.1.1 Scan QR Code API
```http
POST /api/attendance/scan/
Content-Type: application/json

{
  "qr_data": "encrypted-qr-payload",
  "scan_location": "Main Gate",  // Optional
  "scan_device": "Scanner-01",   // Optional
  "timestamp": "2024-01-08T08:30:00Z"
}

Response:
{
  "success": true,
  "student": {
    "id": "uuid",
    "name": "John Doe",
    "admission_no": "2024/STD/001",
    "class": "10-A",
    "photo_url": "url"
  },
  "attendance_marked": true,
  "attendance_id": "attendance-uuid",
  "status": "present",
  "timestamp": "2024-01-08T08:30:00Z",
  "message": "Attendance marked successfully"
}
```

#### 5.1.2 Attendance Record
```python
class QRAttendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    tenant = models.ForeignKey(Tenant)
    qr_code = models.ForeignKey(IDCardQRCode)
    student = models.ForeignKey(Student, null=True)
    staff = models.ForeignKey(Staff, null=True)
    scan_timestamp = models.DateTimeField()
    scan_location = models.CharField(max_length=100, null=True)
    scan_device = models.CharField(max_length=100, null=True)
    attendance_status = models.CharField(choices=[
        ('present', 'Present'),
        ('late', 'Late'),
        ('early_departure', 'Early Departure')
    ])
    created_at = models.DateTimeField(auto_now_add=True)
```

### 5.2 Validation Rules
- QR must be active and not expired
- Duplicate scans within same day counted once
- Late threshold: After 9:00 AM
- Early departure: Before 3:00 PM
- Parent notification on scan (optional feature)

---

## 6. FRONTEND IMPLEMENTATION

### 6.1 Template Designer Page

#### Components Needed
1. **TemplateDesigner.tsx** (Main container)
2. **TemplateCanvas.tsx** (Drag-drop canvas with react-dnd)
3. **ElementLibrary.tsx** (Sidebar with draggable elements)
4. **PropertiesPanel.tsx** (Right panel for element configuration)
5. **TemplateToolbar.tsx** (Save, preview, undo/redo, zoom)
6. **TemplateList.tsx** (Browse and select templates)
7. **PreviewModal.tsx** (Live preview with sample data)

#### Libraries Required
- `react-dnd` + `react-dnd-html5-backend` (Drag and drop)
- `fabric.js` or `konva.js` (Canvas rendering)
- `react-colorful` (Color picker)
- `qrcode` (QR generation)
- `jsbarcode` (Barcode generation)

### 6.2 Bulk Generation Page

#### Components Needed
1. **BulkIDCards.tsx** (Main page)
2. **FilterPanel.tsx** (Class, section, academic year filters)
3. **TemplateSelector.tsx** (Choose template)
4. **GenerationProgress.tsx** (Progress bar with real-time updates)
5. **DownloadManager.tsx** (Download individual/bulk files)

---

## 7. TECHNICAL STACK

### 7.1 Backend
- **PDF Generation**: WeasyPrint or Playwright (headless browser)
- **QR/Barcode**: `qrcode` + `python-barcode` libraries
- **Encryption**: `cryptography` (Fernet for AES)
- **Storage**: AWS S3 or Azure Blob Storage
- **Background Jobs**: Celery + Redis

### 7.2 Frontend
- **Framework**: React + TypeScript
- **Canvas**: Fabric.js or Konva
- **State Management**: React Context or Zustand
- **File Upload**: Direct S3 upload for images

---

## 8. DATA FLOW DIAGRAM

```
Template Designer → Save Template JSON → Database
                                             ↓
User Initiates Bulk Generation → API Request
                                             ↓
Backend: Fetch Template + Student Data → Generate QR Codes
                                             ↓
Render ID Cards (PDF/PNG) → Upload to Cloud Storage
                                             ↓
Return Download URLs → Frontend Display
                                             ↓
QR Code Scanning → Decrypt & Validate → Mark Attendance → Database
```

---

## 9. IMPLEMENTATION PHASES

### Phase 1: Template Designer (Week 1-2)
- Build drag-drop canvas
- Implement element properties
- Create 4 pre-loaded templates
- Template CRUD APIs

### Phase 2: QR Generation & Storage (Week 2)
- QR code encryption logic
- Database models
- QR generation API

### Phase 3: Single Card Generation (Week 3)
- PDF rendering engine
- Single card API
- Cloud storage integration

### Phase 4: Bulk Generation (Week 3-4)
- Celery background jobs
- Bulk API with filters
- Progress tracking
- ZIP file creation

### Phase 5: Attendance Integration (Week 4)
- QR scan API
- Attendance marking logic
- Validation rules
- Frontend scanner interface (optional)

---

## 10. SECURITY CONSIDERATIONS

1. **QR Encryption**: Use AES-256 with tenant-specific keys
2. **Access Control**: Only authorized users can generate ID cards
3. **Rate Limiting**: Prevent abuse of bulk generation
4. **File Storage**: Secure URLs with expiration tokens
5. **Audit Trail**: Log all generation and scan activities

---

## 11. FUTURE ENHANCEMENTS

- Batch printing interface with printer selection
- NFC card encoding support
- Mobile app for QR scanning
- Real-time parent notifications on scan
- Analytics dashboard (scan statistics, attendance trends)
- Template marketplace/sharing
