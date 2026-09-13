"""
Bulk Student Import Service
Handles Excel/CSV import with validation and error reporting
"""

import logging
import pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError
from datetime import datetime
from .models import Student
from .services import generate_admission_number

logger = logging.getLogger(__name__)


class BulkStudentImportService:
    """
    Service for bulk importing students from Excel/CSV files.
    """
    
    REQUIRED_FIELDS = [
        'first_name',
        'last_name',
        'date_of_birth',
        'gender',
        'father_name',
        'father_phone',
        'mother_name',
        'mother_phone',
        'address'
    ]
    
    OPTIONAL_FIELDS = [
        'admission_number',
        'admission_date',
        'email',
        'phone',
        'blood_group',
        'nationality',
        'religion',
        'caste',
        'father_email',
        'father_occupation',
        'mother_email',
        'mother_occupation',
        'guardian_name',
        'guardian_phone',
        'guardian_relation',
        'pen_number',
        'aadhar_number',
        'aapar_number',
        'family_id'
    ]
    
    GENDER_MAPPING = {
        'Male': 'M',
        'M': 'M',
        'Female': 'F',
        'F': 'F',
        'Other': 'O',
        'O': 'O'
    }
    
    def __init__(self, tenant, user):
        self.tenant = tenant
        self.user = user
        self.errors = []
        self.warnings = []
        self.imported_count = 0
        self.skipped_count = 0
    
    def parse_file(self, file_obj):
        """
        Parse Excel or CSV file.
        
        Args:
            file_obj: File object from request.FILES
            
        Returns:
            pandas.DataFrame
        """
        file_extension = file_obj.name.split('.')[-1].lower()
        
        try:
            if file_extension == 'xlsx' or file_extension == 'xls':
                df = pd.read_excel(file_obj)
            elif file_extension == 'csv':
                df = pd.read_csv(file_obj)
            else:
                raise ValidationError(f'Unsupported file format: {file_extension}')
            
            return df
        except Exception as e:
            raise ValidationError(f'Error parsing file: {str(e)}')
    
    def validate_headers(self, df):
        """
        Validate that required headers are present.
        
        Args:
            df: pandas.DataFrame
            
        Returns:
            dict: {'valid': bool, 'missing_fields': list}
        """
        df_columns = [col.lower().strip() for col in df.columns]
        missing_fields = []
        
        for field in self.REQUIRED_FIELDS:
            if field not in df_columns:
                missing_fields.append(field)
        
        return {
            'valid': len(missing_fields) == 0,
            'missing_fields': missing_fields
        }
    
    def validate_row(self, row, row_number):
        """
        Validate a single row of data.
        
        Args:
            row: pandas.Series
            row_number: int
            
        Returns:
            dict: {'valid': bool, 'errors': list, 'warnings': list}
        """
        errors = []
        warnings = []
        
        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if pd.isna(row.get(field)) or str(row.get(field)).strip() == '':
                errors.append(f'Missing required field: {field}')
        
        # Validate gender
        gender = str(row.get('gender', '')).strip()
        if gender and gender not in self.GENDER_MAPPING:
            errors.append(f'Invalid gender: {gender}. Must be Male/M, Female/F, or Other/O')
        
        # Validate date of birth
        dob = row.get('date_of_birth')
        if dob and not pd.isna(dob):
            try:
                if isinstance(dob, str):
                    date_str = str(dob).strip()
                    if ' ' in date_str:
                        # Handle datetime format: "2020-10-10 00:00:00"
                        datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d')
                    else:
                        # Handle date format: "2020-10-10"
                        datetime.strptime(date_str, '%Y-%m-%d')
            except:
                errors.append(f'Invalid date format for date_of_birth: {dob}. Use YYYY-MM-DD or YYYY-MM-DD HH:MM:SS')
        
        # Validate admission number (if provided)
        admission_number = row.get('admission_number')
        if admission_number and not pd.isna(admission_number):
            # Check for duplicate in database
            if Student.objects.filter(
                tenant=self.tenant,
                admission_number=admission_number
            ).exists():
                errors.append(f'Admission number already exists: {admission_number}')
        
        # Validate phone numbers (basic check)
        for phone_field in ['father_phone', 'mother_phone', 'phone', 'guardian_phone']:
            phone = str(row.get(phone_field, '')).strip()
            if phone and phone != 'nan':
                if not phone.replace('+', '').replace('-', '').replace(' ', '').isdigit():
                    warnings.append(f'Phone number may be invalid: {phone_field}')
        
        # Validate email format
        for email_field in ['email', 'father_email', 'mother_email']:
            email = str(row.get(email_field, '')).strip()
            if email and email != 'nan' and '@' not in email:
                warnings.append(f'Email format may be invalid: {email_field}')
        
        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings
        }
    
    def dry_run(self, file_obj):
        """
        Perform a dry run to validate data without saving.
        
        Args:
            file_obj: File object
            
        Returns:
            dict: {
                'total_rows': int,
                'valid_rows': int,
                'invalid_rows': int,
                'errors': list,
                'warnings': list,
                'preview': list
            }
        """
        df = self.parse_file(file_obj)
        
        # Normalize column names
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Validate headers
        header_validation = self.validate_headers(df)
        if not header_validation['valid']:
            return {
                'total_rows': 0,
                'valid_rows': 0,
                'invalid_rows': 0,
                'errors': [f"Missing required columns: {', '.join(header_validation['missing_fields'])}"],
                'warnings': [],
                'preview': []
            }
        
        # Validate each row
        total_rows = len(df)
        valid_rows = 0
        invalid_rows = 0
        all_errors = []
        all_warnings = []
        preview = []
        
        for index, row in df.iterrows():
            row_num = index + 2  # +2 because index starts at 0 and row 1 is header
            validation = self.validate_row(row, row_num)
            
            row_preview = {
                'row_number': row_num,
                'first_name': str(row.get('first_name', '')),
                'last_name': str(row.get('last_name', '')),
                'admission_number': str(row.get('admission_number', 'Auto-generate')),
                'valid': validation['valid'],
                'errors': validation['errors'],
                'warnings': validation['warnings']
            }
            
            preview.append(row_preview)
            
            if validation['valid']:
                valid_rows += 1
            else:
                invalid_rows += 1
                for error in validation['errors']:
                    all_errors.append(f"Row {row_num}: {error}")
            
            for warning in validation['warnings']:
                all_warnings.append(f"Row {row_num}: {warning}")
        
        return {
            'total_rows': total_rows,
            'valid_rows': valid_rows,
            'invalid_rows': invalid_rows,
            'errors': all_errors,
            'warnings': all_warnings,
            'preview': preview
        }
    
    def import_students(self, file_obj):
        """
        Import students from file with atomic transaction.
        
        Args:
            file_obj: File object
            
        Returns:
            dict: {
                'success': bool,
                'imported': int,
                'skipped': int,
                'errors': list
            }
        """
        df = self.parse_file(file_obj)
        
        # Normalize column names
        df.columns = [col.lower().strip() for col in df.columns]
        
        # Validate headers
        header_validation = self.validate_headers(df)
        if not header_validation['valid']:
            return {
                'success': False,
                'imported': 0,
                'skipped': 0,
                'errors': [f"Missing required columns: {', '.join(header_validation['missing_fields'])}"]
            }
        
        imported_students = []
        errors = []
        
        # Use atomic transaction
        try:
            with transaction.atomic():
                for index, row in df.iterrows():
                    row_num = index + 2
                    
                    # Validate row
                    validation = self.validate_row(row, row_num)
                    if not validation['valid']:
                        self.skipped_count += 1
                        for error in validation['errors']:
                            errors.append(f"Row {row_num}: {error}")
                        continue
                    
                    # Create student
                    try:
                        student_data = self._prepare_student_data(row)
                        student = Student.objects.create(**student_data)
                        imported_students.append(student)
                        self.imported_count += 1
                    except Exception as e:
                        self.skipped_count += 1
                        errors.append(f"Row {row_num}: {str(e)}")
        
        except Exception as e:
            return {
                'success': False,
                'imported': 0,
                'skipped': 0,
                'errors': [f'Transaction failed: {str(e)}']
            }

        # Auto-run sibling sync now that the import transaction has committed,
        # so newly-imported students get matched to each other and to any
        # pre-existing students sharing a parent phone number. Best-effort:
        # the import itself already succeeded, so a queueing failure here
        # shouldn't turn a successful import into an error response.
        if self.imported_count > 0:
            try:
                from .tasks import sync_siblings_task
                sync_siblings_task.delay(tenant_id=self.tenant.id)
            except Exception as e:
                logger.warning(f"Failed to queue sibling sync after bulk import: {e}")

        return {
            'success': True,
            'imported': self.imported_count,
            'skipped': self.skipped_count,
            'errors': errors,
            'students': [
                {
                    'id': str(s.id),
                    'admission_number': s.admission_number,
                    'name': s.get_full_name()
                } for s in imported_students
            ]
        }
    
    def _prepare_student_data(self, row):
        """
        Prepare student data from row.
        
        Args:
            row: pandas.Series
            
        Returns:
            dict: Student model data
        """
        # Generate admission number if not provided
        admission_number = row.get('admission_number')
        if pd.isna(admission_number) or str(admission_number).strip() == '' or str(admission_number) == 'nan':
            admission_number = generate_admission_number(self.tenant)
        
        # Parse admission date
        admission_date = row.get('admission_date')
        if pd.isna(admission_date) or str(admission_date).strip() == '' or str(admission_date) == 'nan':
            admission_date = datetime.now().date()
        elif isinstance(admission_date, str):
            # Handle both date and datetime formats
            date_str = str(admission_date).strip()
            if ' ' in date_str:
                # Format: "2020-10-10 00:00:00"
                admission_date = datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d').date()
            else:
                # Format: "2020-10-10"
                admission_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        elif hasattr(admission_date, 'date'):
            # pandas Timestamp object
            admission_date = admission_date.date()
        
        # Parse date of birth
        dob = row.get('date_of_birth')
        if isinstance(dob, str):
            # Handle both date and datetime formats
            date_str = str(dob).strip()
            if ' ' in date_str:
                # Format: "2020-10-10 00:00:00"
                dob = datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d').date()
            else:
                # Format: "2020-10-10"
                dob = datetime.strptime(date_str, '%Y-%m-%d').date()
        elif hasattr(dob, 'date'):
            # pandas Timestamp object
            dob = dob.date()
        
        # Map gender
        gender = self.GENDER_MAPPING.get(str(row.get('gender')).strip(), 'O')
        
        # Build student data
        data = {
            'tenant': self.tenant,
            'admission_number': str(admission_number).strip(),
            'admission_date': admission_date,
            'first_name': str(row.get('first_name')).strip(),
            'last_name': str(row.get('last_name')).strip(),
            'date_of_birth': dob,
            'gender': gender,
            'address': str(row.get('address', '')).strip(),
            'father_name': str(row.get('father_name')).strip(),
            'father_phone': str(row.get('father_phone')).strip(),
            'mother_name': str(row.get('mother_name')).strip(),
            'mother_phone': str(row.get('mother_phone')).strip(),
        }
        
        # Add optional fields
        for field in self.OPTIONAL_FIELDS:
            if field not in data and field in row.index:
                value = row.get(field)
                if not pd.isna(value) and str(value).strip() != '' and str(value) != 'nan':
                    data[field] = str(value).strip()
        
        return data
    
    @staticmethod
    def get_template_columns():
        """
        Get list of columns for template file.
        
        Returns:
            list: Column names
        """
        return BulkStudentImportService.REQUIRED_FIELDS + BulkStudentImportService.OPTIONAL_FIELDS
    
    @staticmethod
    def generate_template():
        """
        Generate sample Excel template.
        
        Returns:
            pandas.DataFrame: Empty template with headers and sample row
        """
        columns = BulkStudentImportService.get_template_columns()
        
        # Create sample data
        sample_data = {
            'admission_number': ['ADM20240001 (or leave empty for auto-generate)'],
            'admission_date': ['2024-01-01'],
            'first_name': ['John'],
            'last_name': ['Doe'],
            'date_of_birth': ['2015-05-15'],
            'gender': ['Male'],
            'blood_group': ['A+'],
            'nationality': ['Indian'],
            'religion': [''],
            'caste': [''],
            'email': ['john.doe@school.edu'],
            'phone': ['+919876543210'],
            'address': ['123 Main Street, City'],
            'father_name': ['Robert Doe'],
            'father_phone': ['+919876543210'],
            'father_email': ['robert@example.com'],
            'father_occupation': ['Engineer'],
            'mother_name': ['Jane Doe'],
            'mother_phone': ['+919876543211'],
            'mother_email': ['jane@example.com'],
            'mother_occupation': ['Teacher'],
            'guardian_name': [''],
            'guardian_phone': [''],
            'guardian_relation': [''],
            'pen_number': [''],
            'aadhar_number': ['123456789012'],
            'aapar_number': [''],
            'family_id': ['FAM001']
        }
        
        df = pd.DataFrame(sample_data)
        return df
