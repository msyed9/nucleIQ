"""
Django management command to test Student Security & Data Validation Enhancements
Tests Aadhar encryption, phone validation, and email validation
"""

from django.core.management.base import BaseCommand
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


class Command(BaseCommand):
    help = 'Test security and validation enhancements for Student module'

    def handle(self, *args, **options):
        self.stdout.write("\n" + "="*60)
        self.stdout.write("STUDENT SECURITY & DATA VALIDATION TEST SUITE")
        self.stdout.write("="*60)
        
        self.test_encryption()
        self.test_phone_validation()
        self.test_email_validation()
        self.test_aadhar_validation()
        self.test_student_model_with_encryption()
        self.test_invalid_phone_in_model()
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("ALL TESTS COMPLETED"))
        self.stdout.write("="*60 + "\n")

    def test_encryption(self):
        """Test Aadhar encryption and decryption."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 1: Aadhar Encryption/Decryption")
        self.stdout.write("="*60)
        
        # Test encryption
        original = "123456789012"
        encrypted = EncryptionManager.encrypt(original)
        decrypted = EncryptionManager.decrypt(encrypted)
        
        self.stdout.write(f"Original:  {original}")
        self.stdout.write(f"Encrypted: {encrypted[:50]}...")
        self.stdout.write(f"Decrypted: {decrypted}")
        
        if original == decrypted:
            self.stdout.write(self.style.SUCCESS("✓ Encryption works"))
        else:
            self.stdout.write(self.style.ERROR("✗ Encryption failed"))
        
        # Test masking
        masked = mask_aadhar(original)
        self.stdout.write(f"Masked:    {masked}")
        
        if masked == 'XXXX-XXXX-9012':
            self.stdout.write(self.style.SUCCESS("✓ Masking works"))
        else:
            self.stdout.write(self.style.ERROR("✗ Masking failed"))

    def test_phone_validation(self):
        """Test Indian phone number validation."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 2: Phone Number Validation")
        self.stdout.write("="*60)
        
        valid_phones = [
            "+919876543210",
            "9876543210",
            "8123456789",
            "7001234567",
            "6999999999"
        ]
        
        invalid_phones = [
            "1234567890",
            "98765432",
            "98765432101",
            "+919876543",
            "5876543210"
        ]
        
        self.stdout.write("\nValid phone numbers:")
        for phone in valid_phones:
            try:
                validate_indian_phone(phone)
                self.stdout.write(self.style.SUCCESS(f"  ✓ {phone}"))
            except ValidationError:
                self.stdout.write(self.style.ERROR(f"  ✗ {phone}"))
        
        self.stdout.write("\nInvalid phone numbers (should be rejected):")
        for phone in invalid_phones:
            try:
                validate_indian_phone(phone)
                self.stdout.write(self.style.ERROR(f"  ✗ {phone} - Should have failed!"))
            except ValidationError:
                self.stdout.write(self.style.SUCCESS(f"  ✓ {phone} - Correctly rejected"))

    def test_email_validation(self):
        """Test enhanced email validation."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 3: Email Validation")
        self.stdout.write("="*60)
        
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
        
        self.stdout.write("\nValid emails:")
        for email in valid_emails:
            try:
                validate_email_enhanced(email)
                self.stdout.write(self.style.SUCCESS(f"  ✓ {email}"))
            except ValidationError:
                self.stdout.write(self.style.ERROR(f"  ✗ {email}"))
        
        self.stdout.write("\nDisposable emails (should be rejected):")
        for email in disposable_emails:
            try:
                validate_email_enhanced(email)
                self.stdout.write(self.style.ERROR(f"  ✗ {email} - Should have failed!"))
            except ValidationError:
                self.stdout.write(self.style.SUCCESS(f"  ✓ {email} - Correctly rejected"))

    def test_aadhar_validation(self):
        """Test Aadhar number validation."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 4: Aadhar Number Validation")
        self.stdout.write("="*60)
        
        valid_aadhars = [
            "123456789012",
            "999988887777"
        ]
        
        invalid_aadhars = [
            "12345678901",
            "1234567890123",
            "12345678901a",
            "123-456-789"
        ]
        
        self.stdout.write("\nValid Aadhar numbers:")
        for aadhar in valid_aadhars:
            try:
                validate_aadhar(aadhar)
                self.stdout.write(self.style.SUCCESS(f"  ✓ {aadhar}"))
            except ValidationError:
                self.stdout.write(self.style.ERROR(f"  ✗ {aadhar}"))
        
        self.stdout.write("\nInvalid Aadhar numbers (should be rejected):")
        for aadhar in invalid_aadhars:
            try:
                validate_aadhar(aadhar)
                self.stdout.write(self.style.ERROR(f"  ✗ {aadhar} - Should have failed!"))
            except ValidationError:
                self.stdout.write(self.style.SUCCESS(f"  ✓ {aadhar} - Correctly rejected"))

    def test_student_model_with_encryption(self):
        """Test Student model with encrypted Aadhar."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 5: Student Model with Encryption")
        self.stdout.write("="*60)
        
        try:
            tenant = Tenant.objects.first()
            if not tenant:
                self.stdout.write(self.style.WARNING("  ⚠ No tenant found. Skipping test."))
                return
            
            self.stdout.write(f"  Using tenant: {tenant.name}")
            
            # Create a test student with unique admission number
            import time
            test_aadhar = "123456789012"
            admission_num = f"TEST_SEC_{int(time.time())}"
            self.stdout.write(f"\n  Creating student with Aadhar: {test_aadhar}")
            
            student = Student(
                tenant=tenant,
                admission_number=admission_num,
                admission_date=date.today(),
                first_name="Test",
                last_name="Security",
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
            self.stdout.write(self.style.SUCCESS("  ✓ Student validation passed"))
            
            # Save
            student.save()
            self.stdout.write(self.style.SUCCESS(f"  ✓ Student saved with ID: {student.id}"))
            
            # Retrieve and check encryption
            retrieved = Student.objects.get(id=student.id)
            self.stdout.write(f"  Retrieved Aadhar (decrypted): {retrieved.aadhar_number}")
            
            if retrieved.aadhar_number == test_aadhar:
                self.stdout.write(self.style.SUCCESS("  ✓ Aadhar encryption/decryption works"))
            else:
                self.stdout.write(self.style.ERROR("  ✗ Aadhar mismatch"))
            
            # Check masking
            masked = mask_aadhar(retrieved.aadhar_number)
            self.stdout.write(f"  Masked Aadhar: {masked}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Error: {e}"))

    def test_invalid_phone_in_model(self):
        """Test that Student model rejects invalid phone numbers."""
        self.stdout.write("\n" + "="*60)
        self.stdout.write("TEST 6: Student Model Phone Validation")
        self.stdout.write("="*60)
        
        try:
            tenant = Tenant.objects.first()
            if not tenant:
                self.stdout.write(self.style.WARNING("  ⚠ No tenant found. Skipping test."))
                return
            
            # Try to create student with invalid phone
            student = Student(
                tenant=tenant,
                admission_number="TEST_SEC_002",
                admission_date=date.today(),
                first_name="Test",
                last_name="Invalid",
                date_of_birth=date(2010, 1, 1),
                gender="M",
                email="test@school.edu",
                phone="1234567890",  # Invalid
                address="Test Address",
                father_name="Test Father",
                father_phone="1234567890",  # Invalid
                mother_name="Test Mother",
                mother_phone="9876543210"
            )
            
            try:
                student.full_clean()
                self.stdout.write(self.style.ERROR("  ✗ Validation should have failed!"))
            except ValidationError as e:
                self.stdout.write(self.style.SUCCESS("  ✓ Invalid phone correctly rejected"))
                if 'phone' in e.message_dict:
                    self.stdout.write(f"     Error: {e.message_dict['phone'][0][:60]}...")
                    
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"  ✗ Unexpected error: {e}"))
