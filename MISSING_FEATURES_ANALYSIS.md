# NucleiQ — Missing & Unimplemented Features Analysis

**Audit Date:** 2026-08-31  
**Scope:** Backend (Django), Frontend (React/TypeScript), Mobile (React Native/Expo)

---

## Legend
| Symbol | Meaning |
|--------|---------|
| ❌ | Not started — no code at all |
| 🔴 | Stub / placeholder — file exists but no real functionality |
| 🟡 | Partial — backend done, frontend is read-only or vice versa |
| 🟢 | Complete — both backend and frontend fully functional |

---

## 1. FRONTEND — Stub / Placeholder Pages

These pages exist in the routing and sidebar but render empty states or read-only lists with no create/edit/action capabilities. The backend API for most of these **does** exist.

### 1.1 Staff Management Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Health Records | `staff/HealthRecords.tsx` | 🔴 | Hard-coded empty state div. Backend has full models (`StaffHealthProfile`, `StaffMedicalHistory`, `StaffMedicalCheckup`, `StaffVaccination`, `StaffInjuryReport`) and API routes — none are wired to the UI. |
| Training Management | `staff/TrainingManagement.tsx` | 🔴 | Hard-coded empty state div. Backend has `TrainingProgram`, `TrainingEnrollment`, `TrainingFeedback` models and routes — none wired. |
| Appraisal Management | `staff/AppraisalManagement.tsx` | 🔴 | "Create Appraisal Cycle" button does nothing. Backend has `AppraisalCycle`, `StaffAppraisal`, `StaffGoal` — none wired. |
| My Appraisal | `staff/MyAppraisal.tsx` | 🔴 | Hard-coded "No Active Appraisals" empty state. No fetch, no form, no self-assessment. |
| Leave Applications | `staff/LeaveApplications.tsx` | 🔴 | Can open the form but the applications list section is an empty comment `{/* Applications list */}` — no fetch or display. |
| Leave Approval | `staff/LeaveApproval.tsx` | 🟡 | Fetches pending leaves and has `handleApprove`/`handleReject` but the JSX return is an empty container — nothing renders. |

### 1.2 Security Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Gate Passes | `security/GatePasses.tsx` | 🔴 | Single Card with "Manage security gate passes and approvals" text only. No list, no create form, no approve/reject. |

### 1.3 Inventory Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Stock Adjustment | `inventory/StockAdjustment.tsx` | 🟡 | Read-only list of existing adjustments. No form to create a new adjustment. |
| Vendor Management | `inventory/VendorManagement.tsx` | 🟡 | Read-only card list. No create/edit vendor form. |
| Inventory Reports | `inventory/InventoryReports.tsx` | 🟡 | Read-only report cards fetched from API. No filters, no export, no drill-down. |
| Stock Manager | `inventory/StockManager.tsx` | 🟡 | Read-only stock level list. No stock-in/stock-out form. |

### 1.4 Helpdesk Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Ticket Board | `helpdesk/TicketBoard.tsx` | 🟡 | Read-only card list of tickets. No ticket detail view, no status update, no comment/resolution workflow. |
| Create Ticket | `helpdesk/CreateTicket.tsx` | 🟡 | Small form. Missing file attachment, priority selection, category tree. |

### 1.5 Placement Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Drive Dashboard | `placement/DriveDashboard.tsx` | 🟡 | Read-only drive list. "View Applications" button has no route/action. No create drive form, no application management, no status tracking (shortlisted/rejected/offered). |

### 1.6 Alumni Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Donation Portal | `alumni/DonationPortal.tsx` | 🔴 | "Donate Now" button fires no action (no payment gateway for alumni donations). Campaigns displayed but cannot actually accept donations. |
| Job Board | `alumni/JobBoard.tsx` | 🟡 | Read-only job posting list. No apply workflow, no alumni job posting form. |
| Event Registration | `alumni/EventRegistration.tsx` | 🟡 | Event list display only. No registration form, no seat booking, no payment for paid events. |

### 1.7 Communication Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Delivery Reports | `communication/DeliveryReports.tsx` | 🟡 | Read-only delivery stats cards. No filters, no resend failed, no per-recipient drill-down. |

### 1.8 LMS Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Digital Resources | `lms/DigitalResources.tsx` | 🟡 | Small file. Resource list only, no upload form, no categorization. |
| Live Class Join | `lms/LiveClassJoin.tsx` | 🟡 | Shows live classes and opens `meeting_link` in a new tab. No real video integration — just a URL launch. No recording, no attendance tracking in-class. |

### 1.9 Library Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Catalog | `library/Catalog.tsx` | 🟡 | Small file. Likely read-only. No OPAC search, no reserve, no availability check. |

### 1.10 Certificates Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Certificate Request | `certificates/CertificateRequest.tsx` | 🟡 | Student can submit a request. No tracking page to see request status. No admin approval page. No certificate download/PDF view after approval. |

### 1.11 CRM Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Followup Scheduler | `crm/FollowupScheduler.tsx` | 🟡 | Small read-only list. No schedule new followup, no calendar view, no reminder setting. |

### 1.12 Fees Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Generate Monthly Invoices | `fees/GenerateMonthlyInvoices.tsx` | 🟡 | Single button with no preview or confirmation. No class-wise selection, no dry-run before generating. Uses MUI components inconsistently. |
| Bulk Allocate Fee Structure | `fees/BulkAllocateFeeStructure.tsx` | 🟡 | Requires manually typing comma-separated student IDs. No student search/multi-select picker. Uses MUI inconsistently. |

### 1.13 Students Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Student Analytics | `students/StudentAnalytics.tsx` | 🟡 | Shows gender/class/age charts (read-only). No export to PDF/Excel, no date filters, no drill-down to student list. |

### 1.14 Transport Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Transport Fleet | `transport/TransportFleet.tsx` | 🟡 | Read-only vehicle and route list. No add/edit vehicle form, no add/edit route form, no vehicle assignment. |

### 1.15 Group / Multi-School Module
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Headquarters | `group/Headquarters.tsx` | 🔴 | Placeholder that re-exports from a non-existent index. No multi-school dashboard, no cross-tenant reporting. |

### 1.16 Store / Parent Shop
| Page | File | Status | What's Missing |
|------|------|--------|----------------|
| Parent Shop | `store/ParentShop.tsx` | 🔴 | `checkout()` function fires `alert("Payment integration coming in Phase 5")`. No payment gateway connected. No order history, no order tracking. |

---

## 2. BACKEND — Missing or Minimal Implementations

### 2.1 Online Examination Engine
| Item | Status | Detail |
|------|--------|--------|
| `OnlineExam` model | 🟢 | Exists (`OnlineExam`, `OnlineExamSession`, `OnlineExamAnswer`) |
| Online exam ViewSet | ❌ | **Not implemented in `exams/views.py`**. Students cannot start, take, or submit online exams via API. The frontend `OnlineExamination.tsx` page has no working backend. |
| Proctoring / anti-cheat | ❌ | No webcam monitoring, tab-switch detection, or IP tracking. |

### 2.2 Habit Tracker
| Item | Status | Detail |
|------|--------|--------|
| Basic CRUD | 🟢 | `Habit` and `StudentHabitLog` with tenant filtering |
| Analytics & Streaks | ❌ | No streak calculation, no weekly completion rate, no student progress report |
| Gamification | ❌ | No points, badges, or leaderboard integration |

### 2.3 Placement Module
| Item | Status | Detail |
|------|--------|--------|
| Basic CRUD | 🟢 | `Recruiter`, `PlacementDrive`, `StudentApplication` |
| Application workflow | ❌ | No shortlisting, interview scheduling, offer letter generation, or final placement recording |
| Analytics | ❌ | No placement rate, no package analytics, no recruiter performance |

### 2.4 Salah Tracker
| Item | Status | Detail |
|------|--------|--------|
| Basic CRUD | 🟢 | `SalahRecord` with tenant filtering |
| Prayer time integration | ❌ | No Adhan API or prayer time calculation |
| Reporting | ❌ | No student-wise prayer compliance report, no streak tracking |

### 2.5 Communication Gateway
| Item | Status | Detail |
|------|--------|--------|
| Push Notifications (FCM) | 🟡 | Code references `fcm_service` but Firebase credentials not configured by default |
| SMS | ❌ | No MSG91, Twilio, or any SMS gateway integrated |
| WhatsApp | ❌ | No WhatsApp Business API integration |
| Email | ❌ | Django email backend exists but no transactional email service (SendGrid, Mailgun, SES) configured or integrated in communication workflows |
| Delivery tracking | 🟡 | Frontend shows delivery stats but no actual webhook from gateway to update them |

### 2.6 Live Class / Video Conferencing
| Item | Status | Detail |
|------|--------|--------|
| `LiveClass` model | 🟢 | Stores `meeting_link` (Google Meet URL) |
| Real video integration | ❌ | No Zoom API, no Jitsi embedded, no WebRTC. The "live class" is just a manual meeting link that opens in a new browser tab. No in-app attendance, no recording, no breakout rooms. |

---

## 3. MISSING INTEGRATIONS (Require Third-Party Keys)

| Integration | Module | Status | Notes |
|-------------|--------|--------|-------|
| Razorpay webhook | Fees | 🟡 | Order creation and signature verification exist but there is no `/api/fees/razorpay-webhook/` endpoint. Payment success is dependent on the frontend calling back — not server-verified. |
| SMS Gateway (MSG91 / Twilio) | Communication | ❌ | No code at all |
| WhatsApp Business API | Communication | ❌ | No code at all |
| Firebase FCM | Communication / Push | 🟡 | Service file exists but needs `FIREBASE_CREDENTIALS` secret configured |
| Email Service (SendGrid / Mailgun) | Communication | ❌ | No transactional email service; relies on Django's default SMTP which is not configured for production |
| Zoom / Jitsi | LMS | ❌ | Live class is just a stored URL |
| Payment for Alumni Donations | Alumni | ❌ | "Donate Now" button has no implementation |
| Payment for Parent Shop | Inventory/Store | ❌ | Checkout fires a browser `alert()` |

---

## 4. MOBILE APP — Almost Entirely Placeholder

The mobile app (`/mobile`) has **59 screens** total.  
**~30 screens (~51%)** are `PlaceholderScreen` — they display "This module is being set up. Check back soon!" with no data or functionality.

### Fully Implemented Mobile Screens
- Login / Auth
- Main Dashboard (stats, charts, quick actions)
- Student List + Add Student
- Mark Attendance (by class/section)
- Collect Fees
- Staff List
- Settings

### Placeholder Mobile Screens (❌ not implemented)
| Module | Placeholder Screens |
|--------|-------------------|
| Students | Edit Student, Student Documents, Student Remarks |
| Attendance | Attendance Reports, QR Scanner, Attendance History |
| Fees | Fee History, Fee Defaulters, Student Ledger, Payment Receipt |
| Staff | Staff Detail, Add Staff |
| Academics | Timetable, Exams, Result Entry, Assignments, Subjects, Grades, Homework, Syllabus |
| ID Cards | Templates, Scanner, Bulk Generation |
| Communication | Noticeboard, Messages |
| Finance | Finance Dashboard, Expenses, Vendors |
| HR & Payroll | Leave Management, Payslips |
| Operations | Library, Transport, Hostel, Inventory |
| CRM | Lead Board |
| Calendar | Calendar |
| Trackers | Salah Tracker, Habit Tracker |
| Helpdesk | Helpdesk |
| Notifications | Notifications |
| Reports | Reports |

---

## 5. MINOR GAPS & POLISH ITEMS

| Item | Location | Detail |
|------|----------|--------|
| `alert()` used for user feedback | ~15 frontend pages | Raw browser `alert()` instead of toast notifications in `GenerateMonthlyInvoices`, `BulkAllocateFeeStructure`, `FeeConfiguration`, `DocumentManager`, etc. |
| MUI mixed with Tailwind | Fees module | `GenerateMonthlyInvoices.tsx` and `BulkAllocateFeeStructure.tsx` use Material-UI components while the rest of the app uses Tailwind CSS. |
| Certificate download/PDF | Certificates | No PDF generation or download for issued certificates from the student-facing request page. |
| Staff Leave Applications list | `staff/LeaveApplications.tsx` | `{/* Applications list */}` comment is the only content in the list section. |
| CompOffRequest | `staff/CompOffRequest.tsx` | Exists only as a modal component, never surfaced in a parent page. |
| Student Analytics export | `students/StudentAnalytics.tsx` | Charts visible but no export to PDF/Excel. |
| Razorpay webhook | Backend | No server-side payment verification webhook — payment completion relies on frontend callback only. |
| `core` app | Backend | No `views.py` or `urls.py` — acts as a utility-only app (middleware, permissions). If API endpoints are ever needed here, they are absent. |

---

## 6. SUMMARY BY PRIORITY

### Critical (blocking core school operations)
1. ❌ **Online exam engine ViewSet** — models exist but students cannot take exams via API
2. ❌ **Razorpay payment webhook** — fee payments not server-verified
3. ❌ **SMS / Email gateway** — communication module cannot send messages to parents
4. 🔴 **Staff Leave Applications list** — page has no list rendering
5. 🔴 **Staff Leave Approval** — JSX is an empty container, approvals cannot be processed

### High (important for daily use)
6. 🔴 **Staff Health Records** — complete UI missing despite full backend
7. 🔴 **Staff Training Management** — complete UI missing despite full backend
8. 🔴 **Staff Appraisal** — complete UI missing despite full backend
9. 🔴 **Gate Passes** — single text card, no functional UI
10. 🟡 **Helpdesk Ticket Board** — read-only, no workflow actions
11. 🟡 **Placement workflow** — no shortlisting, interview, or offer letter stages
12. 🟡 **Transport Fleet** — read-only, no vehicle/route management

### Medium (feature completeness)
13. 🔴 **Parent Shop checkout** — placeholder `alert()`, no payment
14. 🔴 **Alumni Donation Portal** — "Donate Now" does nothing
15. 🟡 **Certificate request tracking** — no status tracking or download
16. 🔴 **Live class video** — just a meeting link, no real integration
17. 🟡 **Delivery Reports** — no resend, no per-recipient detail
18. 🟡 **Inventory stock adjustment/vendor** — read-only

### Low (nice to have)
19. 🟡 Habit Tracker analytics / streaks
20. 🟡 Salah Tracker prayer time integration
21. 🟡 Student Analytics export
22. 🟡 Library OPAC catalog with search
23. 🟡 CRM Followup Scheduler calendar view
24. ❌ **Mobile app** — 30 of 59 screens are placeholders
25. 🔴 **Group/Headquarters** multi-school HQ dashboard
