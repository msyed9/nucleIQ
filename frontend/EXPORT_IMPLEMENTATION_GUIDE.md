# Export Functionality Implementation Guide

## Overview

This document provides a comprehensive guide for implementing export functionality across all modules in the nucleIQ ERP system. The export system supports industry-standard formats including Excel (.xlsx), CSV, PDF, JSON, Copy to Clipboard, and Print.

## Architecture

### Core Components

1. **Export Utilities** (`src/utils/exportUtils.ts`)
   - Core export functions for all formats
   - Format conversion and data transformation
   - File generation and download handling

2. **ExportButton Component** (`src/components/common/ExportButton.tsx`)
   - Reusable dropdown button with all export options
   - Toast notifications for user feedback
   - Loading states and error handling

3. **Styling** (`src/components/common/ExportButton.css`)
   - Modern, accessible design
   - Smooth animations and transitions
   - Responsive layout

## Dependencies

```json
{
  "xlsx": "^0.18.5",           // Excel file generation
  "jspdf": "^2.5.2",           // PDF generation
  "jspdf-autotable": "^3.8.4"  // PDF table formatting
}
```

## Installation

```bash
cd frontend
npm install
```

## Usage

### Basic Implementation

```typescript
import ExportButton from '@/components/common/ExportButton';
import { ExportColumn } from '@/utils/exportUtils';

// Define export columns
const exportColumns: ExportColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'date',
    label: 'Date',
    format: (value) => new Date(value).toLocaleDateString()
  }
];

// Use in component
<ExportButton
  data={filteredData}
  filename="my_export"
  title="My Export Report"
  columns={exportColumns}
  variant="outline"
/>
```

### Advanced Configuration

```typescript
<ExportButton
  data={students}
  filename="students_list"
  title="Students List"
  columns={exportColumns}
  variant="primary"           // primary | secondary | outline
  size="medium"               // small | medium | large
  disabled={loading}
  onExportStart={() => console.log('Export started')}
  onExportComplete={(format) => console.log(`Exported as ${format}`)}
  onExportError={(error) => console.error(error)}
/>
```

## Export Column Configuration

### Basic Column

```typescript
{
  key: 'student_name',
  label: 'Student Name'
}
```

### Column with Formatting

```typescript
{
  key: 'date_of_birth',
  label: 'Date of Birth',
  format: (value) => new Date(value).toLocaleDateString('en-IN')
}
```

### Column with Custom Width (PDF only)

```typescript
{
  key: 'description',
  label: 'Description',
  width: 200,
  format: (value) => value?.substring(0, 100) + '...'
}
```

## Implemented Modules

### ✅ Students Module

**File:** `src/pages/students/StudentList.tsx`

**Export Columns:**
- Admission Number
- Student Name
- Class
- Section
- Date of Birth (formatted)
- Status (Active/Inactive)

**Features:**
- Exports filtered student list
- Respects search and filter criteria
- Formatted dates and status

### ✅ Fee Collection Module

**File:** `src/pages/fees/CollectFees.tsx`

**Export Columns:**
- Invoice Number
- Student Name
- Invoice Date (formatted)
- Due Date (formatted)
- Total Amount (₹)
- Paid Amount (₹)
- Balance Amount (₹)
- Status

**Features:**
- Exports pending invoices
- Currency formatting
- Date localization (en-IN)

### ✅ Attendance Module

**File:** `src/pages/attendance/MarkAttendance.tsx`

**Export Columns:**
- Admission Number
- Student Name
- Class
- Section
- Attendance Status
- Date (formatted)

**Features:**
- Exports current attendance state
- Dynamic filename with date
- Real-time status reflection

## Modules Requiring Implementation

### 🔄 Staff Management

**Files to Update:**
- `src/pages/staff/StaffList.tsx`
- `src/pages/staff/AttendanceReport.tsx`
- `src/pages/staff/LeaveManagement.tsx`

**Suggested Columns:**
```typescript
// Staff List
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
    key: 'is_active',
    label: 'Status',
    format: (value) => value ? 'Active' : 'Inactive'
  }
];
```

### 🔄 Library Management

**Files to Update:**
- `src/pages/library/BooksList.tsx`
- `src/pages/library/IssuedBooks.tsx`
- `src/pages/library/MembersList.tsx`

**Suggested Columns:**
```typescript
// Books List
const exportColumns: ExportColumn[] = [
  { key: 'isbn', label: 'ISBN' },
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'category', label: 'Category' },
  { key: 'publisher', label: 'Publisher' },
  { key: 'total_copies', label: 'Total Copies' },
  { key: 'available_copies', label: 'Available' },
  {
    key: 'price',
    label: 'Price (₹)',
    format: (value) => Number(value).toFixed(2)
  }
];
```

### 🔄 Inventory Management

**Files to Update:**
- `src/pages/inventory/ItemsList.tsx`
- `src/pages/inventory/PurchaseOrders.tsx`
- `src/pages/inventory/StockTransactions.tsx`

**Suggested Columns:**
```typescript
// Inventory Items
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
  }
];
```

### 🔄 Exam Results

**Files to Update:**
- `src/pages/exams/ResultsList.tsx`
- `src/pages/exams/GradeSheet.tsx`
- `src/pages/exams/ResultAnalytics.tsx`

**Suggested Columns:**
```typescript
// Exam Results
const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission No' },
  { key: 'student_name', label: 'Student Name' },
  { key: 'class', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'subject', label: 'Subject' },
  { key: 'marks_obtained', label: 'Marks Obtained' },
  { key: 'total_marks', label: 'Total Marks' },
  {
    key: 'percentage',
    label: 'Percentage',
    format: (value) => `${Number(value).toFixed(2)}%`
  },
  { key: 'grade', label: 'Grade' }
];
```

### 🔄 Transport Management

**Files to Update:**
- `src/pages/transport/RoutesList.tsx`
- `src/pages/transport/VehiclesList.tsx`
- `src/pages/transport/StudentAllocation.tsx`

**Suggested Columns:**
```typescript
// Transport Routes
const exportColumns: ExportColumn[] = [
  { key: 'route_number', label: 'Route No' },
  { key: 'route_name', label: 'Route Name' },
  { key: 'vehicle_number', label: 'Vehicle No' },
  { key: 'driver_name', label: 'Driver' },
  { key: 'total_students', label: 'Students' },
  { key: 'start_time', label: 'Start Time' },
  { key: 'end_time', label: 'End Time' },
  {
    key: 'distance',
    label: 'Distance (km)',
    format: (value) => Number(value).toFixed(2)
  }
];
```

### 🔄 Hostel Management

**Files to Update:**
- `src/pages/hostel/RoomAllocation.tsx`
- `src/pages/hostel/MessManagement.tsx`
- `src/pages/hostel/Complaints.tsx`

**Suggested Columns:**
```typescript
// Room Allocation
const exportColumns: ExportColumn[] = [
  { key: 'room_number', label: 'Room No' },
  { key: 'block', label: 'Block' },
  { key: 'floor', label: 'Floor' },
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
```

### 🔄 Financial Reports

**Files to Update:**
- `src/pages/finance/IncomeExpense.tsx`
- `src/pages/finance/VendorPayments.tsx`
- `src/pages/finance/SalaryPayments.tsx`

**Suggested Columns:**
```typescript
// Income/Expense Report
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
  { key: 'reference_number', label: 'Reference' }
];
```

## Direct Export Functions

For custom implementations, you can use the export functions directly:

```typescript
import {
  exportToExcel,
  exportToCSV,
  exportToPDF,
  exportToJSON,
  copyToClipboard,
  printData
} from '@/utils/exportUtils';

// Excel export
exportToExcel(data, 'filename', {
  sheetName: 'Sheet1',
  columns: exportColumns,
  includeTimestamp: true,
  title: 'Report Title'
});

// CSV export
exportToCSV(data, 'filename', {
  columns: exportColumns,
  includeTimestamp: true
});

// PDF export
exportToPDF(data, 'Report Title', {
  filename: 'filename',
  columns: exportColumns,
  orientation: 'landscape',
  pageSize: 'a4'
});

// Copy to clipboard
await copyToClipboard(data, {
  columns: exportColumns
});

// Print
printData(data, 'Report Title', {
  columns: exportColumns
});

// JSON export
exportToJSON(data, 'filename', {
  includeTimestamp: true
});
```

## Best Practices

### 1. Column Configuration

```typescript
// ✅ Good - Clear labels and proper formatting
const exportColumns: ExportColumn[] = [
  { key: 'id', label: 'Student ID' },
  {
    key: 'dob',
    label: 'Date of Birth',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  }
];

// ❌ Bad - No formatting, unclear labels
const exportColumns: ExportColumn[] = [
  { key: 'id', label: 'id' },
  { key: 'dob', label: 'dob' }
];
```

### 2. Data Preparation

```typescript
// ✅ Good - Export filtered/processed data
const exportData = filteredStudents.map(student => ({
  ...student,
  full_name: `${student.first_name} ${student.last_name}`
}));

<ExportButton data={exportData} ... />

// ❌ Bad - Export raw data
<ExportButton data={rawApiResponse} ... />
```

### 3. Filename Convention

```typescript
// ✅ Good - Descriptive with context
filename={`students_${className}_${new Date().toISOString().split('T')[0]}`}

// ❌ Bad - Generic
filename="export"
```

### 4. Error Handling

```typescript
// ✅ Good - Handle export events
<ExportButton
  data={data}
  onExportStart={() => setExporting(true)}
  onExportComplete={(format) => {
    setExporting(false);
    showToast(`Exported as ${format}`);
  }}
  onExportError={(error) => {
    setExporting(false);
    showToast(error.message, 'error');
  }}
/>
```

## Troubleshooting

### Issue: Export button not showing

**Solution:** Ensure all dependencies are installed:
```bash
npm install xlsx jspdf jspdf-autotable
```

### Issue: TypeScript errors

**Solution:** Add type definitions:
```bash
npm install --save-dev @types/jspdf
```

### Issue: PDF tables not rendering

**Solution:** Check jspdf version compatibility:
```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4"
}
```

### Issue: Toast notifications not working

**Solution:** Ensure ToastContainer is in your app:
```typescript
import { ToastContainer } from '@/design-system/components/Toast';

function App() {
  return (
    <>
      <YourApp />
      <ToastContainer />
    </>
  );
}
```

## Performance Considerations

### Large Datasets

For datasets > 10,000 rows:

```typescript
// Use pagination or chunking
const CHUNK_SIZE = 5000;

const exportLargeDataset = async () => {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);
    await exportToExcel(chunk, `export_part_${i / CHUNK_SIZE + 1}`);
  }
};
```

### Memory Optimization

```typescript
// ✅ Good - Export only necessary fields
const exportData = students.map(({ id, name, class: className }) => ({
  id,
  name,
  class: className
}));

// ❌ Bad - Export entire objects with nested data
const exportData = students; // includes photos, documents, etc.
```

## Testing Checklist

- [ ] Export button renders correctly
- [ ] All export formats work (Excel, CSV, PDF, Copy, JSON, Print)
- [ ] Column formatting applies correctly
- [ ] Filtered data exports (not all data)
- [ ] Filename includes relevant context
- [ ] Toast notifications appear
- [ ] Loading states work
- [ ] Error handling works
- [ ] Large datasets (>1000 rows) export successfully
- [ ] Special characters in data export correctly
- [ ] Date formatting is consistent
- [ ] Currency formatting is correct

## Future Enhancements

1. **Scheduled Exports** - Automate exports on schedule
2. **Email Export** - Send exports via email
3. **Cloud Storage** - Save to Google Drive, Dropbox
4. **Custom Templates** - User-defined export templates
5. **Batch Export** - Export multiple modules at once
6. **Export History** - Track all exports
7. **Compression** - ZIP large exports
8. **Watermarks** - Add watermarks to PDFs

## Support

For issues or questions:
1. Check this documentation
2. Review existing implementations
3. Check console for errors
4. Verify dependencies are installed
5. Test with sample data first

## Version History

- **v1.0.0** (2026-01-04) - Initial implementation
  - Core export utilities
  - ExportButton component
  - Students, Fees, and Attendance modules

---

**Last Updated:** January 4, 2026  
**Maintained By:** NucleIQ Development Team
