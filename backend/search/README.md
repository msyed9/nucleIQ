# Global Search Architecture - NucleiQ

## Overview

NucleiQ's Global Search provides a powerful, keyboard-first search experience across all modules. It uses PostgreSQL Full-Text Search with trigram similarity for fuzzy matching.

## Features

### Core Capabilities
- **Multi-entity search**: Students, Staff, Fees, Books, Exams, Pages, Settings
- **Full-text search**: Uses PostgreSQL's `SearchVector`, `SearchQuery`, `SearchRank`
- **Fuzzy matching**: Handles typos using `pg_trgm` trigram similarity
- **Match highlighting**: Highlights search terms in results
- **Grouped results**: Results organized by type with counts
- **Keyboard navigation**: Arrow keys, Enter, Escape
- **Recent searches**: Server-synced with localStorage fallback
- **Tenant isolation**: Results filtered by tenant with permission checks

### Performance
- **Search response**: < 300ms target
- **Suggestions**: < 200ms target
- **Caching**: 1-minute TTL for suggestions
- **Rate limiting**: 60 requests/minute for suggestions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │ GlobalSearch.tsx│  │ useGlobalSearch.ts│  │ searchTypes.ts │  │
│  │ (UI Component)  │  │ (State + API)    │  │ (TypeScript)   │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────────────┘  │
│           │                    │                                 │
│           └────────────────────┴─────────────────────────────────┤
│                                │                                 │
│                        API Calls                                 │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │   views.py      │  │ search_service.py│  │ serializers.py │  │
│  │ (API Endpoints) │  │ (Business Logic) │  │ (Validation)   │  │
│  └────────┬────────┘  └────────┬─────────┘  └────────────────┘  │
│           │                    │                                 │
│           └────────────────────┴─────────────────────────────────┤
│                                │                                 │
│                      PostgreSQL FTS                              │
└────────────────────────────────┼─────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                       PostgreSQL                                 │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────┐  │
│  │  GIN Indexes    │  │ pg_trgm Extension│  │  tsvector      │  │
│  │ (Full-text)     │  │ (Fuzzy match)    │  │ (Text search)  │  │
│  └─────────────────┘  └──────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## API Endpoints

### `GET /api/search/`
Global search with filters.

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `types` | string | No | Comma-separated types to search |
| `limit` | int | No | Max results per type (default: 20) |
| `class_id` | UUID | No | Filter by class/grade |
| `section_id` | UUID | No | Filter by section |
| `date_from` | date | No | Filter from date |
| `date_to` | date | No | Filter to date |
| `grouped` | bool | No | Return grouped results (default: true) |

**Response (grouped):**
```json
{
  "students": {
    "count": 5,
    "items": [
      {
        "id": "uuid",
        "type": "student",
        "title": "John Doe",
        "subtitle": "2024001 - Grade 10A",
        "url": "/students/uuid",
        "icon": "person",
        "rank": 0.95,
        "metadata": {
          "admission_number": "2024001",
          "highlight": "<mark>John</mark> Doe"
        }
      }
    ]
  },
  "staff": { "count": 0, "items": [] },
  "query": "john",
  "total_results": 5,
  "search_time_ms": 42
}
```

### `GET /api/search/quick/`
Optimized for autocomplete (minimal response).

### `GET /api/search/suggestions/`
Autocomplete suggestions based on prefix.

### `GET /api/search/recent/`
User's recent searches.

### `DELETE /api/search/recent/`
Clear recent searches.

## Searchable Entities

### Students
**Fields searched:**
- `first_name` (weight A)
- `last_name` (weight A)
- `admission_number` (weight B)
- `email` (weight C)
- `phone` (weight C)

**Filters:** `class_id`, `section_id`

### Staff
**Fields searched:**
- `first_name` (weight A)
- `last_name` (weight A)
- `employee_id` (weight B)
- `email` (weight C)
- `phone` (weight C)

### Fees
**Fields searched:**
- `invoice_number`
- Related `student` name

**Filters:** `date_from`, `date_to`

### Books
**Fields searched:**
- `title` (weight A)
- `author` (weight B)
- `isbn` (weight C)
- `description` (weight D)

### Exams
**Fields searched:**
- `name`
- Related `subject` name

### Pages (Navigation)
**Searched against:**
- Page titles
- Subtitles
- Keywords

**Filtered by:** Tenant's enabled modules

### Settings
**Searched against:**
- Setting titles
- Descriptions
- Keywords

## Database Indexes

The migration `0002_add_fts_indexes.py` creates:

```sql
-- Trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Full-text search indexes
CREATE INDEX students_fts_idx ON students USING GIN(
    to_tsvector('english', 
        COALESCE(first_name, '') || ' ' || 
        COALESCE(last_name, '') || ' ' || 
        COALESCE(admission_number, '')
    )
);

-- Trigram indexes for fuzzy matching
CREATE INDEX students_trgm_idx ON students USING GIN(
    (first_name || ' ' || last_name) gin_trgm_ops
);
```

## Frontend Components

### GlobalSearch.tsx
Main search dialog component featuring:
- Material-UI Dialog with keyboard handling
- Type filter chips
- Collapsible result groups
- Match highlighting
- Search timing display
- Recent searches

### useGlobalSearch.ts
Custom hook providing:
- State management
- Debounced API calls
- Abort controller for request cancellation
- Keyboard navigation helpers
- Recent search sync

### searchTypes.ts
TypeScript interfaces:
- `SearchResult`
- `SearchResponse`
- `SearchFilters`
- Type constants and mappings

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search |
| `Ctrl+/` | Open search (alternative) |
| `↑` / `↓` | Navigate results |
| `Enter` | Select result |
| `Escape` | Close search |

## Permission Model

Search respects the RBAC permission system:
- Each entity type requires `{module}_module.read` permission
- Pages filtered by tenant's `enabled_modules`
- Platform admins and superusers bypass permission checks

## Caching Strategy

| Cache Type | TTL | Key Pattern |
|-----------|-----|-------------|
| Suggestions | 1 min | `search_suggestions_{tenant_id}_{query_prefix}` |
| Recent searches | 30 days | `recent_searches_{user_id}` |

## Extending Search

To add a new entity type:

1. **Backend (`search_service.py`):**
   - Add to `SEARCHABLE_ENTITIES` dict
   - Create `_search_{entity}()` method

2. **Frontend (`searchTypes.ts`):**
   - Add to `SearchResultType`
   - Add icon/color/label mappings

3. **Database (new migration):**
   - Create GIN/trigram indexes for new table

## Testing

Run backend tests:
```bash
python manage.py test search
```

Test endpoints:
```bash
# Search
curl "http://localhost:8000/api/search/?q=john" -H "Authorization: Bearer {token}"

# Suggestions
curl "http://localhost:8000/api/search/suggestions/?q=joh" -H "Authorization: Bearer {token}"

# Recent
curl "http://localhost:8000/api/search/recent/" -H "Authorization: Bearer {token}"
```
