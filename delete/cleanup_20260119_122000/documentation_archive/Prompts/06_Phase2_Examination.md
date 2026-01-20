# Phase 2.1: Examination & Evaluation

**Goal**: Assess student performance.

---

## Prompt 2.4: Exam Management & Question Banks

**Context**: Setting up exams.

```markdown
# 📝 EXAM MANAGEMENT CORE

Build the examination infrastructure.

## 📝 Functional Requirements

1.  **Models (in `backend/exams/models.py`)**:
    - `ExamTerm`: (Mid-Term, Final).
    - `Exam`: (e.g., "Math Mid-Term Class 1").
    - `ExamSchedule`: Date, Time, Room.
    - `QuestionBank`:
        - `topic`: FK.
        - `type`: MCQ, Subjective.
        - `difficulty`: Easy/Med/Hard.
        - `learning_outcome`: FK (for OBE).

2.  **Features**:
    - **Schedule Generator**: Avoid overlaps.
    - **Question Paper Generator**: "Generate 50 mark paper with 10 Easy, 10 Hard questions".

## 📦 Deliverables
- `backend/exams/models.py`.
- `frontend/src/pages/exams/ExamScheduler.tsx`.
```

---

## Prompt 2.5: Grading, Results & OBE

**Context**: Calculating and publishing results.

```markdown
# 📊 GRADING & REPORT CARDS (OBE ENABLED)

Implement Result processing with Outcome Based Education analytics.

## 📝 Functional Requirements

1.  **Grading Logic**:
    - `GradeScale`: Range (90-100 = A+).
    - `MarksEntry`: Student, Exam, Marks Obtained.

2.  **OBE (Outcome Based Education)**:
    - **Concept**: Track skills, not just marks.
    - **Mappings**: Question -> Skill (e.g., "Critical Thinking").
    - **Analysis**: "Student X is weak in Algebra but strong in Geometry".

3.  **Holistic Report Card Engine (360-Degree)**:
    - **Composition**:
        - **Scholastic**: Subject Marks & Grades (e.g., Math: A+).
        - **Co-Scholastic**: 
            - **Attendance**: Total Present % (from Prompt 1.6).
            - **Character**: Habit Score & Teacher Remarks (from Prompt 4.6).
            - **Spiritual**: Salah Attendance Stats (from Prompt 4.5 - Configurable visibility).
            - **Activity**: Library Books Read count (from Prompt 4.1).
    - **Visuals (PDF)**:
        - **Skill Radar**: Visualization of OBE Skills (Critical Thinking vs Memory).
        - **Subject Bar Chart**: Student vs Class Average comparison.
    - **Delivery**: Auto-email PDF to parents on Result Day.

## 📦 Deliverables
- `backend/exams/services.py` (Result Calculation).
- `backend/reports/report_card_generator.py`.
- `frontend/src/pages/exams/ResultEntry.tsx`.
```
