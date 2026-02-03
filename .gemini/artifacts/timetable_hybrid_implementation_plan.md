# Timetable Hybrid System Implementation Plan

## Overview
Implement a hybrid timetable system that auto-generates schedules based on constraints, then allows manual drag-and-drop adjustments.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CONFIGURATION LAYER                       │
├─────────────────────────────────────────────────────────────┤
│ TimetablePeriodConfig    │ SubjectSectionLoad               │
│ - periods_per_day        │ - subject + section              │
│ - period_duration        │ - periods_per_week               │
│ - start_times            │ - preferred_teacher              │
│ - working_days           │ - room_type                      │
│ - break_periods          │                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    GENERATION LAYER                          │
├─────────────────────────────────────────────────────────────┤
│ TimetableGeneratorService                                    │
│ - Greedy slot assignment algorithm                          │
│ - Conflict checking via existing validators                 │
│ - Returns: generated slots + unscheduled items              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MANUAL ADJUSTMENT LAYER                   │
├─────────────────────────────────────────────────────────────┤
│ Existing TimetableBuilder.tsx                               │
│ + Swap functionality                                        │
│ + Copy day/week feature                                     │
│ + Teacher workload visualization                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Backend Models (Day 1 - Part 1)

### 1.1 Create TimetablePeriodConfig Model

**File:** `backend/timetable/models.py`

```python
class TimetablePeriodConfig(TenantAwareModel):
    """
    Configuration for timetable periods per tenant.
    Defines the daily schedule structure.
    """
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='timetable_configs'
    )
    
    name = models.CharField(max_length=100, default='Default Schedule')
    
    # Working days as JSON array: ["MONDAY", "TUESDAY", ...]
    working_days = models.JSONField(
        default=list,
        help_text='Days when school operates'
    )
    
    # Period definitions as JSON array:
    # [{"period": 1, "start": "08:00", "end": "08:45", "type": "class"},
    #  {"period": 0, "start": "10:15", "end": "10:30", "type": "break", "label": "Short Break"}]
    periods = models.JSONField(
        default=list,
        help_text='Period timings configuration'
    )
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'timetable_period_configs'
        unique_together = ['tenant', 'academic_year', 'name']
```

### 1.2 Create SubjectSectionLoad Model

**File:** `backend/timetable/models.py`

```python
class SubjectSectionLoad(TenantAwareModel):
    """
    Defines how many periods per week a subject needs for a section.
    """
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='subject_loads'
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='subject_loads'
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='subject_loads'
    )
    
    periods_per_week = models.PositiveIntegerField(
        default=1,
        help_text='Number of periods for this subject per week'
    )
    
    preferred_teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='preferred_subject_loads',
        help_text='Preferred teacher for this subject-section combination'
    )
    
    room_preference = models.CharField(
        max_length=100,
        blank=True,
        help_text='Preferred room or room type (e.g., "Lab", "Room 101")'
    )
    
    # Constraints
    max_periods_per_day = models.PositiveIntegerField(
        default=2,
        help_text='Maximum periods of this subject per day'
    )
    
    class Meta:
        db_table = 'timetable_subject_section_loads'
        unique_together = ['tenant', 'academic_year', 'section', 'subject']
```

---

## Phase 2: Generation Service (Day 1 - Part 2)

### 2.1 Create TimetableGeneratorService

**File:** `backend/timetable/services.py`

```python
class TimetableGeneratorService:
    """
    Service for auto-generating timetables using a greedy algorithm.
    """
    
    def __init__(self, tenant, academic_year):
        self.tenant = tenant
        self.academic_year = academic_year
        self.config = None
        self.generated_slots = []
        self.unscheduled = []
        self.teacher_schedule = {}  # {teacher_id: {day: [periods]}}
        self.room_schedule = {}     # {room: {day: [periods]}}
        self.section_schedule = {}  # {section_id: {day: [periods]}}
    
    def generate(self, section_ids=None, clear_existing=False):
        """
        Generate timetable for specified sections or all sections.
        
        Args:
            section_ids: List of section IDs to generate for (None = all)
            clear_existing: If True, delete existing slots before generating
            
        Returns:
            {
                'success': True,
                'generated_count': 45,
                'unscheduled': [...],
                'warnings': [...]
            }
        """
        # 1. Load configuration
        # 2. Load subject loads for sections
        # 3. Build existing schedule maps (for teachers/rooms already allocated)
        # 4. For each subject load:
        #    - Find available slots
        #    - Assign greedily (prioritize constraints)
        #    - Track what couldn't be scheduled
        # 5. Return results
        pass
    
    def _find_available_slot(self, section, subject, teacher, room_pref, periods_needed):
        """Find next available slot for a subject-section combination."""
        pass
    
    def _is_slot_available(self, day, period, teacher_id, room, section_id):
        """Check if a specific slot is available."""
        pass
    
    def _assign_slot(self, section, subject, teacher, room, day, period_config):
        """Create a timetable slot assignment."""
        pass
```

### 2.2 Algorithm Details

```
GREEDY TIMETABLE GENERATION ALGORITHM
=====================================

Input:
  - Period configuration (working days, period timings)
  - Subject loads (subject + section + periods_per_week)
  - Teacher assignments (optional preferred teachers)
  - Room preferences (optional)

Algorithm:
  1. SORT subject_loads by difficulty:
     - Subjects with specific teacher requirements first
     - Subjects with room requirements (labs) first
     - Subjects with more periods per week first
     
  2. FOR EACH subject_load in sorted order:
       periods_remaining = subject_load.periods_per_week
       daily_count = {}  # Track periods per day for this subject
       
       WHILE periods_remaining > 0:
         FOR EACH day in working_days (shuffled for distribution):
           IF daily_count[day] >= max_periods_per_day:
             CONTINUE
             
           FOR EACH period in periods (shuffled):
             IF period.type != 'class':
               CONTINUE
               
             IF is_slot_available(day, period, teacher, room, section):
               create_slot(...)
               periods_remaining -= 1
               daily_count[day] += 1
               BREAK
               
           IF periods_remaining == 0:
             BREAK
             
       IF periods_remaining > 0:
         unscheduled.append({subject_load, periods_remaining})

Output:
  - Generated TimetableSlot records
  - List of unscheduled subject-loads with remaining periods
```

---

## Phase 3: API Endpoints (Day 2 - Part 1)

### 3.1 New ViewSets

**File:** `backend/timetable/views.py`

```python
class TimetablePeriodConfigViewSet(viewsets.ModelViewSet):
    """CRUD for period configurations."""
    serializer_class = TimetablePeriodConfigSerializer
    # ...

class SubjectSectionLoadViewSet(viewsets.ModelViewSet):
    """CRUD for subject-section loads."""
    serializer_class = SubjectSectionLoadSerializer
    
    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple subject loads at once."""
        pass
    
    @action(detail=False, methods=['post'])
    def copy_from_section(self, request):
        """Copy subject loads from one section to another."""
        pass

class TimetableGenerationViewSet(viewsets.ViewSet):
    """Endpoints for timetable generation."""
    
    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        POST /api/timetable/generation/generate/
        {
            "section_ids": ["uuid1", "uuid2"],  // optional, null = all
            "clear_existing": false
        }
        """
        pass
    
    @action(detail=False, methods=['post'])
    def preview(self, request):
        """
        Generate without saving - returns proposed timetable.
        """
        pass
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """Check generation readiness - are all configurations set?"""
        pass
```

### 3.2 New URLs

**File:** `backend/timetable/urls.py`

```python
router.register(r'configs', TimetablePeriodConfigViewSet, basename='timetable-config')
router.register(r'loads', SubjectSectionLoadViewSet, basename='subject-load')
router.register(r'generation', TimetableGenerationViewSet, basename='timetable-generation')
```

---

## Phase 4: Frontend - Configuration UI (Day 2 - Part 2)

### 4.1 New Components

**File:** `frontend/src/pages/timetable/TimetableConfig.tsx`

```tsx
// Period Configuration Page
// - Set working days (checkboxes)
// - Define periods (add/remove rows with start/end times)
// - Mark break periods
// - Save configuration
```

**File:** `frontend/src/pages/timetable/SubjectLoadManager.tsx`

```tsx
// Subject Load Manager
// - Table: Section | Subject | Periods/Week | Teacher | Room
// - Bulk edit capabilities
// - Copy from another section
// - Import from Excel template
```

### 4.2 Enhanced TimetableBuilder.tsx

Add to existing component:
- "Auto Generate" button
- Generation progress modal
- Preview modal before commit
- "Unscheduled Items" panel
- Teacher workload summary sidebar

---

## Phase 5: Frontend - Builder Enhancements (Day 3)

### 5.1 Swap Functionality

```tsx
// Click slot A -> highlight as "selected"
// Click slot B -> swap A and B positions
// Validate both positions after swap
```

### 5.2 Copy Feature

```tsx
// "Copy Day" button -> select source day, target day
// "Copy to Other Section" -> select target section, overwrite confirmation
```

### 5.3 Teacher Workload Panel

```tsx
// Sidebar showing:
// - Teacher name
// - Total periods/week
// - Periods per day breakdown
// - Highlight if overloaded (configurable threshold)
```

---

## Phase 6: Polish & Export ✅ COMPLETE

### 6.1 Export Features ✅
**File:** `frontend/src/pages/timetable/TimetableExport.tsx`

- PDF export with school branding
- Excel/CSV export
- Print view
- Preview before export
- Responsive modal design

### 6.2 Teacher Workload Panel ✅
**File:** `frontend/src/pages/timetable/TeacherWorkloadPanel.tsx`

- Real-time workload calculation
- Overload warnings (configurable thresholds)
- Daily breakdown per teacher
- Back-to-back period detection
- Sortable teacher list
- Visual progress bars

### 6.3 Validation Report ✅
**File:** `frontend/src/pages/timetable/ValidationReport.tsx`

Frontend validation checks:
- Missing teacher assignments
- Missing room assignments
- Teacher overload (>6 periods/day)
- Subject load fulfillment
- Uneven subject distribution
- Back-to-back same subject
- Empty working days

**Backend API:** `GET /api/timetable/generation/validate/?section_id=uuid`

### 6.4 Undo/Redo Support ✅
**File:** `frontend/src/hooks/useUndoRedo.ts`

- Operation tracking (up to 50 operations)
- Undo/redo with keyboard shortcuts support
- History viewer
- Clear history function

### 6.5 Enhanced CSS ✅
**File:** `frontend/src/pages/timetable/TimetableEnhancements.css`

- Export modal styles
- Teacher workload panel styles
- Validation report modal styles
- Undo/redo button styles
- Quick action button styles
- Responsive design

---

## Database Migrations

```bash
# After adding models
python manage.py makemigrations timetable
python manage.py migrate
```

---

## API Endpoints Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/timetable/configs/` | GET/POST | Period configurations |
| `/api/timetable/configs/{id}/` | GET/PUT/DELETE | Single config |
| `/api/timetable/configs/active/` | GET | Get active config for academic year |
| `/api/timetable/loads/` | GET/POST | Subject-section loads |
| `/api/timetable/loads/bulk_create/` | POST | Bulk create loads |
| `/api/timetable/loads/copy_from_section/` | POST | Copy loads |
| `/api/timetable/generation/generate/` | POST | Run generation |
| `/api/timetable/generation/preview/` | POST | Preview without save |
| `/api/timetable/generation/status/` | GET | Check readiness |
| `/api/timetable/generation/swap/` | POST | Swap two slots |
| `/api/timetable/generation/copy_day/` | POST | Copy day's slots |
| `/api/timetable/generation/validate/` | GET | Validate timetable |

---

## Testing Checklist

- [x] Period config CRUD works
- [x] Subject load CRUD works
- [x] Generation creates expected number of slots
- [x] Conflicts are properly avoided during generation
- [x] Unscheduled items are reported correctly
- [x] Drag-and-drop still works after generation
- [x] Swap functionality works
- [x] Copy day functionality works
- [x] PDF/Excel export generates correctly
- [x] Multi-tenant isolation verified
- [x] Validation report works
- [x] Teacher workload panel displays correctly

---

## Files Created/Modified ✅

### New Files Created:
1. `backend/timetable/services.py` - Generation, swap, and copy services
2. `frontend/src/pages/timetable/TimetableConfig.tsx` - Config UI with periods & loads
3. `frontend/src/pages/timetable/TimetableConfig.css` - Config page styles
4. `frontend/src/pages/timetable/TimetableExport.tsx` - Export modal (PDF/Excel/Print)
5. `frontend/src/pages/timetable/TeacherWorkloadPanel.tsx` - Workload visualization
6. `frontend/src/pages/timetable/ValidationReport.tsx` - Validation report modal
7. `frontend/src/pages/timetable/TimetableEnhancements.css` - Phase 6 styles
8. `frontend/src/hooks/useUndoRedo.ts` - Undo/redo hook

### Modified Files:
1. `backend/timetable/models.py` - Added TimetablePeriodConfig, SubjectSectionLoad
2. `backend/timetable/serializers.py` - Added new serializers
3. `backend/timetable/views.py` - Added config, load, and generation viewsets + validate
4. `backend/timetable/urls.py` - Registered new routes
5. `backend/timetable/admin.py` - Registered new models
6. `frontend/src/pages/timetable/TimetableBuilder.tsx` - Phase 6 integrations
7. `frontend/src/pages/timetable/TimetableBuilder.css` - Updated styles
8. `frontend/src/App.tsx` - Added config route
9. `frontend/src/components/layout/Sidebar.tsx` - Added config menu item

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Backend Models | ✅ Complete |
| Phase 2 | Generation Service | ✅ Complete |
| Phase 3 | API Endpoints | ✅ Complete |
| Phase 4 | Config UI | ✅ Complete |
| Phase 5 | Builder Enhancements | ✅ Complete |
| Phase 6 | Polish & Export | ✅ Complete |

**All phases complete!** 🎉

---

## Next Steps (Optional Enhancements)

1. **Timetable locking** - Lock finalized timetables to prevent edits
2. **Teacher substitution** - Quick substitute teacher assignment
3. **Student view** - Read-only timetable for students
4. **Room management** - Room availability tracking
5. **Clash report** - Automated clash detection and resolution suggestions
