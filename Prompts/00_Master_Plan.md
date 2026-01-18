# 🚀 NucleiQ SaaS - Master Execution Plan

This document outlines the sequential execution order for building the NucleiQ School Management SaaS. 
**ALL PROMPTS MUST BE EXECUTED IN THIS ORDER.**

## 🛑 Critical Architecture Note: Academic Year
A core requirement has been added: **Academic Year Multi-Tenancy**.
- Almost all data (Enrollments, Fees, Exams, Attendance) MUST be scoped to an `AcademicYear`.
- The system must support historical data retention (e.g., viewing 2023 data while in 2024).
- Users must be able to "switch" academic years to view past records, but default to `current_active_year`.

---

## 📅 Execution Sequence

> **💡 Pro Tip**: Refer to **[00_AI_Tool_Selection_Guide.md](./00_AI_Tool_Selection_Guide.md)** to see which AI model (Claude, GPT, v0) is best suited for each prompt.

### 🏗️ Phase 0: Foundation (The Bedrock)
*Establish the SaaS capability, multi-tenancy, and secure access.*

1. **[01_Phase0_Architecture.md](./01_Phase0_Architecture.md)**
   - **0.1 Core & Multi-Tenancy**: Django setup, RLS, Tenant model.
   - **0.2 Auth & RBAC**: Users, Roles, Permissions (JWT).
   - **0.3 Billing & Subscriptions**: Stripe/Razorpay, Plans, Invoices.
   - **0.4 Dashboard & Search**: Global Command Palette, Widgets.
   - **0.5 Student 360° Golden Record**: The "Universal Feed" and comprehensive profile aggregation.
   - **0.6 Platform Intelligence**: Super Admin metrics, Health Scores, and AI Prediction.

### 🎓 Phase 1: Core Academic Essentials
*The minimum viable product for a school to function.*

2. **[02_Phase1_Academic_Structure.md](./02_Phase1_Academic_Structure.md)**
   - **1.1 Academic Years & Terms**: Defining the "Time" dimension.
   - **1.2 Classes, Sections & Subjects**: Defining the "Structure" dimension.
   
3. **[03_Phase1_Student_Staff.md](./03_Phase1_Student_Staff.md)**
   - **1.3 Student Admissions**: Enrollment logic linked to Academic Year.
   - **1.4 ID Card Generator**: Visual designer.
   - **1.5 Staff Management**: Directories and Profiles.

4. **[04_Phase1_Operations.md](./04_Phase1_Operations.md)**
   - **1.6 Attendance System**: Multi-method (QR, RFID, Face).
   - **1.7 Fees & Finance**: Fee Structures (Year-based), Collections, Due Reports.

### 📚 Phase 2: Learning & Evaluation
*The academic delivery mechanisms.*

5. **[05_Phase2_Academics.md](./05_Phase2_Academics.md)**
   - **2.1 Timetable Management**: Scheduling linked to Academic Year.
   - **2.2 Lesson Planning**: Syllabus tracking.
   - **2.3 Homework & Assignments**: Digital submission.

6. **[06_Phase2_Examination.md](./06_Phase2_Examination.md)**
   - **2.4 Exam Management**: Scheduling, Question Banks.
   - **2.5 Grading & Reports**: Dynamic Report Cards (OBE support).

### 👥 Phase 3: Communication & HR
*Managing people and engagement.*

7. **[07_Phase3_HR_Payroll.md](./07_Phase3_HR_Payroll.md)**
   - **3.1 HR & Payroll**: Salary structures, Leave management.
   
8. **[08_Phase3_Communication.md](./08_Phase3_Communication.md)**
   - **3.2 Comm Center**: SMS/WhatsApp/Email, Notices.
   - **3.3 Lead Gen & CRM**: Pipeline, Website Widget, Visitor Log.
   - **3.4 Website CMS**: 100+ Templates, Subdomain Builder.

### 🚀 Phase 4: Extended Features
*Premium modules for Enterprise plans.*

9. **[09_Phase4_Extended.md](./09_Phase4_Extended.md)**
   - **4.1 Library (LMS)**: Book issue/return.
   - **4.2 Transportation**: Routes, Stops, Vehicle tracking.
   - **4.3 Inventory**: Stock management.
   - **4.4 Hostel/Dormitory**: Room allocation.
   - **4.5 Salah Tracker**: Prayer logging & Streaks.
   - **4.6 Habit Tracker**: Good/Bad habits & Discipline.

### 🌐 Phase 5: Advanced & Mobile
*Connecting the ecosystem.*

10. **[10_Phase5_Advanced_Integration.md](./10_Phase5_Advanced_Integration.md)**
    - **5.1 Alumni**: Networking & Fundraising.
    - **5.2 Live Class**: Zoom/Jitsi integration.
    - **5.3 Mobile API**: Push Notifications & FCM.
    - **5.4 Group Schools**: Multi-tenant aggregation.

### 🛠️ Phase 6: Admin Utilities
*Streamlining the office.*

11. **[11_Phase6_Admin_Utilities.md](./11_Phase6_Admin_Utilities.md)**
    - **6.1 Certificates**: TCs, Bonafides, Character Certs.
    - **6.2 Gate Pass**: Student Exit Security.
    - **6.3 Placement Cell**: Campus Recruitment.
    - **6.4 Helpdesk**: Parent Support Tickets.

---

## 🛠️ Usage Instructions
1. Open the file corresponding to your current phase.
2. Copy the **Prompt** block content.
3. Paste into Claude 3.5 Sonnet.
4. Verify the output against the "Deliverables" checklist.
5. Move to the next prompt only after the previous one is fully working and tested.
