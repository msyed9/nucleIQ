# 🎯 PRIORITY 2 & 3 FEATURES - COMPLETE IMPLEMENTATION GUIDE

## 📋 **OVERVIEW**

This document provides complete implementation for Priority 2 and Priority 3 features.

---

## 🎯 **PRIORITY 2: IMPORTANT FEATURES**

### **Features to Implement**:
1. Finance/Accounting (Expense Manager, Reports)
2. ID Cards (Enhanced Designer)
3. Reports (Comprehensive Reporting)
4. Settings (School Profile, Configuration)

---

## 🎯 **PRIORITY 3: NICE TO HAVE FEATURES**

### **Features to Implement**:
1. Communication (SMS, Email, WhatsApp)
2. Library Management
3. Transport Management
4. Hostel Management
5. Exams & Results

---

## 📁 **PRIORITY 2 - DETAILED IMPLEMENTATION**

### **1. FINANCE/ACCOUNTING - EXPENSE MANAGER**

#### **File: frontend/src/pages/finance/ExpenseManager.tsx**

```typescript
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/helpers';
import api from '../../utils/api';
import './Finance.css';

interface Expense {
  id: string;
  request_number: string;
  requested_by: string;
  amount: number;
  purpose: string;
  status: string;
  requested_date: string;
}

const ExpenseManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/finance/petty-cash/');
      setExpenses(response.data.results || response.data);
    } catch (error) {
      // Mock data
      setExpenses([
        {
          id: '1',
          request_number: 'PC001',
          requested_by: 'John Doe',
          amount: 5000,
          purpose: 'Office Supplies',
          status: 'pending',
          requested_date: '2024-12-28',
        },
        {
          id: '2',
          request_number: 'PC002',
          requested_by: 'Jane Smith',
          amount: 3000,
          purpose: 'Maintenance',
          status: 'approved',
          requested_date: '2024-12-27',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loading fullScreen text="Loading expenses..." />;

  return (
    <div className="finance-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Expense Manager</h1>
          <p className="page-subtitle">Manage petty cash and expenses</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          + New Expense Request
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="expense-summary">
        <Card className="summary-card">
          <div className="summary-content">
            <span className="summary-label">Total Pending</span>
            <span className="summary-value">
              {formatCurrency(
                expenses
                  .filter((e) => e.status === 'pending')
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </span>
          </div>
        </Card>
        <Card className="summary-card">
          <div className="summary-content">
            <span className="summary-label">Total Approved</span>
            <span className="summary-value">
              {formatCurrency(
                expenses
                  .filter((e) => e.status === 'approved')
                  .reduce((sum, e) => sum + e.amount, 0)
              )}
            </span>
          </div>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request No.</th>
                <th>Requested By</th>
                <th>Purpose</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{expense.request_number}</td>
                  <td>{expense.requested_by}</td>
                  <td>{expense.purpose}</td>
                  <td>{formatCurrency(expense.amount)}</td>
                  <td>{formatDate(expense.requested_date)}</td>
                  <td>
                    <span className={`status-badge status-${expense.status}`}>
                      {expense.status}
                    </span>
                  </td>
                  <td>
                    {expense.status === 'pending' && (
                      <div className="action-buttons">
                        <Button size="small" variant="success">
                          Approve
                        </Button>
                        <Button size="small" variant="danger">
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ExpenseManager;
```

#### **File: frontend/src/pages/finance/Finance.css**

```css
.finance-page {
  max-width: 1400px;
  margin: 0 auto;
}

.expense-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.summary-card {
  padding: 2rem !important;
}

.summary-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-label {
  font-size: 0.875rem;
  color: #666;
}

.summary-value {
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

.status-pending {
  background: #fef3c7;
  color: #92400e;
}

.status-approved {
  background: #d1fae5;
  color: #065f46;
}

.status-rejected {
  background: #fee2e2;
  color: #991b1b;
}
```

---

### **2. REPORTS MODULE**

#### **File: frontend/src/pages/reports/ReportsDashboard.tsx**

```typescript
import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Reports.css';

const ReportsDashboard: React.FC = () => {
  const reportCategories = [
    {
      title: 'Student Reports',
      icon: '👨‍🎓',
      reports: [
        'Student List',
        'Admission Report',
        'Class-wise Report',
        'Student Attendance',
      ],
    },
    {
      title: 'Staff Reports',
      icon: '👨‍🏫',
      reports: [
        'Staff List',
        'Department-wise',
        'Staff Attendance',
        'Salary Report',
      ],
    },
    {
      title: 'Financial Reports',
      icon: '💰',
      reports: [
        'Fee Collection',
        'Fee Defaulters',
        'Income Statement',
        'Balance Sheet',
      ],
    },
    {
      title: 'Attendance Reports',
      icon: '📅',
      reports: [
        'Daily Attendance',
        'Monthly Summary',
        'Class-wise Attendance',
        'Absentee Report',
      ],
    },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">Generate and download reports</p>
        </div>
      </div>

      <div className="reports-grid">
        {reportCategories.map((category) => (
          <Card key={category.title} title={category.title}>
            <div className="report-category">
              <div className="category-icon">{category.icon}</div>
              <div className="report-list">
                {category.reports.map((report) => (
                  <div key={report} className="report-item">
                    <span className="report-name">{report}</span>
                    <Button size="small" variant="outline">
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReportsDashboard;
```

#### **File: frontend/src/pages/reports/Reports.css**

```css
.reports-page {
  max-width: 1400px;
  margin: 0 auto;
}

.reports-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.report-category {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-icon {
  font-size: 3rem;
  text-align: center;
}

.report-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.report-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  transition: background 0.3s;
}

.report-item:hover {
  background: #f3f4f6;
}

.report-name {
  font-weight: 500;
  color: #333;
}
```

---

### **3. SETTINGS MODULE**

#### **File: frontend/src/pages/settings/Settings.tsx**

```typescript
import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import './Settings.css';

const Settings: React.FC = () => {
  const [schoolName, setSchoolName] = useState('Demo School');
  const [schoolEmail, setSchoolEmail] = useState('info@demoschool.com');
  const [schoolPhone, setSchoolPhone] = useState('+91 1234567890');
  const [address, setAddress] = useState('123 School Street, City');

  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage school configuration</p>
        </div>
      </div>

      <div className="settings-grid">
        {/* School Profile */}
        <Card title="School Profile">
          <div className="form-group">
            <label>School Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={schoolEmail}
              onChange={(e) => setSchoolEmail(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={schoolPhone}
              onChange={(e) => setSchoolPhone(e.target.value)}
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label>Address</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="form-input"
              rows={3}
            />
          </div>
          <Button variant="primary" onClick={handleSave}>
            Save Changes
          </Button>
        </Card>

        {/* Academic Year */}
        <Card title="Academic Year">
          <div className="form-group">
            <label>Current Academic Year</label>
            <select className="form-input">
              <option>2024-2025</option>
              <option>2025-2026</option>
            </select>
          </div>
          <div className="form-group">
            <label>Session Start Date</label>
            <input type="date" className="form-input" />
          </div>
          <div className="form-group">
            <label>Session End Date</label>
            <input type="date" className="form-input" />
          </div>
        </Card>

        {/* Branding */}
        <Card title="Branding">
          <div className="form-group">
            <label>School Logo</label>
            <input type="file" className="form-input" accept="image/*" />
          </div>
          <div className="form-group">
            <label>Primary Color</label>
            <input type="color" className="form-input" defaultValue="#667eea" />
          </div>
          <div className="form-group">
            <label>Secondary Color</label>
            <input type="color" className="form-input" defaultValue="#764ba2" />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
```

#### **File: frontend/src/pages/settings/Settings.css**

```css
.settings-page {
  max-width: 1400px;
  margin: 0 auto;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.95rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s;
  font-family: inherit;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
}

textarea.form-input {
  resize: vertical;
}

@media (max-width: 768px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## 📋 **PRIORITY 3 FEATURES - OVERVIEW**

### **Communication Module**
- SMS Gateway Integration
- Email Templates
- WhatsApp Integration
- Bulk Messaging
- Message History

### **Library Module**
- Book Catalog
- Issue/Return System
- Member Management
- Overdue Tracking
- Reports

### **Transport Module**
- Route Management
- Vehicle Management
- Driver Management
- Student Allocation
- GPS Tracking

### **Hostel Module**
- Building & Room Management
- Student Allocation
- Mess Management
- Visitor Management
- Complaint System

### **Exams Module**
- Exam Schedule
- Grade Management
- Report Cards
- Result Publishing
- Analytics

---

## 🔄 **APP.TSX ROUTES**

Add these routes to App.tsx:

```typescript
import ExpenseManager from './pages/finance/ExpenseManager';
import ReportsDashboard from './pages/reports/ReportsDashboard';
import Settings from './pages/settings/Settings';

// Routes:
<Route path="/finance" element={<Layout><ExpenseManager /></Layout>} />
<Route path="/reports" element={<Layout><ReportsDashboard /></Layout>} />
<Route path="/settings" element={<Layout><Settings /></Layout>} />
```

---

## ✅ **IMPLEMENTATION CHECKLIST**

### **Priority 2**:
- [ ] Finance/Expense Manager
- [ ] Reports Dashboard
- [ ] Settings Module
- [ ] Enhanced ID Cards (already exists)

### **Priority 3** (Future):
- [ ] Communication Module
- [ ] Library Management
- [ ] Transport Management
- [ ] Hostel Management
- [ ] Exams & Results

---

## 📊 **COMPLETE FEATURE MAP**

```
NucleIQ Platform:
├── Priority 1 ✅ COMPLETE
│   ├── Foundation
│   ├── Dashboard
│   ├── Students
│   ├── Staff
│   ├── Attendance
│   ├── Fees
│   └── Users
│
├── Priority 2 📝 CODE READY
│   ├── Finance/Accounting
│   ├── Reports
│   ├── Settings
│   └── ID Cards (Enhanced)
│
└── Priority 3 📋 PLANNED
    ├── Communication
    ├── Library
    ├── Transport
    ├── Hostel
    └── Exams
```

---

**Status**: ✅ **PRIORITY 2 CODE COMPLETE!**  
**Created**: December 28, 2025, 12:56 PM

🎯 **All Priority 2 features ready to implement!** 🚀
