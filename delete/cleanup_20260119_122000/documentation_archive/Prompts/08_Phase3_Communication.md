# Phase 3.1: Communication & Engagement

**Goal**: Connect the stakeholders.

---

## Prompt 3.2: Communication Center

**Context**: Sending messages.

```markdown
# 📡 COMMUNICATION HUB

Integrate SMS, Email, and WhatsApp.

## 📝 Functional Requirements

1.  **Providers**:
    - **SMS**: Twilio / MSG91.
    - **Email**: AWS SES / SendGrid.
    - **WhatsApp**: Interaction with Business API.

2.  **Features**:
    - **Notice Board**: Digital circulars.
    - **Broadcast**: "Send to all Class 5 Parents".
    - **Templates**: Pre-approved message templates.

## 📦 Deliverables
- `backend/communication/services.py`.
- `backend/communication/models.py` (MessageLog).
- `frontend/src/pages/communication/NoticeBoard.tsx`.
```

---

## Prompt 3.3: Lead Generation & CRM

**Context**: Managing admissions pipeline and visitors.

```markdown
# 📈 LEAD GENERATION & ADMISSIONS CRM

Manage the complete lifecycle from "Enquiry" to "Admitted Student".

## 📝 Functional Requirements

1.  **Lead Management (The Core)**:
    - **Sources**: Walk-in, Website Form, Referral, Social Media, Education Fair.
    - **Lead Status Pipeline**: New -> Contacted -> Campus Visit -> Application Received -> Admitted -> Lost.
    - **Follow-ups**: Schedule calls/tasks (e.g., "Call parent on Monday"). Sync with Calendar.

2.  **Online Admission Form (Public Widget)**:
    - A public-facing React component/iframe that schools can embed on their website.
    - Direct injection into `Lead` table.

3.  **Visitor Log**:
    - Check-in/Check-out with Photo (Webcam integration).
    - Purpose: "Enquiry", "Vendor", "Parent Meeting".
    - Badge printing.

4.  **Analytics & Data Handling**:
    - **Conversion Rate**: Enquiry vs Admitted metrics.
    - **Bulk Operations**:
        - **Import**: CSV/Excel uploader for Leads (e.g., from Education Fair data).
        - **Export**: Download filtered Lead lists to Excel.
    - **Public Admission Portal**:
        - Standalone URL for parents to register, upload docs, and track status ("Shortlisted", "Admitted").
        - Integration with Payment Gateway for "Application Fee".

## 📦 Deliverables
- `backend/crm/models.py` (Lead, Interaction, Visitor).
- `backend/crm/views.py`.
- `frontend/src/pages/crm/LeadKanbanBoard.tsx` (Drag-and-drop pipeline).
- `frontend/src/pages/crm/WebFormWidget.tsx`.
```

---

## Prompt 3.4: Tenant Website Builder (CMS)

**Context**: Every tenant gets a public-facing website (`school.platform.com`) to drive admissions.

```markdown
# 🌐 TENANT WEBSITE BUILDER AND CMS

Build a "Wix-lite" website builder for schools.

## 📝 Functional Requirements

1.  **Site Architecture**:
    - **Hosting**:
        - Default: `tenant_subdomain.platform.com`.
        - Custom: `www.schoolname.com` (CNAME mapping).
    - **Pages**: Home, About Us, Admissions, Gallery, Contact, News.

2.  **Visual Editor (No-Code)**:
    - **Drag-and-Drop**: Edit text, swappable images, section reordering.
    - **Components**: Hero Slider, Principal's Message, Faculty Grid, Testimonials, Map.
    - **Live Preview**: Mobile/Desktop view switching.

3.  **Template Engine (100+ Templates)**:
    - **Requirement**: Provide **100+ High-Quality Templates** out of the box.
    - **Categories**: Modern, Traditional, Ivy League, Playful (Kindergarten).
    - **Technology**: Tailwind-based JSON configs applied to dynamic React components.

4.  **Integration**:
    - "Apply Now" button automatically links to the **Admissions CRM** (Prompt 3.3).
    - "News" section pulls from **Notice Board** (Prompt 3.2).

## 📦 Deliverables
- `backend/cms/models.py` (Page, Section, Asset, Theme).
- `frontend/src/pages/cms/WebsiteBuilder.tsx` (The Editor).
- `frontend/src/public/PublicSchoolSite.tsx` (The Renderer).
```
