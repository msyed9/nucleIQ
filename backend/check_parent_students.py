#!/usr/bin/env python
"""Check parent-student relationships for debugging"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from students.models import ParentUser, Student

User = get_user_model()

# Search by email or phone
search_terms = ['anita.das226@example.com', '7601425704']

print("=" * 60)
print("CHECKING PARENT USER AND STUDENT LINKS")
print("=" * 60)

for term in search_terms:
    print(f"\n[SEARCH] Searching for: {term}")
    
    # Find user
    users = User.objects.filter(email__iexact=term) | User.objects.filter(phone_number=term)
    
    if not users.exists():
        print(f"   [ERROR] No user found with this email/phone")
        continue
    
    for user in users:
        print(f"\n   [OK] Found User: {user.id}")
        print(f"      Email: {user.email}")
        print(f"      Phone: {user.phone_number}")
        print(f"      Name: {user.get_full_name()}")
        print(f"      Active: {user.is_active}")
        print(f"      Tenant: {user.tenant}")
        print(f"      Tenant ID: {user.tenant_id}")
        
        # Check parent profile
        try:
            parent = ParentUser.objects.get(user=user)
            print(f"\n   [PARENT] ParentUser Found:")
            print(f"      ID: {parent.id}")
            print(f"      Relation: {parent.relation_type}")
            print(f"      Portal Access: {parent.portal_access_enabled}")
            print(f"      Tenant: {parent.tenant}")
            print(f"      Tenant ID: {parent.tenant_id}")
            print(f"      Last Login: {parent.last_login_at}")
            
            # Check linked students
            students = parent.students.all()
            print(f"\n   [STUDENTS] Linked Students ({students.count()}):")
            for student in students:
                print(f"      - {student.id}: {student.get_full_name()} ({student.admission_number})")
                print(f"        Active: {student.is_active}, Tenant: {student.tenant_id}")
                
            # Check students with matching tenant
            tenant_students = parent.students.filter(tenant=user.tenant, is_active=True)
            print(f"\n   [MATCH] Students matching user's tenant ({tenant_students.count()}):")
            for student in tenant_students:
                print(f"      - {student.id}: {student.get_full_name()}")
            
            # Check if tenant mismatch
            if parent.tenant_id != user.tenant_id:
                print(f"\n   [WARNING] TENANT MISMATCH! ParentUser.tenant ({parent.tenant_id}) != User.tenant ({user.tenant_id})")
                
        except ParentUser.DoesNotExist:
            print(f"\n   [ERROR] No ParentUser profile found for this user")
            
            # Check if there are any students with matching parent phone/email
            matching_students = Student.objects.filter(
                father_phone=user.phone_number
            ) | Student.objects.filter(
                mother_phone=user.phone_number
            ) | Student.objects.filter(
                father_email=user.email
            ) | Student.objects.filter(
                mother_email=user.email
            )
            
            if matching_students.exists():
                print(f"\n   [WARNING] Found students with matching parent contact info but NO ParentUser profile:")
                for s in matching_students[:5]:
                    print(f"      - {s.get_full_name()} ({s.admission_number})")
                    print(f"        Father: {s.father_name}, Phone: {s.father_phone}")
                    print(f"        Mother: {s.mother_name}, Phone: {s.mother_phone}")

# Also show all ParentUser entries
print("\n" + "=" * 60)
print("ALL PARENT USERS IN DATABASE (first 10)")
print("=" * 60)
all_parents = ParentUser.objects.all()[:10]
for p in all_parents:
    student_count = p.students.count()
    print(f"  {p.id}: {p.user.get_full_name()} ({p.user.email}) - {student_count} students, portal={p.portal_access_enabled}")
