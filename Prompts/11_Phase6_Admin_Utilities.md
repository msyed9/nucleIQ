# Phase 6: Administration Utilities & Support

**Goal**: Streamline the daily administrative burden and support operations.

---

## Prompt 6.1: Certificate Generation Engine

**Context**: Schools issue hundreds of certificates (Bonafide, Transfer, Conduct) annually.

```markdown
# 📜 DYNAMIC CERTIFICATE GENERATOR

Create a template-based system for official documents.

## 📝 Functional Requirements

1.  **Template Engine**:
    - **Variables**: `{StudentParams}` (Name, DOB, FatherName, AdmissionDate).
    - **Rich Text Editor**: Admin creates the legal text for the certificate.
    - **Header/Footer**: Configurable Stationaries (Logo, Principal Signature).

2.  **Workflow**:
    - **Request**: Parent requests "Bonafide Certificate" via Portal.
    - **Approval**: Admin approves -> System generates PDF with unique Serial Number.
    - **Verification**: QR Code on certificate validates authenticity.

## 📦 Deliverables
- `backend/certificates/models.py`.
- `backend/certificates/generator.py` (PDF Engine).
- `frontend/src/pages/admin/CertificateTemplates.tsx`.
```

---

## Prompt 6.2: Gate Pass & Security

**Context**: Ensuring student safety during school hours.

```markdown
# 👮 GATE PASS MANAGEMENT

Control logic for students leaving the campus.

## 📝 Functional Requirements

1.  **Workflow**:
    - **Parent Request**: "Early Pickup for Doctor Appointment".
    - **Approval**: Class Teacher approves.
    - **Gate Pass**: Digital Pass (QR) generated on Parent App.
    - **Security Check**: Guard scans QR at gate -> Exit recorded timestamp.

2.  **Alerts**:
    - SMS sent to Parents immediately upon Gate Exit scan.

## 📦 Deliverables
- `backend/security/gate_pass_models.py`.
- `frontend/src/pages/security/GuardScanner.tsx`.
```

---

## Prompt 6.3: Placement Cell (Higher Ed Add-on)

**Context**: For High Schools and Colleges managing recruitment.

```markdown
# 👔 PLACEMENT & RECRUITMENT CELL

Track campus interviews and student offers.

## 📝 Functional Requirements

1.  **Company CRM**: Database of Recruiters (Contact Person, History).
2.  **Drive Management**:
    - "Google Campus Drive 2024".
    - Eligible Students (Filter by GPA > 8.0).
    - Student Applications.
3.  **Offer Tracking**:
    - Track "Selected", "Package/CTC", "Joining Date".

## 📦 Deliverables
- `backend/placement/models.py`.
- `frontend/src/pages/placement/DriveDashboard.tsx`.
```

---

## Prompt 6.4: Helpdesk & Support Ticketing

**Context**: Managing parent complaints efficiently.

```markdown
# 🎫 HELPDESK & TICKETING SYSTEM

A structured way for parents to ask for help.

## 📝 Functional Requirements

1.  **Categories**: "Fee Issue", "Transport Delay", "Academic Query".
2.  **Automated Routing**:
    - "Fee Issue" -> Routes to Accountant.
    - "Academic" -> Routes to Class Teacher.
3.  **SLA Tracking**:
    - "Overdue" flag if not resolved in 48 hours.
    - Escalation to Principal.

## 📦 Deliverables
- `backend/helpdesk/models.py`.
- `frontend/src/pages/helpdesk/TicketBoard.tsx`.
```
