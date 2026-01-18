#  NucleiQ Implementation Prompts - Phase 6: Staff Management Enhancement

**Purpose:** Enhance staff module with documents, attendance, leave, and health tracking

---

##  PROMPT 6.1: Staff Document Management

**Context:** Backend has `/api/staff/documents/` but no UI exists.

**Task:** Build staff document management system.

**Detailed Requirements:**

1. **Create StaffDocuments.tsx:**
   - Location: `frontend/src/pages/staff/StaffDocuments.tsx`
   - View all documents for a staff member
   - Categories:
     - Personal Documents
     - Academic Certificates
     - Experience Certificates
     - ID Proofs
     - Appointment Letter
     - Agreements/Contracts
     - Appraisal Documents
     - Training Certificates
     - Other

2. **Upload Documents:**
   - Select staff member
   - Document category
   - Document type (within category)
   - Upload file (PDF, JPG, PNG)
   - Document number (if applicable)
   - Issue date
   - Expiry date (if applicable)
   - Issuing authority
   - Verified by (admin)
   - Verification date
   - Notes

3. **Document List:**
   - Staff-wise document list
   - Table columns:
     - Category
     - Document type
     - File name
     - Upload date
     - Expiry date
     - Status (Pending/Verified/Expired)
     - Actions (View, Download, Delete)

4. **Document Verification:**
   - Admin verifies uploaded documents
   - Mark as verified
   - Add verification notes
   - Verified stamp on document

5. **Expiry Alerts:**
   - Alert before document expires (30 days, 15 days, 7 days)
   - Dashboard widget for expiring documents
   - Email notification to staff and admin

6. **Mandatory Documents Checklist:**
   - Define mandatory documents for each staff type
   - Track completion %
   - Alert for incomplete documentation

7. **Bulk Download:**
   - Download all documents of a staff member
   - Export as ZIP file

8. **API Integration:**
   - GET `/api/staff/{id}/documents/`
   - POST `/api/staff/documents/` body: `{staff, category, document_type, file, issue_date, expiry_date}`
   - PATCH `/api/staff/documents/{id}/verify/`
   - GET `/api/staff/documents/expiring/`

**Files to Create:**
- `frontend/src/pages/staff/StaffDocuments.tsx`
- `frontend/src/components/staff/DocumentUpload.tsx`
- `frontend/src/components/staff/DocumentVerify.tsx`
- `frontend/src/components/staff/DocumentList.tsx`

**Expected Outcome:** Complete staff document management with verification and expiry tracking.

---

##  PROMPT 6.2: Staff Attendance System

**Context:** Backend has `/api/staff/attendance/` but no UI.

**Task:** Build staff attendance tracking.

**Detailed Requirements:**

1. **Create StaffAttendance.tsx:**
   - Location: `frontend/src/pages/staff/StaffAttendance.tsx`
   - Daily attendance marking
   - Calendar view (monthly)
   - List view (date range)

2. **Mark Attendance:**
   - Date selection
   - Staff list with checkboxes
   - Status options:
     - Present
     - Absent
     - Half Day
     - On Leave
     - Week Off
     - Holiday
   - Time in/out (for present)
   - Late coming (if time in > threshold)
   - Early going (if time out < threshold)
   - Overtime hours
   - Remarks

3. **Bulk Attendance:**
   - Mark all present
   - Mark department-wise
   - Import from biometric device
   - Auto-mark from leave applications

4. **Biometric Integration:**
   - Import attendance from biometric device
   - Match punch records with staff
   - Calculate working hours
   - Detect multiple punches
   - Mismatch resolution

5. **Attendance Summary:**
   - Staff-wise attendance summary
   - Columns:
     - Staff name
     - Total days
     - Present
     - Absent
     - Half days
     - Leaves
     - Late comings
     - Attendance %

6. **Late Coming/Early Going Tracker:**
   - Separate report for punctuality
   - Count late comings per month
   - Penalty rules (if any)
   - Regularization requests

7. **Overtime Tracking:**
   - Record overtime hours
   - Approval workflow
   - Link with payroll for OT payment

8. **Attendance Reports:**
   - Daily attendance register
   - Monthly attendance sheet
   - Department-wise report
   - Absentee report
   - Late coming report
   - Export to Excel

9. **API Integration:**
   - POST `/api/staff/attendance/` body: `{date, staff[], status, time_in, time_out, remarks}`
   - GET `/api/staff/attendance/?date=&month=&staff=`
   - GET `/api/staff/attendance/summary/?from_date=&to_date=&staff=`
   - POST `/api/staff/attendance/import_biometric/`
   - GET `/api/staff/attendance/late_comings/`

**Files to Create:**
- `frontend/src/pages/staff/StaffAttendance.tsx`
- `frontend/src/components/staff/AttendanceMarker.tsx`
- `frontend/src/components/staff/AttendanceCalendar.tsx`
- `frontend/src/components/staff/AttendanceSummary.tsx`
- `frontend/src/components/staff/BiometricImport.tsx`

**Expected Outcome:** Complete staff attendance system with biometric integration.

---

##  PROMPT 6.3: Staff Leave Management Enhancement

**Context:** Basic leave exists but needs approval workflow and leave balance tracking.

**Task:** Enhance leave management with approval and balance.

**Detailed Requirements:**

1. **Leave Types:**
   - Casual Leave (CL)
   - Sick Leave (SL)
   - Earned Leave / Privilege Leave (EL/PL)
   - Maternity Leave
   - Paternity Leave
   - Compensatory Off (Comp Off)
   - Loss of Pay (LOP)
   - Study Leave
   - Special Leave
   - Work From Home (WFH)

2. **Leave Balance:**
   - Define annual leave quota per leave type
   - Varies by staff designation/department
   - Track opening balance
   - Track used
   - Track available
   - Carry forward rules (end of year)

3. **Leave Application:**
   - Staff applies for leave
   - Leave type
   - From date, To date
   - Number of days (auto-calculated, consider half-days)
   - Reason
   - Contact during leave
   - Attachment (medical certificate for SL > 3 days)
   - Save as draft OR submit

4. **Approval Workflow:**
   - Multi-level approval:
     - Level 1: Immediate supervisor/HOD
     - Level 2: Principal/Director (for > X days)
     - Level 3: Management (for long leaves)
   - Each approver can:
     - Approve
     - Reject (with reason)
     - Forward to next level
   - Email notification at each step

5. **Leave Calendar:**
   - Staff personal leave calendar
   - Department leave calendar (who is on leave)
   - Visual monthly view
   - Color-coded by leave type

6. **Compensatory Off:**
   - Staff worked on holiday/weekend
   - Request comp off
   - Link with attendance (proof of working)
   - Approval required
   - Add to leave balance after approval

7. **Leave Regularization:**
   - Staff was absent but didn't apply leave
   - Regularize attendance by applying leave retroactively
   - Approval required
   - Time limit for regularization (e.g., within 7 days)

8. **Leave Encashment:**
   - Unused leaves can be encashed (per policy)
   - Apply for encashment
   - Approval workflow
   - Link with payroll

9. **Leave Reports:**
   - Leave balance report (all staff)
   - Leave history (staff-wise)
   - Pending leave applications
   - Department-wise leave availed
   - Leave trend analysis

10. **Notifications:**
    - Email/SMS on leave application submission
    - Notify approvers
    - Notify staff on approval/rejection
    - Reminder for pending approvals

11. **API Integration:**
    - GET `/api/staff/leave_balance/?staff=`
    - POST `/api/staff/leave_applications/`
    - GET `/api/staff/leave_applications/`
    - POST `/api/staff/leave_applications/{id}/approve/`
    - POST `/api/staff/leave_applications/{id}/reject/` body: `{reason}`
    - GET `/api/staff/leave_calendar/?month=&department=`
    - POST `/api/staff/comp_off/`

**Files to Create:**
- `frontend/src/pages/staff/LeaveBalance.tsx`
- `frontend/src/pages/staff/LeaveApplications.tsx`
- `frontend/src/pages/staff/LeaveApproval.tsx`
- `frontend/src/components/staff/LeaveForm.tsx`
- `frontend/src/components/staff/LeaveCalendar.tsx`
- `frontend/src/components/staff/CompOffRequest.tsx`

**Expected Outcome:** Complete leave management with multi-level approval and balance tracking.

---

##  PROMPT 6.4: Staff Health Records

**Context:** No health record tracking exists.

**Task:** Build staff health record management.

**Detailed Requirements:**

1. **Health Profile:**
   - Create HealthRecords.tsx
   - Location: `frontend/src/pages/staff/HealthRecords.tsx`
   - Basic health info:
     - Blood group
     - Height
     - Weight
     - BMI (auto-calculated)
     - Known allergies
     - Chronic conditions
     - Current medications
     - Emergency contact (medical)
     - Preferred hospital

2. **Medical History:**
   - Past medical events:
     - Date
     - Condition/illness
     - Treatment
     - Doctor/hospital
     - Documents (upload)
   - Surgical history
   - Family medical history

3. **Medical Checkup:**
   - Record periodic health checkups
   - Checkup date
   - Type (Annual, Pre-employment, Fitness, etc.)
   - Vitals:
     - BP
     - Sugar level
     - Temperature
     - Pulse rate
     - Oxygen level
   - Lab tests conducted
   - Upload reports
   - Doctor's notes
   - Fit/Unfit status

4. **Vaccination Records:**
   - Vaccine name
   - Date administered
   - Next due date
   - Certificate upload
   - (Useful for COVID-19, Flu, etc.)

5. **Sick Leave Tracker:**
   - Link sick leaves with health records
   - Track frequent sick leaves
   - Identify patterns
   - Medical certificate verification

6. **Insurance Information:**
   - Health insurance provider
   - Policy number
   - Coverage amount
   - Family members covered
   - Policy expiry date
   - Upload policy document
   - Renewal reminders

7. **Injury/Accident Reporting:**
   - Report workplace injury
   - Date, time, location
   - Description
   - Severity
   - First aid provided
   - Medical treatment
   - Compensation claim (if any)
   - Upload photos/reports

8. **Health Alerts:**
   - Alert for staff with health conditions
   - Vaccination due reminders
   - Insurance renewal reminders
   - Checkup due reminders

9. **Privacy & Access Control:**
   - Health records are sensitive
   - Only HR and authorized personnel can access
   - Staff can view their own records
   - Audit log for access

10. **API Integration:**
    - GET `/api/staff/{id}/health_profile/`
    - POST `/api/staff/health_profile/`
    - POST `/api/staff/medical_history/`
    - POST `/api/staff/medical_checkups/`
    - POST `/api/staff/vaccinations/`
    - POST `/api/staff/injury_reports/`

**Files to Create:**
- `frontend/src/pages/staff/HealthRecords.tsx`
- `frontend/src/components/staff/HealthProfile.tsx`
- `frontend/src/components/staff/MedicalCheckup.tsx`
- `frontend/src/components/staff/VaccinationRecord.tsx`
- `frontend/src/components/staff/InjuryReport.tsx`

**Expected Outcome:** Complete staff health record management with privacy controls.

---

##  PROMPT 6.5: Staff Training & Development

**Context:** No training tracking exists.

**Task:** Build staff training and development module.

**Detailed Requirements:**

1. **Training Programs:**
   - Create TrainingManagement.tsx
   - Location: `frontend/src/pages/staff/TrainingManagement.tsx`
   - List all training programs
   - Columns:
     - Program name
     - Category (Technical, Soft Skills, Leadership, Safety, etc.)
     - Duration
     - Trainer
     - Scheduled date
     - Location/Mode (Online/Offline/Hybrid)
     - Target audience
     - Capacity
     - Enrolled
     - Status

2. **Create Training:**
   - Form fields:
     - Program name
     - Category
     - Description
     - Objectives
     - Duration (days/hours)
     - Trainer (internal/external)
     - Scheduled dates
     - Time
     - Mode
     - Venue/Link
     - Max capacity
     - Target staff (by designation/department)
     - Mandatory/Optional
     - Cost per person
     - Upload material/agenda

3. **Training Enrollment:**
   - Staff self-enrollment (if optional)
   - Admin enrollment
   - Waitlist if full
   - Enrollment confirmation
   - Calendar invite

4. **Attendance Tracking:**
   - Session-wise attendance (if multi-day program)
   - Minimum attendance % for certification

5. **Training Material:**
   - Upload training materials
   - Presentations, videos, PDFs
   - Accessible to enrolled staff
   - Download/view

6. **Assessment & Certification:**
   - Post-training assessment (quiz/exam)
   - Passing marks
   - Certificate generation (if passed)
   - Certificate template
   - Digital signature
   - Certificate download

7. **Feedback:**
   - Staff feedback on training
   - Rating (1-5)
   - Questions:
     - Content quality
     - Trainer effectiveness
     - Relevance
     - Would recommend?
   - Comments
   - View feedback summary

8. **Training Calendar:**
   - View all upcoming trainings
   - Filter by category, month
   - My trainings (staff view)

9. **Training Reports:**
   - Staff-wise training history
   - Department-wise participation
   - Training hours per staff (annual)
   - Certification status
   - Training cost analysis
   - Effectiveness report

10. **API Integration:**
    - GET `/api/staff/trainings/`
    - POST `/api/staff/trainings/`
    - POST `/api/staff/trainings/{id}/enroll/` body: `{staff[]}`
    - POST `/api/staff/trainings/{id}/attendance/`
    - POST `/api/staff/trainings/{id}/assessment/`
    - POST `/api/staff/trainings/{id}/certificate/` body: `{staff}`
    - POST `/api/staff/trainings/{id}/feedback/`

**Files to Create:**
- `frontend/src/pages/staff/TrainingManagement.tsx`
- `frontend/src/components/staff/TrainingForm.tsx`
- `frontend/src/components/staff/TrainingEnrollment.tsx`
- `frontend/src/components/staff/TrainingFeedback.tsx`
- `frontend/src/components/staff/CertificateGen.tsx`

**Expected Outcome:** Complete training management with enrollment, assessment, and certification.

---

##  PROMPT 6.6: Staff Performance & Appraisal

**Context:** No appraisal system exists.

**Task:** Build staff performance appraisal system.

**Detailed Requirements:**

1. **Appraisal Cycle:**
   - Create AppraisalManagement.tsx
   - Location: `frontend/src/pages/staff/AppraisalManagement.tsx`
   - Define appraisal cycles:
     - Name (Annual Appraisal 2026, Mid-year Review, etc.)
     - Appraisal period (from-to dates)
     - Submission deadline
     - Target staff (all or specific departments)
     - Appraisal template

2. **Appraisal Template:**
   - Define evaluation parameters:
     - Technical Skills
     - Communication
     - Teamwork
     - Leadership
     - Initiative
     - Punctuality
     - Goal Achievement
     - Custom parameters
   - Rating scale (1-5 or 1-10)
   - Weightage for each parameter
   - Overall rating calculation

3. **Self-Appraisal:**
   - Staff fills self-appraisal
   - Rate themselves on each parameter
   - Achievements during period
   - Goals for next period
   - Training needs
   - Comments

4. **Manager Appraisal:**
   - Manager/HOD evaluates staff
   - Rate on each parameter
   - Strengths
   - Areas of improvement
   - Recommendations
   - Promotion/increment suggestion
   - Overall comments

5. **360-Degree Feedback (Optional):**
   - Collect feedback from:
     - Peers
     - Subordinates
     - Self
     - Manager
   - Anonymous option
   - Aggregate feedback

6. **Appraisal Meeting:**
   - Schedule 1-on-1 meeting
   - Discuss appraisal
   - Final rating (agreed)
   - Action points
   - Sign-off (both parties)

7. **Goal Setting:**
   - Set SMART goals for next period
   - Goal description
   - Target completion date
   - KPIs/Metrics
   - Track progress
   - Mid-cycle review

8. **Appraisal History:**
   - View past appraisals
   - Rating trend (chart)
   - Compare year-on-year

9. **Appraisal Reports:**
   - Department-wise rating distribution
   - Top performers
   - Low performers
   - Promotion recommendations
   - Increment recommendations
   - Training needs analysis

10. **Increment/Promotion:**
    - Link appraisal with increment
    - HR decides increment % based on rating
    - Process promotions
    - Update designation and salary

11. **API Integration:**
    - POST `/api/staff/appraisal_cycles/`
    - GET `/api/staff/appraisal_cycles/`
    - POST `/api/staff/appraisals/` body: `{cycle, staff, self_ratings, manager_ratings, goals}`
    - GET `/api/staff/{id}/appraisal_history/`
    - GET `/api/staff/appraisal_reports/?cycle=`

**Files to Create:**
- `frontend/src/pages/staff/AppraisalManagement.tsx`
- `frontend/src/pages/staff/MyAppraisal.tsx` (staff view)
- `frontend/src/components/staff/AppraisalCycleForm.tsx`
- `frontend/src/components/staff/AppraisalForm.tsx`
- `frontend/src/components/staff/GoalSetting.tsx`
- `frontend/src/components/staff/AppraisalReports.tsx`

**Expected Outcome:** Complete appraisal system with self/manager evaluation and goal tracking.

---

Phase 6 complete. Ready for Phase 7 (Reports & Analytics)?
