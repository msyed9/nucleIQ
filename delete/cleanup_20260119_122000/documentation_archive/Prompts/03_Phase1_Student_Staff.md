# Phase 1.1: People Management (Students & Staff)

**Goal**: Populate the system with users and manage their lifecycles.

---

## Prompt 1.3: Student Information System (SIS)

**Dependency**: Phase 1.0 (Academic Structure) MUST be complete.

```markdown
# 🎓 STUDENT ADMISSIONS & PROFILES

Build the core Student module with "Session-based Enrollment".

## 📝 Functional Requirements

1.  **Data Structure (Split Model Pattern)**:
    - `Student` (The Profile): 
        - Name, DOB, Gender, Address, Parent Contacts, Blood Group.
        - `admission_number` (Unique per tenant), `admission_date`.
        - Photo URL.
    - `StudentEnrollment` (The Session Record):
        - `student` (FK), `academic_year` (FK).
        - `section` (FK to Section, which links to Class).
        - `roll_number`.
        - `status` (Active, Suspended, Left).

2.  **Features**:
    - **Admission Form**: Multi-step wizard (Profile -> Parent -> Enrollment).
    - **Bulk Operations (Excel/CSV)**:
        - **Import**: Template-based student uploader with error reporting (e.g., "Row 5: Invalid Phone").
        - **Export**: Export filtered student lists (e.g., "Class 5 - Active") to Excel/PDF.
    - **Student View**: 360° Profile showing history of enrollments (e.g., "See Class 1 record while now in Class 5").

3.  **Documents**:
    - `StudentDocument`: Title, File, Student FK.

## 📦 Deliverables
- `backend/students/models.py`.
- `backend/students/services.py` (Admissions logic).
- `frontend/src/pages/students/AdmissionForm.tsx`.
- `frontend/src/pages/students/StudentProfile.tsx`.
```

---

## Prompt 1.4: ID Card Designer & Generation

**Context**: Schools need physical ID cards.

```markdown
# 🪪 VISUAL ID CARD DESIGNER

Implement a drag-and-drop designer for ID cards.

## 📝 Functional Requirements

1.  **Designer UI**:
    - **Canvas**: Interact.js or similar for dragging elements.
    - **Tools**: Add Text, Image,background image, Shape, Barcode, QR Code, QR Code color configuration.
    - **Variables**: Insert placeholders like `{StudentName}`, `{Class}`, `{DOB}`.
    - **Dimensions**: configurable sizes like Credit Card (CR80) size.

2.  **Generation Engine**:
    - **Backend**: Python Pillow or ReportLab to render the JSON design into PDF/Image.
    - **Bulk Export**: "Generate for Class X" -> Download ZIP of PDFs.

3.  **Template Library (Crucial)**:
    - **100+ Pre-built Templates**: Professional designs (Horizontal/Vertical) for Students, Staff, and Visitors.
    - **Categories**: Academic, Corporate, Playful, Minimalist.
    - **Mechanism**: JSON-based templates stored in the database, loadable into the Designer.

## 📦 Deliverables
- `backend/idcards/models.py`.
- `backend/idcards/utils.py` (Rendering engine).
- `frontend/src/pages/idcards/Designer.tsx`.
```

---

## Prompt 1.5: Staff Management (HR Lite)

**Context**: Managing Teachers, Admins, and Support Staff.

```markdown
# 👩‍🏫 STAFF DIRECTORY

Create the Staff management system.

## 📝 Functional Requirements

1.  **Models**:
    - `Staff`:
        - Link to `User` (for login).
        - `employee_id`, `designation`, `department`.
        - `joining_date`.
        - `qualifications` (JSON).
    
2.  **Access Control**:
    - Auto-assign `Role` based on designation (e.g., Hire Teacher -> Assign 'Teacher' Role).

3.  **Features**:
    - Staff Directory with Filters.
    - Document storage (Contracts, Resume).

## 📦 Deliverables
- `backend/staff/models.py`.
- `backend/staff/views.py`.
- `frontend/src/pages/staff/StaffList.tsx`.
```
