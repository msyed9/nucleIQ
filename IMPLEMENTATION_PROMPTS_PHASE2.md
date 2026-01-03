#  NucleIQ Implementation Prompts - Phase 2: Library Management System

**Purpose:** Complete library module with all CRUD operations and advanced features

---

##  PROMPT 2.1: Complete Library Management Frontend - Part A (Book Copies)

**Context:** Backend has `/api/library/copies/` endpoint but no frontend UI. Users cannot manage individual book copies or generate barcodes.

**Task:** Build book copies management interface with barcode generation.

**Detailed Requirements:**

1. **Create BookCopies.tsx page:**
   - Location: `frontend/src/pages/library/BookCopies.tsx`
   - Features:
     - List all copies of a selected book
     - Table columns: Barcode, Status, Condition, Location, Acquired Date, Actions
     - Status badges: AVAILABLE (green), ISSUED (blue), LOST (red), DAMAGED (orange), MAINTENANCE (yellow)
     - Filter by status
     - Search by barcode

2. **CRUD Operations:**
   - **Add Copy:** Modal with fields:
     - Barcode (auto-generate option or manual entry)
     - Condition (New, Good, Fair, Poor)
     - Location (shelf/rack number)
     - Acquisition date
     - Purchase price
     - Notes
   - **Edit Copy:** Update condition, location, notes
   - **Delete Copy:** Soft delete with confirmation
   - **Change Status:** Quick status update (e.g., mark as damaged)

3. **Bulk Operations:**
   - Add multiple copies at once (enter quantity)
   - Auto-generate sequential barcodes
   - Bulk status update
   - Export copy list to Excel

4. **Barcode Features:**
   - Generate printable barcode labels (PDF)
   - Label format: Book title, author, barcode (Code 128 or QR)
   - Print options: Single label, multiple labels, full sheet
   - Use library like `react-barcode` or `qrcode.react`

5. **API Integration:**
   - GET `/api/library/copies/?book={book_id}`
   - POST `/api/library/copies/`
   - PATCH `/api/library/copies/{id}/`
   - DELETE `/api/library/copies/{id}/`
   - POST `/api/library/copies/bulk_create/`
   - GET `/api/library/copies/{id}/generate_label/`

6. **UI Enhancements:**
   - Integrate into LibraryManagement.tsx as a tab OR
   - Access from BookList with "Manage Copies" button per book
   - Show copy count badge on book cards
   - Visual indicator for low stock (< 3 available copies)

**Files to Create/Modify:**
- `frontend/src/pages/library/BookCopies.tsx` (new)
- `frontend/src/pages/library/LibraryBooks.tsx` (add copies button)
- `frontend/src/components/library/BarcodeLabelGenerator.tsx` (new)
- `frontend/src/App.tsx` (add route if separate page)
- `package.json` (add react-barcode or jsbarcode)

**Expected Outcome:** Complete book copy management with barcode generation and printing.

---

##  PROMPT 2.2: Complete Library Management Frontend - Part B (Members)

**Context:** `/api/library/members/` endpoint exists but UI only shows in LibraryManagement without CRUD operations.

**Task:** Build comprehensive library members management.

**Detailed Requirements:**

1. **Update LibraryMembers.tsx page:**
   - Location: `frontend/src/pages/library/LibraryMembers.tsx`
   - Grid/card view of all members
   - Member card showing:
     - Photo (student/staff photo)
     - Name and member ID
     - Member type (STUDENT/STAFF/GUEST)
     - Class/section (students) or designation (staff)
     - Books currently issued (count)
     - Fine amount due (highlighted if > 0)
     - Membership status (ACTIVE/SUSPENDED/EXPIRED)
   
2. **Search & Filters:**
   - Search by name, member ID, admission number
   - Filter by member type
   - Filter by class/grade (for students)
   - Filter by status
   - Show only members with fines
   - Show only members with overdue books

3. **Member Enrollment:**
   - **Auto-enroll:** 
     - Button: "Enroll Class"
     - Select grade/section
     - Auto-create members for all students in that class
     - Assign sequential membership numbers
   - **Manual enroll:**
     - Select student/staff from dropdown
     - Set max_books_allowed (default from settings)
     - Set membership validity period
   - Staff enrollment with department selection

4. **Member Actions:**
   - View issue history (all books ever issued)
   - View current issues
   - View fine history
   - Suspend membership (prevent issuing books)
   - Edit max books allowed
   - Send reminder for overdue books
   - Print membership card

5. **Member Profile View:**
   - Detailed modal/page showing:
     - Personal info
     - Contact details
     - Reading statistics (total books read, favorite genre)
     - Current issues table
     - Issue history table
     - Fine payment history
     - Membership timeline

6. **Bulk Operations:**
   - Bulk suspend/activate
   - Export member list
   - Send bulk notifications

7. **API Integration:**
   - GET `/api/library/members/`
   - POST `/api/library/members/` (single)
   - POST `/api/library/members/bulk_enroll/` (for class)
   - PATCH `/api/library/members/{id}/`
   - GET `/api/library/members/{id}/issue_history/`
   - POST `/api/library/members/{id}/suspend/`
   - POST `/api/library/members/{id}/activate/`

**Files to Modify:**
- `frontend/src/pages/library/LibraryMembers.tsx` (major update)
- `frontend/src/components/library/MemberCard.tsx` (new)
- `frontend/src/components/library/MemberProfile.tsx` (new)
- `frontend/src/components/library/MemberEnrollmentModal.tsx` (new)

**Expected Outcome:** Full member management with enrollment, tracking, and history.

---

##  PROMPT 2.3: Complete Library Management - Part C (Issue & Return)

**Context:** Issue and return functionality exists in backend but frontend implementation in LibraryManagement.tsx is incomplete.

**Task:** Build robust book issue and return interface with validation and barcode scanning.

**Detailed Requirements:**

1. **Issue Book Tab Enhancement:**
   - Two input modes:
     - **Barcode Scanner Mode:** 
       - Use device camera with `@zxing/library`
       - Scan book copy barcode
       - Scan member card QR code
       - Auto-populate fields
     - **Manual Entry Mode:**
       - Type book barcode or search by title
       - Type member ID or search by name
   
2. **Issue Workflow:**
   - Step 1: Scan/enter book copy barcode
     - Show book details (title, author, cover image)
     - Verify copy is AVAILABLE
     - Show warning if copy is DAMAGED
   - Step 2: Scan/enter member ID
     - Show member photo and name
     - Display current books issued count
     - Show available limit (e.g., "3/5 books")
     - Warning if member has overdue books
     - Block if member suspended or limit reached
   - Step 3: Confirm issue
     - Show due date (auto-calculated from library rules)
     - Option to extend due date (admin only)
     - Add notes (optional)
     - Click "Issue Book"
   - Step 4: Success confirmation
     - Print issue receipt option
     - Show remaining limit
     - Clear form for next issue

3. **Validation Rules:**
   - Book copy must be AVAILABLE
   - Member must be ACTIVE
   - Member must not exceed max_books_allowed
   - Member must not have pending fines > threshold (configurable)
   - Member must not have overdue books (if strict mode enabled)

4. **Return Book Tab Enhancement:**
   - Scan/enter book copy barcode
   - Auto-fetch issue details:
     - Member name and photo
     - Issue date
     - Due date
     - Days borrowed
     - Fine amount (if overdue)
   - Fine calculation:
     - Auto-calculate based on overdue days × fine_per_day
     - Show fine breakdown
     - Option to waive fine (with reason and admin approval)
     - Record fine payment if collected
   - Return confirmation:
     - Update copy status to AVAILABLE
     - Check copy condition:
       - If damaged, mark copy as DAMAGED and assess damage fine
       - Notes field for condition remarks
     - Print return receipt
     - Show success message

5. **Current Issues Tab:**
   - Table of all currently issued books:
     - Columns: Member, Book, Issue Date, Due Date, Days Left, Status
     - Status: On Time (green), Due Soon (<3 days, yellow), Overdue (red)
     - Sort by due date
     - Filter by member type, overdue status
   - Row actions:
     - Quick return
     - Extend due date
     - Send reminder to member
   - Bulk actions:
     - Bulk return
     - Send reminders to all overdue

6. **Overdue Alerts:**
   - Dashboard widget showing overdue count
   - List of overdue issues with member contact
   - Send reminder button (SMS/Email/WhatsApp)
   - Auto-reminder job (daily at 9 AM)

7. **API Integration:**
   - POST `/api/library/issues/issue/` body: `{barcode, member_id, due_date, notes}`
   - POST `/api/library/issues/{id}/return_book/` body: `{condition, fine_waived, waive_reason}`
   - GET `/api/library/issues/?status=ISSUED`
   - GET `/api/library/issues/?overdue=true`
   - POST `/api/library/issues/{id}/extend_due_date/` body: `{new_due_date}`
   - POST `/api/library/issues/send_reminders/` body: `{issue_ids[]}`

**Files to Modify:**
- `frontend/src/pages/library/LibraryManagement.tsx` (major enhancement)
- `frontend/src/components/library/BarcodeScanner.tsx` (new)
- `frontend/src/components/library/IssueReceipt.tsx` (new)
- `frontend/src/components/library/ReturnReceipt.tsx` (new)
- `frontend/src/components/library/FineCalculator.tsx` (new)

**Expected Outcome:** Complete issue/return workflow with barcode scanning, fine management, and validation.

---

##  PROMPT 2.4: Digital Resources Module

**Context:** `/api/library/digital/` endpoint exists but no frontend implementation.

**Task:** Create digital library/e-library interface.

**Detailed Requirements:**

1. **Create DigitalResources.tsx:**
   - Location: `frontend/src/pages/library/DigitalResources.tsx`
   - Grid view of digital resources with cards showing:
     - Thumbnail/icon (PDF, video, link icons)
     - Resource title
     - Category badge
     - Format (PDF, VIDEO, LINK, AUDIO)
     - File size (if file upload)
     - Downloads count
     - Access level (PUBLIC, STUDENTS, STAFF, SPECIFIC_GRADES)

2. **Resource Categories:**
   - E-Books
   - Journals & Magazines
   - Educational Videos
   - Online Courses
   - Reference Links
   - Study Materials
   - Past Papers

3. **CRUD Operations:**
   - **Add Resource:**
     - Upload file (PDF, video) OR
     - Provide external link (YouTube, educational sites)
     - Title, description, category
     - Tags for search
     - Access control (who can view)
     - Thumbnail upload
   - **Edit/Delete** with proper permissions

4. **Access Control:**
   - Public: Anyone can access
   - Students: Only enrolled students
   - Staff: Only staff members
   - Grade-specific: Only specific grades (e.g., Class 10 study materials)
   - Individual: Specific students/staff

5. **Resource Viewing:**
   - PDF: In-browser viewer using `react-pdf`
   - Videos: Embedded player
   - Links: Open in new tab
   - Download option with tracking

6. **Search & Filters:**
   - Search by title, description, tags
   - Filter by category, format, grade
   - Sort by popularity, date added, title

7. **Analytics:**
   - Track downloads per resource
   - Most popular resources
   - View count
   - Student engagement metrics

8. **API Integration:**
   - GET `/api/library/digital/`
   - POST `/api/library/digital/` (multipart for file upload)
   - GET `/api/library/digital/{id}/`
   - GET `/api/library/digital/{id}/access_link/` (generates time-limited link)
   - POST `/api/library/digital/{id}/track_access/` (log view/download)
   - DELETE `/api/library/digital/{id}/`

**Files to Create:**
- `frontend/src/pages/library/DigitalResources.tsx`
- `frontend/src/components/library/ResourceCard.tsx`
- `frontend/src/components/library/ResourceViewer.tsx`
- `frontend/src/components/library/ResourceUpload.tsx`
- Add route in `App.tsx`

**Expected Outcome:** Complete digital library with upload, access control, and tracking.

---

##  PROMPT 2.5: Library Reports & Analytics

**Context:** No reporting interface exists for library module.

**Task:** Create comprehensive library reports dashboard.

**Detailed Requirements:**

1. **Create LibraryReports.tsx:**
   - Location: `frontend/src/pages/library/LibraryReports.tsx`
   
2. **Report Types:**

   **A. Circulation Reports:**
   - Books issued today/this week/this month
   - Books returned today/this week/this month
   - Currently issued books count
   - Most issued books (top 10/20)
   - Least circulated books
   - Average issue duration
   - Category-wise circulation

   **B. Member Reports:**
   - Active members count
   - New enrollments (this month)
   - Most active readers (top borrowers)
   - Members with overdue books
   - Members with fines
   - Reading activity by grade/class

   **C. Inventory Reports:**
   - Total books in library
   - Books by category
   - Books by author/publisher
   - Available vs issued ratio
   - Lost/damaged books report
   - Books needing replacement (poor condition)
   - New acquisitions report

   **D. Financial Reports:**
   - Total fines collected (period-wise)
   - Outstanding fines
   - Damage charges collected
   - Book purchase expenses
   - Membership fee collected

   **E. Overdue Reports:**
   - All overdue books list
   - Overdue by member
   - Overdue by book
   - Days overdue statistics
   - Fine calculation summary

3. **Report Features:**
   - Date range selection
   - Filter options (by class, member type, category)
   - Export to Excel
   - Export to PDF
   - Print option
   - Email report (schedule)
   - Visual charts (bar, pie, line graphs)
   - Drill-down capability

4. **Dashboard Widgets:**
   - Add library widgets to main dashboard:
     - Total books widget
     - Books issued today
     - Overdue count (with alert if > threshold)
     - Fine collection (this month)
     - Most popular book

5. **API Endpoints (may need to create):**
   - GET `/api/library/reports/circulation/?start_date=&end_date=`
   - GET `/api/library/reports/members/`
   - GET `/api/library/reports/inventory/`
   - GET `/api/library/reports/financial/?start_date=&end_date=`
   - GET `/api/library/reports/overdue/`
   - GET `/api/library/reports/popular_books/?limit=10`

**Files to Create:**
- `frontend/src/pages/library/LibraryReports.tsx`
- `frontend/src/components/library/ReportChart.tsx`
- `backend/library/views.py` (add report actions if needed)

**Expected Outcome:** Comprehensive reporting system with analytics and export capabilities.

---

##  PROMPT 2.6: Library Settings & Configuration

**Context:** Library rules and settings are hardcoded or missing.

**Task:** Create library configuration interface.

**Detailed Requirements:**

1. **Create LibrarySettings.tsx:**
   - Location: `frontend/src/pages/library/LibrarySettings.tsx`

2. **Configuration Options:**
   - **General Settings:**
     - Library name and code
     - Working days and hours
     - Contact email
   
   - **Circulation Rules:**
     - Default issue period (days)
     - Maximum issue period
     - Allow renewals (Yes/No)
     - Maximum renewals allowed per book
     - Renewal period (days)
   
   - **Member Limits:**
     - Students: Max books allowed
     - Staff: Max books allowed
     - Guest: Max books allowed
     - VIP: Max books allowed (special category)
   
   - **Fine Configuration:**
     - Fine per day for overdue
     - Grace period (days before fine starts)
     - Maximum fine per book
     - Damage fine (based on book price %)
     - Lost book charge (replacement cost + processing fee)
   
   - **Reservation Settings:**
     - Allow reservations (Yes/No)
     - Reservation expiry (hours after book becomes available)
     - Maximum reservations per member
   
   - **Notification Settings:**
     - Send issue confirmation (SMS/Email/WhatsApp)
     - Send return reminder (X days before due)
     - Send overdue reminder (daily)
     - Send reservation notification
   
   - **Barcode Settings:**
     - Barcode prefix
     - Starting number
     - Barcode format (Code 128, QR, EAN)
     - Label size and format

3. **UI Components:**
   - Tabs for different setting categories
   - Form with proper validation
   - Save button with confirmation
   - Reset to defaults option
   - Preview for barcode labels

4. **API Integration:**
   - GET `/api/library/settings/`
   - PATCH `/api/library/settings/`
   - Backend: Create LibrarySettings model or use tenant preferences

**Files to Create:**
- `frontend/src/pages/library/LibrarySettings.tsx`
- `backend/library/models.py` (add LibrarySettings model if needed)
- `backend/library/serializers.py`
- Add settings to Settings page as Library section

**Expected Outcome:** Configurable library rules with UI for all settings.

---

Continue to Phase 3?
