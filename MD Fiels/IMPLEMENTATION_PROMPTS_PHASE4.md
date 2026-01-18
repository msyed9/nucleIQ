#  NucleiQ Implementation Prompts - Phase 4: Inventory Management

**Purpose:** Build complete inventory module (currently has backend but NO frontend)

---

##  PROMPT 4.1: Inventory Items & Stock Management

**Context:** Backend has full inventory API (`/api/inventory/items/`, `/api/inventory/transactions/`, `/api/inventory/orders/`) but NO frontend pages exist at all.

**Task:** Build complete inventory management system from scratch.

**Detailed Requirements:**

1. **Create InventoryDashboard.tsx:**
   - Location: `frontend/src/pages/inventory/InventoryDashboard.tsx`
   - Overview cards:
     - Total items in stock
     - Low stock items count (alert icon)
     - Out of stock items
     - Total inventory value
     - Pending orders count

2. **Create ItemMaster.tsx:**
   - Location: `frontend/src/pages/inventory/ItemMaster.tsx`
   - Grid/table view of all inventory items
   - Columns:
     - Item code
     - Item name
     - Category
     - Unit (Nos, Kg, Ltr, Box, etc.)
     - Current stock
     - Min stock level (reorder point)
     - Max stock level
     - Unit price
     - Total value
     - Status (Active/Inactive)
     - Actions

3. **Item Categories:**
   - Stationery
   - Lab Equipment
   - Sports Equipment
   - Cleaning Supplies
   - IT Equipment
   - Furniture
   - Books & Learning Materials
   - Uniforms
   - Food Items (if canteen)
   - Maintenance Supplies

4. **Add/Edit Item:**
   - Modal form with fields:
     - **Basic Info:**
       - Item code (auto-generate or manual)
       - Item name *
       - Category * (dropdown)
       - Sub-category
       - Description
     - **Stock Details:**
       - Unit of measurement *
       - Current stock (for new item)
       - Minimum stock level (reorder point) *
       - Maximum stock level
     - **Pricing:**
       - Unit cost/price
     - **Other:**
       - Location (shelf/rack)
       - Barcode
       - Image upload
       - Is active
       - Is consumable (Yes/No)

5. **Stock Levels & Alerts:**
   - Color coding:
     - Green: Stock > Min level
     - Yellow: Stock = Min level (reorder now)
     - Red: Stock < Min level (critical)
     - Grey: Out of stock
   - Low stock alert badge
   - Auto-generate purchase request for low stock items

6. **Search & Filters:**
   - Search by item code, name
   - Filter by category
   - Filter by stock status (In Stock, Low Stock, Out of Stock)
   - Filter by location

7. **Bulk Operations:**
   - Bulk upload items (CSV/Excel)
   - Bulk price update
   - Bulk status change
   - Export item list

8. **API Integration:**
   - GET `/api/inventory/items/`
   - POST `/api/inventory/items/`
   - PATCH `/api/inventory/items/{id}/`
   - DELETE `/api/inventory/items/{id}/`
   - GET `/api/inventory/items/low_stock/`
   - POST `/api/inventory/items/bulk_import/`

**Files to Create:**
- `frontend/src/pages/inventory/InventoryDashboard.tsx`
- `frontend/src/pages/inventory/ItemMaster.tsx`
- `frontend/src/components/inventory/ItemForm.tsx`
- `frontend/src/components/inventory/ItemCard.tsx`
- Add routes in `App.tsx`

**Expected Outcome:** Complete item master with stock tracking and alerts.

---

##  PROMPT 4.2: Stock Transactions & Movements

**Context:** `/api/inventory/transactions/` endpoint exists but no UI to record stock movements.

**Task:** Build stock transaction recording system.

**Detailed Requirements:**

1. **Create StockTransactions.tsx:**
   - Location: `frontend/src/pages/inventory/StockTransactions.tsx`
   - List all stock transactions
   - Table columns:
     - Transaction number
     - Date
     - Item name
     - Transaction type (IN/OUT/ADJUST)
     - Quantity
     - From location
     - To location
     - Reason/Description
     - Performed by
     - Attachment

2. **Transaction Types:**
   - **Stock In:**
     - Purchase receipt
     - Return from department
     - Transfer in
     - Opening stock
   - **Stock Out:**
     - Issue to department
     - Damaged/expired
     - Lost/stolen
     - Transfer out
     - Student/staff issue
   - **Stock Adjustment:**
     - Physical count correction
     - Reconciliation

3. **Record Transaction:**
   - Form with transaction type selection (tabs or dropdown)
   
   **A. Stock In Form:**
   - Item selection (searchable dropdown)
   - Quantity
   - From (supplier/location)
   - Unit cost (optional)
   - Purchase order reference
   - Invoice/bill number
   - Date
   - Notes
   - Upload invoice/receipt
   
   **B. Stock Out Form:**
   - Item selection
   - Quantity
   - Issued to (department/person)
   - Purpose/reason
   - Requisition number
   - Return expected? (Yes/No + return date)
   - Date
   - Notes
   - Signature/approval
   
   **C. Stock Adjustment Form:**
   - Item selection
   - Current stock (auto-filled)
   - Physical count
   - Difference (auto-calculated)
   - Reason for difference
   - Approved by
   - Date

4. **Validation:**
   - Stock out cannot exceed available stock
   - Quantity must be > 0
   - Future dates not allowed
   - Approval required for adjustments > threshold

5. **Batch/Serial Number Tracking:**
   - For items with batch tracking
   - Record batch number on stock in
   - Track batch-wise stock
   - FIFO/LIFO/FEFO tracking

6. **Stock Reservation:**
   - Reserve stock for specific purpose/event
   - Prevent issuing reserved stock
   - Release reservation

7. **Transaction History:**
   - Item-wise transaction history
   - Date-wise transactions
   - User-wise transactions
   - Export to Excel

8. **API Integration:**
   - GET `/api/inventory/transactions/`
   - POST `/api/inventory/transactions/` body: `{item, type, quantity, from, to, reason, attachments}`
   - GET `/api/inventory/transactions/?item={id}` (item history)
   - GET `/api/inventory/items/{id}/stock_card/` (complete stock card)

**Files to Create:**
- `frontend/src/pages/inventory/StockTransactions.tsx`
- `frontend/src/components/inventory/StockInForm.tsx`
- `frontend/src/components/inventory/StockOutForm.tsx`
- `frontend/src/components/inventory/StockAdjustForm.tsx`
- `frontend/src/components/inventory/StockCard.tsx`

**Expected Outcome:** Complete stock movement tracking with history and validation.

---

##  PROMPT 4.3: Purchase Orders & Procurement

**Context:** `/api/inventory/orders/` endpoint exists but no UI for purchase management.

**Task:** Build purchase order management system.

**Detailed Requirements:**

1. **Update PurchaseOrders.tsx:**
   - Location: `frontend/src/pages/inventory/PurchaseOrders.tsx`
   - List all purchase orders
   - Status badges:
     - DRAFT (grey)
     - PENDING_APPROVAL (yellow)
     - APPROVED (blue)
     - ORDERED (purple)
     - PARTIALLY_RECEIVED (orange)
     - RECEIVED (green)
     - CANCELLED (red)

2. **PO List Table:**
   - Columns:
     - PO number (auto-generated)
     - Date
     - Vendor name
     - Total amount
     - Status
     - Delivery date
     - Created by
     - Actions (View, Edit, Approve, Receive, Cancel)

3. **Create Purchase Order:**
   - Multi-step form:
   
   **Step 1: Basic Info**
   - Vendor selection (dropdown with search)
   - Delivery location
   - Expected delivery date
   - Payment terms
   - Reference/Requisition number
   
   **Step 2: Add Items**
   - Table to add line items:
     - Item (searchable dropdown)
     - Description
     - Quantity
     - Unit price
     - Tax %
     - Total
     - Delete row
   - Add row button
   - Show subtotal, tax, grand total
   
   **Step 3: Terms & Notes**
   - Delivery instructions
   - Payment terms
   - Special notes
   - Attach requisition/quote
   
   **Step 4: Review & Submit**
   - Summary of PO
   - Save as draft OR Submit for approval

4. **PO Approval Workflow:**
   - Submit for approval
   - Approver gets notification
   - Approver can:
     - Approve (PO status  APPROVED)
     - Reject with reason
     - Request modification
   - Once approved, send to vendor (email/print)

5. **Receive Stock (GRN - Goods Receipt Note):**
   - Select PO
   - Show all items in PO
   - For each item:
     - Ordered quantity
     - Already received
     - Receiving now (input)
     - Pending
   - If partial receipt, PO status  PARTIALLY_RECEIVED
   - If full receipt, PO status  RECEIVED
   - Auto-create stock IN transaction for received items

6. **PO Reports:**
   - Pending POs
   - POs by vendor
   - POs by date range
   - Received vs Ordered analysis

7. **Integration:**
   - Link with vendor payments (finance module)
   - Link with low stock alerts (auto-generate PO for low stock items)

8. **API Integration:**
   - GET `/api/inventory/orders/`
   - POST `/api/inventory/orders/` body: `{vendor, delivery_date, items[], terms, notes}`
   - PATCH `/api/inventory/orders/{id}/`
   - POST `/api/inventory/orders/{id}/approve/`
   - POST `/api/inventory/orders/{id}/receive/` body: `{items[{item, quantity_received}]}`
   - POST `/api/inventory/orders/{id}/cancel/` body: `{reason}`
   - GET `/api/inventory/orders/{id}/print/` (printable PO)

**Files to Modify/Create:**
- `frontend/src/pages/inventory/PurchaseOrders.tsx` (enhance)
- `frontend/src/components/inventory/POForm.tsx`
- `frontend/src/components/inventory/POApproval.tsx`
- `frontend/src/components/inventory/GoodsReceipt.tsx`
- `frontend/src/components/inventory/POPrint.tsx`

**Expected Outcome:** Complete purchase order workflow with approval and receipt.

---

##  PROMPT 4.4: Vendor Management (Inventory)

**Context:** Vendor master is in finance module but inventory needs own vendor tracking.

**Task:** Create vendor management for inventory procurement.

**Detailed Requirements:**

1. **Update VendorManagement.tsx:**
   - Location: `frontend/src/pages/inventory/VendorManagement.tsx`
   - List all vendors with:
     - Vendor code
     - Company name
     - Contact person
     - Phone, email
     - Category (what they supply)
     - Rating (1-5 stars)
     - Total orders
     - Total value
     - Status

2. **Add/Edit Vendor:**
   - Form fields:
     - Company name *
     - Vendor code
     - Contact person name *
     - Phone *, Email *
     - Address (full address)
     - City, State, PIN
     - GST number
     - PAN number
     - Categories supplied (multi-select)
     - Payment terms
     - Bank details
     - Credit limit
     - Lead time (days)
     - Website
     - Notes

3. **Vendor Rating System:**
   - Rate vendor on:
     - Quality (1-5)
     - Delivery timeliness (1-5)
     - Pricing (1-5)
     - Service (1-5)
   - Overall rating (average)
   - Reviews/comments

4. **Vendor Performance:**
   - Total POs placed
   - On-time delivery %
   - Quality acceptance %
   - Average delivery time
   - Total value of orders

5. **Vendor Quotation:**
   - Request quotation
   - Upload quotation file
   - Compare quotations
   - Select best quote

6. **Vendor Documents:**
   - Upload documents:
     - GST certificate
     - PAN card
     - Trade license
     - Catalog
     - Price list
     - Contract agreement

7. **API Integration:**
   - GET `/api/inventory/vendors/`
   - POST `/api/inventory/vendors/`
   - PATCH `/api/inventory/vendors/{id}/`
   - POST `/api/inventory/vendors/{id}/rate/` body: `{quality, delivery, pricing, service, comments}`
   - GET `/api/inventory/vendors/{id}/performance/`

**Files to Create:**
- `frontend/src/pages/inventory/VendorManagement.tsx` (update)
- `frontend/src/components/inventory/VendorForm.tsx`
- `frontend/src/components/inventory/VendorRating.tsx`
- `frontend/src/components/inventory/VendorPerformance.tsx`

**Expected Outcome:** Comprehensive vendor management with ratings and performance tracking.

---

##  PROMPT 4.5: Stock Adjustment & Physical Verification

**Context:** No UI exists for physical stock verification and reconciliation.

**Task:** Build stock adjustment and verification module.

**Detailed Requirements:**

1. **Update StockAdjustment.tsx:**
   - Location: `frontend/src/pages/inventory/StockAdjustment.tsx`

2. **Physical Stock Verification:**
   - Create verification cycle:
     - Name (e.g., 'Annual Stock Verification 2026')
     - Date
     - Location/Department
     - Verifier team
     - Items to verify (select all or by category)
   
3. **Verification Process:**
   - Show list of items to verify
   - For each item:
     - Item name
     - System stock
     - Physical count (input field)
     - Difference (auto-calculated)
     - Remarks
     - Photo (optional)
   - Color code differences:
     - Green: Match
     - Red: Shortage
     - Blue: Excess
   
4. **Mobile-Friendly:**
   - Optimize for tablet/mobile
   - Barcode scanner support
   - Voice input for quantities

5. **Variance Analysis:**
   - Summary after verification:
     - Total items verified
     - Items with variance
     - Total shortage value
     - Total excess value
     - Items to write off
   
6. **Adjustment Approval:**
   - Require approval for variances > threshold
   - Approval workflow
   - Reason codes:
     - Damaged
     - Expired
     - Lost
     - Stolen
     - Counting error
     - Other (specify)

7. **Auto-Create Adjustments:**
   - After approval, auto-create adjustment transactions
   - Update system stock to match physical count
   - Generate adjustment report

8. **Write-Off Management:**
   - List items to write off
   - Approval required
   - Maintain write-off register
   - Financial impact (reduce asset value)

9. **Cycle Counting:**
   - Schedule regular cycle counts (weekly/monthly)
   - ABC analysis (count A items more frequently)
   - Track accuracy rate

10. **API Integration:**
    - POST `/api/inventory/verifications/` body: `{name, date, location, items[]}`
    - POST `/api/inventory/verifications/{id}/record_count/` body: `{items[{item, physical_count, remarks}]}`
    - GET `/api/inventory/verifications/{id}/variance_report/`
    - POST `/api/inventory/verifications/{id}/approve_adjustments/`

**Files to Create:**
- `frontend/src/pages/inventory/StockAdjustment.tsx` (update)
- `frontend/src/components/inventory/VerificationForm.tsx`
- `frontend/src/components/inventory/VarianceReport.tsx`
- `frontend/src/components/inventory/WriteOffManager.tsx`

**Expected Outcome:** Complete stock verification and adjustment system with approval workflow.

---

##  PROMPT 4.6: Inventory Reports & Analytics

**Context:** No inventory reporting exists.

**Task:** Build comprehensive inventory reports.

**Detailed Requirements:**

1. **Create InventoryReports.tsx:**
   - Location: `frontend/src/pages/inventory/InventoryReports.tsx`

2. **Report Types:**

   **A. Stock Summary Report:**
   - All items with current stock
   - Valuation (quantity � unit price)
   - Total inventory value
   - By category breakdown
   
   **B. Stock Movement Report:**
   - Date range
   - All IN and OUT transactions
   - Opening stock, receipts, issues, closing stock
   - Item-wise or summary
   
   **C. Low Stock Report:**
   - Items below minimum level
   - Reorder quantity suggested
   - Last purchase details
   - Export to create PO
   
   **D. Inventory Aging Report:**
   - Items not moved for X days
   - Slow-moving items
   - Dead stock identification
   
   **E. ABC Analysis:**
   - Classify items:
     - A: High value (top 20% items, 80% value)
     - B: Medium value
     - C: Low value
   - Helps in cycle counting frequency
   
   **F. Consumption Report:**
   - Department-wise consumption
   - Item-wise consumption
   - Time period comparison
   
   **G. Purchase Analysis:**
   - Vendor-wise purchases
   - Category-wise purchases
   - Price trend analysis
   
   **H. Stock Valuation Report:**
   - Total stock value
   - Category-wise value
   - FIFO/LIFO/Weighted average methods

3. **Report Features:**
   - Date range selection
   - Export to Excel/PDF
   - Print option
   - Email report
   - Schedule automatic reports
   - Drill-down capability
   - Visual charts and graphs

4. **Dashboard Integration:**
   - Add inventory widgets to main dashboard
   - Stock value widget
   - Low stock alert widget
   - Recent transactions widget

5. **API Endpoints:**
   - GET `/api/inventory/reports/stock_summary/`
   - GET `/api/inventory/reports/movement/?from_date=&to_date=`
   - GET `/api/inventory/reports/low_stock/`
   - GET `/api/inventory/reports/aging/`
   - GET `/api/inventory/reports/abc_analysis/`
   - GET `/api/inventory/reports/consumption/?from_date=&to_date=`

**Files to Create:**
- `frontend/src/pages/inventory/InventoryReports.tsx`
- `frontend/src/components/inventory/StockSummary.tsx`
- `frontend/src/components/inventory/MovementReport.tsx`
- `frontend/src/components/inventory/ABCAnalysis.tsx`

**Expected Outcome:** Comprehensive inventory reporting with analytics and insights.

---

Phase 4 complete. Ready for Phase 5 (Hostel Management)?
