"""
Test script for Student Security & Data Validation Enhancements
Tests Aadhar encryption, phone validation, and email validation
"""

import os
import sys
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from django.core.exceptions import ValidationError
from core.utils import (
    EncryptionManager, 
    validate_indian_phone, 
    validate_email_enhanced,
    validate_aadhar,
    mask_aadhar
)
from students.models import Student
from tenants.models import Tenant
from datetime import date


def test_encryption():
    """Test Aadhar encryption and decryption."""
    print("\n" + "="*60)
    print("TEST 1: Aadhar Encryption/Decryption")
    print("="*60)
    
    # Test encryption
    original = "123456789012"
    encrypted = EncryptionManager.encrypt(original)
    decrypted = EncryptionManager.decrypt(encrypted)
    
    print(f"Original:  {original}")
    print(f"Encrypted: {encrypted[:50]}...")
    print(f"Decrypted: {decrypted}")
    print(f"✓ Encryption works: {original == decrypted}")
    
    # Test masking
    masked = mask_aadhar(original)
    print(f"Masked:    {masked}")
    print(f"✓ Masking works: {masked == 'XXXX-XXXX-9012'}")


def test_phone_validation():
    """Test Indian phone number validation."""
    print("\n" + "="*60)
    print("TEST 2: Phone Number Validation")
    print("="*60)
    
    valid_phones = [
        "+919876543210",
        "9876543210",
        "8123456789",
        "7001234567",
        "6999999999"
    ]
    
    invalid_phones = [
        "1234567890",  # Doesn't start with 6-9
        "98765432",    # Too short
        "98765432101", # Too long
        "+919876543",  # Too short even with +91
        "5876543210"   # Starts with 5
    ]
    
    print("\nValid phone numbers:")
    for phone in valid_phones:
        try:
            validate_indian_phone(phone)
            print(f"  ✓ {phone}")
        except ValidationError as e:
            print(f"  ✗ {phone} - {e}")
    
    print("\nInvalid phone numbers:")
    for phone in invalid_phones:
        try:
            validate_indian_phone(phone)
            print(f"  ✗ {phone} - Should have failed!")
        except ValidationError as e:
            print(f"  ✓ {phone} - Correctly rejected")


def test_email_validation():
    """Test enhanced email validation."""
    print("\n" + "="*60)
    print("TEST 3: Email Validation")
    print("="*60)
    
    valid_emails = [
        "student@school.edu",
        "parent@gmail.com",
        "admin@institution.org"
    ]
    
    disposable_emails = [
        "test@tempmail.com",
        "fake@10minutemail.com",
        "spam@guerrillamail.com"
    ]
    
    print("\nValid emails:")
    for email in valid_emails:
        try:
            validate_email_enhanced(email)
            print(f"  ✓ {email}")
        except ValidationError as e:
            print(f"  ✗ {email} - {e}")
    
    print("\nDisposable emails (should be rejected):")
    for email in disposable_emails:
        try:
            validate_email_enhanced(email)
            print(f"  ✗ {email} - Should have failed!")
        except ValidationError as e:
            print(f"  ✓ {email} - Correctly rejected")


def test_aadhar_validation():
    """Test Aadhar number validation."""
    print("\n" + "="*60)
    print("TEST 4: Aadhar Number Validation")
    print("="*60)
    
    valid_aadhars = [
        "123456789012",
        "999988887777"
    ]
    
    invalid_aadhars = [
        "12345678901",   # 11 digits
        "1234567890123", # 13 digits
        "12345678901a",  # Contains letter
        "123-456-789"    # Too short even with dashes
    ]
    
    print("\nValid Aadhar numbers:")
    for aadhar in valid_aadhars:
        try:
            validate_aadhar(aadhar)
            print(f"  ✓ {aadhar}")
        except ValidationError as e:
            print(f"  ✗ {aadhar} - {e}")
    
    print("\nInvalid Aadhar numbers:")
    for aadhar in invalid_aadhars:
        try:
            validate_aadhar(aadhar)
            print(f"  ✗ {aadhar} - Should have failed!")
        except ValidationError as e:
            print(f"  ✓ {aadhar} - Correctly rejected")


def test_student_model_with_encryption():
    """Test Student model with encrypted Aadhar."""
    print("\n" + "="*60)
    print("TEST 5: Student Model with Encryption")
    print("="*60)
    
    try:
        # Get or create a test tenant
        tenant = Tenant.objects.first()
        if not tenant:
            print("  ⚠ No tenant found. Skipping Student model test.")
            return
        
        print(f"  Using tenant: {tenant.name}")
        
        # Create a test student
        test_aadhar = "123456789012"
        print(f"\n  Creating student with Aadhar: {test_aadhar}")
        
        student = Student(
            tenant=tenant,
            admission_number="TEST001",
            admission_date=date.today(),
            first_name="Test",
            last_name="Student",
            date_of_birth=date(2010, 1, 1),
            gender="M",
            email="test@school.edu",
            phone="9876543210",
            address="Test Address",
            father_name="Test Father",
            father_phone="9876543210",
            mother_name="Test Mother",
            mother_phone="9876543210",
            aadhar_number=test_aadhar
        )
        
        # Validate
        student.full_clean()
        print("  ✓ Student validation passed")
        
        # Save
        student.save()
        print(f"  ✓ Student saved with ID: {student.id}")
        
        # Retrieve and check encryption
        retrieved = Student.objects.get(id=student.id)
        print(f"  Retrieved Aadhar (decrypted): {retrieved.aadhar_number}")
        print(f"  ✓ Aadhar matches: {retrieved.aadhar_number == test_aadhar}")
        
        # Check masking
        masked = mask_aadhar(retrieved.aadhar_number)
        print(f"  Masked Aadhar: {masked}")
        
        # Cleanup
        student.delete()
        print("  ✓ Test student deleted")
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        import traceback
        traceback.print_exc()


def test_invalid_phone_in_model():
    """Test that Student model rejects invalid phone numbers."""
    print("\n" + "="*60)
    print("TEST 6: Student Model Phone Validation")
    print("="*60)
    
    try:
        tenant = Tenant.objects.first()
        if not tenant:
            print("  ⚠ No tenant found. Skipping test.")
            return
        
        # Try to create student with invalid phone
        student = Student(
            tenant=tenant,
            admission_number="TEST002",
            admission_date=date.today(),
            first_name="Test",
            last_name="Student",
            date_of_birth=date(2010, 1, 1),
            gender="M",
            email="test@school.edu",
            phone="1234567890",  # Invalid - starts with 1
            address="Test Address",
            father_name="Test Father",
            father_phone="1234567890",  # Invalid
            mother_name="Test Mother",
            mother_phone="9876543210"
        )
        
        try:
            student.full_clean()
            print("  ✗ Validation should have failed for invalid phone!")
        except ValidationError as e:
            print("  ✓ Invalid phone correctly rejected")
            print(f"     Error: {e.message_dict.get('phone', [''])[0][:60]}...")
            
    except Exception as e:
        print(f"  ✗ Unexpected error: {e}")


if __name__ == "__main__":
    print("\n" + "="*60)
    print("STUDENT SECURITY & DATA VALIDATION TEST SUITE")
    print("="*60)
    
    test_encryption()
    test_phone_validation()
    test_email_validation()
    test_aadhar_validation()
    test_student_model_with_encryption()
    test_invalid_phone_in_model()
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETED")
    print("="*60 + "\n")
