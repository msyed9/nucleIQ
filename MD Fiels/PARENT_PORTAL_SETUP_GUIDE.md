# Parent Portal Setup & Testing Guide

**Quick Start Guide for Testing Parent Portal Features**

---

## 📋 Prerequisites

- Backend server running (Django)
- Frontend development server running (React)
- Database with sample data
- At least one student in the system

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create a Parent User Account

Run in Django shell or create via admin:

```python
# In Django shell: python manage.py shell
from users.models import User
from students.models import ParentUser, Student
from tenants.models import Tenant

# Get tenant
tenant = Tenant.objects.first()

# Create parent user
parent_user = User.objects.create_user(
    email='father@test.com',
    password='test123',
    first_name='John',
    last_name='Doe',
    tenant=tenant
)

# Create parent profile
parent_profile = ParentUser.objects.create(
    user=parent_user,
    tenant=tenant,
    relation_type='FATHER',
    occupation='Engineer',
    portal_access_enabled=True,  # Important!
    email_notifications=True,
    sms_notifications=True
)

# Link to student
student = Student.objects.first()  # Or get specific student
parent_profile.students.add(student)

print(f"✅ Parent created: {parent_user.email}")
print(f"✅ Linked to student: {student.get_full_name()}")
```

### Step 2: Test Parent Login

```bash
# Test via curl or Postman
curl -X POST http://localhost:8000/api/parent/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "father@test.com",
    "password": "test123"
  }'
```

**Expected Response:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJh...",
  "access": "eyJ0eXAiOiJKV1QiLCJh...",
  "user_type": "parent",
  "parent_id": 1,
  "relation_type": "FATHER",
  "students": [
    {
      "id": 1,
      "admission_number": "ADM001",
      "first_name": "Alice",
      "last_name": "Smith"
    }
  ],
  "students_count": 1
}
```

### Step 3: Test Frontend

1. Navigate to: `http://localhost:3000/parent/login`
2. Enter credentials:
   - Email: `father@test.com`
   - Password: `test123`
3. Click "Sign In"
4. Should redirect to `/parent/portal`

---

## 🧪 Complete Testing Checklist

### Authentication Tests

- [ ] Login with valid credentials → Success
- [ ] Login with invalid email → Error: "Invalid email or password"
- [ ] Login with invalid password → Error: "Invalid email or password"
- [ ] Login with disabled portal access → Error: "Portal access is disabled"
- [ ] Token stored in localStorage → Check browser DevTools
- [ ] Auto-redirect to portal after login → `/parent/portal`

### Dashboard Tests

- [ ] Student cards display correctly
- [ ] Student photo loads (or placeholder shows)
- [ ] Click student card → Border turns blue (selected)
- [ ] 360° summary cards populate
- [ ] Attendance percentage shows
- [ ] Fee balance displays
- [ ] Exam average shows
- [ ] Grade badge appears

### Tab Navigation Tests

- [ ] Click "Overview" tab → Student details show
- [ ] Click "Remarks" tab → Remarks list or "No remarks available"
- [ ] Click "Documents" tab → Documents table or "No documents available"
- [ ] Click "Health Records" tab → Health cards or "No health records"
- [ ] Loading bar appears during data fetch
- [ ] Error messages display if API fails

### Data Display Tests

- [ ] Remarks show teacher name and date
- [ ] Documents show verification status (chip colors)
- [ ] Document download button works
- [ ] Health records show height/weight/BMI
- [ ] Empty states show helpful messages

### Responsive Tests

- [ ] Mobile view (< 600px) → Cards stack vertically
- [ ] Tablet view (600-960px) → 2-column layout
- [ ] Desktop view (> 960px) → 3-column layout
- [ ] Tabs scroll on mobile
- [ ] All buttons accessible on small screens

---

## 🛠️ Troubleshooting

### Problem: "Portal access is disabled"
**Solution:**
```python
# In Django shell
parent_profile = ParentUser.objects.get(user__email='father@test.com')
parent_profile.portal_access_enabled = True
parent_profile.save()
```

### Problem: "No students linked"
**Solution:**
```python
# In Django shell
parent_profile = ParentUser.objects.get(user__email='father@test.com')
student = Student.objects.get(admission_number='ADM001')
parent_profile.students.add(student)
```

### Problem: 403 Forbidden on API calls
**Solution:**
- Check JWT token in localStorage
- Verify token is sent in Authorization header
- Check parent profile exists and is active

### Problem: Empty 360° summary
**Solution:**
- Ensure student has attendance records
- Ensure student has fee invoices
- Ensure student has exam results
- Check academic year is active

---

## 📊 Sample Data Setup

### Create Complete Test Data

```python
# Run in Django shell
from django.utils import timezone
from attendance.models import StudentAttendance
from fees.models import FeeInvoice
from exams.models import Exam, ExamResult

student = Student.objects.first()
academic_year = AcademicYear.objects.first()

# Create attendance records
for i in range(30):
    StudentAttendance.objects.create(
        student=student,
        academic_year=academic_year,
        date=timezone.now() - timezone.timedelta(days=i),
        status='PRESENT' if i % 4 != 0 else 'ABSENT',
        tenant=student.tenant
    )

# Create fee invoice
FeeInvoice.objects.create(
    student=student,
    academic_year=academic_year,
    total_amount=50000,
    paid_amount=30000,
    due_date=timezone.now() + timezone.timedelta(days=30),
    status='PARTIAL',
    tenant=student.tenant
)

# Create exam results
exam = Exam.objects.first()
ExamResult.objects.create(
    student=student,
    exam=exam,
    total_marks=100,
    obtained_marks=85,
    percentage=85,
    grade='A',
    tenant=student.tenant
)

print("✅ Sample data created!")
```

---

## 🎯 API Endpoint Testing

### Using Postman or curl

#### 1. Get Students List
```bash
curl -X GET http://localhost:8000/api/parent/students/ \
  -H "Authorization: Bearer <access_token>"
```

#### 2. Get 360° Summary
```bash
curl -X GET http://localhost:8000/api/parent/students/1/360/ \
  -H "Authorization: Bearer <access_token>"
```

#### 3. Get Remarks
```bash
curl -X GET http://localhost:8000/api/parent/students/1/remarks/ \
  -H "Authorization: Bearer <access_token>"
```

#### 4. Get Documents
```bash
curl -X GET http://localhost:8000/api/parent/students/1/documents/ \
  -H "Authorization: Bearer <access_token>"
```

#### 5. Get Health Records
```bash
curl -X GET http://localhost:8000/api/parent/students/1/health-records/ \
  -H "Authorization: Bearer <access_token>"
```

---

## 🔐 Security Testing

### Test Data Isolation

1. Create two parents with different students
2. Login as Parent A
3. Try to access Parent B's student via API
4. Should get 403 Forbidden

```bash
# Should fail
curl -X GET http://localhost:8000/api/parent/students/999/360/ \
  -H "Authorization: Bearer <parent_a_token>"
```

### Test Permission Checks

1. Login as regular user (non-parent)
2. Try to access parent endpoints
3. Should get 403 Forbidden

---

## 📱 Mobile Testing

### Using Browser DevTools

1. Open Chrome DevTools (F12)
2. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Select device: iPhone 12 Pro
4. Navigate to `/parent/login`
5. Test all features in mobile view

### Test Checklist for Mobile
- [ ] Login form is readable
- [ ] Buttons are tap-friendly
- [ ] Cards don't overflow screen
- [ ] Tabs are scrollable
- [ ] Tables are responsive
- [ ] No horizontal scroll

---

## 🚦 Production Deployment Checklist

Before deploying to production:

- [ ] Change default test passwords
- [ ] Set up HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure JWT secret key
- [ ] Enable rate limiting on login endpoint
- [ ] Set up email notifications for new parent accounts
- [ ] Create parent onboarding documentation
- [ ] Test with real parent users
- [ ] Monitor error logs
- [ ] Set up analytics tracking

---

## 📞 Support

### For Parents
- Password reset: Contact school administration
- Portal access: Contact school office
- Technical issues: Email support@school.com

### For Developers
- Check backend logs: `docker-compose logs backend`
- Check frontend console: Browser DevTools
- API docs: http://localhost:8000/api/docs/

---

**Setup Status:** Ready for Testing ✅  
**Estimated Setup Time:** 5-10 minutes  
**Next Steps:** Test all features, create more parent accounts, gather feedback

---

*Document Version: 1.0*  
*Last Updated: January 4, 2026*
