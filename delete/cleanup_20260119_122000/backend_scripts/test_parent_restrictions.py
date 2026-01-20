import os
import django
import requests
import json

os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings.dev"
django.setup()

from users.models import User

print("=" * 60)
print("TESTING PARENT PORTAL RESTRICTIONS")
print("=" * 60)

# Test 1: Parent Login via Parent API
print("\n[TEST 1] Parent Login via /api/parent/auth/login/")
try:
    response = requests.post(
        "http://localhost:8000/api/parent/auth/login/",
        json={"email": "parent@test.com", "password": "parent123"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f" Login successful")
        print(f"   User Type: {data.get('user_type')}")
        print(f"   Parent ID: {data.get('parent_id')}")
        print(f"   Students: {len(data.get('students', []))}")
        parent_token = data.get('access')
    else:
        print(f" Login failed: {response.json()}")
        parent_token = None
except Exception as e:
    print(f" Error: {e}")
    parent_token = None

# Test 2: Parent trying to login via Admin API
print("\n[TEST 2] Parent Login via /api/auth/login/ (Should get is_parent flag)")
try:
    response = requests.post(
        "http://localhost:8000/api/auth/login/",
        json={"email": "parent@test.com", "password": "parent123"}
    )
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f" Login successful")
        print(f"   User Data: {json.dumps(data.get('user', {}), indent=2)}")
        print(f"   Is Parent: {data.get('user', {}).get('is_parent', False)}")
    else:
        print(f" Login failed: {response.json()}")
except Exception as e:
    print(f" Error: {e}")

# Test 3: Parent trying to access parent students API
if parent_token:
    print("\n[TEST 3] Parent accessing /api/parent/students/ (Should work)")
    try:
        response = requests.get(
            "http://localhost:8000/api/parent/students/",
            headers={"Authorization": f"Bearer {parent_token}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            students = response.json()
            print(f" Access granted - {len(students)} student(s) returned")
            for student in students:
                print(f"   - {student.get('first_name')} {student.get('last_name')} ({student.get('admission_number')})")
        else:
            print(f" Access denied: {response.json()}")
    except Exception as e:
        print(f" Error: {e}")

# Test 4: Parent trying to access admin API
if parent_token:
    print("\n[TEST 4] Parent accessing /api/students/ (Should fail - admin only)")
    try:
        response = requests.get(
            "http://localhost:8000/api/students/",
            headers={"Authorization": f"Bearer {parent_token}"}
        )
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print(f" SECURITY ISSUE: Parent can access admin API!")
        else:
            print(f" Access denied (Expected)")
            print(f"   Error: {response.json()}")
    except Exception as e:
        print(f" Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)