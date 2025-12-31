# 🗺️ NucleIQ - Backend-Frontend Endpoint Mapping

**Last Updated**: December 31, 2025

---

## 📊 LEGEND

- ✅ **CONNECTED**: Backend endpoint has corresponding frontend page
- ⚠️ **PARTIAL**: Some endpoints connected, others missing
- ❌ **MISSING**: Backend ready, no frontend implementation
- 🔴 **NOT IMPLEMENTED**: Backend not implemented

---

## 1️⃣ AUTHENTICATION & USERS

### **Backend**: `/api/` (users app)

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/login/` | POST | `/login` | ✅ CONNECTED |
| `/api/logout/` | POST | N/A (API call) | ✅ CONNECTED |
| `/api/refresh/` | POST | N/A (API call) | ✅ CONNECTED |
| `/api/change-password/` | POST | `/settings` | ✅ CONNECTED |
| `/api/users/` | GET/POST | `/users` | ✅ CONNECTED |
| `/api/users/{id}/` | GET/PUT/DELETE | `/users/manage` | ✅ CONNECTED |
| `/api/roles/` | GET/POST | `/users/manage` | ✅ CONNECTED |
| `/api/permissions/` | GET | `/users/manage` | ✅ CONNECTED |
| `/api/impersonate/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 8/9 connected (89%)

---

## 2️⃣ TENANTS & ACADEMIC STRUCTURE

### **Backend**: `/api/tenants/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/tenants/years/` | GET/POST | `/settings/academic` | ✅ CONNECTED |
| `/api/tenants/departments/` | GET/POST | `/settings/academic` | ✅ CONNECTED |
| `/api/tenants/grades/` | GET/POST | `/settings/academic` | ✅ CONNECTED |
| `/api/tenants/sections/` | GET/POST | `/settings/academic` | ✅ CONNECTED |
| `/api/tenants/hq/` | GET/POST | `/group/hq` | ✅ CONNECTED |

**Summary**: 5/5 connected (100%) ✅

---

## 3️⃣ STUDENTS

### **Backend**: `/api/students/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/students/` | GET/POST | `/students` | ✅ CONNECTED |
| `/api/students/{id}/` | GET/PUT/DELETE | `/students/{id}` | ✅ CONNECTED |
| `/api/students/remarks/` | GET/POST | `/students/remarks` | ✅ CONNECTED |
| `/api/students/documents/` | GET/POST | `/students/documents` | ✅ CONNECTED |
| `/api/students/health-records/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/students/enrollments/` | GET/POST | ❌ MISSING | ❌ MISSING |

**Summary**: 4/6 connected (67%)

---

## 4️⃣ STAFF

### **Backend**: `/api/staff/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/staff/` | GET/POST | `/staff` | ✅ CONNECTED |
| `/api/staff/{id}/` | GET/PUT/DELETE | `/staff/{id}` | ✅ CONNECTED |
| `/api/staff/documents/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/staff/attendance/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/staff/leaves/` | GET/POST | `/hr/leaves` | ✅ CONNECTED |

**Summary**: 3/5 connected (60%)

---

## 5️⃣ ATTENDANCE

### **Backend**: `/api/attendance/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/attendance/` | GET/POST | `/attendance` | ✅ CONNECTED |
| `/api/attendance/bulk/` | POST | `/attendance` | ✅ CONNECTED |
| `/api/attendance/aggregates/` | GET | `/attendance/aggregates` | ✅ CONNECTED |
| `/api/attendance/qr-generate/` | POST | `/attendance` | ✅ CONNECTED |
| `/api/attendance/qr-mark/` | POST | ❌ MISSING (Mobile) | ⚠️ PARTIAL |

**Summary**: 4/5 connected (80%)

---

## 6️⃣ FEES & FINANCE

### **Backend**: `/api/fees/` & `/api/finance/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/fees/structures/` | GET/POST | `/fees/configure` | ✅ CONNECTED |
| `/api/fees/assignments/` | GET/POST | `/fees/configure` | ✅ CONNECTED |
| `/api/fees/payments/` | GET/POST | `/fees/collect` | ✅ CONNECTED |
| `/api/fees/discounts/` | GET/POST | `/fees/configure` | ✅ CONNECTED |
| `/api/fees/defaulters/` | GET | ❌ MISSING | ❌ MISSING |
| `/api/finance/accounts/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/finance/transactions/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/finance/expenses/` | GET/POST | `/finance` | ✅ CONNECTED |
| `/api/finance/budgets/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/finance/reports/` | GET | ❌ MISSING | ❌ MISSING |

**Summary**: 5/10 connected (50%)

---

## 7️⃣ TIMETABLE

### **Backend**: `/api/timetable/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/timetable/slots/` | GET/POST | `/timetable/builder` | ✅ CONNECTED |
| `/api/timetable/templates/` | GET/POST | `/timetable/builder` | ✅ CONNECTED |
| `/api/timetable/teacher-view/` | GET | `/timetable/teacher` | ✅ CONNECTED |
| `/api/timetable/class-view/` | GET | `/timetable/class` | ✅ CONNECTED |
| `/api/timetable/conflicts/` | GET | `/timetable/builder` | ✅ CONNECTED |

**Summary**: 5/5 connected (100%) ✅

---

## 8️⃣ ACADEMICS

### **Backend**: `/api/academics/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/academics/assignments/` | GET/POST | `/assignments` | ✅ CONNECTED |
| `/api/academics/submissions/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/academics/assignments/{id}/grade/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 1/3 connected (33%)

---

## 9️⃣ EXAMS

### **Backend**: `/api/exams/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/exams/exams/` | GET/POST | `/exams` | ✅ CONNECTED |
| `/api/exams/schedules/` | GET/POST | `/exams` | ✅ CONNECTED |
| `/api/exams/results/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/exams/grades/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/exams/grade-cards/` | GET | ❌ MISSING | ❌ MISSING |

**Summary**: 2/5 connected (40%)

---

## 🔟 HR & PAYROLL

### **Backend**: `/api/hr/` & `/api/payroll/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/hr/leave-types/` | GET/POST | `/hr/leaves` | ✅ CONNECTED |
| `/api/hr/leave-balances/` | GET | `/hr/leaves` | ✅ CONNECTED |
| `/api/hr/leave-applications/` | GET/POST | `/hr/leaves` | ✅ CONNECTED |
| `/api/hr/leave-applications/{id}/approve/` | POST | ❌ MISSING | ❌ MISSING |
| `/api/payroll/components/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/payroll/structures/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/payroll/cycles/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/payroll/payslips/` | GET | `/payroll/payslips` | ✅ CONNECTED |

**Summary**: 4/8 connected (50%)

---

## 1️⃣1️⃣ LIBRARY

### **Backend**: `/api/library/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/library/books/` | GET/POST | `/library/catalog` | ✅ CONNECTED |
| `/api/library/copies/` | GET/POST | `/library/books` | ✅ CONNECTED |
| `/api/library/members/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/library/issues/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/library/issues/{id}/return/` | POST | ❌ MISSING | ❌ MISSING |
| `/api/library/digital/` | GET/POST | `/lms/digital` | ✅ CONNECTED |

**Summary**: 3/6 connected (50%)

---

## 1️⃣2️⃣ TRANSPORT

### **Backend**: `/api/transport/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/transport/vehicles/` | GET/POST | `/transport` | ✅ CONNECTED |
| `/api/transport/drivers/` | GET/POST | `/transport` | ✅ CONNECTED |
| `/api/transport/routes/` | GET/POST | `/transport` | ✅ CONNECTED |
| `/api/transport/stops/` | GET/POST | `/transport` | ✅ CONNECTED |
| `/api/transport/allocations/` | GET/POST | `/transport/allocations` | ✅ CONNECTED |

**Summary**: 5/5 connected (100%) ✅

---

## 1️⃣3️⃣ INVENTORY

### **Backend**: `/api/inventory/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/inventory/items/` | GET/POST | `/inventory/stock` | ✅ CONNECTED |
| `/api/inventory/transactions/` | GET/POST | `/inventory/stock` | ✅ CONNECTED |
| `/api/inventory/orders/` | GET/POST | ❌ MISSING | ❌ MISSING |

**Summary**: 2/3 connected (67%)

---

## 1️⃣4️⃣ HOSTEL

### **Backend**: `/api/hostel/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/hostel/buildings/` | GET/POST | `/hostel` | ✅ CONNECTED |
| `/api/hostel/rooms/` | GET/POST | `/hostel` | ✅ CONNECTED |
| `/api/hostel/beds/` | GET/POST | `/hostel` | ✅ CONNECTED |
| `/api/hostel/allocations/` | GET/POST | ❌ MISSING | ❌ MISSING |

**Summary**: 3/4 connected (75%)

---

## 1️⃣5️⃣ COMMUNICATION

### **Backend**: `/api/communication/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/communication/providers/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/communication/templates/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/communication/notices/` | GET/POST | `/communication` | ✅ CONNECTED |
| `/api/communication/logs/` | GET | ❌ MISSING | ❌ MISSING |
| `/api/communication/broadcasts/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 1/5 connected (20%)

---

## 1️⃣6️⃣ CRM

### **Backend**: `/api/crm/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/crm/leads/` | GET/POST | `/crm/leads` | ✅ CONNECTED |
| `/api/crm/interactions/` | GET/POST | `/crm/leads` | ✅ CONNECTED |
| `/api/crm/documents/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/crm/visitors/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/crm/public/lead/` | POST | ❌ MISSING (Public) | ❌ MISSING |

**Summary**: 2/5 connected (40%)

---

## 1️⃣7️⃣ CMS

### **Backend**: `/api/cms/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/cms/themes/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/cms/websites/` | GET/POST | `/cms/builder` | ✅ CONNECTED |
| `/api/cms/pages/` | GET/POST | `/cms/builder` | ✅ CONNECTED |
| `/api/cms/sections/` | GET/POST | `/cms/builder` | ✅ CONNECTED |
| `/api/cms/assets/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/cms/navigation/` | GET/POST | `/cms/builder` | ✅ CONNECTED |

**Summary**: 4/6 connected (67%)

---

## 1️⃣8️⃣ ALUMNI

### **Backend**: `/api/alumni/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/alumni/profiles/` | GET/POST | `/alumni` | ✅ CONNECTED |
| `/api/alumni/jobs/` | GET/POST | `/alumni` | ✅ CONNECTED |
| `/api/alumni/events/` | GET/POST | `/alumni` | ✅ CONNECTED |
| `/api/alumni/campaigns/` | GET/POST | `/alumni` | ✅ CONNECTED |

**Summary**: 4/4 connected (100%) ✅

---

## 1️⃣9️⃣ LMS

### **Backend**: `/api/lms/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/lms/live/` | GET/POST | `/lms/classes` | ✅ CONNECTED |
| `/api/lms/live/{id}/join/` | GET | `/lms/classes` | ✅ CONNECTED |

**Summary**: 2/2 connected (100%) ✅

---

## 2️⃣0️⃣ CERTIFICATES

### **Backend**: `/api/certificates/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/certificates/templates/` | GET/POST | `/admin/certificates` | ✅ CONNECTED |
| `/api/certificates/requests/` | GET/POST | ❌ MISSING | ❌ MISSING |
| `/api/certificates/generate/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 1/3 connected (33%)

---

## 2️⃣1️⃣ SECURITY

### **Backend**: `/api/security/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/security/passes/` | GET/POST | `/security/scanner` | ✅ CONNECTED |
| `/api/security/passes/{id}/verify/` | POST | `/security/scanner` | ✅ CONNECTED |

**Summary**: 2/2 connected (100%) ✅

---

## 2️⃣2️⃣ PLACEMENT

### **Backend**: `/api/placement/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/placement/recruiters/` | GET/POST | `/placement` | ✅ CONNECTED |
| `/api/placement/drives/` | GET/POST | `/placement` | ✅ CONNECTED |
| `/api/placement/applications/` | GET/POST | ❌ MISSING | ❌ MISSING |

**Summary**: 2/3 connected (67%)

---

## 2️⃣3️⃣ HELPDESK

### **Backend**: `/api/helpdesk/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/helpdesk/tickets/` | GET/POST | `/helpdesk` | ✅ CONNECTED |
| `/api/helpdesk/tickets/{id}/` | GET/PUT | `/helpdesk/tickets` | ✅ CONNECTED |
| `/api/helpdesk/tickets/{id}/assign/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 2/3 connected (67%)

---

## 2️⃣4️⃣ TRACKERS

### **Backend**: `/api/salah/` & `/api/habits/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/salah/records/` | GET/POST | `/trackers/salah` | ✅ CONNECTED |
| `/api/habits/habits/` | GET/POST | `/trackers/habits` | ✅ CONNECTED |
| `/api/habits/logs/` | GET/POST | `/trackers/habits` | ✅ CONNECTED |

**Summary**: 3/3 connected (100%) ✅

---

## 2️⃣5️⃣ ANALYTICS

### **Backend**: `/api/analytics/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/analytics/dashboard/` | GET | `/analytics` | ✅ CONNECTED |
| `/api/analytics/students/` | GET | `/analytics` | ✅ CONNECTED |
| `/api/analytics/finance/` | GET | `/analytics` | ✅ CONNECTED |
| `/api/analytics/academic/` | GET | `/analytics` | ✅ CONNECTED |

**Summary**: 4/4 connected (100%) ✅

---

## 2️⃣6️⃣ BILLING

### **Backend**: `/api/billing/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/billing/plans/` | GET | `/billing` | ✅ CONNECTED |
| `/api/billing/subscriptions/` | GET/POST | `/billing` | ✅ CONNECTED |
| `/api/billing/invoices/` | GET | `/billing` | ✅ CONNECTED |
| `/api/billing/payments/` | POST | ❌ MISSING | ❌ MISSING |

**Summary**: 3/4 connected (75%)

---

## 2️⃣7️⃣ ID CARDS

### **Backend**: `/api/idcards/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/idcards/templates/` | GET | `/idcards/designer` | ✅ CONNECTED |
| `/api/idcards/designs/` | GET/POST | `/idcards/designer` | ✅ CONNECTED |
| `/api/idcards/generations/` | POST | `/idcards/designer` | ✅ CONNECTED |

**Summary**: 3/3 connected (100%) ✅

---

## 2️⃣8️⃣ DASHBOARD & SEARCH

### **Backend**: `/api/dashboard/` & `/api/search/`

| Endpoint | Method | Frontend Route | Status |
|----------|--------|----------------|--------|
| `/api/dashboard/stats/` | GET | `/dashboard` | ✅ CONNECTED |
| `/api/search/` | GET | N/A (Global) | ✅ CONNECTED |

**Summary**: 2/2 connected (100%) ✅

---

## 📊 OVERALL SUMMARY

| Module | Total Endpoints | Connected | Percentage |
|--------|----------------|-----------|------------|
| Authentication & Users | 9 | 8 | 89% |
| Tenants & Academic | 5 | 5 | 100% ✅ |
| Students | 6 | 4 | 67% |
| Staff | 5 | 3 | 60% |
| Attendance | 5 | 4 | 80% |
| Fees & Finance | 10 | 5 | 50% |
| Timetable | 5 | 5 | 100% ✅ |
| Academics | 3 | 1 | 33% |
| Exams | 5 | 2 | 40% |
| HR & Payroll | 8 | 4 | 50% |
| Library | 6 | 3 | 50% |
| Transport | 5 | 5 | 100% ✅ |
| Inventory | 3 | 2 | 67% |
| Hostel | 4 | 3 | 75% |
| Communication | 5 | 1 | 20% |
| CRM | 5 | 2 | 40% |
| CMS | 6 | 4 | 67% |
| Alumni | 4 | 4 | 100% ✅ |
| LMS | 2 | 2 | 100% ✅ |
| Certificates | 3 | 1 | 33% |
| Security | 2 | 2 | 100% ✅ |
| Placement | 3 | 2 | 67% |
| Helpdesk | 3 | 2 | 67% |
| Trackers | 3 | 3 | 100% ✅ |
| Analytics | 4 | 4 | 100% ✅ |
| Billing | 4 | 3 | 75% |
| ID Cards | 3 | 3 | 100% ✅ |
| Dashboard & Search | 2 | 2 | 100% ✅ |

### **GRAND TOTAL**
- **Total Endpoints**: 127
- **Connected**: 89
- **Missing**: 38
- **Overall Completion**: **70%**

---

## 🎯 TOP PRIORITY ENDPOINTS TO CONNECT

1. **Communication Module** (20% connected) - 4 endpoints missing
2. **Exams Module** (40% connected) - 3 endpoints missing
3. **Academics Module** (33% connected) - 2 endpoints missing
4. **CRM Module** (40% connected) - 3 endpoints missing
5. **Finance Module** (50% connected) - 5 endpoints missing

---

**Status**: Comprehensive Mapping Complete  
**Next Action**: Prioritize missing endpoints  
**Goal**: Reach 100% connectivity

🚀 **Let's connect them all!**
