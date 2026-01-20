# Export Implementation Templates

## 📋 Copy-Paste Templates for All Modules

This file contains ready-to-use export implementations for all major modules in nucleIQ.

---

## 1. Staff Management

### Staff List (`src/pages/staff/StaffList.tsx`)

```typescript
import ExportButton from '@/components/common/ExportButton';
import { ExportColumn } from '@/utils/exportUtils';

const exportColumns: ExportColumn[] = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'full_name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  {
    key: 'joining_date',
    label: 'Joining Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'salary',
    label: 'Salary (₹)',
    format: (value) => Number(value).toLocaleString('en-IN')
  },
  {
    key: 'is_active',
    label: 'Status',
    format: (value) => value ? 'Active' : 'Inactive'
  }
];

// In JSX
<ExportButton
  data={filteredStaff}
  filename="staff_list"
  title="Staff List"
  columns={exportColumns}
  variant="outline"
/>
```

### Staff Attendance (`src/pages/staff/AttendanceReport.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'full_name', label: 'Name' },
  { key: 'department', label: 'Department' },
  {
    key: 'date',
    label: 'Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'check_in', label: 'Check In' },
  { key: 'check_out', label: 'Check Out' },
  { key: 'status', label: 'Status' },
  { key: 'working_hours', label: 'Working Hours' }
];

<ExportButton
  data={attendanceRecords}
  filename={`staff_attendance_${startDate}_to_${endDate}`}
  title="Staff Attendance Report"
  columns={exportColumns}
  variant="outline"
/>
```

### Leave Management (`src/pages/staff/LeaveManagement.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'employee_name', label: 'Employee Name' },
  { key: 'leave_type', label: 'Leave Type' },
  {
    key: 'start_date',
    label: 'Start Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'end_date',
    label: 'End Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'days', label: 'Days' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'approved_by', label: 'Approved By' }
];

<ExportButton
  data={leaveRequests}
  filename="leave_requests"
  title="Leave Requests Report"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 2. Library Management

### Books List (`src/pages/library/BooksList.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'isbn', label: 'ISBN' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'category', label: 'Category' },
  { key: 'publisher', label: 'Publisher' },
  {
    key: 'publication_year',
    label: 'Year',
    format: (value) => String(value)
  },
  { key: 'total_copies', label: 'Total Copies' },
  { key: 'available_copies', label: 'Available' },
  {
    key: 'price',
    label: 'Price (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'location', label: 'Location' }
];

<ExportButton
  data={filteredBooks}
  filename="library_books"
  title="Library Books Catalog"
  columns={exportColumns}
  variant="outline"
/>
```

### Issued Books (`src/pages/library/IssuedBooks.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'book_title', label: 'Book Title' },
  { key: 'isbn', label: 'ISBN' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'member_id', label: 'Member ID' },
  {
    key: 'issue_date',
    label: 'Issue Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'due_date',
    label: 'Due Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'return_date',
    label: 'Return Date',
    format: (value) => value ? new Date(value).toLocaleDateString('en-IN') : 'Not Returned'
  },
  { key: 'status', label: 'Status' },
  {
    key: 'fine_amount',
    label: 'Fine (₹)',
    format: (value) => value ? Number(value).toFixed(2) : '0.00'
  }
];

<ExportButton
  data={issuedBooks}
  filename="issued_books"
  title="Issued Books Report"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 3. Inventory Management

### Items List (`src/pages/inventory/ItemsList.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'item_code', label: 'Item Code' },
  { key: 'name', label: 'Item Name' },
  { key: 'category', label: 'Category' },
  { key: 'unit', label: 'Unit' },
  { key: 'current_stock', label: 'Current Stock' },
  { key: 'reorder_level', label: 'Reorder Level' },
  {
    key: 'unit_price',
    label: 'Unit Price (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'total_value',
    label: 'Total Value (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'location', label: 'Location' },
  {
    key: 'last_updated',
    label: 'Last Updated',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  }
];

<ExportButton
  data={inventoryItems}
  filename="inventory_items"
  title="Inventory Items List"
  columns={exportColumns}
  variant="outline"
/>
```

### Purchase Orders (`src/pages/inventory/PurchaseOrders.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'po_number', label: 'PO Number' },
  { key: 'vendor_name', label: 'Vendor' },
  {
    key: 'order_date',
    label: 'Order Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'expected_delivery',
    label: 'Expected Delivery',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'total_amount',
    label: 'Total Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'status', label: 'Status' },
  { key: 'items_count', label: 'Items' },
  { key: 'created_by', label: 'Created By' }
];

<ExportButton
  data={purchaseOrders}
  filename="purchase_orders"
  title="Purchase Orders Report"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 4. Exam Results

### Results List (`src/pages/exams/ResultsList.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission No' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'exam_name', label: 'Exam' },
  { key: 'subject', label: 'Subject' },
  { key: 'marks_obtained', label: 'Marks Obtained' },
  { key: 'total_marks', label: 'Total Marks' },
  {
    key: 'percentage',
    label: 'Percentage',
    format: (value) => `${Number(value).toFixed(2)}%`
  },
  { key: 'grade', label: 'Grade' },
  { key: 'rank', label: 'Rank' }
];

<ExportButton
  data={examResults}
  filename={`exam_results_${examName}`}
  title={`Exam Results - ${examName}`}
  columns={exportColumns}
  variant="outline"
/>
```

### Grade Sheet (`src/pages/exams/GradeSheet.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission No' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'roll_number', label: 'Roll No' },
  ...subjects.map(subject => ({
    key: `marks_${subject.id}`,
    label: subject.name,
    format: (value: any) => value || '-'
  })),
  { key: 'total_marks', label: 'Total' },
  {
    key: 'percentage',
    label: 'Percentage',
    format: (value) => `${Number(value).toFixed(2)}%`
  },
  { key: 'grade', label: 'Grade' },
  { key: 'result', label: 'Result' }
];

<ExportButton
  data={gradeSheetData}
  filename={`grade_sheet_${className}_${examName}`}
  title={`Grade Sheet - ${className} - ${examName}`}
  columns={exportColumns}
  variant="outline"
/>
```

---

## 5. Transport Management

### Routes List (`src/pages/transport/RoutesList.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'route_number', label: 'Route No' },
  { key: 'route_name', label: 'Route Name' },
  { key: 'vehicle_number', label: 'Vehicle No' },
  { key: 'driver_name', label: 'Driver' },
  { key: 'driver_phone', label: 'Driver Phone' },
  { key: 'total_students', label: 'Students' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  {
    key: 'distance',
    label: 'Distance (km)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'monthly_fee',
    label: 'Monthly Fee (₹)',
    format: (value) => Number(value).toFixed(2)
  }
];

<ExportButton
  data={routes}
  filename="transport_routes"
  title="Transport Routes List"
  columns={exportColumns}
  variant="outline"
/>
```

### Student Allocation (`src/pages/transport/StudentAllocation.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission No' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'class', label: 'Class' },
  { key: 'route_number', label: 'Route No' },
  { key: 'route_name', label: 'Route Name' },
  { key: 'pickup_point', label: 'Pickup Point' },
  { key: 'pickup_time', label: 'Pickup Time' },
  { key: 'drop_point', label: 'Drop Point' },
  { key: 'drop_time', label: 'Drop Time' },
  {
    key: 'monthly_fee',
    label: 'Monthly Fee (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'parent_phone', label: 'Parent Phone' }
];

<ExportButton
  data={studentAllocations}
  filename="transport_student_allocation"
  title="Transport Student Allocation"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 6. Hostel Management

### Room Allocation (`src/pages/hostel/RoomAllocation.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'room_number', label: 'Room No' },
  { key: 'block', label: 'Block' },
  { key: 'floor', label: 'Floor' },
  { key: 'room_type', label: 'Room Type' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'occupied', label: 'Occupied' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'admission_number', label: 'Admission No' },
  { key: 'class', label: 'Class' },
  {
    key: 'allocation_date',
    label: 'Allocation Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'monthly_fee',
    label: 'Monthly Fee (₹)',
    format: (value) => Number(value).toFixed(2)
  }
];

<ExportButton
  data={roomAllocations}
  filename="hostel_room_allocation"
  title="Hostel Room Allocation"
  columns={exportColumns}
  variant="outline"
/>
```

### Mess Management (`src/pages/hostel/MessManagement.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'student_name', label: 'Student Name' },
  { key: 'admission_number', label: 'Admission No' },
  { key: 'room_number', label: 'Room No' },
  { key: 'meal_plan', label: 'Meal Plan' },
  { key: 'dietary_preference', label: 'Dietary Preference' },
  {
    key: 'monthly_fee',
    label: 'Monthly Fee (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'registration_date',
    label: 'Registration Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'status', label: 'Status' }
];

<ExportButton
  data={messRegistrations}
  filename="hostel_mess_registrations"
  title="Hostel Mess Registrations"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 7. Financial Reports

### Income/Expense Report (`src/pages/finance/IncomeExpense.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  {
    key: 'date',
    label: 'Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'transaction_type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'description', label: 'Description' },
  {
    key: 'amount',
    label: 'Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'reference_number', label: 'Reference' },
  { key: 'created_by', label: 'Created By' }
];

<ExportButton
  data={transactions}
  filename={`income_expense_${startDate}_to_${endDate}`}
  title="Income & Expense Report"
  columns={exportColumns}
  variant="outline"
/>
```

### Vendor Payments (`src/pages/finance/VendorPayments.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'vendor_name', label: 'Vendor Name' },
  { key: 'invoice_number', label: 'Invoice No' },
  {
    key: 'invoice_date',
    label: 'Invoice Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'due_date',
    label: 'Due Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'invoice_amount',
    label: 'Invoice Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'paid_amount',
    label: 'Paid Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'balance',
    label: 'Balance (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'status', label: 'Status' }
];

<ExportButton
  data={vendorPayments}
  filename="vendor_payments"
  title="Vendor Payments Report"
  columns={exportColumns}
  variant="outline"
/>
```

### Salary Payments (`src/pages/finance/SalaryPayments.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'employee_id', label: 'Employee ID' },
  { key: 'employee_name', label: 'Employee Name' },
  { key: 'department', label: 'Department' },
  { key: 'designation', label: 'Designation' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
  {
    key: 'basic_salary',
    label: 'Basic Salary (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'allowances',
    label: 'Allowances (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'deductions',
    label: 'Deductions (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'net_salary',
    label: 'Net Salary (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'payment_date',
    label: 'Payment Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'status', label: 'Status' }
];

<ExportButton
  data={salaryPayments}
  filename={`salary_payments_${month}_${year}`}
  title={`Salary Payments - ${month} ${year}`}
  columns={exportColumns}
  variant="outline"
/>
```

---

## 8. CRM & Admissions

### Enquiries List (`src/pages/crm/EnquiriesList.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'enquiry_number', label: 'Enquiry No' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'parent_name', label: 'Parent Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'class_interested', label: 'Class Interested' },
  {
    key: 'enquiry_date',
    label: 'Enquiry Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'assigned_to', label: 'Assigned To' },
  {
    key: 'follow_up_date',
    label: 'Follow-up Date',
    format: (value) => value ? new Date(value).toLocaleDateString('en-IN') : '-'
  }
];

<ExportButton
  data={enquiries}
  filename="admission_enquiries"
  title="Admission Enquiries"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 9. Timetable

### Class Timetable (`src/pages/timetable/ClassTimetable.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'class_name', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'day', label: 'Day' },
  { key: 'period', label: 'Period' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  { key: 'subject', label: 'Subject' },
  { key: 'teacher_name', label: 'Teacher' },
  { key: 'room_number', label: 'Room' }
];

<ExportButton
  data={timetableData}
  filename={`timetable_${className}_${section}`}
  title={`Timetable - ${className} ${section}`}
  columns={exportColumns}
  variant="outline"
/>
```

---

## 10. Security

### Visitor Log (`src/pages/security/VisitorLog.tsx`)

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'visitor_name', label: 'Visitor Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'purpose', label: 'Purpose' },
  { key: 'person_to_meet', label: 'Person to Meet' },
  { key: 'department', label: 'Department' },
  {
    key: 'check_in',
    label: 'Check In',
    format: (value) => new Date(value).toLocaleString('en-IN')
  },
  {
    key: 'check_out',
    label: 'Check Out',
    format: (value) => value ? new Date(value).toLocaleString('en-IN') : 'Not Checked Out'
  },
  { key: 'id_proof_type', label: 'ID Proof' },
  { key: 'id_proof_number', label: 'ID Number' },
  { key: 'status', label: 'Status' }
];

<ExportButton
  data={visitorLogs}
  filename={`visitor_log_${new Date().toISOString().split('T')[0]}`}
  title="Visitor Log"
  columns={exportColumns}
  variant="outline"
/>
```

---

## Usage Instructions

1. **Copy the relevant template** for your module
2. **Paste into your component file**
3. **Adjust column keys** to match your data structure
4. **Customize labels** as needed
5. **Add/remove columns** based on requirements
6. **Test with sample data**

## Notes

- All templates use Indian date format (`en-IN`)
- Currency is formatted with ₹ symbol
- Boolean values are converted to Active/Inactive
- Dates are properly formatted
- Numbers are formatted with 2 decimal places

---

**Last Updated:** January 4, 2026  
**Version:** 1.0.0
