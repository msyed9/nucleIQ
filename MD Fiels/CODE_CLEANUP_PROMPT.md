# Code De-duplication & Cleanup Analysis Prompt

## Instructions for User
1.  Copy the content of the "Prompt" block below.
2.  Paste it into your AI coding assistant (or use it to guide your manual review).
3.  The goal is to generate a report, NOT to auto-delete code immediately.

---

### Prompt: Comprehensive Code De-duplication Analysis
```markdown
**Task:** Project-Wide Duplicate Code Analysis and Cleanup Plan

**Objective:** Scan the entire solution (Frontend & Backend) to identify redundant code, duplicate functions, and repeated logic to reduce technical debt.

**Instructions:**

1.  **Phase 1: Frontend Analysis (React/Typescript)**
    *   **Components:** Identify UI components that look visually similar or have identical structures (e.g., multiple custom "Button", "Card", or "Modal" implementations).
    *   **Utilities:** Check `src/utils`, `src/helpers`, and `src/services` for helper functions (like date formatting, currency conversion, validation) that are defined multiple times.
    *   **API Calls:** Look for duplicate API definitions in `api.ts` versus individual service modules (e.g., `services/studentService.ts`).
    *   **Hooks:** Check for repeated logic in components that could be extracted into custom hooks (e.g., form handling, fetch logic).

2.  **Phase 2: Backend Analysis (Django/Python)**
    *   **Utils:** Search across all `backend/*/utils.py` or `services.py` files for repeated helper logic.
    *   **Serializers:** Identify Serializers that are effectively identical but named differently (e.g., `UserSerializer` vs `UserDetailSerializer` if fields are same).
    *   **Views:** Check for Views/ViewSets that expose the same data under different endpoints unnecessarily.
    *   **Permissions:** Check for duplicate permission classes or logic.

3.  **Phase 3: Cross-Check**
    *   Identify "Dead Code" (functions/components defined but never imported/used).

4.  **Output Requirements (Strict Format):**
    *   Produce a **"Duplicate Functionality Report"**.
    *   Group findings by **Category**:
        *   🔴 **Exact Duplicates:** Code blocks that are identical or nearly identical.
        *   🟡 **Logic Duplication:** Different code implementing the same business logic (violates DRY).
        *   🟢 **Dead Code:** Unused exports.
    *   For each finding, provide:
        *   `Source A`: File path & Line number.
        *   `Source B`: File path & Line number.
        *   `Recommended Action`: (e.g., "Delete Source B and import Source A", "Extract common logic to `utils.ts`").

**Constraints:**
*   **Do NOT delete code yet.** Only report findings.
*   Focus on custom code (ignore `node_modules`, `venv`, `build`, `dist`).
```
