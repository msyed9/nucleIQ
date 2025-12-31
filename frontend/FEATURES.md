**Prioritized Features & Estimates**

This file lists recommended features to implement in priority order, with a short description and a rough implementation estimate (dev hours) and risk/notes.

Overview
- Purpose: prioritized feature backlog for frontend work that connects to backend endpoints discovered in `frontend/api-mapping.csv`.

High Priority
- Attendance Aggregates Dashboard: Build charts and aggregate views for attendance (uses `api/attendance/records/` and `api/attendance/config/`). Estimate: 16h. Notes: high user value; requires charting library (e.g., Recharts or Chart.js).
- Student Management (Full CRUD): Replace simple list with create/edit forms, validation, bulk actions, and import/export (uses `api/students/students/`, `api/students/enrollments/`). Estimate: 24h. Notes: authentication + RBAC checks.
- Fee Defaulter Workflows: UI for viewing defaulters, sending reminders (email/WhatsApp/SMS) and retrying payments (uses `api/fees/defaulters/`, `api/communication/broadcasts/`). Estimate: 20h. Notes: integrate messaging provider settings.
- Library Issue/Return Flow: Implement book issue/return, member management (uses `api/library/issues/`, `api/library/members/`). Estimate: 16h.

Medium Priority
- Transport Management: Vehicle/route/stop management and allocation map view (uses `api/transport/vehicles/`, `api/transport/routes/`). Estimate: 18h.
- Helpdesk Full Workflow: ticket creation (with attachments), assignment, status changes (uses `api/helpdesk/tickets/`). Estimate: 12h.
- Dashboard Widgets: expose `api/dashboard/widgets/` and layout editor for users (uses `api/dashboard/layout/`). Estimate: 14h.

Low Priority
- Payroll/Payslips UI: payslip viewer and payroll run controls (uses `api/payroll/payslips/`). Estimate: 18h.
- CMS Admin Panels: page/theme editor for `api/cms/*` endpoints. Estimate: 30h (complex).
- Analytics Reports: build scheduled reports using `api/analytics/*`. Estimate: 24h.

Implementation Guidance
- Start with small, testable pieces: lists with pagination and a create/edit dialog (already implemented in several pages).
- Use centralized `api` wrapper for requests and consistent error handling and to inject tenant headers.
- Add unit tests for forms and integration tests for key flows (students, fees, attendance).

Next Steps
- Triage `frontend/api-mapping.csv` and pick top 3 features to implement in the next sprint.
- Replace remaining prompt-based flows with dialog forms (done for students, transport, library, helpdesk).

Generated: 2025-12-31
