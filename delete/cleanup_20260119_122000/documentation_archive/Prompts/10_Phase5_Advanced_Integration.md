# Phase 5: Advanced Integration & Mobile

**Goal**: Extend the platform beyond the browser and into the ecosystem.

---

## Prompt 5.1: Alumni Management Portal

**Context**: Schools want to engage with past students for fundraising and networking.

```markdown
# 🎓 ALUMNI NETWORK & FUNDRAISING

Build a "LinkedIn-lite" for school alumni.

## 📝 Functional Requirements

1.  **Directories**:
    - **Alumni Profile**: Current Company, Designation, Batch Year.
    - **Search**: "Find all Alumni working at Google".

2.  **Engagement**:
    - **Events**: Reunions, Mentorship sessions.
    - **Jobs Board**: Alumni posting internships for current students.
    - **Donations**: Fundraising campaigns (Payment Gateway integration).

3.  **Lifecycle**:
    - **Auto-Convert**: When Student status = 'Graduated', auto-create Alumni profile invites.

## 📦 Deliverables
- `backend/alumni/models.py` (Profile, Job, Event, Donation).
- `frontend/src/pages/alumni/AlumniPortal.tsx` (Public facing for registered alumni).
```

---

## Prompt 5.2: Live Classroom & Zoom Integration

**Context**: Hybrid learning is here to stay.

```markdown
# 📹 LIVE VIRTUAL CLASSROOM

Integrate video conferencing for remote teaching.

## 📝 Functional Requirements

1.  **Integration**:
    - **Providers**: Zoom API, Google Meet (Link), Jitsi (Self-hosted).
    - **Scheduling**: Auto-create Zoom meeting when Timetable Slot is marked "Online".

2.  **LMS Features**:
    - **Live Polls**: Teacher pushes question -> Student votes.
    - **Attendance**: Auto-mark "Present" if student joins Zoom link via portal.
    - **Recording**: Auto-archive Zoom cloud recording link to Lesson Plan.

## 📦 Deliverables
- `backend/lms/video_services.py` (Zoom/Jitsi Wrappers).
- `frontend/src/pages/lms/LiveClassJoin.tsx`.
```

---

## Prompt 5.3: White-Label Mobile App (iOS & Android)

**Context**: Every tenant wants "Their Own App" on the Play Store.

```markdown
# 📱 WHITE-LABEL REACT NATIVE APP

Build a single codebase that can adapt to 1000s of tenants dynamically.

## 📝 Functional Requirements

1.  **Architecture (One App vs Many)**:
    - **Strategy A (Standard)**: "NucleiQ Connect" app. User enters "School Code" -> App morphs into School's Branding (Logo, Colors, Name) using `TenantBranding` API.
    - **Strategy B (Premium)**: CI/CD Pipeline (Fastlane) to auto-build standalone APK/IPA files with unique Bundle IDs (`com.schoolname.app`) for top-tier clients.

2.  **Dynamic Theming**:
    - **Splash Screen**: Fetch branding immediately on interaction.
    - **Home Screen**: Configurable widgets (controlled by Admin Dashboard).
    - **Assets**: App Icon generation pipeline for Strategy B.

3.  **Core Features**:
    - **Offline Sync**: Caching for poor network areas.
    - **Push Notifications (FCM)**: Targeted routing (Tenant -> Class -> Student).

## 📦 Deliverables
- `mobile/` (React Native Expo project).
- `mobile/src/context/ThemeContext.tsx` (Dynamic Styling).
- `mobile/fastlane/` (Automation scripts for White-label builds).
- `backend/api/mobile_views.py`.
```

---

## Prompt 5.4: Multi-School Group Management (Enterprise)

**Context**: For chains running 50+ schools (e.g., DPS, Ryan International).

```markdown
# 🏢 GROUP OF SCHOOLS HEADQUARTERS

Super-Admin layer for managing multiple tenants under one umbrella.

## 📝 Functional Requirements

1.  **Group Dashboard**:
    - Aggregated Revenue: "Total Collection across 50 branches".
    - Standardized Curriculum: Create "Math Syllabus" once, push to all 50 schools.
    - Staff Transfer: Move Teacher from "Branch A" to "Branch B" (Tenant to Tenant transfer).

2.  **Audit**:
    - "Central Auditor" role who can view but not edit tenant data.

## 📦 Deliverables
- `backend/tenants/group_views.py`.
- `frontend/src/pages/group/Headquarters.tsx`.
```
