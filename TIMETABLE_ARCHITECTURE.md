# Timetable Management System - Architecture Overview

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + TypeScript)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ TimetableBuilder │  │   TeacherView    │  │  ClassView   │  │
│  │                  │  │                  │  │              │  │
│  │ • Drag & Drop    │  │ • Teacher Select │  │ • Section    │  │
│  │ • Grid View      │  │ • Weekly View    │  │   Select     │  │
│  │ • Conflict Check │  │ • Stats Display  │  │ • Table View │  │
│  │ • Edit/Delete    │  │ • Card Layout    │  │ • Print      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │           │
│           └─────────────────────┼────────────────────┘           │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
                            HTTP/REST API
                                  │
┌─────────────────────────────────┼────────────────────────────────┐
│                         BACKEND (Django REST)                     │
├─────────────────────────────────┼────────────────────────────────┤
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                    TimetableSlotViewSet                      │ │
│  │                                                              │ │
│  │  • list()              • check_availability()               │ │
│  │  • create()            • teacher_schedule()                 │ │
│  │  • retrieve()          • section_schedule()                 │ │
│  │  • update()            • bulk_create()                      │ │
│  │  • destroy()           • weekly_view()                      │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                    TimetableValidator                        │ │
│  │                                                              │ │
│  │  • check_availability()                                     │ │
│  │  • _check_teacher_conflicts()                               │ │
│  │  • _check_room_conflicts()                                  │ │
│  │  • _check_section_conflicts()                               │ │
│  │  • get_teacher_schedule()                                   │ │
│  │  • get_section_schedule()                                   │ │
│  │  • validate_bulk_slots()                                    │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
│  ┌──────────────────────────────▼──────────────────────────────┐ │
│  │                      TimetableSlot Model                     │ │
│  │                                                              │ │
│  │  Fields:                      Methods:                      │ │
│  │  • academic_year (FK)         • clean()                     │ │
│  │  • section (FK)               • _check_teacher_conflicts()  │ │
│  │  • subject (FK)               • _check_room_conflicts()     │ │
│  │  • teacher (FK)               • _check_section_conflicts()  │ │
│  │  • day_of_week                • get_duration_minutes()      │ │
│  │  • start_time                 • save()                      │ │
│  │  • end_time                                                 │ │
│  │  • room                                                     │ │
│  │  • period_number                                            │ │
│  │  • is_active                                                │ │
│  └──────────────────────────────┬──────────────────────────────┘ │
│                                 │                                │
└─────────────────────────────────┼────────────────────────────────┘
                                  │
┌─────────────────────────────────▼────────────────────────────────┐
│                      DATABASE (PostgreSQL)                        │
├───────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ timetable_  │  │  tenants_   │  │   staff     │             │
│  │   slots     │  │  sections   │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  tenants_   │  │  tenants_   │  │  timetable_ │             │
│  │  subjects   │  │  academic_  │  │  templates  │             │
│  │             │  │   years     │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow

### Creating a Timetable Slot

```
User Action (Drag & Drop)
         │
         ▼
Frontend: Check Availability
         │
         ▼
API: POST /api/timetable/slots/check_availability/
         │
         ▼
Validator: TimetableValidator.check_availability()
         │
         ├─► Check Teacher Conflicts
         ├─► Check Room Conflicts
         └─► Check Section Conflicts
         │
         ▼
Return: { is_available: true/false, conflicts: [...] }
         │
         ▼
Frontend: If available, create slot
         │
         ▼
API: POST /api/timetable/slots/
         │
         ▼
Serializer: Validate data
         │
         ▼
Model: Run clean() validation
         │
         ├─► _check_teacher_conflicts()
         ├─► _check_room_conflicts()
         └─► _check_section_conflicts()
         │
         ▼
Database: Save slot
         │
         ▼
Response: Created slot data
         │
         ▼
Frontend: Update UI
```

### Viewing Teacher Schedule

```
User Action (Select Teacher)
         │
         ▼
API: GET /api/timetable/slots/teacher_schedule/?teacher_id=xxx
         │
         ▼
Validator: TimetableValidator.get_teacher_schedule()
         │
         ▼
Database: Query slots for teacher
         │
         ▼
Response: Formatted schedule data
         │
         ▼
Frontend: Display in card layout
```

## 🛡️ Conflict Detection Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Frontend                         │
│  • Pre-check before API call                                │
│  • Immediate user feedback                                  │
│  • Prevents unnecessary API calls                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 2: API Endpoint                     │
│  • check_availability() endpoint                            │
│  • Returns detailed conflict information                    │
│  • Used by frontend before creation                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 3: Serializer                       │
│  • Validates data before model save                         │
│  • Calls TimetableValidator                                 │
│  • Returns validation errors                                │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 4: Model                            │
│  • clean() method validation                                │
│  • Database-level conflict checks                           │
│  • Final safety net                                         │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 5: Database                         │
│  • Constraints and indexes                                  │
│  • Ensures data integrity                                   │
│  • Performance optimization                                 │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

```sql
-- TimetableSlot Table
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    section_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    teacher_id UUID,
    day_of_week VARCHAR(10) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100),
    period_number INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    is_deleted BOOLEAN DEFAULT FALSE,
    
    -- Foreign Keys
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (academic_year_id) REFERENCES academic_years(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (subject_id) REFERENCES subjects(id),
    FOREIGN KEY (teacher_id) REFERENCES staff(id),
    
    -- Constraints
    CONSTRAINT end_after_start CHECK (end_time > start_time)
);

-- Indexes for Performance
CREATE INDEX idx_timetable_tenant_year_section 
    ON timetable_slots(tenant_id, academic_year_id, section_id);
    
CREATE INDEX idx_timetable_teacher_day 
    ON timetable_slots(tenant_id, teacher_id, day_of_week);
    
CREATE INDEX idx_timetable_day_time 
    ON timetable_slots(tenant_id, day_of_week, start_time);
    
CREATE INDEX idx_timetable_room 
    ON timetable_slots(room, day_of_week, start_time);
```

## 🎯 Key Design Decisions

1. **Multi-Layer Validation**: Ensures conflicts are caught at multiple levels
2. **Tenant Isolation**: All queries filtered by tenant automatically
3. **Soft Delete**: Preserves historical data
4. **Audit Trail**: Tracks creation and updates
5. **Flexible Time Slots**: No hardcoded periods, fully customizable
6. **Drag & Drop UI**: Intuitive, visual interface
7. **Real-time Feedback**: Immediate conflict detection
8. **Multiple Views**: Different perspectives for different users
9. **Print Support**: Class schedules can be printed
10. **Responsive Design**: Works on all devices

## 🚀 Performance Optimizations

- **Database Indexes**: Fast queries on common filters
- **Select Related**: Reduces database queries
- **Caching**: Can be added for frequently accessed schedules
- **Pagination**: Handles large datasets efficiently
- **Lazy Loading**: Components load data as needed
