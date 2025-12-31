# Phase 1.0: Academic Structure Setup

**Goal**: Define the core academic dimensions (Time and Hierarchy) before adding people.

---

## Prompt 1.1: Academic Years & Terms (The Time Dimension)

**Context**: You are setting up the chronological backbone of the system.

```markdown
# 📅 ACADEMIC YEAR ARCHITECTURE

Implement the "Academic Year" and "Term" logic. This is a Dependency Injection for all future modules.

## 📝 Functional Requirements

1.  **Models (in `backend/academics/models.py`)**:
    - `AcademicYear`:
        - `name`: string (e.g., "2023-2024").
        - `start_date`, `end_date`: Date.
        - `is_current`: boolean (Only one true per tenant).
        - `is_enrollment_open`: boolean.
    - `AcademicTerm` (Optional/Advanced):
        - `name`: string (e.g., "Term 1", "Semester 1").
        - `academic_year`: FK.
        - `start_date`, `end_date`.

2.  **Logic**:
    - **Session Switching**: Create a lightweight middleware or utility that allows users to pass `?year_id=...` to view historical data.
    - **Validation**: Ensure `start_date` < `end_date`. Ensure no overlap of "Current" years.

3.  **Global Context**:
    - Creates a `get_current_academic_year(tenant)` utility function used widely.

## 📦 Deliverables
- `backend/academics/models.py`.
- `backend/academics/utils.py`.
- `frontend/src/components/layout/AcademicYearSwitcher.tsx`.
```

---

## Prompt 1.2: Classes, Sections & Subjects (The Structural Dimension)

**Context**: Defining the hierarchy required for student enrollment.

```markdown
# 🏫 SCHOOL HIERARCHY SETUP

Create the structure to house students.

## 📝 Functional Requirements

1.  **Models (in `backend/academics/models.py`)**:
    - `Department`: (e.g., "Primary", "High School", "Science Wing").
    - `GradeLevel` (Class): Name (e.g., "Class 1"), Order (int).
    - `Section`: Name (e.g., "A", "Red"), `grade_level` FK.
        - **Capacity**: Max students allowed.
    - `Subject`: Name, Code, Type (Theory/Practical).
    - `ClassSubject`: Mapping `GradeLevel` <-> `Subject`. (Defines "Class 1 studies Math").

2.  **APIs**:
    - CRUD for all.
    - "Promote Structure": Ability to clone structure from Year X to Year Y.

## 📦 Deliverables
- `backend/academics/models.py` (Updates).
- `backend/academics/views.py`.
- `frontend/src/pages/academics/ClassConfiguration.tsx`.
```
