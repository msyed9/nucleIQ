"""
Data Migration Utilities
Parsing, validation, and transformation utilities for CSV/Excel imports
"""

import io
import csv
import re
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from typing import List, Dict, Any, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

# Try to import Excel libraries
try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
    import openpyxl.utils
    OPENPYXL_AVAILABLE = True
except ImportError:
    OPENPYXL_AVAILABLE = False

try:
    import xlrd
    XLRD_AVAILABLE = True
except ImportError:
    XLRD_AVAILABLE = False


class DateParser:
    """
    Flexible date parser supporting multiple formats common in Indian schools
    """
    
    SUPPORTED_FORMATS = [
        '%d-%m-%Y',      # 15-05-2010
        '%d/%m/%Y',      # 15/05/2010
        '%Y-%m-%d',      # 2010-05-15 (ISO)
        '%d-%m-%y',      # 15-05-10
        '%d/%m/%y',      # 15/05/10
        '%d.%m.%Y',      # 15.05.2010
        '%d.%m.%y',      # 15.05.10
        '%Y/%m/%d',      # 2010/05/15
        '%m-%d-%Y',      # 05-15-2010 (US format)
        '%m/%d/%Y',      # 05/15/2010 (US format)
        '%d %b %Y',      # 15 May 2010
        '%d %B %Y',      # 15 May 2010
        '%B %d, %Y',     # May 15, 2010
        '%b %d, %Y',     # May 15, 2010
    ]
    
    @classmethod
    def parse(cls, date_str: Any, default=None) -> Optional[date]:
        """
        Parse date string in multiple formats.
        Returns date object or default if parsing fails.
        """
        if date_str is None or date_str == '':
            return default
        
        # If already a date object, return as is
        if isinstance(date_str, date):
            return date_str
        
        # If datetime object, extract date
        if isinstance(date_str, datetime):
            return date_str.date()
        
        # Convert to string and clean
        date_str = str(date_str).strip()
        
        if not date_str:
            return default
        
        # Try each format
        for fmt in cls.SUPPORTED_FORMATS:
            try:
                return datetime.strptime(date_str, fmt).date()
            except ValueError:
                continue
        
        # Try parsing Excel serial date (float)
        try:
            serial = float(date_str)
            if serial > 0:
                # Excel serial date: days since 1899-12-30
                from datetime import timedelta
                base_date = date(1899, 12, 30)
                return base_date + timedelta(days=int(serial))
        except (ValueError, TypeError):
            pass
        
        return default
    
    @classmethod
    def format_for_display(cls, date_obj: date) -> str:
        """Format date for display (dd-mm-yyyy)"""
        if date_obj:
            return date_obj.strftime('%d-%m-%Y')
        return ''


class PhoneValidator:
    """
    Phone number validation and formatting for Indian numbers
    """
    
    INDIAN_MOBILE_PATTERN = re.compile(r'^[6-9]\d{9}$')
    LANDLINE_PATTERN = re.compile(r'^\d{2,4}[-\s]?\d{6,8}$')
    
    @classmethod
    def clean(cls, phone: Any) -> str:
        """Clean and normalize phone number"""
        if phone is None:
            return ''
        
        phone = str(phone).strip()
        
        # Remove common prefixes
        phone = re.sub(r'^(\+91|91|0)', '', phone)
        
        # Remove spaces, dashes, and parentheses
        phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        # Remove any remaining non-digit characters
        phone = re.sub(r'[^\d]', '', phone)
        
        return phone
    
    @classmethod
    def validate(cls, phone: str) -> Tuple[bool, str]:
        """
        Validate phone number.
        Returns (is_valid, error_message)
        """
        cleaned = cls.clean(phone)
        
        if not cleaned:
            return True, ''  # Empty is valid (optional field)
        
        if len(cleaned) == 10 and cls.INDIAN_MOBILE_PATTERN.match(cleaned):
            return True, ''
        
        if cls.LANDLINE_PATTERN.match(cleaned):
            return True, ''
        
        return False, f'Invalid phone number: {phone}'
    
    @classmethod
    def format(cls, phone: str) -> str:
        """Format phone number to standard format"""
        cleaned = cls.clean(phone)
        
        if len(cleaned) == 10:
            return cleaned  # Return as 10-digit mobile
        
        return cleaned


class EmailValidator:
    """Email validation utility"""
    
    EMAIL_PATTERN = re.compile(
        r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    )
    
    @classmethod
    def validate(cls, email: Any) -> Tuple[bool, str]:
        """Validate email address"""
        if email is None or str(email).strip() == '':
            return True, ''  # Empty is valid (optional field)
        
        email = str(email).strip().lower()
        
        if cls.EMAIL_PATTERN.match(email):
            return True, ''
        
        return False, f'Invalid email: {email}'
    
    @classmethod
    def clean(cls, email: Any) -> str:
        """Clean and normalize email"""
        if email is None:
            return ''
        return str(email).strip().lower()


class AadharValidator:
    """Aadhar number validation"""
    
    AADHAR_PATTERN = re.compile(r'^\d{12}$')
    
    @classmethod
    def clean(cls, aadhar: Any) -> str:
        """Clean Aadhar number - remove spaces and dashes"""
        if aadhar is None:
            return ''
        
        aadhar = str(aadhar).strip()
        aadhar = re.sub(r'[\s\-]', '', aadhar)
        return aadhar
    
    @classmethod
    def validate(cls, aadhar: str) -> Tuple[bool, str]:
        """Validate Aadhar number"""
        cleaned = cls.clean(aadhar)
        
        if not cleaned:
            return True, ''  # Empty is valid (optional)
        
        if cls.AADHAR_PATTERN.match(cleaned):
            return True, ''
        
        return False, f'Invalid Aadhar number: {aadhar} (must be 12 digits)'


class GenderMapper:
    """Map various gender representations to standard values"""
    
    MALE_VALUES = ['m', 'male', 'boy', 'b', '1', 'पुरुष']
    FEMALE_VALUES = ['f', 'female', 'girl', 'g', '2', 'महिला', 'स्त्री']
    OTHER_VALUES = ['o', 'other', '3', 'अन्य']
    
    @classmethod
    def map(cls, value: Any) -> str:
        """Map gender value to M/F/O"""
        if value is None:
            return ''
        
        value = str(value).strip().lower()
        
        if value in cls.MALE_VALUES:
            return 'M'
        elif value in cls.FEMALE_VALUES:
            return 'F'
        elif value in cls.OTHER_VALUES:
            return 'O'
        
        # Return uppercase first letter if single character
        if len(value) == 1:
            return value.upper()
        
        return ''


class BloodGroupMapper:
    """Map blood group representations"""
    
    VALID_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    
    @classmethod
    def clean(cls, value: Any) -> str:
        """Clean and normalize blood group"""
        if value is None:
            return ''
        
        value = str(value).strip().upper()
        value = value.replace(' ', '')
        
        # Handle common variations
        value = value.replace('VE', '')  # Remove "positive/negative" abbreviations
        value = value.replace('POS', '+')
        value = value.replace('NEG', '-')
        value = value.replace('POSITIVE', '+')
        value = value.replace('NEGATIVE', '-')
        
        if value in cls.VALID_GROUPS:
            return value
        
        return ''


class FileParser:
    """
    Universal file parser for CSV, XLSX, and XLS files
    """
    
    @classmethod
    def parse(cls, file, filename: str = None) -> Tuple[List[Dict], List[str], str]:
        """
        Parse uploaded file and return data.
        Returns (data_rows, headers, file_type)
        """
        if filename is None:
            filename = getattr(file, 'name', '')
        
        filename_lower = filename.lower()
        
        if filename_lower.endswith('.csv'):
            return cls._parse_csv(file), None, 'csv'
        elif filename_lower.endswith('.xlsx'):
            if not OPENPYXL_AVAILABLE:
                raise ValueError('XLSX support requires openpyxl. Please use CSV format.')
            return cls._parse_xlsx(file), None, 'xlsx'
        elif filename_lower.endswith('.xls'):
            if not XLRD_AVAILABLE:
                raise ValueError('XLS support requires xlrd. Please use CSV or XLSX format.')
            return cls._parse_xls(file), None, 'xls'
        else:
            raise ValueError(f'Unsupported file format. Supported: CSV, XLSX, XLS')
    
    @classmethod
    def _parse_csv(cls, file) -> List[Dict]:
        """Parse CSV file"""
        # Read content
        if hasattr(file, 'read'):
            content = file.read()
            if isinstance(content, bytes):
                # Try UTF-8 first, then Windows-1252 (common in Excel exports)
                for encoding in ['utf-8-sig', 'utf-8', 'cp1252', 'iso-8859-1']:
                    try:
                        content = content.decode(encoding)
                        break
                    except UnicodeDecodeError:
                        continue
            file = io.StringIO(content)
        
        reader = csv.DictReader(file)
        data = []
        
        for row in reader:
            # Clean keys and values
            cleaned_row = {}
            for key, value in row.items():
                if key:  # Skip empty column headers
                    clean_key = str(key).strip().lower().replace(' ', '_')
                    cleaned_row[clean_key] = str(value).strip() if value else ''
            if any(cleaned_row.values()):  # Skip completely empty rows
                data.append(cleaned_row)
        
        return data
    
    @classmethod
    def _parse_xlsx(cls, file) -> List[Dict]:
        """Parse XLSX file using openpyxl"""
        wb = openpyxl.load_workbook(file, data_only=True)
        ws = wb.active
        
        # Get headers from first row
        headers = []
        for cell in ws[1]:
            if cell.value:
                headers.append(str(cell.value).strip().lower().replace(' ', '_'))
            else:
                headers.append(f'column_{len(headers) + 1}')
        
        data = []
        for row_num, row in enumerate(ws.iter_rows(min_row=2, values_only=True), start=2):
            if any(row):  # Skip empty rows
                row_dict = {}
                for i, header in enumerate(headers):
                    if i < len(row):
                        value = row[i]
                        if value is not None:
                            # Handle different types
                            if isinstance(value, datetime):
                                value = value.date()
                            elif isinstance(value, date):
                                pass  # Keep as is
                            else:
                                value = str(value).strip()
                        else:
                            value = ''
                        row_dict[header] = value
                    else:
                        row_dict[header] = ''
                
                if any(v for v in row_dict.values() if v):  # Skip empty rows
                    row_dict['_row_number'] = row_num
                    data.append(row_dict)
        
        return data
    
    @classmethod
    def _parse_xls(cls, file) -> List[Dict]:
        """Parse XLS file using xlrd"""
        # Read file content if needed
        if hasattr(file, 'read'):
            content = file.read()
        else:
            content = file
        
        wb = xlrd.open_workbook(file_contents=content)
        ws = wb.sheet_by_index(0)
        
        # Get headers from first row
        headers = []
        for col in range(ws.ncols):
            cell_value = ws.cell_value(0, col)
            if cell_value:
                headers.append(str(cell_value).strip().lower().replace(' ', '_'))
            else:
                headers.append(f'column_{col + 1}')
        
        data = []
        for row_num in range(1, ws.nrows):
            row_dict = {}
            row_has_data = False
            
            for col in range(ws.ncols):
                header = headers[col] if col < len(headers) else f'column_{col + 1}'
                cell = ws.cell(row_num, col)
                value = cell.value
                
                # Handle xlrd cell types
                if cell.ctype == xlrd.XL_CELL_DATE:
                    try:
                        date_tuple = xlrd.xldate_as_tuple(value, wb.datemode)
                        value = date(date_tuple[0], date_tuple[1], date_tuple[2])
                    except:
                        pass
                elif cell.ctype == xlrd.XL_CELL_NUMBER:
                    # Check if it's an integer
                    if value == int(value):
                        value = int(value)
                elif cell.ctype == xlrd.XL_CELL_EMPTY:
                    value = ''
                else:
                    value = str(value).strip() if value else ''
                
                row_dict[header] = value
                if value:
                    row_has_data = True
            
            if row_has_data:
                row_dict['_row_number'] = row_num + 1
                data.append(row_dict)
        
        return data


class DataTransformer:
    """
    Transform and clean imported data to match model requirements
    """
    
    @classmethod
    def transform_student(cls, row: Dict) -> Dict:
        """Transform a row of student data"""
        transformed = {}
        
        # Map common column variations to standard fields
        field_mappings = {
            # First name variations
            'first_name': ['first_name', 'firstname', 'fname', 'given_name', 'name'],
            'middle_name': ['middle_name', 'middlename', 'mname'],
            'last_name': ['last_name', 'lastname', 'lname', 'surname', 'family_name'],
            
            # Admission
            'admission_number': ['admission_number', 'admission_no', 'admn_no', 'admno', 
                                'roll_no', 'rollno', 'registration_number', 'reg_no', 'student_id'],
            'admission_date': ['admission_date', 'date_of_admission', 'doa', 'joining_date'],
            
            # Personal
            'date_of_birth': ['date_of_birth', 'dob', 'birth_date', 'birthdate'],
            'gender': ['gender', 'sex'],
            'blood_group': ['blood_group', 'bloodgroup', 'blood_type'],
            
            # Contact
            'email': ['email', 'email_id', 'student_email', 'e_mail'],
            'phone': ['phone', 'mobile', 'contact', 'phone_number', 'mobile_number', 'student_phone'],
            'address': ['address', 'full_address', 'residential_address', 'home_address'],
            
            # Parent info
            'father_name': ['father_name', 'fathers_name', 'father', 'dad_name'],
            'father_phone': ['father_phone', 'father_mobile', 'fathers_mobile', 'father_contact'],
            'father_email': ['father_email', 'fathers_email'],
            'father_occupation': ['father_occupation', 'fathers_occupation'],
            'mother_name': ['mother_name', 'mothers_name', 'mother', 'mom_name'],
            'mother_phone': ['mother_phone', 'mother_mobile', 'mothers_mobile', 'mother_contact'],
            'mother_email': ['mother_email', 'mothers_email'],
            'mother_occupation': ['mother_occupation', 'mothers_occupation'],
            'guardian_name': ['guardian_name', 'guardian'],
            'guardian_phone': ['guardian_phone', 'guardian_mobile', 'guardian_contact'],
            'guardian_relation': ['guardian_relation', 'relation_with_guardian'],
            
            # Academic
            'class_name': ['class_name', 'class', 'grade', 'grade_level', 'standard', 'std'],
            'section_name': ['section_name', 'section', 'division', 'div'],
            'roll_number': ['roll_number', 'roll_no', 'class_roll', 'rollno'],
            
            # Documents
            'aadhar_number': ['aadhar_number', 'aadhar', 'aadhaar', 'aadhar_no', 'uid'],
            'pen_number': ['pen_number', 'pen', 'pen_no'],
            
            # Other
            'nationality': ['nationality', 'nation'],
            'religion': ['religion'],
            'caste': ['caste', 'category'],
            'notes': ['notes', 'remarks', 'comments'],
            'previous_school_name': ['previous_school_name', 'previous_school', 'last_school'],
        }
        
        # Map fields
        for target_field, source_fields in field_mappings.items():
            for source in source_fields:
                if source in row and row[source]:
                    transformed[target_field] = row[source]
                    break
        
        # Apply transformations
        if 'date_of_birth' in transformed:
            transformed['date_of_birth'] = DateParser.parse(transformed['date_of_birth'])
        
        if 'admission_date' in transformed:
            transformed['admission_date'] = DateParser.parse(
                transformed['admission_date'], 
                default=date.today()
            )
        else:
            transformed['admission_date'] = date.today()
        
        if 'gender' in transformed:
            transformed['gender'] = GenderMapper.map(transformed['gender'])
        
        if 'blood_group' in transformed:
            transformed['blood_group'] = BloodGroupMapper.clean(transformed['blood_group'])
        
        # Clean phone numbers
        for phone_field in ['phone', 'father_phone', 'mother_phone', 'guardian_phone']:
            if phone_field in transformed:
                transformed[phone_field] = PhoneValidator.clean(transformed[phone_field])
        
        # Clean email
        for email_field in ['email', 'father_email', 'mother_email']:
            if email_field in transformed:
                transformed[email_field] = EmailValidator.clean(transformed[email_field])
        
        # Clean Aadhar
        if 'aadhar_number' in transformed:
            transformed['aadhar_number'] = AadharValidator.clean(transformed['aadhar_number'])
        
        return transformed
    
    @classmethod
    def transform_staff(cls, row: Dict) -> Dict:
        """Transform a row of staff data"""
        transformed = {}
        
        field_mappings = {
            'first_name': ['first_name', 'firstname', 'fname', 'given_name', 'name'],
            'middle_name': ['middle_name', 'middlename', 'mname'],
            'last_name': ['last_name', 'lastname', 'lname', 'surname'],
            'employee_id': ['employee_id', 'emp_id', 'staff_id', 'employee_code', 'emp_code'],
            'email': ['email', 'email_id', 'e_mail'],
            'phone': ['phone', 'mobile', 'contact', 'phone_number'],
            'alternate_phone': ['alternate_phone', 'alt_phone', 'secondary_phone'],
            'date_of_birth': ['date_of_birth', 'dob', 'birth_date'],
            'gender': ['gender', 'sex'],
            'blood_group': ['blood_group', 'bloodgroup'],
            'joining_date': ['joining_date', 'date_of_joining', 'doj', 'join_date'],
            'leaving_date': ['leaving_date', 'date_of_leaving', 'exit_date'],
            'designation': ['designation', 'position', 'role', 'title'],
            'department': ['department', 'dept'],
            'employment_type': ['employment_type', 'type', 'emp_type'],
            'address': ['address', 'full_address'],
            'city': ['city'],
            'state': ['state'],
            'postal_code': ['postal_code', 'pincode', 'zip'],
            'aadhar_number': ['aadhar_number', 'aadhar', 'aadhaar'],
            'pan_number': ['pan_number', 'pan'],
            'salary': ['salary', 'basic_salary', 'monthly_salary'],
            'bank_account_number': ['bank_account_number', 'account_number', 'bank_account'],
            'bank_name': ['bank_name', 'bank'],
            'bank_ifsc': ['bank_ifsc', 'ifsc', 'ifsc_code'],
            'emergency_contact_name': ['emergency_contact_name', 'emergency_contact'],
            'emergency_contact_phone': ['emergency_contact_phone', 'emergency_phone'],
        }
        
        for target_field, source_fields in field_mappings.items():
            for source in source_fields:
                if source in row and row[source]:
                    transformed[target_field] = row[source]
                    break
        
        # Apply transformations
        if 'date_of_birth' in transformed:
            transformed['date_of_birth'] = DateParser.parse(transformed['date_of_birth'])
        
        if 'joining_date' in transformed:
            transformed['joining_date'] = DateParser.parse(transformed['joining_date'])
        
        if 'leaving_date' in transformed:
            transformed['leaving_date'] = DateParser.parse(transformed['leaving_date'])
        
        if 'gender' in transformed:
            transformed['gender'] = GenderMapper.map(transformed['gender'])
        
        if 'blood_group' in transformed:
            transformed['blood_group'] = BloodGroupMapper.clean(transformed['blood_group'])
        
        # Clean phone
        for phone_field in ['phone', 'alternate_phone', 'emergency_contact_phone']:
            if phone_field in transformed:
                transformed[phone_field] = PhoneValidator.clean(transformed[phone_field])
        
        if 'email' in transformed:
            transformed['email'] = EmailValidator.clean(transformed['email'])
        
        return transformed
    
    @classmethod
    def transform_class_section(cls, row: Dict) -> Dict:
        """Transform class/section data"""
        transformed = {}
        
        field_mappings = {
            'class_name': ['class_name', 'class', 'grade', 'grade_level', 'grade_name', 'standard'],
            'section_name': ['section_name', 'section', 'division'],
            'room_number': ['room_number', 'room', 'classroom'],
            'capacity': ['capacity', 'max_students', 'seats'],
            'class_teacher': ['class_teacher', 'teacher', 'form_teacher'],
        }
        
        for target_field, source_fields in field_mappings.items():
            for source in source_fields:
                if source in row and row[source]:
                    transformed[target_field] = row[source]
                    break
        
        if 'capacity' in transformed:
            try:
                transformed['capacity'] = int(float(transformed['capacity']))
            except (ValueError, TypeError):
                transformed['capacity'] = 40
        
        return transformed

    @classmethod
    def transform_user(cls, row: Dict) -> Dict:
        """Transform a row of user account data"""
        transformed = {}
        
        field_mappings = {
            'email': ['email', 'email_id', 'username', 'user_id', 'login_id'],
            'password': ['password', 'pwd', 'pass'],
            'first_name': ['first_name', 'firstname', 'fname', 'given_name', 'name', 'full_name'],
            'last_name': ['last_name', 'lastname', 'lname', 'surname'],
            'role': ['role', 'user_role', 'type', 'user_type'],
            'admission_number': ['admission_number', 'admission_no', 'adm_no', 'student_id', 'student_admission_number'],
            'employee_id': ['employee_id', 'emp_id', 'staff_id', 'employee_code'],
        }
        
        for target_field, source_fields in field_mappings.items():
            for source in source_fields:
                if source in row and row[source]:
                    transformed[target_field] = row[source]
                    break
        
        # Clean email
        if 'email' in transformed:
            transformed['email'] = EmailValidator.clean(transformed['email'])
            
        # Normalize role
        if 'role' in transformed:
            transformed['role'] = str(transformed['role']).strip().upper()
            
        return transformed


class DataValidator:
    """
    Validate imported data before processing
    """
    
    @classmethod
    def validate_student(cls, data: Dict, row_number: int = 0) -> List[str]:
        """Validate student data, returns list of errors"""
        errors = []
        
        # Required fields
        required_fields = ['first_name', 'admission_number', 'date_of_birth']
        for field in required_fields:
            if not data.get(field):
                errors.append(f'Row {row_number}: Missing required field: {field}')
        
        # Validate date of birth
        if data.get('date_of_birth'):
            dob = data['date_of_birth']
            if isinstance(dob, str):
                dob = DateParser.parse(dob)
            
            if dob is None:
                errors.append(f'Row {row_number}: Invalid date of birth format')
            elif dob > date.today():
                errors.append(f'Row {row_number}: Date of birth cannot be in the future')
            elif dob < date(1900, 1, 1):
                errors.append(f'Row {row_number}: Date of birth is too old')
        
        # Validate gender
        if data.get('gender'):
            gender = GenderMapper.map(data['gender'])
            if gender not in ['M', 'F', 'O', '']:
                errors.append(f'Row {row_number}: Invalid gender value: {data["gender"]}')
        
        # Validate phone numbers
        for phone_field in ['phone', 'father_phone', 'mother_phone']:
            if data.get(phone_field):
                is_valid, error = PhoneValidator.validate(data[phone_field])
                if not is_valid:
                    errors.append(f'Row {row_number}: {error}')
        
        # Validate emails
        for email_field in ['email', 'father_email', 'mother_email']:
            if data.get(email_field):
                is_valid, error = EmailValidator.validate(data[email_field])
                if not is_valid:
                    errors.append(f'Row {row_number}: {error}')
        
        # Validate Aadhar
        if data.get('aadhar_number'):
            is_valid, error = AadharValidator.validate(data['aadhar_number'])
            if not is_valid:
                errors.append(f'Row {row_number}: {error}')
        
        return errors
    
    @classmethod
    def validate_staff(cls, data: Dict, row_number: int = 0) -> List[str]:
        """Validate staff data"""
        errors = []
        
        required_fields = ['first_name', 'last_name', 'employee_id', 'joining_date']
        for field in required_fields:
            if not data.get(field):
                errors.append(f'Row {row_number}: Missing required field: {field}')
        
        # Validate joining date
        if data.get('joining_date'):
            join_date = data['joining_date']
            if isinstance(join_date, str):
                join_date = DateParser.parse(join_date)
            
            if join_date is None:
                errors.append(f'Row {row_number}: Invalid joining date format')
            elif join_date > date.today():
                errors.append(f'Row {row_number}: Joining date cannot be in the future')
        
        # Validate email
        if data.get('email'):
            is_valid, error = EmailValidator.validate(data['email'])
            if not is_valid:
                errors.append(f'Row {row_number}: {error}')
        
        # Validate phone
        if data.get('phone'):
            is_valid, error = PhoneValidator.validate(data['phone'])
            if not is_valid:
                errors.append(f'Row {row_number}: {error}')
        
        return errors
    
    @classmethod
    def validate_class_section(cls, data: Dict, row_number: int = 0) -> List[str]:
        """Validate class/section data"""
        errors = []
        
        if not data.get('class_name'):
            errors.append(f'Row {row_number}: Missing required field: class_name')
        
        if not data.get('section_name'):
            errors.append(f'Row {row_number}: Missing required field: section_name')
        
        return errors
