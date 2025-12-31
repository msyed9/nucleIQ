# Phase 4: Extended Modules & Character Building

**Goal**: Complete the school ecosystem and student character development.

---

## Prompt 4.1: Library & Digital LMS

**Context**: Managing physical books and digital e-learning resources.

```markdown
# 📚 SMART LIBRARY & DIGITAL LMS

Build a hybrid library system for Physical & Digital assets.

## 📝 Functional Requirements

1.  **Physical Library (The Books)**:
    - **Catalog**: ISBN (Auto-fetch info), Title, Author, Shelf Location.
    - **Circulation**:
        - **Issue/Return**: Barcode Scan -> Auto-assign to Student.
        - **Reservation**: "Reserve Book" if out of stock -> Notify when returned.
    - **Fines**: Auto-calc overdue fees (Configurable: ₹5/day).

2.  **Digital LMS (The E-Learning)**:
    - **Resources**: Upload PDF Notes, Video Links (YouTube/Vimeo), Audio.
    - **Access Control**: "Class 10 Only" can view "Physics Chapter 5 Notes".
    - **Tracking**: "Who downloaded this file?".

3.  **OPAC (Online Public Access Catalog)**:
    - Student/Parent Portal to search books and view digital content.

## 📦 Deliverables
- `backend/library/models.py`.
- `frontend/src/pages/library/Catalog.tsx`.
- `frontend/src/pages/lms/DigitalResources.tsx`.
```

---

## Prompt 4.2: Transport Management

```markdown
# 🚌 TRANSPORT & FLEET

Manage buses and routes.

## 📝 Functional Requirements
1.  **Routes**: Stops and timing.
2.  **Vehicle**: Bus details, insurance expiry.
3.  **Tracking**: Integrate GPS API (optional).
```

---

## Prompt 4.3: Inventory & School Store

**Context**: Managing school supplies and selling them to parents.

```markdown
# 📦 INVENTORY & E-COMMERCE STORE

Manage internal stocks and a public storefront.

## 📝 Functional Requirements

1.  **Internal Inventory**:
    - **Item Master**: Categories (Stationery, Uniform, cleaning supplies, IT Assets).
    - **Stock Management**:
        - **GRN (Goods Received Note)**: Add stock from Vendors.
        - **Low Stock Alerts**: Email Admin when "Notebooks < 50".
    - **Asset Tracking**: "Laptop Serial #123 assigned to Teacher A".

2.  **School Store (Parent E-commerce)**:
    - **Storefront UI**: Parents browse "Class 5 Kit" (Books + Uniform).
    - **Order Workflow**: Add to Cart -> Pay Online -> Generate "Pickup Token".
    - **Fulfillment**: Store manager marks "Delivered" when parent picks up.

## 📦 Deliverables
- `backend/inventory/models.py`.
- `frontend/src/pages/inventory/StockManager.tsx`.
- `frontend/src/pages/store/ParentShop.tsx`.
```

---

## Prompt 4.4: Hostel/Dormitory

```markdown
# 🛏️ HOSTEL MANAGEMENT

Manage residential facilities.

## 📝 Functional Requirements
1.  **Infrastructure**: Buildings, Rooms, Beds.
2.  **Allocation**: Assign Student -> Bed.
3.  **Mess**: Meal planning and attendance.
```

---

## Prompt 4.5: Salah (Prayer) Tracker

**Context**: For Islamic schools, encouraging spiritual discipline is key.

```markdown
# 🕌 SALAH TRACKER (SPIRITUAL DEVELOPMENT)

A gamified tracker for daily 5 prayers.

## 📝 Functional Requirements

1.  **Tracking Model (Universal)**:
    - **Scope**: Available for **Students, Staff, AND Parents**.
    - **Prayers**: Fajr, Dhuhr, Asr, Maghrib, Isha.
    - **Roles**:
        - **Student**: Logs monitored by Parent/Teacher.
        - **Staff**: Self-driven (Optional: Shared with Principal for "Spiritual Leader" awards).
        - **Parent**: Private personal tracker (Value-add feature for them).
    - **Status**: Prayed in Masjid (Gold), Prayed Alone (Green), Missed (Red).
    - **Frequency**: Daily entry required.

2.  **Gamification**:
    - **Streaks**: "7 Days Facr Streak!".
    - **Leaderboard**: Class-wise ranking (Optional/Configurable).
    - **Badges**: "Early Riser" (For consistent Fajr).

3.  **Visual Analytics**:
    - **Performance Graph**: Bar chart showing "Prayed in Masjid vs Alone vs Missed" over last 30 days.
    - **Trend Line**: "Consistency Score" trend (Are they improving?).
    - **Parent Dashboard**: Parents see a Weekly Summary Card with visual stats.

## 📦 Deliverables
- `backend/character/models.py` (SalahLog).
- `frontend/src/pages/character/SalahTracker.tsx` (Interactive Charts using Recharts).
```

---

## Prompt 4.6: Habit & Discipline Tracker

**Context**: Tracking soft skills and behavior beyond academics.

```markdown
# 🌱 HABIT & DISCIPLINE BUILDER

Track daily habits and behavioral incidents.

## 📝 Functional Requirements

1.  **Good Habits (Green Points)**:
    - Customizable List: "Helping Others", "Clean Uniform", "Submitted Homework on Time".
    - **Log**: Teacher assigns points -> Student gets notifiction.

2.  **Areas of Improvement (Red Points)**:
    - List: "Late to Class", "Disruptive", "No Textbook".
    - **Flow**: Minor infractions = Warning. 3 Warnings = Incident Report sent to Parent.

3.  **Behavioral Analytics (Visuals)**:
    - **Radar Chart**: Visualizing character traits (e.g., Punctuality, Leadership, Hygiene).
    - **Incident Heatmap**: "When does bad behavior happen?" (e.g., Mostly Monday mornings).
    - **Score Trend**: Line graph of "Character Score" over the term.

## 📦 Deliverables
- `backend/character/models.py` (Habit, BehaviorLog).
- `frontend/src/pages/character/HabitTracker.tsx`.
- `frontend/src/components/analytics/RadarChart.tsx`.
```
