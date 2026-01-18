#  NucleiQ Implementation Prompts - Phase 1: Critical Backend Completions

**Generated:** January 3, 2026  
**Purpose:** Detailed prompts to complete critical backend features  

---

##  PROMPT 1.1: Payroll PDF Generation

**Context:** The payroll module has a TODO marker for PDF generation in `backend/payroll/utils.py` and `backend/payroll/views.py`. Users cannot download payslips as PDFs.

**Task:** Implement complete PDF payslip generation with professional formatting.

**Detailed Requirements:**
1. Install and configure ReportLab or WeasyPrint library
2. Create a PDF template for payslips with:
   - School logo and header
   - Employee details (name, ID, designation, department)
   - Salary breakdown table (earnings and deductions)
   - Net salary prominently displayed
   - Month/year and payment date
   - Digital signature placeholders
   - Footer with generated timestamp
3. Implement `generate_payslip_pdf()` function in `backend/payroll/utils.py` that:
   - Takes payslip object as parameter
   - Returns PDF file in memory
   - Handles missing data gracefully
4. Add view action in `backend/payroll/views.py`:
   - `@action(methods=['get'], detail=True)` for `download_pdf`
   - Returns PDF as HTTP response with proper content-type
   - Filename format: `Payslip_EmployeeName_MonthYear.pdf`
5. Update frontend `PayrollDashboard.tsx`:
   - Add "Download PDF" button for each payslip
   - Handle download trigger with proper file download
   - Show loading state during PDF generation
6. Test with sample data and verify formatting

**Files to Modify:**
- `backend/payroll/utils.py` (lines ~297)
- `backend/payroll/views.py` (lines ~180)
- `frontend/src/pages/payroll/PayslipView.tsx`
- `frontend/src/pages/payroll/PayrollDashboard.tsx`
- `backend/requirements/base.txt` (add PDF library)

**Expected Outcome:** Users can download professionally formatted PDF payslips with all salary details.

---

##  PROMPT 1.2: ID Card Staff Data Mapping

**Context:** ID card generation only works for students. Staff ID card data mapping is incomplete (TODO in `backend/idcards/utils.py`).

**Task:** Complete staff ID card generation functionality.

**Detailed Requirements:**
1. In `backend/idcards/utils.py` (around line 332):
   - Implement staff data mapping in `get_card_data()` function
   - Map staff fields: name, photo, employee_id, designation, department, blood_group, emergency_contact
   - Handle staff-specific fields vs student fields
2. Create separate staff ID card templates:
   - Design fields appropriate for staff
   - Different color scheme than student cards
   - Include QR code with staff ID
3. Update `IDCardTemplateViewSet` to support `card_type` field (STUDENT/STAFF)
4. Modify frontend `Designer.tsx`:
   - Add toggle to switch between student/staff card design
   - Show appropriate fields based on card type
   - Update preview to show staff data when staff template selected
5. Implement bulk generation for staff:
   - Filter staff by department, designation
   - Generate cards in batches
   - Queue background job for large batches
6. Add async task trigger in `backend/idcards/views.py` (line 147):
   - Use Celery or Django Q for async processing
   - Create task for bulk card generation
   - Return task ID and status endpoint

**Files to Modify:**
- `backend/idcards/utils.py` (lines ~332)
- `backend/idcards/views.py` (lines ~147)
- `backend/idcards/models.py` (add card_type field)
- `frontend/src/pages/idcards/Designer.tsx`
- `backend/idcards/tasks.py` (new file for Celery tasks)

**Expected Outcome:** Staff can generate professional ID cards just like students, with appropriate fields and design.

---

##  PROMPT 1.3: Fee Management SMS/WhatsApp Integration

**Context:** Fee reminder system has placeholder code for WhatsApp/SMS integration (TODO in `backend/fees/tasks.py` and `views.py`).

**Task:** Integrate SMS and WhatsApp notifications for fee reminders and receipts.

**Detailed Requirements:**
1. Choose and integrate SMS provider:
   - Recommended: Twilio, MSG91, or TextLocal
   - Add API credentials to settings
   - Create SMS service wrapper in `backend/communication/services/sms_service.py`
2. Integrate WhatsApp Business API:
   - Use Twilio WhatsApp API or official WhatsApp Business API
   - Create message templates for:
     - Fee invoice generated
     - Payment reminder (3 days before due)
     - Payment overdue reminder
     - Payment received confirmation
   - Implement in `backend/communication/services/whatsapp_service.py`
3. Update `backend/fees/tasks.py` (line 64):
   - Replace TODO with actual SMS/WhatsApp sending logic
   - Implement `send_fee_reminder_notifications()` function
   - Support both SMS and WhatsApp based on parent preference
4. Update `backend/fees/views.py` (line 224):
   - Add action to send individual reminder
   - Add action to send bulk reminders to all defaulters
   - Log all sent messages in MessageLog model
5. Add frontend controls in `FeeDefaulters.tsx`:
   - "Send Reminder" button for individual defaulters
   - "Send Bulk Reminders" button for all
   - Option to choose SMS vs WhatsApp vs Both
   - Show sending status and history
6. Create configuration page for:
   - SMS/WhatsApp provider settings
   - Message templates customization
   - Notification preferences per parent
7. Add tests for notification sending

**Files to Modify:**
- `backend/fees/tasks.py` (line 64)
- `backend/fees/views.py` (line 224)
- `backend/communication/services/sms_service.py` (new)
- `backend/communication/services/whatsapp_service.py` (new)
- `backend/config/settings/base.py` (add provider settings)
- `frontend/src/pages/fees/FeeDefaulters.tsx`
- `backend/communication/models.py` (ensure MessageLog supports SMS/WhatsApp)

**Expected Outcome:** Automated fee reminders via SMS/WhatsApp with delivery tracking.

---

##  PROMPT 1.4: CRM Lead Conversion Auto-Student Creation

**Context:** After converting a lead to student, the student record must be created manually (TODO in `backend/crm/views.py` lines 87, 321).

**Task:** Automate student record creation and parent email confirmation on lead conversion.

**Detailed Requirements:**
1. In `backend/crm/views.py` (line 87), implement `convert_to_student` action with full workflow
2. Student creation logic should:
   - Generate unique admission number
   - Map lead fields to student fields (name, parent details, contact)
   - Create parent user account with auto-generated password
   - Assign to selected grade/section
   - Set enrollment status to PENDING_DOCS
3. Email confirmation (line 321):
   - Use Django email backend
   - Create HTML email template with:
     - Welcome message
     - Admission number
     - Temporary login credentials for parent portal
     - Next steps (documents to submit, fee payment)
     - School contact information
   - Attach PDF with admission details
4. Add frontend conversion flow in LeadConversion.tsx
5. Add transaction management and logging
6. Create conversion report tracking

**Files to Modify:**
- `backend/crm/views.py` (lines 87, 321)
- `backend/students/services.py` (add student creation service)
- `backend/templates/emails/admission_confirmation.html` (new)
- `frontend/src/pages/crm/LeadKanbanBoard.tsx`
- `frontend/src/pages/crm/LeadConversion.tsx`

**Expected Outcome:** One-click lead conversion creates student record and sends welcome email to parents.

---

##  PROMPT 1.5: Attendance Academic Calendar Integration

**Context:** Attendance system doesn't auto-skip holidays (TODO in `backend/attendance/services.py`).

**Task:** Integrate academic calendar for automatic holiday detection and handling.

**Detailed Requirements:**
1. Create Holiday model in `backend/tenants/models.py`
2. Implement holiday checking in `backend/attendance/services.py` (line 30)
3. Update attendance marking to prevent marking on holidays
4. Create Holiday management page in frontend with CRUD and calendar view
5. Add to Academic Setup page
6. Update attendance reports to exclude holidays from working days
7. Add holiday notification system

**Files to Modify:**
- `backend/tenants/models.py` (add Holiday model)
- `backend/tenants/serializers.py`, `views.py`, `urls.py`
- `backend/attendance/services.py` (line 30)
- `frontend/src/pages/settings/HolidayManagement.tsx` (new)
- `frontend/src/pages/attendance/MarkAttendance.tsx`

**Expected Outcome:** Automatic holiday detection prevents attendance marking and ensures accurate working days calculation.
