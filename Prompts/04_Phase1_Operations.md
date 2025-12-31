# Phase 1.2: Core Operations (Attendance & Finance)

**Goal**: Manage daily routines and revenue.

---

## Prompt 1.6: Smart Attendance System

**Context**: Recording presence for Students and Staff.

```markdown
# 🙋‍♂️ ATTENDANCE & BIOMETRIC INTEGRATION

Build a multi-method attendance system.

## 📝 Functional Requirements

1.  **Models (in `backend/attendance/models.py`)**:
    - `AttendanceRecord`:
        - `student`: FK.
        - `date`: Date (Indexed).
        - `status`: Enum (Present, Absent, Late, HalfDay).
        - `method`: Enum (Manual, QR, Face, RFID).
        - `academic_year`: FK (optimization for Year-based reports).

2.  **Methods**:
    - **Manual**: Teacher Grid View (React).
    - **QR Code**: Generate QR for student for ID card -> Scan via App -> API Call.
    - **QR Code for teacher**: Generate Daily QR for Teacher -> Scan via App -> API Call.
    - **Biometric/RFID**: API endpoint receiving `{card_id, timestamp}` from hardware.
    - **Geo Tagging**: API endpoint receiving `{card_id, timestamp}` from hardware.
    - **Geo Tagging**: API endpoint receiving `{card_id, timestamp}` from mobile for Transport.

3.  **Calendar & Event Integration (Smart Logic)**:
    - **Blocked Dates**: Prevent marking attendance on "Holidays" or "Sundays" (fetched from Academic Calendar).
    - **Event Days**: If "Sports Day" is an Event, allow marking attendance but tag as "Non-Instructional".
    - **Auto-Calculation**:
        - `WorkingDays = TotalDays - (Sundays + Holidays)`.
        - `Attendance% = (Present + Late) / WorkingDays`.
        - Recalculate monthly aggregates automatically via Celery signals.
    - **Auto-Absent Job (Cron)**: 
        - **Scope**: Runs for both **Students** and **Staff**.
        - Configurable Cutoff Time (e.g., Students: 10:00 AM, Staff: 9:00 AM).
        - If no record found by Cutoff -> Auto-mark as "Absent".
    - **Staff Specifics**:
        - **Late Arrival**: If Staff punches in after `shift_start_time` + buffer -> Mark "Late".
        - 3 Late Marks = 1 Half Day (Configurable Rule).
        - **Loss of Pay (LOP)**: Auto-absent days flagged for Payroll deduction.
    - **Alerts**: 
        - Student: "Consecutive Absents" (3 days) -> SMS to Parent.
        - Staff: "Absent" -> SMS to Principal/HR.
    - **Report Automation (WhatsApp)**:
        - **Monthly Summary**: On 1st of month -> Calc % -> Generate PDF.
        - **Delivery**: Send WhatsApp message: "Your child {Name} had {X} days Present (92%) in {Month}. View Report: {Link}".

## 📦 Deliverables
- `backend/attendance/models.py`.
- `backend/attendance/services.py` (Calculation Service).
- `backend/attendance/tasks.py` (Report Generation Cron).
- `backend/attendance/views.py`.
- `frontend/src/pages/attendance/MarkAttendance.tsx`.
- `frontend/src/pages/attendance/AttendanceReports.tsx`.
```

---

## Prompt 1.7: Fees & Payment Engine

**Context**: The financial lifeline (Student revenue). **Critical Dependency**: Academic Structure.

```markdown
# 💰 FEE COLLECTION SYSTEM

Implement a flexible Fee engine linked to Academic Years.

## 📝 Functional Requirements

1.  **Fee Configuration**:
    - `FeeCategory`: (Tuition, Transport, Lab).
    - `FeeStructure`: 
        - `academic_year`: FK (Fees change every year).
        - `class`: FK.
        - `amount`: Decimal.
        - `frequency`: OneTime, Monthly, Term.

2.  **Student Billing (Customizable)**:
    - **Auto-Invoice**: Cron job to generate monthly dues.
    - **FeeAllocation**: Assign Structure -> Student.
        - **Override Capability**: Admin can manually adjust amounts per student (e.g., "Special Discount: ₹2000").
        - **Scholarships**: Tag allocations as "Scholarship" to track waivers in accounting.
    - **FeeTransaction**: Payment Record (Amount, Date, Mode, Transaction ID).
    - **Sibling Discount**: Apply discount to sibling students.
    - **Bulk Operations**: Import/Export payments via Excel/CSV.    
    - **Sibling Fee Discount Calculation**: Prorata fee calculation based on sibling count.
    - **Fee Type**: OneTime, Monthly, Term.
    - **Fee Status**: Pending, Partial, Full, Overpaid. 
    - **Fee Transaction**: Payment Record (Amount, Date, Mode, Transaction ID).
    - **Sibling Consolidation**: Consolidate sibling fees into a single invoice. Collect all fees at once.
    - **Integration**: Every success transaction -> Auto-creates "Income Entry" in Accounting (Prompt 1.8).

3.  **Features**:
    - **Receipts**: PDF Generation. Two receipts for each transaction. One for Student and one for School.
    - **Defaulters**: "Stop Access" logic integration.
    - **WhatsApp Reminders**: Automated Nudges with "Pay Now" link.

## 📦 Deliverables
- `backend/fees/models.py`.
- `backend/fees/services.py`.
- `frontend/src/pages/fees/CollectFees.tsx`.
```

---

## Prompt 1.8: School Finance & Accounting

**Context**: Managing the school's ledger, expenses, and P&L.

```markdown
# 🧾 SCHOOL ACCOUNTING & DOUBLE ENTRY

Build a robust accounting system to track Income vs Expenses.

## 📝 Functional Requirements

1.  **Double-Entry Core**:
    - `LedgerAccount`: (Assets, Liabilities, Income, Expenses).
    - `JournalEntry`: Debit/Credit matching logic.

2.  **Expense Management**:
    - **Petty Cash**: Track daily small spends (Tea, chalks) -> Approval Workflow.
    - **Vendor Payments**: Track payments to Book/Uniform vendors (Prompt 4.3).
    - **Salary Integration**: Auto-debit Staff Salaries from HR module (Prompt 3.2).

3.  **Reports**:
    - **Income Statement (P&L)**: Real-time Profit/Loss view.
    - **Balance Sheet**: Assets vs Liabilities.
    - **Day Book**: Daily Cash In/Out summary.

## 📦 Deliverables
- `backend/finance/models.py` (Account, Journal, Transaction).
- `backend/finance/reports.py`.
- `frontend/src/pages/finance/ExpenseManager.tsx`.
- `frontend/src/pages/finance/FinancialReports.tsx`.
```
