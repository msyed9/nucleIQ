
# Platform Access Restructuring & Tenant Dashboard Enhancement

## Objective
Restructure the application to strictly separate Platform Owner (Superuser) and Tenant Admin functionalities.
- **Platform Owner**: Access solely via `http://localhost:8000/` (Django Admin/Custom Admin). Manages Tenants, Billing, Global Analytics.
- **Tenant Super Admin**: Access via Tenant Dashboard (Frontend). Manages Branding, Academic Years, Users, Roles.
- **Constraint**: No new "Platform Owner" model. Use `User(is_superuser=True)`.

## Phase 1: Backend & Platform Admin Security (Port 8000)

1.  **Secure Root URL (`backend/config/urls.py`)**:
    -   Ensure the root path `path('', ...)` redirects to `admin/` or a custom Platform Dashboard view protected by `user_passes_test(lambda u: u.is_superuser)`.
    -   Verify that `admin.site.urls` is accessible.

2.  **Enhance Django Admin (`backend/tenants/admin.py`, `backend/users/admin.py`)**:
    -   **Tenant Management**: Ensure `TenantAdmin` exposes `plan`, `subscription_dates`. Add custom actions for "Extend Trial", "Suspend Tenant".
    -   **Analytics**:
        -   Create a custom Admin View (or Dashboard Widget) at `admin/analytics/` or within the Admin Index that shows:
            -   Total Tenants (Active/Trial).
            -   API Usage Stats (Need to verify if tracking exists, if not, create a simple placeholder or aggregate logs).
            -   Recent Signups.
    -   **Billing**:
        -   Ensure `Billing/Payment` models are registered in Admin.
    -   **Passwords**:
        -   Ensure `UserAdmin` allows Superusers to set passwords for any user (standard functionality, just verify).

3.  **API Permissions**:
    -   Audit `tenants/urls.py` and `views.py`. Ensure "Create Tenant" endpoint (`POST /api/tenants/`) is `IsAdminUser` (Superuser) only.
    -   Ensure "Update Tenant Branding" (`PUT /api/tenants/branding/`) is accessible to `IsTenantAdmin`.

## Phase 2: Frontend Tenant Features (React)

1.  **Global Branding Application (Prominent UI)**:
    -   **Objective**: Ensure the Tenant/School identity is the *primary* visual element, not NucleIQ.
    -   **Context**: Create `src/context/TenantBrandingContext.tsx` to fetch branding (`GET /api/tenants/current/branding`) on app load.
    -   **Sidebar (`Sidebar.tsx`)**:
        -   Replace the generic "NucleIQ" header with the **Tenant's Logo** (if available) and **Tenant Name**.
        -   Ensure the logo is large and visible at the top.
        -   Apply `sidebar_color` from branding to the sidebar background.
    -   **Theme & Colors**:
        -   Use `primary_color` for active menu items, buttons, and top highlight bars.
        -   Inject these colors as CSS variables (`--color-primary`, `--sidebar-bg`) via a `ThemeProvider` update.
    -   **Login Page**:
        -   Display the Tenant Logo prominently on the login form if the tenant is resolved (e.g., via subdomain).

2.  **Tenant Branding Settings (`New Component`)**:
    -   **Target**: `src/pages/settings/TenantBranding.tsx`.
    -   **Route**: Add `/settings/branding` to `App.tsx` and `Sidebar.tsx`.
    -   **Functionality**:
        -   Fetch current tenant's branding.
        -   Form to update: Logo URL, Primary Color, Secondary Color, Sidebar Color.
        -   **Live Preview**: Show a preview of how the sidebar/buttons will look.
    -   **Access**: Restricted to Tenant Admins.

3.  **Academic Years & Setup**:
    -   **Target**: `src/pages/settings/AcademicSetup.tsx`.
    -   **Verification**: Ensure this page is fully functional (CRUD for Academic Years).
    -   **Location**: It is currently at `/settings/academic`. Ensure this is prominent in the "Settings" menu or a top-level "Academics" setup item if frequently used.

3.  **User & Role Management**:
    -   **Target**: `src/pages/users/UserManagement.tsx` and `src/settings/RolesPermissions.tsx`.
    -   **Verification**: Ensure Tenant Admins can create/edit users and assign roles.
    -   **Organization**: Ensure these are grouped under "Admin" or "Settings" in Sidebar (currently seems correct).

4.  **Billing & Subscription (Tenant View)**:
    -   **Target**: `src/pages/billing/BillingManagement.tsx` (if exists) or create new.
    -   **Scope**: Tenant Admin should only *view* their plan and invoices. They should *not* be able to modify the plan without a flow (like "Request Upgrade").

5.  **Analytics (Tenant View)**:
    -   **Target**: `src/pages/reports/AdvancedAnalytics.tsx`.
    -   **Scope**: Ensure the data shown is *scoped* to the current tenant (Backend should handle this via `TenantAwareModel`).

## Phase 3: Cleanup & Validation

1.  **Sidebar Cleanup**:
    -   Review `src/components/layout/Sidebar.tsx`.
    -   Ensure no "Platform Admin" links (like global server settings) are visible to Tenant Admins.
    -   Confirm "Branding" is added.

2.  **Testing**:
    -   **Scenario 1**: Login as Platform Owner (Superuser) at `localhost:8000/`. Check Tenant creation, password reset, global stats.
    -   **Scenario 2**: Login as Tenant Admin at Frontend. Try to access `localhost:8000/` (should fail/redirect/no session share if strict). Access Branding, Academic Setup.
    -   **Scenario 3**: Login as Tenant Regular User. Ensure no access to Branding/Users.

## Implementation Prompt for AI Agent

```markdown
You are an expert Full Stack Developer. Implement the following restructuring of the nucleIQ platform access and dashboard logic.

### 1. Backend Security & Admin (Django)
- **File**: `backend/config/urls.py`
    - Configure the root URL `''` to serve the Django Admin login or a RedirectView to `/admin/`.
- **File**: `backend/tenants/admin.py`
    - Verify `Tenant` admin allows complete management (Plan, Status, Dates).
    - Add a custom Admin View or simple `ModelAdmin` extension to show "Tenant Analytics" (e.g., number of students/staff per tenant).
- **File**: `backend/tenants/serializers.py`
    - Create `TenantBrandingSerializer` for `TenantBranding` model.
- **File**: `backend/tenants/views.py`
    - Create `TenantBrandingViewSet` with `permission_classes = [IsAuthenticated, IsTenantUser]`.
    - Implement `get_object` to return `request.user.tenant.branding` (using `get_or_create`).
    - Ensure it allows `PUT/PATCH` update.
- **File**: `backend/tenants/urls.py`
    - Register `router.register(r'branding', TenantBrandingViewSet, basename='tenant-branding')`.
- **File**: `backend/tenants/api/views.py` (or equivalent)
    - Ensure `TenantViewSet.create` permission is `IsAdminUser` (Superuser).

### 2. Frontend Tenant Features (React)
- **Create File**: `src/context/TenantBrandingContext.tsx`
    - Fetch and store tenant branding (Logo, Colors).
    - Provide values to the app.
- **Update File**: `src/App.tsx` (or `Layout.tsx`)
    - Wrap application in `TenantBrandingProvider`.
    - Apply CSS variables for colors (`--color-primary`, `--sidebar-bg`) dynamically based on context.
- **Update File**: `src/components/layout/Sidebar.tsx`
    - **CRITICAL**: Replace "NucleIQ" text/icon with the dynamic `tenantLogo` and `tenantName` from context.
    - Ensure the branding is prominent (top of sidebar, large logo).
- **Create File**: `src/pages/settings/TenantBranding.tsx`
    - Create a form to manage Tenant Branding (Logo, Colors).
    - Use `TenantBranding` model fields.
    - Integrate with `updateTenantBranding` API.
- **Update File**: `src/components/layout/Sidebar.tsx` (Menu)
    - Add "Branding" under the "Settings" group. Link to `/settings/branding`.
- **Update File**: `src/App.tsx`
    - Add route `<Route path="/settings/branding" element={<Layout><TenantBranding /></Layout>} />`.
- **Verify**:
    - `AcademicSetup` (Academic Years) is accessible at `/settings/academic`.
    - `UserManagement` is accessible at `/users/manage`.
    - Ensure these pages work for a Tenant Super Admin.

### 3. Constraints
- Do NOT create a separate "Platform Owner" model. Relies on `is_superuser=True`.
- Ensure strict separation: Tenant Admins NEVER access port 8000 Admin Interface.
- All frontend changes must match the existing Design System (`@/design-system`).
```
