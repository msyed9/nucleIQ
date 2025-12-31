# Phase 0: Architecture & Foundation

**Goal**: Establish the multi-tenant SaaS foundation, authentication, billing, and dashboarding.
**Tech Stack (Optimized)**:
- **Backend**: Python Django 5.0+ (Async Support), Django REST Framework.
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **State/Data**: TanStack Query (React Query) - *Critical for caching*, Zustand (Global State).
- **Forms**: React Hook Form + Zod Validation.
- **Database**: PostgreSQL 16+ (Row Level Security), Redis (Cache/Queues).
- **DevOps**: Docker, Github Actions.

---

## 🛠️ Tech Stack Review & Best Practices
*Based on analysis for a scalable Multi-Tenant SaaS.*

1.  **Why Django 5.0?**: Standard version for 2024/2025. Better async support for WebSockets (Chat/Notifications).
2.  **Why TanStack Query?**: Reduces boilerplate. Replaces `useEffect` for data fetching. Handles caching, background refetching, and optimistic updates out-of-the-box.
3.  **Why Zod + Hook Form?**: Type-safe form validation that mirrors the backend schemas.
4.  **Why RLS?**: "Row Level Security" is the gold standard for multi-tenancy. It prevents data leaks at the database engine level, even if application code fails.


---

## Prompt 0.1: Core Architecture & Multi-Tenancy

**Context**: Green field project setup.
**Role**: Senior Software Architect & Full Stack Engineer.

```markdown
# 🚀 CORE ARCHITECTURE INSTRUCTION

You are tasked with building the foundational architecture for "NucleIQ", a multi-tenant School Management SaaS.

## 🛠️ Technical Specifications
- **Backend**: Django 5.0+, Django REST Framework (DRF).
- **Database**: PostgreSQL 16+ with **Row Level Security (RLS)**. This is CRITICAL.
- **Frontend**: React 18+, TypeScript, Vite, Tailwind CSS, Shadcn UI.
- **Tenancy**: Single Database, Shared Schema, Identifier = `tenant_id` column on every table. RLS policies must enforce isolation.

## 📝 Functional Requirements

1.  **Project Structure (Docker-First)**:
    - **Principle**: "If it runs on your machine, it runs in Prod." **Development MUST happen inside Docker containers.**
    - **Setup**:
        - `docker-compose.yml`: Main orchestrator. Services: `backend` (Django), `frontend` (Vite), `db` (Postgres), `redis`, `celery`, `celery-beat`.
        - **Volumes**: Map local `./backend` -> `/app/backend` and `./frontend` -> `/app/frontend` for **Hot Reloading**.
    - **Execution**: The user should strictly run `docker compose up` and not install Python/Node locally.

2.  **Base Models & Strategies**:
    - `BaseModel`: Abstract model containing:
        - `id`: UUID (primary key).
        - `created_at`, `updated_at`.
        - `created_by`, `updated_by` (User FK).
        - `is_deleted` (bool), `deleted_at`, `deleted_by` (Soft Delete Pattern).
    - **TenantAwareModel**: Inherits from `BaseModel`.
        - Adds `tenant` (FK to Tenant model).
        - **Critical**: Override `objects` manager to filter `is_deleted=False` AND enforce tenant isolation logic at application layer (safety net for RLS).

3.  **Core Models**:
    - `Tenant`: Name, subdomain, schema_name, plan, is_active.
    - `TenantBranding` (OneToOne with Tenant):
        - **Assets**: `logo_url`, `favicon_url`, `login_background_url`, `email_header_image`.
        - **Theming**: `primary_color`, `sidebar_color`, `font_family`.
        - **Gallery**: `gallery_images` (JSON list of URLs for login carousel/school profile).
    - `Domain`: Custom domains (e.g., `portal.myschool.com`).
    - `AcademicYear`:
        - `name` (e.g., "2024-2025").
        - `start_date`, `end_date`.
        - `is_active` (bool, only one active per tenant).
        - `is_locked` (bool, for past years).

4.  **Middleware**:
    - `TenantMiddleware`: 
        - Extract tenant from subdomain or `X-Tenant-ID` header.
        - Set `connection.cursor()` RLS variable.
        - **Inject Branding**: Attach the branding object to the `request` for the frontend to auto-apply colors/logos.

5.  **Infrastructure**:
    - `docker-compose.yml`: Services for db, redis, web, worker.
    - `Dockerfile`: Multi-stage builds.

## 📦 Deliverables
Generate the following files with **COMPLETE IMPLEMENTATION** (No placeholders):
- `backend/config/settings/*` (base, dev, prod).
- `backend/core/models.py` (BaseModel, TenantAwareModel).
- `backend/core/middleware.py`.
- `backend/tenants/models.py` (Tenant, TenantBranding, Domain, AcademicYear).
- `backend/Dockerfile`, `frontend/Dockerfile`.
- `docker-compose.yml`.
- `README.md` (Setup instructions).
```

---

## Prompt 0.2: Authentication & Authorization (RBAC)

**Prerequisites**: Prompt 0.1 completed.

```markdown
# 🔐 AUTHENTICATION & RBAC INSTRUCTION

Implement a robust JWT-based Auth and Role-Based Access Control (RBAC) system with deep user customization.

## 📝 Functional Requirements

1.  **Authentication**:
    - `SimpleJWT` for tokens.
    - Custom `User` model inheriting `AbstractUser` and `TenantAwareModel`.
    - **Username**: Globally Unique Email.

2.  **User Personalization (Granular Settings)**:
    - `UserPreference` Model (OneToOne with User):
        - **UI**: `theme_mode` (Light/Dark/System), `density` (Compact/Comfortable), `language` (en/hi/ar/ur).
        - **Notifications**: `channels` JSON (e.g., `{'sms': true, 'email': false, 'whatsapp': true}`).
        - **Layout**: `sidebar_collapsed` (bool), `dashboard_widgets` (JSON: order and visibility of widgets).
    - **API**: Endpoint to patch partial preferences (e.g., toggle Dark Mode instantly).

3.  **Frontend & i18n**:
    - **Library**: `i18next` & `react-i18next`.
    - **RTL Support**: Auto-switch layout direction (`dir="rtl"`) for Urdu (ur) and Arabic (ar).
    - **Translations**: JSON locales for storing UI strings.

4.  **RBAC Models**:
    - `Role`: Name (Principal, Teacher, Accountant), description, tenant (FK).
    - `Permission`: Resource (module), Action (create, read, update, delete).
    - `RolePermission`: Mapping.
    - **Granular Logic**: check_permission(user, 'student_module', 'create').

4.  **Platform Administration**:
    - Super Admin Dashboard (Tenant Management).
    - **Impersonation**: "Login as Tenant" feature for support.

5.  **Frontend Auth**:
    - `AuthProvider` context loading User + Preferences.
    - `ProtectedRoute` wrapper.
    - Shadcn UI Login/Forgot Password forms (styled with Tenant Branding).

## 📦 Deliverables
- `backend/users/models.py` (User, UserPreference, Role, Permission).
- `backend/users/serializers.py`.
- `backend/users/views.py`.
- `frontend/src/context/AuthContext.tsx`.
- `frontend/src/context/ThemeContext.tsx` (Applies Tenant Colors + User Preference).
- `backend/core/permissions.py`.
```

---

## Prompt 0.3: Subscription & Billing

**Prerequisites**: Prompt 0.1, 0.2 completed.

```markdown
# 💸 BILLING & SUBSCRIPTION INSTRUCTION

Implement the monetization engine.

## 📝 Functional Requirements

1.  **Models**:
    - `SubscriptionPlan`: Name (Basic, Pro), price, limits (student_count, storage).
    - `Subscription`: Tenant, Plan, Start/End Date, Status (Active, PastDue).
    - `Invoice`: PDF URL, Amount, Status.

2.  **Enforcement**:
    - Middleware/Decorator to check `subscription.is_active`.
    - **Limit Checks**: Logic to block "Add Student" if limit reached.

3.  **Gateways**:
    - **Razorpay** (India focus) & **Stripe** (International).
    - Webhook handlers for renewals/failures.

## 📦 Deliverables
- `backend/billing/models.py`.
- `backend/billing/services.py` (Gateway wrappers).
- `backend/billing/webhooks.py`.
- `frontend/src/pages/billing/SubscriptionManage.tsx`.
```

---

## Prompt 0.4: Dashboard & Global Search

**Prerequisites**: Core foundation ready.

```markdown
# 📊 DASHBOARD & SEARCH

Create the landing experience.

## 📝 Functional Requirements

1.  **Smart & Customizable Dashboard**:
    - **Widget Registry**: A library of component widgets (e.g., `FeeTrendChart`, `AbsenteeList`, `NextClassCard`).
    - **Role-Based Availability**: Accountant sees Finance widgets; Teacher sees Academic widgets.
    - **Personalization Engine**:
        - **Edit Mode**: User clicks "Customize" -> Drag-and-Drop Grid (using `react-grid-layout`).
        - **Persistence**: Save JSON layout (`{ widgetId: 'fee_chart', x: 0, y: 0, w: 2, h: 2 }`) to `UserPreference.dashboard_widgets`.
    - **Stats**: Cached counters (Redis) for performance.

2.  **Global Command Palette (Ctrl+K)**:
    - Search Students, Staff, Pages, Settings.
    - Uses **PostgreSQL Full Text Search** (`SearchVector`).
    - **Crucial**: Must filter by Tenant AND User Permissions (e.g., Teacher cannot search other teachers' salaries).

3.  **School Admin Analytics (Tenant-Level)**:
    - **Academic Heatmap**: Visual grid showing Class-Subject performance (Red = Low Average). "Class 5B Math scores dropped by 10%".
    - **Financial Health**: 
        - **Cash Flow**: Collections this month vs Expenses.
        - **Ageing Report**: Outstanding Fees bucketed (<30d, 30-60d, >90d).
    - **Staff Efficiency**: Correlation graph "Teacher Attendance vs Syllabus Completion %".

4.  **System Health (Super Admin)**:
    - Tenant growth charts.
    - Error rate monitoring.

## 📦 Deliverables
- `backend/dashboard/views.py`.
- `backend/dashboard/analytics_service.py` (Tenant level aggregation).
- `backend/search/views.py` (SearchVector implementation).
- `frontend/src/components/layout/CommandPalette.tsx`.
- `frontend/src/pages/Dashboard.tsx`.
```

---

## Prompt 0.5: Student 360° Golden Record

**Context**: The "Single Pane of Glass" for any student. This is the most used screen in the system.

```markdown
# 🌟 STUDENT 360° GOLDEN RECORD

Create the "Entity Dashboard" that aggregates data from all modules into a single holistic view.

## 📝 Functional Requirements

1.  **Composite UI Architecture**:
    - The page is a shell containing independent widgets.
    - **Layout**:
        - **Left Sidebar**: Identity (Photo, Name, Class Only, Sibling Links).
        - **Main Feed** (Center): "Facebook-style" timeline of interaction (Remarks, Discipline, Achievements).
        - **Right Panel**: Key KPIs (Attendance %, Fee Balance, Next Exam).
    - **Tabs**: Academics, Finance, Library, Health, Documents.

2.  **The "Universal Feed" (Core Feature)**:
    - **Universal Remarks System**: A central `Remark` model where *any* staff (Driver, Librarian, Teacher) can post a note.
    - **Types**: POSITIVE (Green), NEGATIVE (Red), NEUTRAL (Gray), COMPLAINT (Alert).
    - **Visibility**: `visible_to_parent` (bool).
    - **Auto-Integration**: Automatically log system events as remarks (e.g., "Library Book Overdue > 7 days", "Bus Breakdown Report", "Hostel Discipline Issue").
    - **Use Case**: Bus driver logs "Left bag in bus" -> Parent sees notif -> Teacher knows why homework isn't done.

3.  **Sibling Logic**:
    - "Switch Sibling" dropdown if parents have multiple kids.
    - **Family Financial View**: "Pay All Fees" button aggregating all siblings.

4.  **Backend Aggregation Service**:
    - `Student360Service.get_summary(student_id)`: Returns the high-level KPI JSON efficiently.

## 📦 Deliverables
- `backend/students/models.py`: Add `StudentRemark` (polymorphic or simple FK).
- `backend/students/services.py`: `get_360_profile_data`.
- `frontend/src/pages/students/Student360.tsx`: The master profile page.
- `frontend/src/components/student360/UniversalFeed.tsx`.
```

---

## Prompt 0.6: Platform Intelligence & Analytics (Super Admin)

**Context**: The "God View" for the SaaS Owner to monitor the business health.

```markdown
# 📡 PLATFORM INTELLIGENCE DASHBOARD

Build the analytics engine for the Super Admin to monitor Tenant health and Business metrics.

## 📝 Functional Requirements

1.  **Tenant Monitoring (Health Score)**:
    - **Health Score Algorithm**: Calculate 0-100 score based on:
        - `Daily Active Users (DAU)` / `Total Users`.
        - `Error Rate` (from logs).
        - `Feature Adoption` (Are they using >3 modules?).
    - **Alerts**: "Tenant X Health dropped to 40% (Churn Risk)".

2.  **Usage & Behavioral Analytics**:
    - **Resource Tracking**: Storage Used (S3), Database Rows, SMS/Email Credits consumed.
    - **Module Popularity**: "80% of schools use Attendance, but only 10% use Library" -> Identifying product gaps.
    - **Peak Times**: "System load highest at 8:30 AM (Attendance Marking)".

3.  **Predictive Intelligence (AI)**:
    - **Churn Prediction**: Identify tenants with declining usage trends over 30 days.
    - **Upsell Opportunities**: Flag tenants hitting 90% logic limits (e.g., "Student Reach Limit").

4.  **Financial Analytics**:
    - **MRR/ARR**: Monthly/Annual Recurring Revenue charts.
    - **Cohorts**: "Retention rate of Tenants joined in Jan 2024 vs Jan 2025".
    - **Revenue Forecasting**: "Expected collections next month based on renewals".

## 📦 Deliverables
- `backend/analytics/models.py` (TenantMetric, UsageLog).
- `backend/analytics/tasks.py` (Daily Aggregation Cron).
- `frontend/src/pages/admin/PlatformDashboard.tsx`.
```
