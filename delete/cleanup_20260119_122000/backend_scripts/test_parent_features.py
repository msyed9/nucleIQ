"""
Test Parent Portal Features:
1. Parent login works
2. Parents can see their children
3. Auto-creation of parent accounts during student admission
"""
import os
import django
import requests
import json

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from users.models import User
from students.models import ParentUser, Student

print("=" * 70)
print("PARENT PORTAL FEATURES TEST")
print("=" * 70)

# Test 1: Verify existing parent login
print("\n[TEST 1] Existing Parent Login")
print("-" * 70)
try:
    resp = requests.post(
        'http://localhost:8000/api/parent/auth/login/',
        json={'email': 'parent@test.com', 'password': 'parent123'}
    )
    if resp.status_code == 200:
        data = resp.json()
        print(f" Login successful")
        print(f"   User Type: {data.get('user_type')}")
        print(f"   Parent ID: {data.get('parent_id')}")
        print(f"   Students Count: {len(data.get('students', []))}")
        
        # Test fetching students
        token = data.get('access')
        resp2 = requests.get(
            'http://localhost:8000/api/parent/students/',
            headers={'Authorization': f'Bearer {token}'}
        )
        if resp2.status_code == 200:
            students = resp2.json()
            print(f" Students API: {len(students)} student(s)")
            for student in students:
                print(f"   - {student.get('first_name')} {student.get('last_name')} ({student.get('admission_number')})")
        else:
            print(f" Students API failed: {resp2.status_code}")
    else:
        print(f" Login failed: {resp.status_code}")
except Exception as e:
    print(f" Error: {e}")

# Test 2: Check parent user creation
print("\n[TEST 2] Parent User Auto-Creation Stats")
print("-" * 70)
parent_users = ParentUser.objects.all()
print(f"Total Parent Users: {parent_users.count()}")
for parent in parent_users:
    student_count = parent.students.count()
    print(f"  - {parent.user.get_full_name()} ({parent.relation_type})")
    print(f"    Email: {parent.user.email}")
    print(f"    Phone: {parent.user.phone_number}")
    print(f"    Portal Access: {parent.portal_access_enabled}")
    print(f"    Linked Students: {student_count}")
    for student in parent.students.all()[:3]:  # Show first 3
        print(f"       {student.first_name} {student.last_name} ({student.admission_number})")

# Test 3: Verify parent cannot access admin API
print("\n[TEST 3] Security Check - Parent Access to Admin API")
print("-" * 70)
try:
    resp = requests.post(
        'http://localhost:8000/api/parent/auth/login/',
        json={'email': 'parent@test.com', 'password': 'parent123'}
    )
    if resp.status_code == 200:
        token = resp.json().get('access')
        
        # Try to access admin students API
        resp2 = requests.get(
            'http://localhost:8000/api/students/',
            headers={'Authorization': f'Bearer {token}'}
        )
        if resp2.status_code == 403:
            print(" Parent BLOCKED from admin API (Expected)")
        elif resp2.status_code == 200:
            print(" SECURITY ISSUE: Parent can access admin API!")
        else:
            print(f"  Unexpected status: {resp2.status_code}")
except Exception as e:
    print(f" Error: {e}")

print("\n" + "=" * 70)
print("TEST COMPLETE")
print("=" * 70)

print("\n Summary:")
print("  - Parent login: parent@test.com / parent123")
print("  - Parent portal: http://localhost:5173/parent/login")
print("  - Auto-creation: Enabled when adding students with father/mother phone")