# Export Functionality - Quick Reference Card

## 🚀 Quick Start (Copy & Paste)

### Step 1: Import Components

```typescript
import ExportButton from '@/components/common/ExportButton';
import { ExportColumn } from '@/utils/exportUtils';
```

### Step 2: Define Export Columns

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'date',
    label: 'Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  }
];
```

### Step 3: Add Export Button

```typescript
<ExportButton
  data={filteredData}
  filename="my_export"
  title="My Report"
  columns={exportColumns}
  variant="outline"
/>
```

---

## 📋 Common Column Patterns

### Basic Text Column
```typescript
{ key: 'student_name', label: 'Student Name' }
```

### Date Column (Indian Format)
```typescript
{
  key: 'date_of_birth',
  label: 'Date of Birth',
  format: (value) => new Date(value).toLocaleDateString('en-IN')
}
```

### Currency Column (₹)
```typescript
{
  key: 'amount',
  label: 'Amount (₹)',
  format: (value) => Number(value).toFixed(2)
}
```

### Boolean Column
```typescript
{
  key: 'is_active',
  label: 'Status',
  format: (value) => value ? 'Active' : 'Inactive'
}
```

### Percentage Column
```typescript
{
  key: 'percentage',
  label: 'Percentage',
  format: (value) => `${Number(value).toFixed(2)}%`
}
```

### Enum/Status Column
```typescript
{
  key: 'status',
  label: 'Status',
  format: (value) => {
    const statusMap = {
      'PENDING': 'Pending',
      'APPROVED': 'Approved',
      'REJECTED': 'Rejected'
    };
    return statusMap[value] || value;
  }
}
```

---

## 🎨 Button Variants

### Primary Button
```typescript
<ExportButton variant="primary" ... />
```

### Secondary Button
```typescript
<ExportButton variant="secondary" ... />
```

### Outline Button (Recommended)
```typescript
<ExportButton variant="outline" ... />
```

---

## 📏 Button Sizes

### Small
```typescript
<ExportButton size="sm" ... />
```

### Medium (Default)
```typescript
<ExportButton size="medium" ... />
```

### Large
```typescript
<ExportButton size="large" ... />
```

---

## 🔔 Event Handlers

```typescript
<ExportButton
  data={data}
  onExportStart={() => {
    console.log('Export started');
    setLoading(true);
  }}
  onExportComplete={(format) => {
    console.log(`Exported as ${format}`);
    setLoading(false);
    trackEvent('export', { format });
  }}
  onExportError={(error) => {
    console.error('Export failed:', error);
    setLoading(false);
    showErrorToast(error.message);
  }}
/>
```

---

## 📦 Complete Examples

### Students List

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission Number' },
  { key: 'full_name', label: 'Student Name' },
  { key: 'current_class', label: 'Class' },
  { key: 'section', label: 'Section' },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'is_active',
    label: 'Status',
    format: (value) => value ? 'Active' : 'Inactive'
  }
];

<ExportButton
  data={filteredStudents}
  filename="students_list"
  title="Students List"
  columns={exportColumns}
  variant="outline"
/>
```

### Fee Receipts

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'invoice_number', label: 'Invoice Number' },
  { key: 'student_name', label: 'Student Name' },
  {
    key: 'invoice_date',
    label: 'Invoice Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  },
  {
    key: 'total_amount',
    label: 'Total Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'paid_amount',
    label: 'Paid Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  {
    key: 'balance_amount',
    label: 'Balance Amount (₹)',
    format: (value) => Number(value).toFixed(2)
  },
  { key: 'status', label: 'Status' }
];

<ExportButton
  data={filteredInvoices}
  filename="fee_receipts"
  title="Fee Collection Report"
  columns={exportColumns}
  variant="outline"
/>
```

### Attendance Report

```typescript
const attendanceData = students.map(student => ({
  admission_number: student.admission_number,
  full_name: student.full_name,
  class_name: student.class_name,
  section: student.section,
  status: attendance[student.id] || 'PRESENT',
  date: selectedDate
}));

const exportColumns: ExportColumn[] = [
  { key: 'admission_number', label: 'Admission Number' },
  { key: 'full_name', label: 'Student Name' },
  { key: 'class_name', label: 'Class' },
  { key: 'section', label: 'Section' },
  { key: 'status', label: 'Attendance Status' },
  {
    key: 'date',
    label: 'Date',
    format: (value) => new Date(value).toLocaleDateString('en-IN')
  }
];

<ExportButton
  data={attendanceData}
  filename={`attendance_${selectedDate}`}
  title={`Attendance Report - ${selectedDate}`}
  columns={exportColumns}
  variant="outline"
  size="sm"
/>
```

---

## 🛠️ Direct Function Usage

### Export to Excel

```typescript
import { exportToExcel } from '@/utils/exportUtils';

exportToExcel(data, 'filename', {
  sheetName: 'Sheet1',
  columns: exportColumns,
  includeTimestamp: true,
  title: 'Report Title'
});
```

### Export to CSV

```typescript
import { exportToCSV } from '@/utils/exportUtils';

exportToCSV(data, 'filename', {
  columns: exportColumns,
  includeTimestamp: true
});
```

### Export to PDF

```typescript
import { exportToPDF } from '@/utils/exportUtils';

exportToPDF(data, 'Report Title', {
  filename: 'filename',
  columns: exportColumns,
  orientation: 'landscape', // or 'portrait'
  pageSize: 'a4' // or 'letter', 'legal'
});
```

### Copy to Clipboard

```typescript
import { copyToClipboard } from '@/utils/exportUtils';

await copyToClipboard(data, {
  columns: exportColumns
});
```

### Print

```typescript
import { printData } from '@/utils/exportUtils';

printData(data, 'Report Title', {
  columns: exportColumns
});
```

---

## ⚡ Pro Tips

### 1. Dynamic Filenames

```typescript
filename={`students_${className}_${new Date().toISOString().split('T')[0]}`}
```

### 2. Conditional Columns

```typescript
const exportColumns: ExportColumn[] = [
  { key: 'name', label: 'Name' },
  ...(includeEmail ? [{ key: 'email', label: 'Email' }] : []),
  ...(includePhone ? [{ key: 'phone', label: 'Phone' }] : [])
];
```

### 3. Nested Data

```typescript
{
  key: 'student',
  label: 'Student Name',
  format: (value) => value?.full_name || 'N/A'
}
```

### 4. Multiple Formats

```typescript
{
  key: 'amount',
  label: 'Amount',
  format: (value) => `₹${Number(value).toLocaleString('en-IN')}`
}
```

### 5. Truncate Long Text

```typescript
{
  key: 'description',
  label: 'Description',
  format: (value) => value?.substring(0, 50) + (value?.length > 50 ? '...' : '')
}
```

---

## 🐛 Common Issues & Fixes

### Issue: "Cannot find module 'xlsx'"

**Fix:**
```bash
npm install
```

### Issue: PDF not generating

**Fix:** Check package.json versions:
```json
{
  "jspdf": "^2.5.2",
  "jspdf-autotable": "^3.8.4"
}
```

### Issue: Toast not showing

**Fix:** Ensure ToastContainer is in App.tsx:
```typescript
import { ToastContainer } from '@/design-system/components/Toast';
```

### Issue: Export button not visible

**Fix:** Check import path:
```typescript
import ExportButton from '@/components/common/ExportButton';
```

---

## 📊 Format Comparison

| Format | Best For | File Size | Speed |
|--------|----------|-----------|-------|
| **Excel** | Data analysis, formulas | Medium | Fast |
| **CSV** | Simple data, imports | Small | Very Fast |
| **PDF** | Reports, printing | Large | Slow |
| **JSON** | API integration | Small | Very Fast |
| **Copy** | Quick paste to Excel | N/A | Instant |
| **Print** | Physical copies | N/A | Fast |

---

## ✅ Implementation Checklist

- [ ] Import ExportButton and ExportColumn
- [ ] Define export columns with proper labels
- [ ] Add formatters for dates, currency, etc.
- [ ] Add ExportButton to page
- [ ] Set appropriate filename
- [ ] Set report title
- [ ] Test all export formats
- [ ] Test with filtered data
- [ ] Test with large datasets
- [ ] Add event handlers if needed

---

## 📚 Resources

- **Full Guide:** `frontend/EXPORT_IMPLEMENTATION_GUIDE.md`
- **Summary:** `EXPORT_IMPLEMENTATION_SUMMARY.md`
- **Examples:** Check `StudentList.tsx`, `CollectFees.tsx`, `MarkAttendance.tsx`

---

**Last Updated:** January 4, 2026  
**Version:** 1.0.0
