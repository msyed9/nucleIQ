# Phase 3.0: HR & Payroll

**Goal**: Manage staff lifecycle and compensation.

---

## Prompt 3.1: Human Resource Management (HRM)

**Context**: Extension of Staff module.

```markdown
# 👥 HR & PAYROLL SYSTEM

Implement comprehensive HR management.

## 📝 Functional Requirements

1.  **Leave Management**:
    - `LeaveType`: Sick, Casual, Earned.
    - `LeaveApplication`: Workflow (Apply -> Approve/Reject).
    - `LeaveBalance`: Track quotas.

2.  **Payroll Engine**:
    - `SalaryStructure`: Base + HRA + Transport - Tax.
    - `PayrollCycle`: Monthly generation.
    - **Logic**: 
        - Auto-calculate "Loss of Pay" from Attendance.
        - Generate Payslip (PDF).

## 📦 Deliverables
- `backend/hr/models.py`.
- `backend/payroll/models.py`.
- `backend/payroll/utils.py` (Salary Calculator).
- `frontend/src/pages/hr/LeaveManage.tsx`.
- `frontend/src/pages/payroll/PayslipView.tsx`.
```
