# Quick Integration Guide - Timetable Routes

## Add to App.tsx

### 1. Import the components (add to top of file)

```tsx
import TimetableBuilder from './pages/timetable/TimetableBuilder';
import TeacherView from './pages/timetable/TeacherView';
import ClassView from './pages/timetable/ClassView';
```

### 2. Add routes (inside your Routes component)

```tsx
{/* Timetable Routes */}
<Route path="/timetable/builder" element={<TimetableBuilder />} />
<Route path="/timetable/teacher" element={<TeacherView />} />
<Route path="/timetable/class" element={<ClassView />} />
```

### 3. Add navigation links (in your sidebar/menu component)

```tsx
<Link to="/timetable/builder">
  <span>📅</span>
  <span>Timetable Builder</span>
</Link>

<Link to="/timetable/teacher">
  <span>👨‍🏫</span>
  <span>Teacher Schedule</span>
</Link>

<Link to="/timetable/class">
  <span>📚</span>
  <span>Class Schedule</span>
</Link>
```

## Complete Example

```tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TimetableBuilder from './pages/timetable/TimetableBuilder';
import TeacherView from './pages/timetable/TeacherView';
import ClassView from './pages/timetable/ClassView';

function App() {
  return (
    <Router>
      <Routes>
        {/* ... other routes ... */}
        
        {/* Timetable Routes */}
        <Route path="/timetable/builder" element={<TimetableBuilder />} />
        <Route path="/timetable/teacher" element={<TeacherView />} />
        <Route path="/timetable/class" element={<ClassView />} />
      </Routes>
    </Router>
  );
}

export default App;
```

## Sidebar Menu Example

```tsx
const menuItems = [
  // ... other menu items ...
  {
    title: 'Timetable',
    icon: '📅',
    children: [
      {
        title: 'Builder',
        path: '/timetable/builder',
        icon: '🏗️'
      },
      {
        title: 'Teacher Schedule',
        path: '/timetable/teacher',
        icon: '👨‍🏫'
      },
      {
        title: 'Class Schedule',
        path: '/timetable/class',
        icon: '📚'
      }
    ]
  }
];
```

## Role-Based Access (Optional)

If you want to restrict access by role:

```tsx
import { ProtectedRoute } from './components/ProtectedRoute';

// In your routes:
<Route 
  path="/timetable/builder" 
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL']}>
      <TimetableBuilder />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/timetable/teacher" 
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER']}>
      <TeacherView />
    </ProtectedRoute>
  } 
/>

<Route 
  path="/timetable/class" 
  element={
    <ProtectedRoute allowedRoles={['ADMIN', 'PRINCIPAL', 'TEACHER', 'STUDENT']}>
      <ClassView />
    </ProtectedRoute>
  } 
/>
```

## Testing the Routes

After adding the routes, test by navigating to:
- http://localhost:5173/timetable/builder
- http://localhost:5173/timetable/teacher
- http://localhost:5173/timetable/class

All routes should load without errors!
