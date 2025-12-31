# 📅 Timetable Management System

> **A complete, production-ready conflict-free scheduling engine for educational institutions**

![Status](https://img.shields.io/badge/Status-Complete-success)
![Backend](https://img.shields.io/badge/Backend-Django%20REST-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## 🎯 Overview

A comprehensive timetable management system with **drag-and-drop interface**, **real-time conflict detection**, and **multiple viewing modes**. Built for the NucleIQ School Management SaaS platform.

### ✨ Key Features

- 🎨 **Drag-and-Drop Builder** - Intuitive visual interface
- 🛡️ **Conflict Detection** - Multi-layer validation
- 👨‍🏫 **Teacher View** - Personal schedule display
- 📚 **Class View** - Section timetable with print support
- 📱 **Responsive Design** - Works on all devices
- ⚡ **Real-time Validation** - Instant feedback
- 🎨 **Beautiful UI** - Modern gradients and animations

---

## 📸 Screenshots

### Timetable Builder
![Timetable Builder](../.gemini/antigravity/brain/4c65365d-74bd-4367-9908-bd4b5a2663d2/timetable_system_showcase_1767093937930.png)

*Drag-and-drop interface with conflict detection*

---

## 🏗️ Architecture

```
Frontend (React + TypeScript)
    ↓
REST API (Django REST Framework)
    ↓
Validators (Conflict Detection)
    ↓
Models (Database Layer)
    ↓
PostgreSQL (Data Storage)
```

**See [TIMETABLE_ARCHITECTURE.md](./TIMETABLE_ARCHITECTURE.md) for detailed diagrams**

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Installation

#### Option 1: Automated Setup (Recommended)
```powershell
# Windows
.\setup_timetable.ps1

# Linux/Mac
./setup_timetable.sh
```

#### Option 2: Manual Setup

**Backend:**
```bash
# Create and run migrations
docker-compose exec backend python manage.py makemigrations timetable
docker-compose exec backend python manage.py migrate timetable
```

**Frontend:**
```bash
# Install dependencies
cd frontend
npm install react-dnd react-dnd-html5-backend
```

**Integration:**
See [TIMETABLE_ROUTES_GUIDE.md](./TIMETABLE_ROUTES_GUIDE.md) for adding routes to your app.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Implementation Summary](./TIMETABLE_IMPLEMENTATION_SUMMARY.md) | Complete overview |
| [System Documentation](./TIMETABLE_SYSTEM_COMPLETE.md) | Detailed features |
| [Architecture Guide](./TIMETABLE_ARCHITECTURE.md) | Technical architecture |
| [Routes Guide](./TIMETABLE_ROUTES_GUIDE.md) | Integration instructions |
| [Quick Start Checklist](./TIMETABLE_QUICK_START_CHECKLIST.md) | Setup checklist |

---

## 🎯 Features

### 1. Timetable Builder (`/timetable/builder`)

**Drag-and-Drop Interface:**
- Visual weekly grid (Days × Time Slots)
- Subject palette for dragging
- Real-time conflict detection
- Edit and delete functionality
- Academic year and section filters

**Conflict Detection:**
- Teacher availability checking
- Room booking validation
- Section schedule verification
- Automatic time validation

### 2. Teacher View (`/timetable/teacher`)

**Features:**
- Teacher selection dropdown
- Profile card with photo and details
- Weekly schedule organized by day
- Statistics (total classes, subjects)
- Beautiful card-based layout

### 3. Class View (`/timetable/class`)

**Features:**
- Section selection dropdown
- Section info card with stats
- Traditional timetable table
- Print-friendly layout
- Complete weekly view

---

## 🔧 API Endpoints

### Timetable Slots

```http
GET    /api/timetable/slots/
POST   /api/timetable/slots/
GET    /api/timetable/slots/{id}/
PATCH  /api/timetable/slots/{id}/
DELETE /api/timetable/slots/{id}/
```

### Custom Actions

```http
POST /api/timetable/slots/check_availability/
GET  /api/timetable/slots/teacher_schedule/?teacher_id={id}
GET  /api/timetable/slots/section_schedule/?section_id={id}
POST /api/timetable/slots/bulk_create/
GET  /api/timetable/slots/weekly_view/?section_id={id}
```

### Templates

```http
GET  /api/timetable/templates/
POST /api/timetable/templates/
```

**See [TIMETABLE_SYSTEM_COMPLETE.md](./TIMETABLE_SYSTEM_COMPLETE.md) for API examples**

---

## 🛡️ Conflict Detection

### Multi-Layer Validation

1. **Frontend** - Pre-check before API call
2. **API Endpoint** - Availability checking
3. **Serializer** - Data validation
4. **Model** - Database-level checks
5. **Database** - Constraints and indexes

### What's Validated

- ✅ Teacher can't be in two places at once
- ✅ Room can't be double-booked
- ✅ Section can't have overlapping classes
- ✅ End time must be after start time

---

## 🎨 Design System

### Color Schemes

- **Timetable Builder**: Purple/Violet gradients (`#667eea` → `#764ba2`)
- **Teacher View**: Green gradients (`#10b981` → `#059669`)
- **Class View**: Orange/Amber gradients (`#f59e0b` → `#d97706`)

### UI Components

- Gradient backgrounds
- Smooth animations
- Hover effects
- Card-based layouts
- Responsive grids
- Modern typography

---

## 📊 Database Schema

### TimetableSlot Model

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| tenant | FK | Tenant isolation |
| academic_year | FK | Academic year |
| section | FK | Class/Section |
| subject | FK | Subject |
| teacher | FK | Staff member |
| day_of_week | Enum | MONDAY-SUNDAY |
| start_time | Time | Class start time |
| end_time | Time | Class end time |
| room | String | Room number |
| period_number | Integer | Period in schedule |
| is_active | Boolean | Active status |
| notes | Text | Additional notes |

**Indexes:** tenant, academic_year, section, teacher, day, time, room

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Create timetable slot
- [ ] Edit existing slot
- [ ] Delete slot
- [ ] Drag and drop works
- [ ] Conflicts are detected
- [ ] Teacher schedule loads
- [ ] Class schedule loads
- [ ] Print functionality works

### Test Data Requirements

- At least one Academic Year (active)
- At least one Section
- At least one Subject
- At least one Teacher (Staff)

---

## 🔐 Security

- ✅ Tenant isolation (RLS)
- ✅ Authentication required
- ✅ Permission-based access
- ✅ CSRF protection
- ✅ Input validation
- ✅ SQL injection prevention

---

## 📈 Performance

### Optimizations

- Database indexes on common queries
- Select related for foreign keys
- Efficient conflict checking
- Lazy loading
- Pagination support

### Scalability

- Handles hundreds of slots
- Multiple academic years
- Tenant-isolated data
- Soft delete for history

---

## 🛠️ Tech Stack

### Backend
- Django 5.0
- Django REST Framework
- PostgreSQL 16+
- Python 3.11+

### Frontend
- React 18
- TypeScript
- React DnD (Drag and Drop)
- Axios
- CSS3 (Gradients, Animations)

---

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

---

## 🤝 Contributing

This is a proprietary system for NucleIQ. Internal contributions follow the standard development workflow.

---

## 📄 License

Proprietary - NucleIQ School Management SaaS

---

## 📞 Support

For issues or questions:
1. Check the documentation files
2. Review the architecture guide
3. Test API endpoints manually
4. Check browser console for errors

---

## 🎉 Credits

**Developed by:** NucleIQ Development Team  
**Framework:** Django + React  
**Design:** Modern SaaS UI/UX

---

## 📝 Changelog

### Version 1.0.0 (2025-12-30)
- ✅ Initial release
- ✅ Drag-and-drop builder
- ✅ Teacher view
- ✅ Class view
- ✅ Conflict detection
- ✅ Complete documentation

---

## 🚀 Deployment

### Production Checklist

- [ ] Run migrations
- [ ] Collect static files
- [ ] Configure environment variables
- [ ] Set up SSL certificates
- [ ] Configure CORS
- [ ] Enable caching
- [ ] Set up monitoring
- [ ] Configure backups

---

## 🎯 Roadmap

### Future Enhancements

- [ ] Export to PDF/Excel
- [ ] Recurring patterns
- [ ] Substitution management
- [ ] Conflict resolution suggestions
- [ ] Mobile app
- [ ] Push notifications
- [ ] Analytics dashboard
- [ ] Template library

---

**Made with ❤️ for NucleIQ**

**Happy Scheduling! 📅✨**
