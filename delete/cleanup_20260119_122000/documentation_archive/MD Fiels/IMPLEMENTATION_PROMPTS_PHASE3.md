#  NucleiQ Implementation Prompts - Phase 3: Finance & Accounting Module

**Purpose:** Complete double-entry accounting system with all financial operations

---

##  PROMPT 3.1: Chart of Accounts & Ledger Management

**Context:** Backend has `/api/finance/accounts/` endpoint but no frontend UI. Full accounting system exists in backend but only petty cash is used in frontend.

**Task:** Build chart of accounts management with hierarchical structure.

**Detailed Requirements:**

1. **Create ChartOfAccounts.tsx:**
   - Location: `frontend/src/pages/finance/ChartOfAccounts.tsx`
   - Tree view structure showing account hierarchy:
     - Level 1: Account Types (Assets, Liabilities, Income, Expenses, Equity)
     - Level 2: Account Groups (Current Assets, Fixed Assets, etc.)
     - Level 3: Sub-groups
     - Level 4: Individual accounts
   
2. **Account Display:**
   - Each node shows:
     - Account code (e.g., 1000, 1100, 1110)
     - Account name
     - Account type
     - Current balance (Dr/Cr)
     - Status (Active/Inactive)
     - Number of transactions
   - Expandable/collapsible tree
   - Color coding by account type

3. **CRUD Operations:**
   - **Add Account:** Modal with:
     - Parent account (dropdown showing tree)
     - Account code (auto-suggest next available)
     - Account name
     - Account type (Asset/Liability/Income/Expense/Equity)
     - Opening balance (Dr/Cr)
     - Description
     - Is active (checkbox)
   - **Edit Account:** Update name, description, status
   - **Delete Account:** Only if no transactions (soft delete)
   - **Activate/Deactivate:** Toggle status

4. **Account Details View:**
   - Click on account to see:
     - Full account details
     - Current balance
     - Recent transactions (last 10)
     - Sub-accounts list
     - "View Ledger" button (opens ledger report)

5. **Pre-configured Templates:**
   - Button: "Import Standard Chart of Accounts"
   - Templates for:
     - Educational Institution
     - Small Business
     - Non-Profit Organization
   - Creates full account structure automatically

6. **Search & Filter:**
   - Search by code or name
   - Filter by account type
   - Show only active/inactive
   - Show only accounts with balance

7. **API Integration:**
   - GET `/api/finance/accounts/`
   - GET `/api/finance/accounts/tree/` (hierarchical structure)
   - POST `/api/finance/accounts/`
   - PATCH `/api/finance/accounts/{id}/`
   - DELETE `/api/finance/accounts/{id}/`
   - POST `/api/finance/accounts/import_template/` body: `{template_name}`

**Files to Create:**
- `frontend/src/pages/finance/ChartOfAccounts.tsx`
- `frontend/src/components/finance/AccountTree.tsx`
- `frontend/src/components/finance/AccountForm.tsx`
- `frontend/src/components/finance/AccountDetails.tsx`
- Add route in `App.tsx`

**Expected Outcome:** Complete chart of accounts management with hierarchical tree view and templates.

---

##  PROMPT 3.2: Journal Entry System

**Context:** `/api/finance/journal-entries/` endpoint exists but no frontend implementation.

**Task:** Build double-entry journal entry interface with validation.

**Detailed Requirements:**

1. **Create JournalEntries.tsx:**
   - Location: `frontend/src/pages/finance/JournalEntries.tsx`
   - Two-panel layout:
     - Left: List of journal entries
     - Right: Entry details/form

2. **Journal Entry List:**
   - Table columns:
     - Entry number (auto-generated, e.g., JV-2026-001)
     - Date
     - Reference number
     - Description/Narration
     - Total amount
     - Status (DRAFT/POSTED/REVERSED)
     - Created by
     - Actions
   - Filter by:
     - Date range
     - Status
     - Account
     - Created by
   - Sort by date, amount, entry number

3. **Create New Entry:**
   - Form fields:
     - **Date:** Date picker (default today)
     - **Reference Number:** Text input (invoice #, receipt #, etc.)
     - **Description:** Textarea (narration)
     - **Line Items Table:**
       - Account (searchable dropdown with account code and name)
       - Debit amount
       - Credit amount
       - Description (optional per line)
       - Actions (delete row)
   - **Add Line Item** button
   - **Running Balance Display:**
     - Total Debits: XXX
     - Total Credits: XXX
     - Difference: XXX (show in red if not balanced)
   - **Attachment:** Upload supporting documents (bills, receipts)

4. **Validation Rules:**
   - At least 2 line items required
   - Total debits must equal total credits
   - Cannot post if unbalanced
   - Cannot post if no description
   - Account must be active
   - Cannot select same account in both Dr and Cr

5. **Entry Actions:**
   - **Save as Draft:** Save without posting (can edit later)
   - **Post Entry:** Post to ledger (cannot edit after)
   - **Delete:** Only drafts can be deleted
   - **Reverse Entry:** Create reversing entry (for posted entries)
   - **Duplicate:** Copy entry to create similar entry
   - **Print:** Print voucher

6. **Entry Templates:**
   - Pre-defined templates for common transactions:
     - Salary Payment
     - Vendor Payment
     - Fee Receipt
     - Utility Bill Payment
     - Bank Deposit
     - Bank Withdrawal
     - Petty Cash Reimbursement
   - Click template fills in accounts automatically
   - User just enters amounts and description

7. **Entry Details View:**
   - Show complete entry with:
     - Header info (date, reference, status)
     - Line items table
     - Attachments
     - Audit trail (created by, created at, posted by, posted at)
     - Related transactions (if any)

8. **Bulk Operations:**
   - Select multiple draft entries
   - Bulk post
   - Bulk delete

9. **API Integration:**
   - GET `/api/finance/journal-entries/`
   - POST `/api/finance/journal-entries/` body: `{date, reference, description, line_items[], attachments[]}`
   - PATCH `/api/finance/journal-entries/{id}/` (only drafts)
   - POST `/api/finance/journal-entries/{id}/post/`
   - POST `/api/finance/journal-entries/{id}/reverse/`
   - DELETE `/api/finance/journal-entries/{id}/` (only drafts)
   - GET `/api/finance/journal-entries/templates/`

**Files to Create:**
- `frontend/src/pages/finance/JournalEntries.tsx`
- `frontend/src/components/finance/JournalEntryForm.tsx`
- `frontend/src/components/finance/JournalLineItem.tsx`
- `frontend/src/components/finance/EntryTemplates.tsx`
- `frontend/src/components/finance/JournalVoucher.tsx` (printable)

**Expected Outcome:** Complete journal entry system with validation, templates, and posting workflow.

---

##  PROMPT 3.3: Vendor Payment Management

**Context:** `/api/finance/vendor-payments/` endpoint exists but no frontend UI.

**Task:** Build vendor payment tracking and management system.

**Detailed Requirements:**

1. **Create VendorMaster.tsx first:**
   - Location: `frontend/src/pages/finance/VendorMaster.tsx`
   - List all vendors with:
     - Vendor code
     - Vendor name
     - Contact person
     - Phone, email
     - Outstanding balance
     - Total paid (lifetime)
     - Status (Active/Inactive)
   
2. **Vendor CRUD:**
   - Add Vendor: Modal with fields:
     - Vendor name *
     - Vendor code (auto-generate or manual)
     - Contact person
     - Phone, email, address
     - Bank account details (for NEFT)
     - Payment terms (Net 30, Net 60, etc.)
     - Credit limit
     - GST number
     - PAN number
   - Edit/Delete vendors
   - View vendor ledger

3. **Create VendorPayments.tsx:**
   - Location: `frontend/src/pages/finance/VendorPayments.tsx`
   - Payment list table:
     - Payment number
     - Date
     - Vendor name
     - Amount
     - Payment method
     - Status (PENDING/PAID/CANCELLED)
     - Reference (cheque #, UTR #)

4. **Record Payment:**
   - Form:
     - Select vendor (dropdown)
     - Show vendor outstanding balance
     - Payment date
     - Payment method:
       - Cash
       - Cheque (cheque number, bank, date)
       - Bank Transfer (UTR/reference number)
       - UPI (transaction ID)
     - **Invoice Selection:**
       - Show all pending invoices for vendor
       - Checkbox to select invoices to pay
       - Auto-fill amount when invoice selected
       - Can pay partial or full
     - Total payment amount
     - Notes/remarks
     - Upload receipt/proof

5. **Auto Journal Entry:**
   - When payment is recorded, auto-create journal entry:
     - Dr: Vendor Payable account
     - Cr: Bank/Cash account
   - Link payment to journal entry

6. **Vendor Ledger:**
   - Click vendor to see ledger:
     - All invoices (payables)
     - All payments
     - Running balance
     - Date-wise transactions

7. **Vendor Aging Report:**
   - Table showing:
     - Vendor name
     - Current (0-30 days)
     - 31-60 days
     - 61-90 days
     - >90 days
     - Total outstanding
   - Export to Excel
   - Drill-down to see invoices

8. **Payment Reminders:**
   - List of upcoming payments (due in 7 days)
   - Overdue payments
   - Send reminder to procurement team

9. **API Integration:**
   - Vendor Master:
     - GET `/api/finance/vendors/`
     - POST `/api/finance/vendors/`
     - GET `/api/finance/vendors/{id}/ledger/`
   - Payments:
     - GET `/api/finance/vendor-payments/`
     - POST `/api/finance/vendor-payments/` body: `{vendor, date, method, amount, invoices[], reference, proof}`
     - GET `/api/finance/vendor-payments/aging_report/`

**Files to Create:**
- `frontend/src/pages/finance/VendorMaster.tsx`
- `frontend/src/pages/finance/VendorPayments.tsx`
- `frontend/src/components/finance/VendorForm.tsx`
- `frontend/src/components/finance/VendorLedger.tsx`
- `frontend/src/components/finance/AgingReport.tsx`

**Expected Outcome:** Complete vendor management with payment tracking and aging reports.

---

##  PROMPT 3.4: Salary Payment Integration

**Context:** `/api/finance/salary-payments/` endpoint exists but payroll and finance are not integrated.

**Task:** Link payroll cycles to finance module and generate salary journal entries.

**Detailed Requirements:**

1. **Create SalaryPayments.tsx:**
   - Location: `frontend/src/pages/finance/SalaryPayments.tsx`
   
2. **Integration with Payroll:**
   - List of all payroll cycles:
     - Month/Year
     - Total staff
     - Total gross salary
     - Total deductions
     - Total net salary
     - Finance status (NOT_POSTED/POSTED)
   - Filter by year, status

3. **Post to Finance:**
   - For each payroll cycle, button: "Post to Finance"
   - When clicked:
     - Show breakdown:
       - Gross Salary: XXX (Dr to Salary Expense)
       - TDS Deducted: XXX (Cr to TDS Payable)
       - PF Deducted: XXX (Cr to PF Payable)
       - Loan Recovery: XXX (Cr to Loan Receivable)
       - Other Deductions: XXX (Cr to respective accounts)
       - Net Salary: XXX (Cr to Bank/Cash)
     - Confirm button creates journal entry
     - Entry is auto-posted
     - Payroll cycle marked as POSTED

4. **Journal Entry Structure:**
   `
   Dr Salary Expense          500,000
       Cr TDS Payable                     25,000
       Cr PF Payable                      30,000
       Cr Loan Receivable                 10,000
       Cr Bank Account                    435,000
   `

5. **Bank Transfer File:**
   - Generate NEFT/RTGS file for bank upload
   - Format: CSV/Excel with:
     - Employee name
     - Account number
     - IFSC code
     - Amount
     - Reference
   - Download button
   - Support multiple file formats (SBI, ICICI, HDFC formats)

6. **Payment Reconciliation:**
   - Upload bank statement (CSV)
   - Match with salary payments
   - Mark as reconciled
   - Show unmatched items

7. **Salary Register:**
   - Month-wise salary register report
   - Department-wise breakdown
   - Export to Excel

8. **API Integration:**
   - GET `/api/finance/salary-payments/`
   - POST `/api/finance/salary-payments/` body: `{payroll_cycle_id}`
   - POST `/api/finance/salary-payments/{id}/generate_bank_file/` returns file
   - GET `/api/finance/salary-payments/register/?month=&year=`

**Files to Create:**
- `frontend/src/pages/finance/SalaryPayments.tsx`
- `frontend/src/components/finance/SalaryBreakdown.tsx`
- `frontend/src/components/finance/BankFileGenerator.tsx`
- `frontend/src/components/finance/SalaryRegister.tsx`

**Expected Outcome:** Seamless payroll to finance integration with automated journal entries.

---

##  PROMPT 3.5: Financial Reports

**Context:** `/api/finance/reports/` endpoints exist but no frontend implementation.

**Task:** Build comprehensive financial reporting dashboard.

**Detailed Requirements:**

1. **Update FinancialReports.tsx:**
   - Location: `frontend/src/pages/finance/FinancialReports.tsx`
   - Tab-based interface for different reports

2. **Trial Balance Report:**
   - Date range selection (from date, to date)
   - Table showing:
     - Account code
     - Account name
     - Debit balance
     - Credit balance
   - Grand total row
   - Verify total debit = total credit
   - Export to Excel/PDF
   - Print option
   - API: GET `/api/finance/reports/trial_balance/?from_date=&to_date=`

3. **Profit & Loss Statement:**
   - Date range or period (Monthly, Quarterly, Yearly)
   - Two sections:
     - **Income:**
       - All income accounts
       - Subtotal income
     - **Expenses:**
       - All expense accounts
       - Subtotal expenses
     - **Net Profit/Loss:** (Income - Expenses)
   - Comparison with previous period (option)
   - Chart visualization (bar/line chart)
   - Export and print
   - API: GET `/api/finance/reports/profit_loss/?from_date=&to_date=`

4. **Balance Sheet:**
   - As on date selection
   - Two-column format:
     - **Left: Assets**
       - Current Assets
       - Fixed Assets
       - Total Assets
     - **Right: Liabilities & Equity**
       - Current Liabilities
       - Long-term Liabilities
       - Equity
       - Total Liabilities & Equity
   - Must balance (Assets = Liabilities + Equity)
   - Drill-down to account details
   - Export and print
   - API: GET `/api/finance/reports/balance_sheet/?as_on_date=`

5. **Cash Flow Statement:**
   - Date range
   - Three sections:
     - Operating Activities
     - Investing Activities
     - Financing Activities
   - Net cash flow
   - Opening and closing cash balance
   - API: GET `/api/finance/reports/cash_flow/?from_date=&to_date=`

6. **Ledger Report:**
   - Select account from dropdown
   - Date range
   - Table showing:
     - Date
     - Reference/Description
     - Debit
     - Credit
     - Balance (running)
   - Opening balance row
   - Closing balance row
   - Filter by reference/description
   - Export and print
   - API: GET `/api/finance/reports/ledger/?account_id=&from_date=&to_date=`

7. **Day Book:**
   - Select date
   - List all transactions for that day
   - Grouped by entry number
   - Show all debits and credits
   - Daily summary
   - API: GET `/api/finance/reports/day_book/?date=`

8. **Report Features (common to all):**
   - Date range picker with presets (This Month, Last Month, This Quarter, This Year)
   - Export options: Excel, PDF, CSV
   - Print layout optimized
   - Email report (enter email, send)
   - Schedule report (auto-send daily/weekly/monthly)
   - Save report preferences

9. **Visual Analytics:**
   - Income vs Expense trend (line chart)
   - Expense breakdown by category (pie chart)
   - Revenue by source (bar chart)
   - Month-on-month comparison
   - Year-on-year comparison

**Files to Modify/Create:**
- `frontend/src/pages/finance/FinancialReports.tsx` (major update)
- `frontend/src/components/finance/TrialBalance.tsx`
- `frontend/src/components/finance/ProfitLoss.tsx`
- `frontend/src/components/finance/BalanceSheet.tsx`
- `frontend/src/components/finance/CashFlow.tsx`
- `frontend/src/components/finance/LedgerReport.tsx`
- `frontend/src/components/finance/DayBook.tsx`
- `frontend/src/components/finance/ReportExport.tsx`

**Expected Outcome:** Complete financial reporting suite with all standard accounting reports.

---

##  PROMPT 3.6: Finance Dashboard & Budget Management

**Context:** No finance dashboard exists. Budget tracking is not implemented.

**Task:** Create finance dashboard with KPIs and budget management.

**Detailed Requirements:**

1. **Create FinanceDashboard.tsx:**
   - Location: `frontend/src/pages/finance/FinanceDashboard.tsx`

2. **KPI Cards (top row):**
   - **Total Revenue (This Month):**
     - Amount in large font
     - Percentage change from last month ()
     - Sparkline showing daily trend
   - **Total Expenses (This Month):**
     - Amount
     - Percentage of revenue
     - Trend
   - **Net Profit/Loss:**
     - Amount (green if profit, red if loss)
     - Profit margin %
   - **Outstanding Receivables:**
     - Total fee pending
     - Number of defaulters
   - **Outstanding Payables:**
     - Total vendor pending
     - Number of pending bills
   - **Bank Balance:**
     - Total across all bank accounts
     - Cash in hand

3. **Charts & Graphs:**
   - **Cash Flow Trend (6 months):**
     - Line chart showing monthly cash in vs cash out
   - **Expense Breakdown:**
     - Pie chart by category (Salary, Utilities, Supplies, etc.)
   - **Revenue Streams:**
     - Bar chart (Fees, Donations, Grants, Other)
   - **Budget vs Actual:**
     - Horizontal bar chart for each department
     - Green if under budget, red if over

4. **Recent Transactions:**
   - Last 10 transactions
   - Quick view with date, description, amount
   - Click to view details

5. **Alerts & Notifications:**
   - Low bank balance warning
   - Budget exceeded alerts
   - Pending approvals
   - Upcoming vendor payments

6. **Create BudgetManagement.tsx:**
   - Location: `frontend/src/pages/finance/BudgetManagement.tsx`
   
7. **Budget Creation:**
   - Select financial year
   - Create budget by:
     - Department (Admin, Academic, Sports, etc.)
     - Category (Salary, Utilities, Marketing, etc.)
   - Enter budgeted amount for each category
   - Quarterly breakdown option

8. **Budget Tracking:**
   - Table showing:
     - Category
     - Budgeted amount
     - Actual spent (YTD)
     - Variance (amount and %)
     - % utilized
     - Projected year-end spend
   - Color coding:
     - Green: <80% utilized
     - Yellow: 80-95%
     - Red: >95%

9. **Budget Reports:**
   - Budget vs Actual report
   - Department-wise budget utilization
   - Category-wise analysis
   - Forecast vs actual

10. **Budget Approval Workflow:**
    - Submit budget for approval
    - Approval chain (HOD  Principal  Management)
    - Track approval status
    - Comments/feedback

11. **API Integration:**
    - Dashboard:
      - GET `/api/finance/dashboard/kpis/`
      - GET `/api/finance/dashboard/cash_flow_trend/`
      - GET `/api/finance/dashboard/expense_breakdown/`
    - Budget:
      - GET `/api/finance/budgets/`
      - POST `/api/finance/budgets/`
      - GET `/api/finance/budgets/{id}/variance_report/`
      - POST `/api/finance/budgets/{id}/submit_for_approval/`

**Files to Create:**
- `frontend/src/pages/finance/FinanceDashboard.tsx`
- `frontend/src/pages/finance/BudgetManagement.tsx`
- `frontend/src/components/finance/KPICard.tsx`
- `frontend/src/components/finance/CashFlowChart.tsx`
- `frontend/src/components/finance/BudgetForm.tsx`
- `frontend/src/components/finance/BudgetVariance.tsx`

**Expected Outcome:** Comprehensive finance dashboard with real-time KPIs and budget tracking.

---

##  PROMPT 3.7: Bank Reconciliation

**Context:** No bank reconciliation feature exists.

**Task:** Build bank reconciliation module.

**Detailed Requirements:**

1. **Create BankReconciliation.tsx:**
   - Location: `frontend/src/pages/finance/BankReconciliation.tsx`

2. **Bank Account Setup:**
   - List of bank accounts
   - Add/edit bank account details
   - Opening balance

3. **Upload Bank Statement:**
   - CSV/Excel file upload
   - Map columns (date, description, debit, credit, balance)
   - Preview imported data
   - Save statement entries

4. **Matching Process:**
   - Two-panel view:
     - Left: Bank statement entries (unmatched)
     - Right: Book entries (unmatched)
   - Auto-match by:
     - Date and amount (exact match)
     - Date range and amount (1 day)
   - Manual match: drag and drop or select + match button
   - Mark as reconciled

5. **Reconciliation Summary:**
   - Balance as per bank statement
   - Balance as per books
   - Outstanding deposits (in books, not in bank)
   - Outstanding withdrawals (in books, not in bank)
   - Bank charges not recorded
   - Reconciled balance

6. **Unreconciled Items:**
   - List of items not matched
   - Actions:
     - Create journal entry for bank charges
     - Mark as error (to be investigated)
     - Ignore (if irrelevant)

7. **Reconciliation Report:**
   - Date-wise reconciliation history
   - Export to PDF

**Files to Create:**
- `frontend/src/pages/finance/BankReconciliation.tsx`
- `frontend/src/components/finance/StatementUpload.tsx`
- `frontend/src/components/finance/ReconciliationMatch.tsx`

**Expected Outcome:** Complete bank reconciliation with auto-matching and reporting.

---

Phase 3 complete. Ready for Phase 4?
