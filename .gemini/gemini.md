# 🌌 GEMINI.MD - NucleiQ Development Constitution
## Common Guiding Principles & System Standards

**Project**: NucleiQ (School Management SaaS)
**Target**: Premium, Multi-Tenant Educational Ecosystem
**Tech Stack**: React 18 (Shadcn UI) | Django 4.2 (DRF) | PostgreSQL (RLS) | Redis

---

## 🧭 1. Core Philosophy: "Premium First"
We are not building just a database interface; we are building an **Experience**.
- **The "Wow" Factor**: Every UI interaction must feel polished. Use skeletons instead of spinners, smooth transitions, and "glassmorphism" where appropriate.
- **Nudge Operations**: The system should be proactive, not reactive. (e.g., "Don't just show low attendance; email the parent automatically").
- **No-Code Power**: Whenever possible, give the user a builder (Report Builder, ID Card Designer, Fee Structure Builder) rather than a rigid form.

---

## 🏗️ 2. The Architectural Commandments
These rules are **non-negotiable** for system integrity and security.

### I. The Law of Tenant Isolation
- **Single Database, Shared Schema**: We use one database for all tenants.
- **Row Level Security (RLS)**: **Every** query must be filtered by `tenant_id` at the database level.
- **Middleware Enforcement**: Never rely solely on frontend filters. Backend middleware must catch tenant context.

### II. The Law of Preservation (Soft Deletes)
- **Zero Hard Deletes**: No record is ever truly removed from the database (GDPR exceptions apply).
- **Implementation**: All models inherit from `BaseModel` containing `is_deleted`, `deleted_at`, `deleted_by`.
- **Query Managers**: Default Django Managers must filter `is_deleted=False`.

### III. The Law of the Golden Record (360° View)
- **Unified Data**: Data silos are forbidden. A student's record must aggregate Academic, Financial, Health, Behavioral, and Extracurricular data.
- **Cross-Module Feedback**: A remark created in the Transport module must be visible in the Student Profile.

---

## 💻 3. Coding Standards & Best Practices

### Backend (Django/Python)
- **Type Hinting**: All Python code must use strictly typed signatures. `def process(data: dict) -> bool:`
- **Service Layer Pattern**: Thin Views, Fat Services. Business logic lives in `services/`, not `views.py`.
- **Swagger Documentation**: Every API endpoint must have a docstring description and example schema.
- **Signals**: Use Signals for decoupling (e.g., creating a User profile after Student admission), but document them clearly to avoid magic behavior.

### Frontend (React/TypeScript)
- **Strict TypeScript**: No `any`. Define interfaces for all props and API responses.
- **Component Composition**: Build small, reusable atoms. Use Shadcn components as the base.
- **Error Boundaries**: The app should never crash white. Graceful error handling with "Try Again" buttons.
- **Optimistic UI**: Updates should feel instant; handle server verification in the background.

---

## 🔒 4. Security Protocols
1.  **Input Sanitation**: All rich text inputs (e.g., Homework descriptions) must be sanitized to prevent XSS.
2.  **Rate Limiting**: Protect APIs against "noisy neighbor" tenants using Redis-based throttling.
3.  **Role-Based Access (RBAC)**: All sensitive actions (Delete, Refund, Approve) require explicit permission checks via decorators.

---

## 🤖 5. AI & Automation Guidelines
When generating code or features:
1.  **Test First**: Think about how the feature will be tested before writing the implementation.
2.  **Self-Repair**: If a build fails, analyze the error log, apply a fix, and retry.
3.  **Premium Enhancements**: Always check if a feature can be "AI-Enhanced" (e.g., "Don't just make a quiz form; add an AI generator for questions").

---

## 📝 6. Implementation Workflow
1.  **Check the Prompt**: Refer to `2_SAAS_PROJECT_BREAKDOWN.md` for specific requirements.
2.  **Verify Gaps**: Check `9_MISSING_AND_ADDITIONAL.md` for recent patches.
3.  **Validate**: Ensure the proposed code follows the **Architectural Commandments** above.
4.  **Execute**: Generate code, tests, and documentation.

---

## 🐋 7. Execution & Environment
1.  **Container Enforcement**: Any command to be executed (migrations, tests, management commands) **MUST** be done inside the Docker container.


**This file serves as the Single Source of Truth for the "Spirit" of the NucleiQ codebase.**
Refer to this whenever making architectural or design decisions.
