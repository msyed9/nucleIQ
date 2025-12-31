# API Integration Plan - Unlinked Backend Endpoints

## Priority 1: Core User Management

### 1. User Management (`/api/users/`)
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/users/` - List all users
- `POST /api/users/` - Create new user
- `PUT /api/users/{id}/` - Update user
- `DELETE /api/users/{id}/` - Delete user

**Frontend Component**: `UserManagement.tsx`
**Features**:
- User list with search and filters
- Add/Edit user modal
- Role assignment
- Activate/Deactivate users

---

### 2. Role & Permission Management
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/roles/` - List roles
- `POST /api/roles/` - Create role
- `GET /api/permissions/` - List permissions
- Assign permissions to roles

**Frontend Component**: `RoleManagement.tsx`
**Features**:
- Role CRUD operations
- Permission matrix
- Module-based access control

---

## Priority 2: Academic Setup

### 3. Academic Year Management (`/api/tenants/years/`)
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/tenants/years/` - List academic years
- `POST /api/tenants/years/` - Create academic year
- `PUT /api/tenants/years/{id}/` - Update academic year

**Frontend Component**: `AcademicYearSetup.tsx`
**Features**:
- List all academic years
- Create new academic year
- Set active year
- Define term/semester dates

---

### 4. Department & Grade Management
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/tenants/departments/` - List departments
- `GET /api/tenants/grades/` - List grade levels

**Frontend Component**: `SchoolStructure.tsx`
**Features**:
- Department hierarchy
- Grade level configuration
- Section management (already partially done)

---

## Priority 3: Fee Management Extensions

### 5. Fee Structure Management
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/fees/categories/` - Fee categories
- `GET /api/fees/structures/` - Fee structures
- `GET /api/fees/allocations/` - Fee allocations
- `GET /api/fees/defaulters/` - Fee defaulters list
- `GET /api/fees/sibling-discounts/` - Sibling discounts

**Frontend Component**: `FeeConfiguration.tsx`
**Features**:
- Define fee categories (Tuition, Transport, etc.)
- Create fee structures per grade
- Allocate fees to students
- View defaulters report
- Configure sibling discounts

---

## Priority 4: Student Records Management

### 6. Student Remarks System
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/students/remarks/` - List all remarks
- `POST /api/students/remarks/` - Create remark
- `POST /api/students/remarks/{id}/acknowledge/` - Parent acknowledgment
- `POST /api/students/remarks/{id}/mark_action_taken/` - Mark action taken

**Frontend Component**: `RemarksManager.tsx`
**Features**:
- Universal feed for all student remarks
- Filter by type, category, student
- Add new remarks with attachments
- Track parent acknowledgments
- Action tracking

---

### 7. Student Documents
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/students/documents/` - List documents
- `POST /api/students/documents/` - Upload document
- `POST /api/students/documents/{id}/verify/` - Verify document

**Frontend Component**: `DocumentManager.tsx`
**Features**:
- Upload student documents
- Document verification workflow
- Document type categorization
- Download/preview documents

---

### 8. Health Records
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/students/health-records/` - List health records
- `POST /api/students/health-records/` - Add health record

**Frontend Component**: `HealthRecords.tsx`
**Features**:
- Add health checkup records
- Track height, weight, BMI
- Vaccination records
- Medical history

---

## Priority 5: Staff Management

### 9. Staff Module (Complete)
**Status**: Backend ✅ | Frontend ⚠️ (List only)

**Endpoints**:
- `POST /api/staff/staff/` - Add staff
- `PUT /api/staff/staff/{id}/` - Update staff
- `GET /api/staff/documents/` - Staff documents
- `GET /api/staff/attendance/` - Staff attendance
- `GET /api/staff/leaves/` - Leave management

**Frontend Components Needed**:
- `AddStaff.tsx` - Staff admission form
- `StaffProfile.tsx` - Staff 360° view
- `LeaveManagement.tsx` - Leave requests

---

## Priority 6: Finance Module

### 10. Finance Management
**Status**: Backend ✅ | Frontend ⚠️ (Petty cash only)

**Endpoints**:
- `GET /api/finance/accounts/` - Ledger accounts
- `GET /api/finance/journal-entries/` - Journal entries
- `GET /api/finance/vendor-payments/` - Vendor payments
- `GET /api/finance/salary-payments/` - Salary payments
- `GET /api/finance/reports/` - Financial reports

**Frontend Component**: `FinanceModule.tsx`
**Features**:
- Chart of accounts
- Journal entry recording
- Vendor payment tracking
- Salary disbursement
- Financial reports (P&L, Balance Sheet)

---

## Priority 7: Advanced Features

### 11. Global Search
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/search/?q={query}` - Global search
- `GET /api/search/recent/` - Recent searches
- `GET /api/search/suggestions/` - Search suggestions

**Frontend Component**: `GlobalSearch.tsx` (Command Palette enhancement)
**Features**:
- Search across students, staff, invoices
- Recent search history
- Auto-suggestions

---

### 12. Dashboard Widgets
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/dashboard/widgets/` - Available widgets
- `GET /api/dashboard/layout/` - User's dashboard layout
- `POST /api/dashboard/layout/update_layout/` - Save layout
- `POST /api/dashboard/layout/add_widget/` - Add widget

**Frontend Component**: `CustomizableDashboard.tsx`
**Features**:
- Drag-and-drop widget layout
- Widget library
- Personalized dashboards
- Save/restore layouts

---

### 13. ID Card Designer (Partial)
**Status**: Backend ✅ | Frontend ⚠️ (Designer exists, no API calls)

**Endpoints**:
- `GET /api/idcards/templates/` - List templates
- `POST /api/idcards/designs/` - Save design
- `POST /api/idcards/generations/` - Generate cards

**Enhancement Needed**: Connect existing `Designer.tsx` to backend

---

## Priority 8: Platform Admin (Super Admin)

### 14. Analytics & Monitoring
**Status**: Backend ✅ | Frontend ❌

**Endpoints**:
- `GET /api/analytics/platform/` - Platform metrics
- `GET /api/analytics/churn/` - Churn prediction
- `GET /api/analytics/upsell/` - Upsell opportunities
- `GET /api/analytics/logs/` - Audit logs

**Frontend Component**: `PlatformAnalytics.tsx`
**Features**:
- Tenant health monitoring
- Churn risk alerts
- Usage analytics
- Audit trail

---

### 15. Billing & Subscriptions
**Status**: Backend ✅ | Frontend ⚠️ (Partial in SubscriptionManage.tsx)

**Endpoints**:
- `GET /api/billing/plans/` - Subscription plans
- `GET /api/billing/subscriptions/` - Manage subscriptions
- `POST /api/billing/subscriptions/{id}/upgrade/` - Upgrade plan
- `POST /api/billing/subscriptions/{id}/cancel/` - Cancel subscription

**Enhancement Needed**: Complete integration in existing component

---

## Implementation Priority

### Phase 1 (Immediate - Core Operations)
1. ✅ User Management
2. ✅ Academic Year Setup
3. ✅ Fee Configuration
4. ✅ Student Remarks

### Phase 2 (High Priority - Daily Operations)
5. ✅ Student Documents
6. ✅ Health Records
7. ✅ Staff Add/Edit
8. ✅ Leave Management

### Phase 3 (Medium Priority - Administrative)
9. ✅ Role Management
10. ✅ Finance Module
11. ✅ Global Search

### Phase 4 (Nice to Have - Advanced)
12. ✅ Dashboard Widgets
13. ✅ Platform Analytics
14. ✅ Complete ID Card Integration

---

## Next Steps

I will now implement the **Phase 1** components, starting with the most critical ones:

1. **User Management** - Essential for admin operations
2. **Academic Year Setup** - Required for proper school configuration
3. **Fee Configuration** - Extends the existing fee collection feature
4. **Student Remarks** - Completes the Student 360° vision

Would you like me to proceed with implementing these components?
