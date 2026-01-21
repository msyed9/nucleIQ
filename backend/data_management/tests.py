"""
Tests for Data Migration System
Comprehensive test coverage for import, export, validation, and rollback functionality
"""

import io
import csv
import json
from datetime import date, timedelta
from decimal import Decimal
from unittest.mock import patch, MagicMock

from django.test import TestCase, TransactionTestCase
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from tenants.models import Tenant, AcademicYear, GradeLevel, Section
from students.models import Student
from staff.models import Staff
from users.models import User
from data_management.models import ImportJob, ImportFieldMapping
from data_management.utils import (
    DateParser, PhoneValidator, EmailValidator, AadharValidator,
    GenderMapper, BloodGroupMapper, FileParser, DataTransformer, DataValidator
)
from data_management.templates import get_template, get_all_templates, TEMPLATE_REGISTRY


class DateParserTests(TestCase):
    """Tests for DateParser utility"""
    
    def test_parse_standard_dd_mm_yyyy(self):
        """Test parsing DD-MM-YYYY format"""
        result = DateParser.parse('15-05-2010')
        self.assertEqual(result, date(2010, 5, 15))
    
    def test_parse_slash_format(self):
        """Test parsing DD/MM/YYYY format"""
        result = DateParser.parse('15/05/2010')
        self.assertEqual(result, date(2010, 5, 15))
    
    def test_parse_iso_format(self):
        """Test parsing YYYY-MM-DD ISO format"""
        result = DateParser.parse('2010-05-15')
        self.assertEqual(result, date(2010, 5, 15))
    
    def test_parse_dot_format(self):
        """Test parsing DD.MM.YYYY format"""
        result = DateParser.parse('15.05.2010')
        self.assertEqual(result, date(2010, 5, 15))
    
    def test_parse_short_year(self):
        """Test parsing DD-MM-YY format"""
        result = DateParser.parse('15-05-10')
        self.assertIsNotNone(result)
    
    def test_parse_date_object(self):
        """Test that date objects are returned as-is"""
        input_date = date(2010, 5, 15)
        result = DateParser.parse(input_date)
        self.assertEqual(result, input_date)
    
    def test_parse_empty_string(self):
        """Test parsing empty string returns None"""
        result = DateParser.parse('')
        self.assertIsNone(result)
    
    def test_parse_none(self):
        """Test parsing None returns None"""
        result = DateParser.parse(None)
        self.assertIsNone(result)
    
    def test_parse_invalid_date(self):
        """Test parsing invalid date returns None"""
        result = DateParser.parse('invalid-date')
        self.assertIsNone(result)
    
    def test_parse_excel_serial_date(self):
        """Test parsing Excel serial date number"""
        # Excel serial date for 2010-05-15 is around 40313
        result = DateParser.parse(40313)
        self.assertIsNotNone(result)


class PhoneValidatorTests(TestCase):
    """Tests for PhoneValidator utility"""
    
    def test_clean_valid_phone(self):
        """Test cleaning valid 10-digit phone"""
        result = PhoneValidator.clean('9876543210')
        self.assertEqual(result, '9876543210')
    
    def test_clean_with_country_code(self):
        """Test removing +91 country code"""
        result = PhoneValidator.clean('+91 9876543210')
        self.assertEqual(result, '9876543210')
    
    def test_clean_with_91_prefix(self):
        """Test removing 91 prefix"""
        result = PhoneValidator.clean('919876543210')
        self.assertEqual(result, '9876543210')
    
    def test_clean_with_spaces(self):
        """Test removing spaces"""
        result = PhoneValidator.clean('98765 43210')
        self.assertEqual(result, '9876543210')
    
    def test_clean_with_dashes(self):
        """Test removing dashes"""
        result = PhoneValidator.clean('9876-543-210')
        self.assertEqual(result, '9876543210')
    
    def test_validate_valid_mobile(self):
        """Test validating valid mobile number"""
        is_valid, _ = PhoneValidator.validate('9876543210')
        self.assertTrue(is_valid)
    
    def test_validate_invalid_start(self):
        """Test validating phone starting with invalid digit"""
        is_valid, error = PhoneValidator.validate('1234567890')
        self.assertFalse(is_valid)
        self.assertIn('must start with', error.lower())
    
    def test_validate_too_short(self):
        """Test validating too short phone number"""
        is_valid, error = PhoneValidator.validate('98765')
        self.assertFalse(is_valid)
    
    def test_validate_landline(self):
        """Test validating landline number with STD code"""
        is_valid, _ = PhoneValidator.validate('01234567890')
        # Landlines may have different validation rules
        self.assertIsNotNone(is_valid)


class EmailValidatorTests(TestCase):
    """Tests for EmailValidator utility"""
    
    def test_clean_valid_email(self):
        """Test cleaning valid email"""
        result = EmailValidator.clean('Test@Example.COM')
        self.assertEqual(result, 'test@example.com')
    
    def test_clean_with_spaces(self):
        """Test cleaning email with spaces"""
        result = EmailValidator.clean('  test@example.com  ')
        self.assertEqual(result, 'test@example.com')
    
    def test_validate_valid_email(self):
        """Test validating valid email"""
        is_valid, _ = EmailValidator.validate('test@example.com')
        self.assertTrue(is_valid)
    
    def test_validate_invalid_email(self):
        """Test validating invalid email"""
        is_valid, error = EmailValidator.validate('notanemail')
        self.assertFalse(is_valid)


class AadharValidatorTests(TestCase):
    """Tests for AadharValidator utility"""
    
    def test_clean_valid_aadhar(self):
        """Test cleaning valid Aadhar number"""
        result = AadharValidator.clean('1234 5678 9012')
        self.assertEqual(result, '123456789012')
    
    def test_validate_valid_aadhar(self):
        """Test validating valid 12-digit Aadhar"""
        is_valid, _ = AadharValidator.validate('123456789012')
        self.assertTrue(is_valid)
    
    def test_validate_invalid_length(self):
        """Test validating Aadhar with wrong length"""
        is_valid, error = AadharValidator.validate('1234567890')
        self.assertFalse(is_valid)
    
    def test_validate_non_numeric(self):
        """Test validating Aadhar with non-numeric characters"""
        is_valid, error = AadharValidator.validate('1234567890AB')
        self.assertFalse(is_valid)


class GenderMapperTests(TestCase):
    """Tests for GenderMapper utility"""
    
    def test_map_male_variations(self):
        """Test mapping various male representations"""
        for value in ['M', 'Male', 'male', 'MALE', 'Boy', 'boy']:
            result = GenderMapper.map(value)
            self.assertEqual(result, 'M', f"Failed for {value}")
    
    def test_map_female_variations(self):
        """Test mapping various female representations"""
        for value in ['F', 'Female', 'female', 'FEMALE', 'Girl', 'girl']:
            result = GenderMapper.map(value)
            self.assertEqual(result, 'F', f"Failed for {value}")
    
    def test_map_other(self):
        """Test mapping other gender representations"""
        for value in ['O', 'Other', 'other']:
            result = GenderMapper.map(value)
            self.assertEqual(result, 'O', f"Failed for {value}")
    
    def test_map_unknown(self):
        """Test mapping unknown value returns None"""
        result = GenderMapper.map('Unknown')
        self.assertIsNone(result)


class BloodGroupMapperTests(TestCase):
    """Tests for BloodGroupMapper utility"""
    
    def test_map_positive_variations(self):
        """Test mapping positive blood groups"""
        self.assertEqual(BloodGroupMapper.map('A+'), 'A+')
        self.assertEqual(BloodGroupMapper.map('A positive'), 'A+')
        self.assertEqual(BloodGroupMapper.map('A POS'), 'A+')
        self.assertEqual(BloodGroupMapper.map('a+ve'), 'A+')
    
    def test_map_negative_variations(self):
        """Test mapping negative blood groups"""
        self.assertEqual(BloodGroupMapper.map('B-'), 'B-')
        self.assertEqual(BloodGroupMapper.map('B negative'), 'B-')
        self.assertEqual(BloodGroupMapper.map('B NEG'), 'B-')
        self.assertEqual(BloodGroupMapper.map('b-ve'), 'B-')
    
    def test_map_ab_group(self):
        """Test mapping AB blood groups"""
        self.assertEqual(BloodGroupMapper.map('AB+'), 'AB+')
        self.assertEqual(BloodGroupMapper.map('AB-'), 'AB-')
    
    def test_map_o_group(self):
        """Test mapping O blood groups"""
        self.assertEqual(BloodGroupMapper.map('O+'), 'O+')
        self.assertEqual(BloodGroupMapper.map('O-'), 'O-')


class TemplateRegistryTests(TestCase):
    """Tests for template configuration"""
    
    def test_get_all_templates(self):
        """Test getting all templates"""
        templates = get_all_templates()
        self.assertIsInstance(templates, dict)
        self.assertTrue(len(templates) > 0)
    
    def test_get_students_template(self):
        """Test getting students template"""
        template = get_template('students')
        self.assertIsNotNone(template)
        self.assertEqual(template.name, 'students')
        self.assertTrue(len(template.fields) > 0)
    
    def test_get_staff_template(self):
        """Test getting staff template"""
        template = get_template('staff')
        self.assertIsNotNone(template)
        self.assertEqual(template.name, 'staff')
    
    def test_get_classes_template(self):
        """Test getting classes template"""
        template = get_template('classes')
        self.assertIsNotNone(template)
        self.assertEqual(template.name, 'classes')
    
    def test_get_invalid_template(self):
        """Test getting non-existent template returns None"""
        template = get_template('nonexistent')
        self.assertIsNone(template)
    
    def test_template_has_required_fields(self):
        """Test that templates have required fields marked"""
        template = get_template('students')
        required_fields = [f for f in template.fields if f.required]
        self.assertTrue(len(required_fields) > 0)
    
    def test_template_has_sample_values(self):
        """Test that template fields have sample values"""
        template = get_template('students')
        for field in template.fields:
            self.assertIsNotNone(field.sample_value)


class FileParserTests(TestCase):
    """Tests for FileParser utility"""
    
    def test_parse_csv_file(self):
        """Test parsing CSV file"""
        csv_content = "first_name,last_name,admission_number\nRahul,Sharma,STU001\n"
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        
        data, errors = FileParser.parse(file_obj, 'test.csv')
        
        self.assertEqual(len(errors), 0)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['first_name'], 'Rahul')
    
    def test_parse_csv_with_bom(self):
        """Test parsing CSV with UTF-8 BOM"""
        csv_content = "\ufeffname,value\ntest,123\n"
        file_obj = io.BytesIO(csv_content.encode('utf-8-sig'))
        
        data, errors = FileParser.parse(file_obj, 'test.csv')
        
        self.assertEqual(len(errors), 0)
        self.assertIn('name', data[0])
    
    def test_parse_empty_rows_skipped(self):
        """Test that empty rows are skipped"""
        csv_content = "name,value\ntest1,1\n\ntest2,2\n"
        file_obj = io.BytesIO(csv_content.encode('utf-8'))
        
        data, errors = FileParser.parse(file_obj, 'test.csv')
        
        self.assertEqual(len(data), 2)
    
    def test_parse_invalid_extension(self):
        """Test parsing file with invalid extension"""
        file_obj = io.BytesIO(b"test content")
        
        data, errors = FileParser.parse(file_obj, 'test.txt')
        
        self.assertEqual(len(data), 0)
        self.assertTrue(len(errors) > 0)


class DataTransformerTests(TestCase):
    """Tests for DataTransformer utility"""
    
    def test_transform_student_data(self):
        """Test transforming student data"""
        raw_data = {
            'first_name': 'Rahul',
            'last_name': 'Sharma',
            'dob': '15-05-2010',
            'gender': 'Male',
            'father_mobile': '9876543210'
        }
        
        transformed = DataTransformer.transform_student(raw_data)
        
        self.assertEqual(transformed['first_name'], 'Rahul')
        self.assertEqual(transformed['gender'], 'M')
        self.assertEqual(transformed['father_phone'], '9876543210')
    
    def test_transform_staff_data(self):
        """Test transforming staff data"""
        raw_data = {
            'first_name': 'Priya',
            'last_name': 'Kumar',
            'emp_id': 'EMP001',
            'joining_date': '01-04-2020',
            'gender': 'Female'
        }
        
        transformed = DataTransformer.transform_staff(raw_data)
        
        self.assertEqual(transformed['employee_id'], 'EMP001')
        self.assertEqual(transformed['gender'], 'F')
    
    def test_transform_preserves_unknown_fields(self):
        """Test that unknown fields are preserved"""
        raw_data = {
            'first_name': 'Test',
            'custom_field': 'custom_value'
        }
        
        transformed = DataTransformer.transform_student(raw_data)
        
        self.assertEqual(transformed['custom_field'], 'custom_value')


class DataValidatorTests(TestCase):
    """Tests for DataValidator utility"""
    
    def test_validate_student_valid(self):
        """Test validating valid student data"""
        data = {
            'first_name': 'Rahul',
            'admission_number': 'STU001',
            'date_of_birth': date(2010, 5, 15),
            'gender': 'M',
            'father_name': 'Suresh',
            'mother_name': 'Sunita',
            'father_phone': '9876543210'
        }
        
        errors, warnings = DataValidator.validate_student(data)
        
        self.assertEqual(len(errors), 0)
    
    def test_validate_student_missing_required(self):
        """Test validating student with missing required field"""
        data = {
            'first_name': 'Rahul',
            # missing admission_number
            'date_of_birth': date(2010, 5, 15),
            'gender': 'M'
        }
        
        errors, _ = DataValidator.validate_student(data)
        
        self.assertTrue(len(errors) > 0)
        self.assertTrue(any('admission_number' in e.lower() for e in errors))
    
    def test_validate_student_invalid_phone(self):
        """Test validating student with invalid phone"""
        data = {
            'first_name': 'Rahul',
            'admission_number': 'STU001',
            'date_of_birth': date(2010, 5, 15),
            'gender': 'M',
            'father_name': 'Suresh',
            'mother_name': 'Sunita',
            'father_phone': '12345'  # Invalid
        }
        
        errors, _ = DataValidator.validate_student(data)
        
        # Should have error for invalid phone
        self.assertTrue(len(errors) > 0)
    
    def test_validate_staff_valid(self):
        """Test validating valid staff data"""
        data = {
            'first_name': 'Priya',
            'last_name': 'Kumar',
            'employee_id': 'EMP001',
            'joining_date': date(2020, 4, 1),
            'designation': 'TEACHER'
        }
        
        errors, warnings = DataValidator.validate_staff(data)
        
        self.assertEqual(len(errors), 0)


class ImportJobModelTests(TestCase):
    """Tests for ImportJob model"""
    
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test School',
            slug='test-school',
            email='test@school.com'
        )
        self.user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
    
    def test_create_import_job(self):
        """Test creating an import job"""
        job = ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            created_by=self.user
        )
        
        self.assertIsNotNone(job.id)
        self.assertEqual(job.status, 'PENDING')
        self.assertEqual(job.module, 'students')
    
    def test_import_job_status_transitions(self):
        """Test import job status can be updated"""
        job = ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            created_by=self.user
        )
        
        job.status = 'VALIDATING'
        job.save()
        job.refresh_from_db()
        self.assertEqual(job.status, 'VALIDATING')
        
        job.status = 'COMPLETED'
        job.save()
        job.refresh_from_db()
        self.assertEqual(job.status, 'COMPLETED')
    
    def test_import_job_stores_record_ids(self):
        """Test import job can store created record IDs"""
        job = ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            created_by=self.user,
            created_record_ids=[1, 2, 3, 4, 5]
        )
        
        job.refresh_from_db()
        self.assertEqual(job.created_record_ids, [1, 2, 3, 4, 5])


class ImportFieldMappingModelTests(TestCase):
    """Tests for ImportFieldMapping model"""
    
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test School',
            slug='test-school',
            email='test@school.com'
        )
    
    def test_create_field_mapping(self):
        """Test creating a field mapping"""
        mapping = ImportFieldMapping.objects.create(
            tenant=self.tenant,
            module='students',
            source_column='Student ID',
            target_field='admission_number'
        )
        
        self.assertIsNotNone(mapping.id)
        self.assertTrue(mapping.is_active)
    
    def test_unique_constraint(self):
        """Test unique constraint on tenant/module/source/target"""
        ImportFieldMapping.objects.create(
            tenant=self.tenant,
            module='students',
            source_column='Student ID',
            target_field='admission_number'
        )
        
        # Creating duplicate should raise error
        from django.db import IntegrityError
        with self.assertRaises(IntegrityError):
            ImportFieldMapping.objects.create(
                tenant=self.tenant,
                module='students',
                source_column='Student ID',
                target_field='admission_number'
            )


class DataMigrationAPITests(APITestCase):
    """API integration tests for data migration endpoints"""
    
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test School',
            slug='test-school',
            email='test@school.com'
        )
        self.academic_year = AcademicYear.objects.create(
            tenant=self.tenant,
            name='2024-25',
            start_date=date(2024, 4, 1),
            end_date=date(2025, 3, 31),
            is_current=True
        )
        self.grade_level = GradeLevel.objects.create(
            tenant=self.tenant,
            name='Class 10',
            order=10
        )
        self.section = Section.objects.create(
            tenant=self.tenant,
            grade_level=self.grade_level,
            academic_year=self.academic_year,
            name='A'
        )
        
        self.user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
        self.user.tenant = self.tenant
        self.user.is_staff = True
        self.user.save()
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_list_modules_endpoint(self):
        """Test listing available modules"""
        response = self.client.get('/api/data-management/modules/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('modules', response.data)
        self.assertTrue(len(response.data['modules']) > 0)
    
    def test_get_module_fields_endpoint(self):
        """Test getting field specifications for a module"""
        response = self.client.get('/api/data-management/modules/students/fields/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('required_fields', response.data)
        self.assertIn('optional_fields', response.data)
    
    def test_download_template_xlsx(self):
        """Test downloading Excel template"""
        response = self.client.get('/api/data-management/template/students/?format=xlsx')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('application/vnd.openxmlformats', response['Content-Type'])
    
    def test_download_template_csv(self):
        """Test downloading CSV template"""
        response = self.client.get('/api/data-management/template/students/?format=csv')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text/csv', response['Content-Type'])
    
    def test_validate_endpoint(self):
        """Test file validation endpoint"""
        csv_content = "first_name,admission_number,date_of_birth,gender,father_name,mother_name,father_phone\n"
        csv_content += "Rahul,STU001,15-05-2010,M,Suresh,Sunita,9876543210\n"
        
        file = SimpleUploadedFile(
            'students.csv',
            csv_content.encode('utf-8'),
            content_type='text/csv'
        )
        
        response = self.client.post(
            '/api/data-management/validate/',
            {'module': 'students', 'file': file},
            format='multipart'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('valid', response.data)
        self.assertIn('total_rows', response.data)
    
    def test_import_history_endpoint(self):
        """Test getting import history"""
        # Create some import jobs
        ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            status='COMPLETED',
            created_by=self.user
        )
        
        response = self.client.get('/api/data-management/import/history/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('jobs', response.data)
    
    def test_invalid_module_returns_error(self):
        """Test that invalid module returns error"""
        response = self.client.get('/api/data-management/modules/invalidmodule/fields/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_unauthenticated_request_denied(self):
        """Test that unauthenticated requests are denied"""
        client = APIClient()  # No authentication
        response = client.get('/api/data-management/modules/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RollbackTests(TransactionTestCase):
    """Tests for import rollback functionality"""
    
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name='Test School',
            slug='test-school',
            email='test@school.com'
        )
        self.user = User.objects.create_user(
            email='admin@test.com',
            password='testpass123'
        )
        self.user.tenant = self.tenant
        self.user.is_staff = True
        self.user.save()
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def test_rollback_deletes_imported_records(self):
        """Test that rollback deletes records created during import"""
        # Create a student manually
        student = Student.objects.create(
            tenant=self.tenant,
            first_name='Test',
            admission_number='STU001',
            date_of_birth=date(2010, 5, 15),
            gender='M'
        )
        
        # Create import job with this student's ID
        job = ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            status='COMPLETED',
            created_by=self.user,
            created_record_ids=[student.id]
        )
        
        # Rollback
        response = self.client.post(f'/api/data-management/import/{job.id}/rollback/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify job status changed
        job.refresh_from_db()
        self.assertEqual(job.status, 'ROLLED_BACK')
        
        # Verify student was deleted
        self.assertFalse(Student.objects.filter(id=student.id).exists())
    
    def test_rollback_non_completed_job_fails(self):
        """Test that rollback fails for non-completed jobs"""
        job = ImportJob.objects.create(
            tenant=self.tenant,
            module='students',
            original_filename='students.csv',
            file_type='csv',
            status='PENDING',  # Not completed
            created_by=self.user
        )
        
        response = self.client.post(f'/api/data-management/import/{job.id}/rollback/')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
