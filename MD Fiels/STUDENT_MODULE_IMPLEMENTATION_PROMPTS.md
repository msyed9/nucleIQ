# Student Module Implementation Prompts

This file contains detailed, phase-wise prompts to implement the missing features identified in `STUDENT_MODULE_GAP_ANALYSIS.md`.

## Instructions for User
1.  Copy the content of each "Prompt" block.
2.  Paste it into your AI coding assistant (Claude Sonnet 4.5).
3.  Execute the prompts sequentially.
4.  Verify the output of each prompt before moving to the next.

---

## Phase 1: Core Enhancements & Critical Integrations
**Focus:** Security, Data Validation, User Experience, and Integration with existing modules.

### Prompt 1.1: Security & Data Validation
```markdown
**Task:** Implement Security & Data Validation Enhancements for Student Module

**Objective:** Secure sensitive data (Aadhar) and improve data quality through rigorous validation.

**Instructions:**
1.  **Codebase Analysis (MANDATORY START):**
    *   Search for existing implementations of Aadhar encryption or phone/email validation in `backend/students/` or `backend/utils/`.
    *   Check `Student` model for current field definitions.
    *   **Decision:**
        *   If fully implemented and secure: Report "Already Done" and stop.
        *   If partially implemented or insecure (plain text Aadhar): Refactor to use encryption.
        *   If missing: Implement from scratch.

2.  **Implementation Details:**
    *   **Aadhar Encryption:**
        *   Implement field-level encryption for `aadhar_number`.
        *   Create a utility/mixin for encrypted fields.
        *   Update serializers to mask the number (e.g., `XXXX-XXXX-1234`) on read.
        *   Add a specific permission `can_view_full_aadhar` to permit viewing unmasked data.
    *   **Phone Number Validation:**
        *   Implement validators for Indian phone numbers (Regex: `^+91[6-9]\d{9}$`).
        *   Apply this to `student_phone`, `father_phone`, `mother_phone`.
    *   **Email Validation:**
        *   Enhance email validation to reject disposable domains or invalid formats.

3.  **Constraints:**
    *   Do NOT break the existing `Student` model creation API.
    *   Ensure database migrations are created (`makemigrations`).

4.  **Verification:**
    *   Verify that saving a plain text Aadhar stores it encrypted in DB.
    *   Verify that invalid phone numbers raise `ValidationError`.
```

### Prompt 1.2: Admission Number Auto-Generation (Frontend Integration)
```markdown
**Task:** Integrate Admission Number Auto-Generation on Frontend

**Objective:** Connect the existing backend auto-geneation logic to the Student Admission Form.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `StudentForm.tsx` or `AddStudent.tsx`.
    *   Check `TenantSettings` API usage.

2.  **Implementation Details:**
    *   Fetch `TenantSettings` on form mount.
    *   If `settings.auto_generate_admission_number` is `true`:
        *   Hide or Disable the "Admission Number" input field.
        *   Show a placeholder or message: "Auto-generated upon save".
    *   If `false`: Allow manual entry with validation checking for uniqueness.

3.  **Constraints:**
    *   Ensure the form submission still works (backend should handle the actual generation).
```

### Prompt 1.3: Student 360 - Real Data Integration
```markdown
**Task:** Integrate Real Data into Student 360 Profile

**Objective:** Replace hardcoded placeholders in `Student360.tsx` with real data from Attendance, Fees, and Exam modules.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `Student360` component for hardcoded values.
    *   Identify APIs for Attendance, Fees, and Exams.

2.  **Implementation Details:**
    *   **Backend Aggregation:**
        *   Create API `GET /api/students/{id}/360-summary/`.
        *   Return JSON with:
            *   **Attendance:** { present_days, total_days, percentage, late_days }
            *   **Fees:** { total_due, paid_amount, balance }
            *   **Exams:** { overall_percentage, rank } (if available)
    *   **Frontend Integration:**
        *   Update `Student360` to fetch and display this data.
        *   Handle "Loading" states.

3.  **Constraints:**
    *   Use optimized queries (`select_related`, `prefetch_related`) to prevent N+1 issues.
```

### Prompt 1.4: Camera Capture Integration
```markdown
**Task:** Implement Camera Capture for Student Photo

**Objective:** Allow taking a photo directly from the browser/mobile camera during admission.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `PhotoUpload` component.

2.  **Implementation Details:**
    *   **Frontend:**
        *   Use `react-webcam` or HTML5 `navigator.mediaDevices.getUserMedia`.
        *   Add "Take Photo" button next to "Upload".
        *   Show live camera preview in a modal.
        *   "Capture" button to freeze and save image.
        *   Convert captured Base64/Blob to File object and pass to existing upload handler.

3.  **Constraints:**
    *   Must work on Mobile browsers.
    *   Request Camera permissions gracefully.
```

---

## Phase 2: Bulk Operations
**Focus:** Mass data handling for efficiency (Import, Update, Photos).

### Prompt 2.1: Bulk Student Import (Backend)
```markdown
**Task:** Implement Bulk Student Import Backend Service

**Objective:** Allow importing students via Excel/CSV.

**Instructions:**
1.  **Codebase Analysis:**
    *   Search for any existing `import_students` logic.

2.  **Implementation Details:**
    *   Create View/API: `POST /api/students/bulk-import/`.
    *   **Parsing & Validation:**
        *   Accept `.xlsx`, `.csv`.
        *   Validate headers and data rows.
        *   Check for duplicates (Admission No).
    *   **Modes:**
        *   `dry_run=True`: Return error report / preview.
        *   `dry_run=False`: Commit valid records.

3.  **Constraints:**
    *   Use atomic transactions (`transaction.atomic`).
```

### Prompt 2.2: Bulk Student Import (Frontend)
```markdown
**Task:** Implement Bulk Student Import Frontend Interface

**Objective:** UI for uploading files and correcting errors during bulk import.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check for `StudentList` actions.

2.  **Implementation Details:**
    *   Create `StudentBulkImport.tsx`.
    *   **Flow:** Upload -> Validating (Dry Run) -> Preview Table (Green/Red rows) -> Confirm Import.
    *   Provide "Download Template" link.

3.  **Constraints:**
    *   Provide clear error messages for failed rows.
```

### Prompt 2.3: Bulk Photo Upload
```markdown
**Task:** Implement Bulk Photo Upload Functionality

**Objective:** Upload multiple student photos via ZIP.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check media handling.

2.  **Implementation Details:**
    *   **Backend:** `POST /api/students/bulk-upload-photos/`.
        *   Accept ZIP file.
        *   Extract and match filename (e.g., `ADM001.jpg`) to `student.admission_number`.
        *   Update `student.photo`.
    *   **Frontend:** Simple ZIP upload component.

3.  **Constraints:**
    *   Securely handle ZIP extraction.
```

---

## Phase 3: Lifecycle Management
**Focus:** Transfers, Promotions, Alumni, and ID Cards.

### Prompt 3.1: Student Promotion Workflow
```markdown
**Task:** Implement Student Promotion System

**Objective:** Move students from one class/session to the next.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check for recent Academic Year logic.

2.  **Implementation Details:**
    *   **Backend:** `PromotionService` to update class_section and session.
    *   **Frontend:** `StudentPromotion.tsx`
        *   Select Source Class -> Select Target Class.
        *   Select Students -> Associate Promoted status.

3.  **Constraints:**
    *   Validate section capacity.
```

### Prompt 3.2: Student Transfer & Alumni
```markdown
**Task:** Implement Student Transfer and Alumni Management

**Objective:** Handle status changes (Transfer, Alumni).

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `Student.status` choices.

2.  **Implementation Details:**
    *   **Frontend Actions:**
        *   "Transfer": Move to another section or change status to `Withdrawn`.
        *   "Mark Alumni": Change status to `Alumni`.
    *   **Alumni List:** Create a filtered view/page for Alumni students.

3.  **Constraints:**
    *   Preserve data for historical records.
```

### Prompt 3.3: ID Card Generation
```markdown
**Task:** Implement ID Card Generation

**Objective:** Generate printable ID cards (PDF) for students.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check for PDF libraries.

2.  **Implementation Details:**
    *   **Backend:** `GET /api/students/id-cards/`.
        *   Generate PDF with Student details + Photo + QR Code (optional).
    *   **Frontend:** Button in Student List to trigger PDF download.

3.  **Constraints:**
    *   Ensure layout fits standard ID card holders.
```

---

## Phase 4: Parent Engagement & Documents
**Focus:** Parent Portal, Communication, and Document Mgmt.

### Prompt 4.1: Parent Portal (Backend & Auth)
```markdown
**Task:** Implement Parent Portal Backend & Authentication

**Objective:** Parent login and data access.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `User` roles.

2.  **Implementation Details:**
    *   Create `Parent` user role/group.
    *   Link `Student` to `Parent` user.
    *   Create Auth API for parents.
    *   Permissions: Parent sees ONLY their children.

3.  **Constraints:**
    *   Strict isolation of data.
```

### Prompt 4.2: Parent Portal (Frontend)
```markdown
**Task:** Implement Parent Portal Frontend

**Objective:** Mobile-responsive dashboard for parents.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check routing for `/parent/`.

2.  **Implementation Details:**
    *   Create `ParentDashboard.tsx`.
    *   Show Child Select (if multiple).
    *   Display: Attendance, Fees, Report Cards, Notices.

3.  **Constraints:**
    *   Mobile-first design.
```

### Prompt 4.3: Communication (SMS/Email)
```markdown
**Task:** Implement Notification Services

**Objective:** Send SMS/Email for events.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check existing notification services.

2.  **Implementation Details:**
    *   Create `CommunicationService` (SMS/Email).
    *   Implement Triggers: Fee Payment Success, Absent Alert.

3.  **Constraints:**
    *   Use background tasks.
```

### Prompt 4.4: Document Management & Verification
```markdown
**Task:** Implement Document Management & Verification Workflow

**Objective:** Enhanced document handling for students.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check `StudentDocument` model.

2.  **Implementation Details:**
    *   **Models:** Add `verification_status` (Pending, Verified, Rejected) to `StudentDocument`.
    *   **Frontend:**
        *   Add "Documents" tab in Student Edit.
        *   Allow uploading specific categories (Birth Cert, Transfer Cert).
        *   Allow Staff to "Verify" or "Reject" documents.

3.  **Constraints:**
    *   Secure file storage.
```

---

## Phase 5: Advanced Features & Compliance
**Focus:** Audit, Analytics.

### Prompt 5.1: Compliance & Audit Trail
```markdown
**Task:** Implement Data Audit Trail

**Objective:** Track changes to student records.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check for audit libraries (`django-simple-history`).

2.  **Implementation Details:**
    *   Enable history tracking on `Student` model.
    *   Create a "History" view for Admins to see who changed fields.

3.  **Constraints:**
    *   Minimal performance impact.
```

### Prompt 5.2: Analytics Dashboard
```markdown
**Task:** Implement Student Analytics Dashboard

**Objective:** Visual insights.

**Instructions:**
1.  **Codebase Analysis:**
    *   Check charting libs.

2.  **Implementation Details:**
    *   **Backend:** Aggregation APIs (Count by Gender, Class, Age).
    *   **Frontend:** `StudentAnalytics.tsx` with Charts (Pie, Bar).

3.  **Constraints:**
    *   Interactive and visually appealing.
```
