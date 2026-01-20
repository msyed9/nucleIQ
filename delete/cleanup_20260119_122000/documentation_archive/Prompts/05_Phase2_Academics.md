# Phase 2.0: Academic Delivery

**Goal**: Manage the classroom lifecycle.

---

## Prompt 2.1: Timetable & Scheduling

**Context**: Complex scheduling with conflict detection.

```markdown
# 📅 TIMETABLE MANAGEMENT SYSTEM

Create a conflict-free scheduling engine.

## 📝 Functional Requirements

1.  **Models**:
    - `TimetableSlot`:
        - `academic_year`: FK.
        - `section`: FK.
        - `subject`: FK.
        - `teacher`: FK (Staff).
        - `day_of_week`: Enum.
        - `start_time`, `end_time`.
        - `room`: string/FK.

2.  **Logic (The Hard Part)**:
    - **Conflict Check**: Ensure Teacher is not in two sections at once. Ensure Room is not double-booked.
    - **Validation API**: `check_availability(teacher_id, day, time)`.

3.  **UI**:
    - **Drag-and-Drop Builder**: React DnD or FullCalendar.
    - **Views**: Teacher View (My Schedule), Class View (Class Schedule).

## 📦 Deliverables
- `backend/timetable/models.py`.
- `backend/timetable/validators.py`.
- `frontend/src/pages/timetable/TimetableBuilder.tsx`.
```

---

## Prompt 2.2: Lesson Planning & Syllabus

**Context**: Tracking what is taught.

```markdown
# 📖 LESSON PLANNING & SYLLABUS

Track academic progress.

## 📝 Functional Requirements

1.  **Hierarchy**:
    - `Syllabus`: Subject Topic tree (Unit -> Chapter -> Topic).
    - `LessonPlan`: 
        - `teacher`: FK.
        - `section`: FK.
        - `topic`: FK.
        - `planned_date`, `completion_date`.
        - `status`: Pending, Completed.

2.  **Features**:
    - **Teacher Log**: "Mark Topic as Done".
    - **Progress Report**: "% of Syllabus Completed" vs "Expected %".

## 📦 Deliverables
- `backend/academics/models.py` (Additions).
- `frontend/src/pages/academics/LessonPlanner.tsx`.
```

---

## Prompt 2.3: Homework & Assignments

**Context**: Digital interaction between Teacher and Student.

```markdown
# 🏠 HOMEWORK & ASSIGNMENTS

Implement digital assignment submission.

## 📝 Functional Requirements

1.  **Workflow**:
    - Teacher creates Assignment (Title, Description, Due Date, Attachments).
    - Student views Assignment -> Uploads Solution (PDF/Img).
    - Teacher reviews -> Adds Remarks/Grade.

2.  **Models**:
    - `Assignment` (Class-wide).
    - `Submission` (Student-specific).

## 📦 Deliverables
- `backend/academics/models.py` (Assignment, Submission).
- `frontend/src/pages/assignments/AssignmentList.tsx`.
```
