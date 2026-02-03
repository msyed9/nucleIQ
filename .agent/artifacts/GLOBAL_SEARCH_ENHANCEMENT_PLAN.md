# Global Search Enhancement Plan - NucleiQ

## Executive Summary

This document consolidates both search enhancement prompts and outlines a comprehensive implementation plan for enhancing NucleiQ's global search capabilities. The goal is to create a powerful, performant, and user-friendly search experience across all modules.

---

## Current State Analysis

### ✅ What Exists

#### Backend (`backend/search/`)
- `SearchService` class with scaffolded PostgreSQL Full-Text Search (FTS)
- Three API endpoints registered at `/api/search/`:
  - `GET /api/search/` - Global search
  - `GET /api/search/recent/` - Recent searches
  - `GET /api/search/suggestions/` - Search suggestions
- Placeholder implementations for `_search_students`, `_search_staff`
- Static page/settings search with keyword matching
- Recent searches cached per user (30-day TTL)
- Tenant + permission filtering scaffolded but not fully implemented

#### Frontend (`frontend/src/components/search/GlobalSearch.tsx`)
- Modal dialog triggered from header
- Debounced API calls (300ms)
- Recent searches stored in localStorage
- Type chips and icons for result differentiation
- Basic keyboard shortcuts mentioned in UI

### ❌ What's Missing/Broken

| Component | Issue |
|-----------|-------|
| Student/Staff Search | Commented out - returns empty arrays |
| Fees, Books, Exams Search | Not implemented |
| LMS, CRM, Transport Search | Not implemented |
| PostgreSQL FTS Indexes | Not created |
| Autocomplete Suggestions | Only matches recent searches |
| Filter UI | No type/date/class filters |
| Result Grouping | Flat list, not grouped by type |
| Match Highlighting | Not implemented |
| Fuzzy Matching | Not implemented |
| Quick Actions | Not implemented |
| Search Analytics/Audit | Not implemented |
| Keyboard Navigation | Mentioned but not working |

---

## Consolidated Objectives (Best of Both Prompts)

### Phase 1: Core Search Infrastructure (Backend)
1. **Implement PostgreSQL Full-Text Search** with proper `SearchVector`, `SearchQuery`, `SearchRank`
2. **Add search across all major entities**:
   - Students, Staff, Fees (invoices), Books, Exams
   - Pages (dynamic based on tenant modules), Settings
3. **Normalize search result schema**:
   ```json
   {
     "id": "uuid",
     "type": "student|staff|fee|book|exam|page|setting",
     "title": "Display Title",
     "subtitle": "Additional context",
     "url": "/path/to/resource",
     "rank": 0.95,
     "icon": "icon-name",
     "metadata": {
       "class": "Grade 10A",
       "admission_number": "2024001",
       "highlight": "matched <em>text</em>"
     }
   }
   ```
4. **Create PostgreSQL trigram indexes** for fuzzy matching
5. **Implement proper caching and throttling** for suggestions
6. **Add audit logging** for search analytics

### Phase 2: Enhanced API Endpoints
1. **Refactored endpoints**:
   - `GET /api/search/global/?q=&types=&class=&date_from=&date_to=&limit=`
   - `GET /api/search/suggestions/?q=` (autocomplete with smart suggestions)
   - `GET /api/search/recent/` (server-synced recent searches)
   - `POST /api/search/log/` (optional audit logging)
2. **Response format**:
   ```json
   {
     "grouped_results": {
       "students": { "count": 5, "items": [...] },
       "staff": { "count": 3, "items": [...] },
       "pages": { "count": 2, "items": [...] }
     },
     "flat_results": [...],
     "query": "john",
     "total_results": 10,
     "search_time_ms": 45
   }
   ```

### Phase 3: Frontend "Command Palette" Experience
1. **Keyboard-first navigation**:
   - `Ctrl+/` or `Ctrl+K` to open search
   - `↑/↓` to navigate results
   - `Enter` to select
   - `Esc` to close
2. **Autocomplete dropdown** with smart suggestions
3. **Filter UI**:
   - Type multi-select (Students, Staff, Fees, etc.)
   - Class/Section filter
   - Date range picker
4. **Grouped results** by type with counts and icons
5. **Match highlighting** in results
6. **Quick Actions**:
   - "Add student" → Opens Add Student modal
   - Search student → "Collect Fee" action button
7. **No results state** with helpful guidance

### Phase 4: Performance & Polish
1. **Response time targets**:
   - Autocomplete: < 200ms
   - Full search: < 300ms
2. **Caching strategy**:
   - Suggestions cached per query prefix (1 min TTL)
   - Recent searches per user (30 day TTL)
3. **Fuzzy matching** for common typos using PostgreSQL `pg_trgm`
4. **Server-synced recent searches** with localStorage fallback

---

## Technical Implementation Details

### Database Indexes (Migration Required)

```python
# New migration for search indexes
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

class Migration(migrations.Migration):
    operations = [
        # Trigram extension for fuzzy matching
        migrations.RunSQL(
            "CREATE EXTENSION IF NOT EXISTS pg_trgm;",
            "DROP EXTENSION IF EXISTS pg_trgm;"
        ),
        
        # GiST indexes for text search
        migrations.RunSQL(
            """
            CREATE INDEX students_search_idx ON students USING GIN(
                to_tsvector('english', 
                    coalesce(first_name,'') || ' ' || 
                    coalesce(last_name,'') || ' ' || 
                    coalesce(admission_number,'') || ' ' ||
                    coalesce(email,'')
                )
            );
            """,
            "DROP INDEX IF EXISTS students_search_idx;"
        ),
        # Similar for staff, books, etc.
    ]
```

### SearchService Enhancement

```python
class SearchService:
    SEARCHABLE_ENTITIES = {
        'students': {
            'model': 'students.Student',
            'fields': ['first_name', 'last_name', 'admission_number', 'email', 'phone'],
            'weights': {'first_name': 'A', 'last_name': 'A', 'admission_number': 'B', 'email': 'C'},
            'permission': 'student_module',
            'icon': 'person',
            'url_pattern': '/students/{id}'
        },
        'staff': {
            'model': 'staff.Staff',
            'fields': ['first_name', 'last_name', 'employee_id', 'email', 'designation'],
            'weights': {'first_name': 'A', 'last_name': 'A', 'employee_id': 'B'},
            'permission': 'staff_module',
            'icon': 'work',
            'url_pattern': '/staff/{id}'
        },
        'fees': {
            'model': 'fees.FeeInvoice',
            'fields': ['invoice_number'],
            'permission': 'fee_module',
            'icon': 'attach_money',
            'url_pattern': '/fees/invoices/{id}'
        },
        'books': {
            'model': 'library.Book',
            'fields': ['title', 'author', 'isbn'],
            'weights': {'title': 'A', 'author': 'B', 'isbn': 'C'},
            'permission': 'library_module',
            'icon': 'book',
            'url_pattern': '/library/books/{id}'
        },
        'exams': {
            'model': 'exams.Exam',
            'fields': ['name'],
            'permission': 'exam_module',
            'icon': 'assignment',
            'url_pattern': '/exams/{id}'
        }
    }
```

### Frontend Component Structure

```
frontend/src/components/search/
├── GlobalSearch.tsx          # Main command palette component
├── SearchInput.tsx           # Search input with autocomplete
├── SearchFilters.tsx         # Type, class, date filters
├── SearchResults.tsx         # Grouped results display
├── SearchResultItem.tsx      # Individual result with actions
├── SearchHighlight.tsx       # Text highlighting utility
├── useGlobalSearch.ts        # Search hook with debounce
└── searchTypes.ts            # TypeScript interfaces
```

---

## Deliverables Checklist

### Backend
- [x] Migration for PostgreSQL trigram extension and GIN indexes (`0002_add_fts_indexes.py`) ✅ Deployed
- [x] Full `SearchService` implementation with all entities (Students, Staff, Fees, Books, Exams, Pages, Settings)
- [x] Updated `GlobalSearchView` with filters (class, section, date range)
- [x] Enhanced `SearchSuggestionsView` with smart autocomplete
- [x] `QuickSearchView` for optimized autocomplete
- [x] Search analytics logging (via `log_search` method)
- [x] Unit tests for search endpoints (`tests.py`)

### Frontend  
- [x] Refactored `GlobalSearch.tsx` as command palette
- [x] Filter chips UI (type multi-select)
- [x] Grouped results with counts and collapsible sections
- [x] Match highlighting (`HighlightText` component)
- [x] Full keyboard navigation (↑/↓, Enter, Escape)
- [x] Server-synced recent searches with localStorage fallback
- [x] TypeScript interfaces (`searchTypes.ts`)
- [x] Custom hook (`useGlobalSearch.ts`)
- [x] Class/Section filter dropdowns with dynamic loading
- [x] Date range picker using @mui/x-date-pickers
- [x] Quick action buttons in results (View, Edit, Collect Fee, View Attendance, View Results)
- [x] Quick Add Actions in empty state (Add Student, Add Staff, Collect Fee, Issue Book)

### Documentation
- [x] Search architecture README (`backend/search/README.md`)
- [x] Implementation plan artifact

---

## Implementation Order

1. **Backend First** (Foundation):
   - Create migration for search indexes
   - Implement full SearchService
   - Update/create views and serializers
   - Add audit logging model

2. **Frontend Enhancement**:
   - Implement new GlobalSearch component
   - Add filters and grouped results
   - Implement keyboard navigation
   - Add match highlighting

3. **Testing & Polish**:
   - Write tests
   - Performance optimization
   - Documentation

---

## Estimated Effort

| Phase | Estimated Time |
|-------|----------------|
| Phase 1: Backend Core | 4-6 hours |
| Phase 2: API Enhancement | 2-3 hours |
| Phase 3: Frontend Overhaul | 6-8 hours |
| Phase 4: Testing & Polish | 2-3 hours |
| **Total** | **14-20 hours** |

---

## Success Criteria

1. ✅ Search returns results from Students, Staff, Fees, Books, Exams, Pages, Settings
2. ✅ Tenant data is isolated and permission-restricted
3. ✅ Suggestions return within 200ms
4. ✅ Full search returns within 300ms
5. ✅ Supports at least 20 results per type
6. ✅ Queries < 2 chars return no results
7. ✅ Keyboard shortcuts fully functional
8. ✅ Match highlighting visible
9. ✅ Grouped results by type with counts
10. ✅ Recent searches synced to server

