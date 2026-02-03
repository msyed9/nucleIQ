"""
Template Configuration for Data Migration
Defines field specifications, validations, and sample data for each module
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from enum import Enum


class FieldType(Enum):
    STRING = 'string'
    INTEGER = 'integer'
    DECIMAL = 'decimal'
    DATE = 'date'
    DATETIME = 'datetime'
    EMAIL = 'email'
    PHONE = 'phone'
    BOOLEAN = 'boolean'
    CHOICE = 'choice'
    FOREIGN_KEY = 'foreign_key'


@dataclass
class FieldSpec:
    """Specification for a single import field"""
    name: str
    display_name: str
    field_type: FieldType
    required: bool = False
    max_length: int = None
    choices: List[str] = None
    description: str = ''
    sample_value: str = ''
    validation_hint: str = ''
    aliases: List[str] = field(default_factory=list)  # Alternative column names
    
    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'display_name': self.display_name,
            'type': self.field_type.value,
            'required': self.required,
            'max_length': self.max_length,
            'choices': self.choices,
            'description': self.description,
            'sample_value': self.sample_value,
            'validation_hint': self.validation_hint,
        }


@dataclass
class ModuleTemplate:
    """Template configuration for a module"""
    name: str
    display_name: str
    description: str
    model_name: str
    fields: List[FieldSpec]
    unique_field: str = None
    supported_formats: List[str] = field(default_factory=lambda: ['csv', 'xlsx', 'xls'])
    max_import_size: int = 5000  # Max rows per import
    instructions: List[str] = field(default_factory=list)
    
    def get_required_fields(self) -> List[FieldSpec]:
        return [f for f in self.fields if f.required]
    
    def get_optional_fields(self) -> List[FieldSpec]:
        return [f for f in self.fields if not f.required]
    
    def get_field_names(self) -> List[str]:
        return [f.name for f in self.fields]
    
    def to_dict(self) -> Dict:
        return {
            'name': self.name,
            'display_name': self.display_name,
            'description': self.description,
            'unique_field': self.unique_field,
            'supported_formats': self.supported_formats,
            'max_import_size': self.max_import_size,
            'required_fields': [f.to_dict() for f in self.get_required_fields()],
            'optional_fields': [f.to_dict() for f in self.get_optional_fields()],
            'instructions': self.instructions,
        }


# ============================================================================
# STUDENT IMPORT TEMPLATE
# ============================================================================
STUDENT_TEMPLATE = ModuleTemplate(
    name='students',
    display_name='Students',
    description='Import student basic information and enrollment data',
    model_name='students.Student',
    unique_field='admission_number',
    fields=[
        # Required Fields
        FieldSpec(
            name='first_name',
            display_name='First Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description="Student's first/given name",
            sample_value='Rahul',
            aliases=['firstname', 'fname', 'given_name', 'name']
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Unique admission/registration number',
            sample_value='STU2024001',
            validation_hint='Must be unique within the school',
            aliases=['admn_no', 'admission_no', 'reg_no', 'student_id', 'roll_no']
        ),
        FieldSpec(
            name='date_of_birth',
            display_name='Date of Birth',
            field_type=FieldType.DATE,
            required=True,
            description='Date of birth',
            sample_value='15-05-2010',
            validation_hint='Format: DD-MM-YYYY or DD/MM/YYYY',
            aliases=['dob', 'birth_date', 'birthdate']
        ),
        FieldSpec(
            name='gender',
            display_name='Gender',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['M', 'F', 'O', 'Male', 'Female', 'Other'],
            description='Gender (M=Male, F=Female, O=Other)',
            sample_value='M',
            aliases=['sex']
        ),
        FieldSpec(
            name='father_name',
            display_name="Father's Name",
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description="Father's full name",
            sample_value='Suresh Kumar',
            aliases=['fathers_name', 'father']
        ),
        FieldSpec(
            name='mother_name',
            display_name="Mother's Name",
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description="Mother's full name",
            sample_value='Sunita Devi',
            aliases=['mothers_name', 'mother']
        ),
        FieldSpec(
            name='father_phone',
            display_name="Father's Phone",
            field_type=FieldType.PHONE,
            required=True,
            description="Father's mobile number (10 digits)",
            sample_value='9876543210',
            validation_hint='10 digit Indian mobile number',
            aliases=['father_mobile', 'fathers_mobile']
        ),
        
        # Optional Fields
        FieldSpec(
            name='middle_name',
            display_name='Middle Name',
            field_type=FieldType.STRING,
            max_length=100,
            description="Student's middle name",
            sample_value='Kumar',
            aliases=['middlename', 'mname']
        ),
        FieldSpec(
            name='last_name',
            display_name='Last Name',
            field_type=FieldType.STRING,
            max_length=100,
            description="Student's surname/family name",
            sample_value='Singh',
            aliases=['lastname', 'lname', 'surname']
        ),
        FieldSpec(
            name='admission_date',
            display_name='Admission Date',
            field_type=FieldType.DATE,
            description='Date of admission to school',
            sample_value='01-04-2024',
            validation_hint='Format: DD-MM-YYYY. Defaults to today if empty',
            aliases=['date_of_admission', 'doa', 'joining_date']
        ),
        FieldSpec(
            name='email',
            display_name='Email',
            field_type=FieldType.EMAIL,
            description="Student's email address",
            sample_value='rahul@example.com',
            aliases=['email_id', 'student_email']
        ),
        FieldSpec(
            name='phone',
            display_name='Phone',
            field_type=FieldType.PHONE,
            description="Student's phone number",
            sample_value='9876543211',
            aliases=['mobile', 'contact', 'student_phone']
        ),
        FieldSpec(
            name='address',
            display_name='Address',
            field_type=FieldType.STRING,
            max_length=500,
            description='Complete residential address',
            sample_value='123, Main Street, City - 110001',
            aliases=['full_address', 'residential_address']
        ),
        FieldSpec(
            name='blood_group',
            display_name='Blood Group',
            field_type=FieldType.CHOICE,
            choices=['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            description='Blood group',
            sample_value='B+',
            aliases=['bloodgroup']
        ),
        FieldSpec(
            name='mother_phone',
            display_name="Mother's Phone",
            field_type=FieldType.PHONE,
            description="Mother's mobile number",
            sample_value='9876543212',
            aliases=['mother_mobile', 'mothers_mobile']
        ),
        FieldSpec(
            name='father_email',
            display_name="Father's Email",
            field_type=FieldType.EMAIL,
            description="Father's email address",
            sample_value='suresh@example.com',
            aliases=['fathers_email']
        ),
        FieldSpec(
            name='mother_email',
            display_name="Mother's Email",
            field_type=FieldType.EMAIL,
            description="Mother's email address",
            sample_value='sunita@example.com',
            aliases=['mothers_email']
        ),
        FieldSpec(
            name='father_occupation',
            display_name="Father's Occupation",
            field_type=FieldType.STRING,
            max_length=100,
            description="Father's occupation/profession",
            sample_value='Business',
            aliases=['fathers_occupation']
        ),
        FieldSpec(
            name='mother_occupation',
            display_name="Mother's Occupation",
            field_type=FieldType.STRING,
            max_length=100,
            description="Mother's occupation/profession",
            sample_value='Teacher',
            aliases=['mothers_occupation']
        ),
        FieldSpec(
            name='guardian_name',
            display_name="Guardian Name",
            field_type=FieldType.STRING,
            max_length=100,
            description="Guardian's name (if different from parents)",
            sample_value='',
            aliases=['guardian']
        ),
        FieldSpec(
            name='guardian_phone',
            display_name="Guardian Phone",
            field_type=FieldType.PHONE,
            description="Guardian's phone number",
            sample_value='',
            aliases=['guardian_mobile']
        ),
        FieldSpec(
            name='guardian_relation',
            display_name="Guardian Relation",
            field_type=FieldType.STRING,
            max_length=50,
            description="Relationship with guardian",
            sample_value='Uncle',
        ),
        FieldSpec(
            name='aadhar_number',
            display_name='Aadhar Number',
            field_type=FieldType.STRING,
            max_length=12,
            description='12-digit Aadhar card number',
            sample_value='123456789012',
            validation_hint='12 digits only, spaces will be removed',
            aliases=['aadhar', 'aadhaar', 'uid']
        ),
        FieldSpec(
            name='pen_number',
            display_name='PEN Number',
            field_type=FieldType.STRING,
            max_length=50,
            description='Permanent Education Number',
            sample_value='',
            aliases=['pen', 'pen_no']
        ),
        FieldSpec(
            name='nationality',
            display_name='Nationality',
            field_type=FieldType.STRING,
            max_length=100,
            description='Nationality',
            sample_value='Indian',
        ),
        FieldSpec(
            name='religion',
            display_name='Religion',
            field_type=FieldType.STRING,
            max_length=100,
            description='Religion',
            sample_value='Hindu',
        ),
        FieldSpec(
            name='caste',
            display_name='Caste/Category',
            field_type=FieldType.STRING,
            max_length=100,
            description='Caste or category (General, OBC, SC, ST)',
            sample_value='General',
            aliases=['category']
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.FOREIGN_KEY,
            description='Class/Grade name (must exist in system)',
            sample_value='Class 10',
            validation_hint='Must match existing class name exactly',
            aliases=['class', 'grade', 'grade_level', 'standard']
        ),
        FieldSpec(
            name='section_name',
            display_name='Section',
            field_type=FieldType.FOREIGN_KEY,
            description='Section name (must exist in system)',
            sample_value='A',
            validation_hint='Must match existing section name exactly',
            aliases=['section', 'division']
        ),
        FieldSpec(
            name='roll_number',
            display_name='Roll Number',
            field_type=FieldType.STRING,
            max_length=20,
            description='Roll number in class',
            sample_value='1',
            aliases=['rollno', 'class_roll']
        ),
        FieldSpec(
            name='previous_school_name',
            display_name='Previous School',
            field_type=FieldType.STRING,
            max_length=200,
            description='Name of previous school (for transfers)',
            sample_value='ABC Public School',
            aliases=['previous_school', 'last_school']
        ),
        FieldSpec(
            name='transfer_certificate_number',
            display_name='TC Number',
            field_type=FieldType.STRING,
            max_length=100,
            description='Transfer certificate number',
            sample_value='TC/2024/001',
            aliases=['tc_number', 'tc_no']
        ),
        FieldSpec(
            name='notes',
            display_name='Notes',
            field_type=FieldType.STRING,
            description='Additional notes or remarks',
            sample_value='',
            aliases=['remarks', 'comments']
        ),
    ],
    instructions=[
        '📋 STUDENT IMPORT INSTRUCTIONS',
        '',
        '📅 DATE FORMATS SUPPORTED:',
        '   • DD-MM-YYYY (e.g., 15-05-2010) - Recommended',
        '   • DD/MM/YYYY (e.g., 15/05/2010)',
        '   • YYYY-MM-DD (e.g., 2010-05-15)',
        '',
        '📞 PHONE NUMBER FORMAT:',
        '   • 10-digit mobile number (e.g., 9876543210)',
        '   • +91 or 0 prefix will be automatically removed',
        '',
        '🎓 CLASS & SECTION:',
        '   • Class name must match exactly as in the system',
        '   • Section name must match exactly',
        '   • Students will be enrolled in current academic year',
        '',
        '💡 TIPS:',
        '   • Blue headers are REQUIRED fields',
        '   • Gray headers are OPTIONAL fields',
        '   • Admission Number must be unique',
        '   • Do not modify the header row',
    ]
)


# ============================================================================
# STAFF IMPORT TEMPLATE
# ============================================================================
STAFF_TEMPLATE = ModuleTemplate(
    name='staff',
    display_name='Staff / Employees',
    description='Import staff and employee information',
    model_name='staff.Staff',
    unique_field='employee_id',
    fields=[
        # Required Fields
        FieldSpec(
            name='first_name',
            display_name='First Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description="Staff member's first name",
            sample_value='Priya',
            aliases=['firstname', 'fname']
        ),
        FieldSpec(
            name='last_name',
            display_name='Last Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description="Staff member's last name",
            sample_value='Sharma',
            aliases=['lastname', 'lname', 'surname']
        ),
        FieldSpec(
            name='employee_id',
            display_name='Employee ID',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Unique employee ID',
            sample_value='EMP001',
            validation_hint='Must be unique',
            aliases=['emp_id', 'staff_id', 'employee_code']
        ),
        FieldSpec(
            name='joining_date',
            display_name='Joining Date',
            field_type=FieldType.DATE,
            required=True,
            description='Date of joining',
            sample_value='01-04-2020',
            validation_hint='Format: DD-MM-YYYY',
            aliases=['date_of_joining', 'doj', 'join_date']
        ),
        FieldSpec(
            name='designation',
            display_name='Designation',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['PRINCIPAL', 'VICE_PRINCIPAL', 'HEAD_TEACHER', 'TEACHER', 
                    'ASSISTANT_TEACHER', 'LIBRARIAN', 'LAB_ASSISTANT', 'COUNSELOR',
                    'ACCOUNTANT', 'CLERK', 'RECEPTIONIST', 'SECURITY', 'PEON', 
                    'DRIVER', 'OTHER'],
            description='Job designation',
            sample_value='TEACHER',
            aliases=['position', 'role']
        ),
        
        # Optional Fields
        FieldSpec(
            name='middle_name',
            display_name='Middle Name',
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='',
            aliases=['middlename']
        ),
        FieldSpec(
            name='email',
            display_name='Email',
            field_type=FieldType.EMAIL,
            description='Official email address',
            sample_value='priya.sharma@school.edu',
            aliases=['email_id']
        ),
        FieldSpec(
            name='phone',
            display_name='Phone',
            field_type=FieldType.PHONE,
            description='Primary mobile number',
            sample_value='9876543210',
            aliases=['mobile', 'contact']
        ),
        FieldSpec(
            name='alternate_phone',
            display_name='Alternate Phone',
            field_type=FieldType.PHONE,
            description='Secondary phone number',
            sample_value='',
            aliases=['alt_phone']
        ),
        FieldSpec(
            name='date_of_birth',
            display_name='Date of Birth',
            field_type=FieldType.DATE,
            description='Date of birth',
            sample_value='15-08-1985',
            aliases=['dob', 'birth_date']
        ),
        FieldSpec(
            name='gender',
            display_name='Gender',
            field_type=FieldType.CHOICE,
            choices=['MALE', 'FEMALE', 'OTHER'],
            sample_value='FEMALE',
            aliases=['sex']
        ),
        FieldSpec(
            name='blood_group',
            display_name='Blood Group',
            field_type=FieldType.CHOICE,
            choices=['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
            sample_value='O+',
        ),
        FieldSpec(
            name='employment_type',
            display_name='Employment Type',
            field_type=FieldType.CHOICE,
            choices=['PERMANENT', 'CONTRACT', 'TEMPORARY', 'PART_TIME'],
            sample_value='PERMANENT',
            aliases=['emp_type', 'type']
        ),
        FieldSpec(
            name='department',
            display_name='Department',
            field_type=FieldType.STRING,
            max_length=100,
            description='Department name',
            sample_value='Mathematics',
            aliases=['dept']
        ),
        FieldSpec(
            name='address',
            display_name='Address',
            field_type=FieldType.STRING,
            max_length=500,
            sample_value='456, Park Avenue, City',
            aliases=['full_address']
        ),
        FieldSpec(
            name='city',
            display_name='City',
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='Delhi',
        ),
        FieldSpec(
            name='state',
            display_name='State',
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='Delhi',
        ),
        FieldSpec(
            name='postal_code',
            display_name='Postal Code',
            field_type=FieldType.STRING,
            max_length=20,
            sample_value='110001',
            aliases=['pincode', 'zip']
        ),
        FieldSpec(
            name='aadhar_number',
            display_name='Aadhar Number',
            field_type=FieldType.STRING,
            max_length=12,
            sample_value='123456789012',
            aliases=['aadhar', 'aadhaar']
        ),
        FieldSpec(
            name='pan_number',
            display_name='PAN Number',
            field_type=FieldType.STRING,
            max_length=10,
            sample_value='ABCDE1234F',
            aliases=['pan']
        ),
        FieldSpec(
            name='salary',
            display_name='Monthly Salary',
            field_type=FieldType.DECIMAL,
            description='Monthly salary amount',
            sample_value='50000',
            aliases=['basic_salary', 'monthly_salary']
        ),
        FieldSpec(
            name='bank_account_number',
            display_name='Bank Account',
            field_type=FieldType.STRING,
            max_length=50,
            sample_value='12345678901234',
            aliases=['account_number', 'bank_account']
        ),
        FieldSpec(
            name='bank_name',
            display_name='Bank Name',
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='State Bank of India',
            aliases=['bank']
        ),
        FieldSpec(
            name='bank_ifsc',
            display_name='IFSC Code',
            field_type=FieldType.STRING,
            max_length=20,
            sample_value='SBIN0001234',
            aliases=['ifsc', 'ifsc_code']
        ),
        FieldSpec(
            name='emergency_contact_name',
            display_name='Emergency Contact Name',
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='Spouse Name',
            aliases=['emergency_contact']
        ),
        FieldSpec(
            name='emergency_contact_phone',
            display_name='Emergency Contact Phone',
            field_type=FieldType.PHONE,
            sample_value='9876543211',
            aliases=['emergency_phone']
        ),
        FieldSpec(
            name='experience_years',
            display_name='Experience (Years)',
            field_type=FieldType.DECIMAL,
            description='Total years of experience',
            sample_value='10',
        ),
    ],
    instructions=[
        '📋 STAFF IMPORT INSTRUCTIONS',
        '',
        '👤 DESIGNATION VALUES:',
        '   PRINCIPAL, VICE_PRINCIPAL, HEAD_TEACHER, TEACHER,',
        '   ASSISTANT_TEACHER, LIBRARIAN, LAB_ASSISTANT, COUNSELOR,',
        '   ACCOUNTANT, CLERK, RECEPTIONIST, SECURITY, PEON, DRIVER, OTHER',
        '',
        '📋 EMPLOYMENT TYPE:',
        '   PERMANENT, CONTRACT, TEMPORARY, PART_TIME',
        '',
        '📅 DATE FORMAT: DD-MM-YYYY or DD/MM/YYYY',
    ]
)


# ============================================================================
# CLASS & SECTION IMPORT TEMPLATE
# ============================================================================
CLASS_SECTION_TEMPLATE = ModuleTemplate(
    name='classes',
    display_name='Classes & Sections',
    description='Import class/grade levels and their sections',
    model_name='tenants.GradeLevel',
    unique_field=None,  # Composite key
    fields=[
        FieldSpec(
            name='class_name',
            display_name='Class/Grade Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Class or grade name',
            sample_value='Class 10',
            aliases=['class', 'grade', 'grade_level', 'standard']
        ),
        FieldSpec(
            name='section_name',
            display_name='Section Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Section name',
            sample_value='A',
            aliases=['section', 'division']
        ),
        FieldSpec(
            name='room_number',
            display_name='Room Number',
            field_type=FieldType.STRING,
            max_length=50,
            description='Classroom number',
            sample_value='101',
            aliases=['room', 'classroom']
        ),
        FieldSpec(
            name='capacity',
            display_name='Capacity',
            field_type=FieldType.INTEGER,
            description='Maximum number of students',
            sample_value='40',
            aliases=['max_students', 'seats']
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2024-25). Defaults to current if empty',
            sample_value='2024-25',
            validation_hint='Format: YYYY-YY',
            aliases=['year', 'session']
        ),
    ],
    instructions=[
        '📋 CLASS & SECTION IMPORT',
        '',
        '• Each row creates a class and its section',
        '• Same class with multiple sections should be in separate rows',
        '• Academic year format: YYYY-YY (e.g., 2024-25)',
        '• If academic_year is empty, current year will be used',
        '• Example:',
        '  Class 10, A, 2024-25',
        '  Class 10, B, 2024-25',
        '  Class 10, C, 2024-25',
    ]
)


# ============================================================================
# FEE STRUCTURE IMPORT TEMPLATE
# ============================================================================
FEE_STRUCTURE_TEMPLATE = ModuleTemplate(
    name='fee_structures',
    display_name='Fee Structures',
    description='Import fee structure definitions for classes',
    model_name='fees.FeeStructure',
    unique_field=None,
    fields=[
        FieldSpec(
            name='fee_type',
            display_name='Fee Type/Category',
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description='Fee category name (e.g., Tuition Fee, Transport Fee)',
            sample_value='Tuition Fee',
            aliases=['fee_category', 'category', 'fee_name']
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Class/Grade for this fee',
            sample_value='Class 10',
            aliases=['class', 'grade']
        ),
        FieldSpec(
            name='amount',
            display_name='Amount',
            field_type=FieldType.DECIMAL,
            required=True,
            description='Fee amount per frequency',
            sample_value='5000',
            aliases=['fee_amount']
        ),
        FieldSpec(
            name='frequency',
            display_name='Frequency',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['ONE_TIME', 'MONTHLY', 'TERM', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
            description='How often fee is collected',
            sample_value='MONTHLY',
            aliases=['payment_frequency']
        ),
        FieldSpec(
            name='due_day',
            display_name='Due Day',
            field_type=FieldType.INTEGER,
            description='Day of month when fee is due (1-28)',
            sample_value='10',
        ),
        FieldSpec(
            name='is_mandatory',
            display_name='Mandatory',
            field_type=FieldType.BOOLEAN,
            description='Whether this fee is mandatory',
            sample_value='true',
            aliases=['mandatory', 'required']
        ),
        FieldSpec(
            name='description',
            display_name='Description',
            field_type=FieldType.STRING,
            max_length=500,
            description='Additional description',
            sample_value='Monthly tuition fee',
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2024-25). Defaults to current if empty',
            sample_value='2024-25',
            validation_hint='Format: YYYY-YY',
            aliases=['year', 'session']
        ),
    ],
    instructions=[
        '📋 FEE STRUCTURE IMPORT',
        '',
        '💰 FREQUENCY OPTIONS:',
        '   ONE_TIME - One-time fees (admission, etc.)',
        '   MONTHLY - Collected every month',
        '   TERM - Collected per term',
        '   QUARTERLY - Every 3 months',
        '   HALF_YEARLY - Every 6 months',
        '   YEARLY - Once a year',
        '',
        '📅 ACADEMIC YEAR:',
        '   Format: YYYY-YY (e.g., 2024-25)',
        '   If empty, current academic year will be used',
        '',
        '⚠️ Class must exist before importing fee structures',
    ]
)


# ============================================================================
# SUBJECT IMPORT TEMPLATE
# ============================================================================
SUBJECT_TEMPLATE = ModuleTemplate(
    name='subjects',
    display_name='Subjects',
    description='Import subject master data',
    model_name='tenants.Subject',
    unique_field='subject_code',
    fields=[
        FieldSpec(
            name='subject_name',
            display_name='Subject Name',
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            description='Name of the subject',
            sample_value='Mathematics',
            aliases=['name', 'subject']
        ),
        FieldSpec(
            name='subject_code',
            display_name='Subject Code',
            field_type=FieldType.STRING,
            required=True,
            max_length=20,
            description='Unique subject code',
            sample_value='MATH10',
            validation_hint='Must be unique',
            aliases=['code']
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Class for this subject',
            sample_value='Class 10',
            aliases=['class', 'grade']
        ),
        FieldSpec(
            name='credit_hours',
            display_name='Credit Hours',
            field_type=FieldType.INTEGER,
            description='Weekly teaching hours',
            sample_value='5',
            aliases=['hours', 'periods']
        ),
        FieldSpec(
            name='is_elective',
            display_name='Is Elective',
            field_type=FieldType.BOOLEAN,
            description='Whether this is an elective subject',
            sample_value='false',
            aliases=['elective', 'optional']
        ),
        FieldSpec(
            name='max_marks',
            display_name='Maximum Marks',
            field_type=FieldType.INTEGER,
            description='Maximum marks for this subject',
            sample_value='100',
        ),
    ],
    instructions=[
        '📋 SUBJECT IMPORT',
        '',
        '• Subject code must be unique',
        '• Class must exist before importing subjects',
    ]
)


# ============================================================================
# STUDENT ENROLLMENT TEMPLATE
# ============================================================================
STUDENT_ENROLLMENT_TEMPLATE = ModuleTemplate(
    name='student_enrollments',
    display_name='Student Enrollments',
    description='Import or update student class/section assignments',
    model_name='students.StudentEnrollment',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number (must exist)',
            sample_value='STU2024001',
            aliases=['admn_no', 'student_id']
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Class to enroll in',
            sample_value='Class 10',
            aliases=['class', 'grade']
        ),
        FieldSpec(
            name='section_name',
            display_name='Section',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Section to enroll in',
            sample_value='A',
            aliases=['section', 'division']
        ),
        FieldSpec(
            name='roll_number',
            display_name='Roll Number',
            field_type=FieldType.STRING,
            max_length=20,
            description='Roll number in class',
            sample_value='1',
            aliases=['rollno']
        ),
        FieldSpec(
            name='enrollment_date',
            display_name='Enrollment Date',
            field_type=FieldType.DATE,
            description='Date of enrollment (defaults to today)',
            sample_value='01-04-2024',
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2024-25). Defaults to current if empty',
            sample_value='2024-25',
            validation_hint='Format: YYYY-YY',
            aliases=['year', 'session']
        ),
    ],
    instructions=[
        '📋 STUDENT ENROLLMENT IMPORT',
        '',
        '• Students must exist before enrollment import',
        '• Classes and sections must exist',
        '',
        '📅 ACADEMIC YEAR:',
        '   Format: YYYY-YY (e.g., 2024-25)',
        '   If empty, current academic year will be used',
        '',
        '• Existing active enrollments for the same year will be updated',
    ]
)


# ============================================================================
# TRANSPORT ALLOCATION TEMPLATE
# ============================================================================
TRANSPORT_TEMPLATE = ModuleTemplate(
    name='transport',
    display_name='Transport Allocations',
    description='Import student transport/bus assignments',
    model_name='transport.StudentTransport',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001',
            aliases=['student_id']
        ),
        FieldSpec(
            name='route_name',
            display_name='Route Name',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Transport route name',
            sample_value='Route 5',
            aliases=['route']
        ),
        FieldSpec(
            name='stop_name',
            display_name='Stop Name',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Pickup/drop stop name',
            sample_value='Main Market',
            aliases=['stop', 'pickup_point']
        ),
        FieldSpec(
            name='start_date',
            display_name='Start Date',
            field_type=FieldType.DATE,
            description='Transport start date',
            sample_value='01-04-2024',
        ),
    ],
    instructions=[
        '📋 TRANSPORT ALLOCATION IMPORT',
        '',
        '• Routes and stops must be created first',
        '• Students must exist',
        '• One allocation per student',
    ]
)


# ============================================================================
# PARENT INFO UPDATE TEMPLATE
# ============================================================================
PARENT_TEMPLATE = ModuleTemplate(
    name='parents',
    display_name='Parent Information',
    description='Update parent/guardian information for existing students',
    model_name='students.Student',
    unique_field='admission_number',
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number (must exist)',
            sample_value='STU2024001',
            aliases=['student_id', 'student_admission_number']
        ),
        FieldSpec(
            name='father_name',
            display_name="Father's Name",
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            sample_value='Suresh Kumar',
        ),
        FieldSpec(
            name='mother_name',
            display_name="Mother's Name",
            field_type=FieldType.STRING,
            required=True,
            max_length=100,
            sample_value='Sunita Devi',
        ),
        FieldSpec(
            name='father_phone',
            display_name="Father's Phone",
            field_type=FieldType.PHONE,
            required=True,
            sample_value='9876543210',
        ),
        FieldSpec(
            name='mother_phone',
            display_name="Mother's Phone",
            field_type=FieldType.PHONE,
            sample_value='9876543211',
        ),
        FieldSpec(
            name='father_email',
            display_name="Father's Email",
            field_type=FieldType.EMAIL,
            sample_value='father@example.com',
        ),
        FieldSpec(
            name='mother_email',
            display_name="Mother's Email",
            field_type=FieldType.EMAIL,
            sample_value='mother@example.com',
        ),
        FieldSpec(
            name='father_occupation',
            display_name="Father's Occupation",
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='Business',
        ),
        FieldSpec(
            name='mother_occupation',
            display_name="Mother's Occupation",
            field_type=FieldType.STRING,
            max_length=100,
            sample_value='Homemaker',
        ),
    ],
    instructions=[
        '📋 PARENT INFO UPDATE',
        '',
        '• Use this to update parent information for existing students',
        '• Student must exist (matched by admission number)',
    ]
)


# ============================================================================
# FEE INVOICE IMPORT TEMPLATE
# ============================================================================
FEE_INVOICE_TEMPLATE = ModuleTemplate(
    name='fee_invoices',
    display_name='Fee Invoices',
    description='Import historical fee invoices/dues',
    model_name='fees.FeeInvoice',
    unique_field='invoice_number',
    fields=[
        FieldSpec(
            name='invoice_number',
            display_name='Invoice Number',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Unique invoice number',
            sample_value='INV/2023/001',
            validation_hint='Must be unique',
            aliases=['invoice_no', 'bill_no']
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001',
            aliases=['student_id']
        ),
        FieldSpec(
            name='fee_type',
            display_name='Fee Type',
            field_type=FieldType.STRING,
            required=True,
            description='Fee category (e.g., Tuition Fee)',
            sample_value='Tuition Fee',
            aliases=['category']
        ),
        FieldSpec(
            name='amount',
            display_name='Invoice Amount',
            field_type=FieldType.DECIMAL,
            required=True,
            description='Total amount on invoice',
            sample_value='5000',
        ),
        FieldSpec(
            name='due_date',
            display_name='Due Date',
            field_type=FieldType.DATE,
            required=True,
            description='Payment due date',
            sample_value='15-04-2023',
        ),
        FieldSpec(
            name='invoice_date',
            display_name='Invoice Date',
            field_type=FieldType.DATE,
            description='Date of invoice generation',
            sample_value='01-04-2023',
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2023-24)',
            sample_value='2023-24',
        ),
    ],
    instructions=[
        '📋 FEE INVOICE IMPORT',
        '',
        '• Use for importing historical dues/invoices',
        '• Invoice number must be unique',
        '• Student must exist',
    ]
)


# ============================================================================
# FEE PAYMENT IMPORT TEMPLATE
# ============================================================================
FEE_PAYMENT_TEMPLATE = ModuleTemplate(
    name='fee_payments',
    display_name='Fee Payments',
    description='Import historical fee payment/receipt records',
    model_name='fees.FeeTransaction',
    unique_field='receipt_number',
    fields=[
        FieldSpec(
            name='receipt_number',
            display_name='Receipt Number',
            field_type=FieldType.STRING,
            required=True,
            max_length=50,
            description='Unique receipt number',
            sample_value='RCP/2023/001',
            validation_hint='Must be unique',
            aliases=['receipt_no', 'transaction_id']
        ),
        FieldSpec(
            name='invoice_number',
            display_name='Invoice Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Related invoice number (must exist)',
            sample_value='INV/2023/001',
            aliases=['invoice_no']
        ),
        FieldSpec(
            name='amount_paid',
            display_name='Amount Paid',
            field_type=FieldType.DECIMAL,
            required=True,
            description='Amount paid in this transaction',
            sample_value='5000',
            aliases=['amount', 'paid_amount']
        ),
        FieldSpec(
            name='payment_date',
            display_name='Payment Date',
            field_type=FieldType.DATE,
            required=True,
            description='Date of payment',
            sample_value='10-04-2023',
            aliases=['date', 'transaction_date']
        ),
        FieldSpec(
            name='payment_mode',
            display_name='Payment Mode',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['CASH', 'CHEQUE', 'ONLINE', 'BANK_TRANSFER', 'UPI', 'OTHER'],
            description='Mode of payment',
            sample_value='CASH',
            aliases=['mode']
        ),
        FieldSpec(
            name='remarks',
            display_name='Remarks',
            field_type=FieldType.STRING,
            description='Transaction notes',
            sample_value='Paid in full',
        ),
    ],
    instructions=[
        '📋 FEE PAYMENT IMPORT',
        '',
        '• Use for importing historical payment records',
        '• Receipt number must be unique',
        '• Related Invoice must exist in the system first',
    ]
)


# ============================================================================
# USER ACCOUNT IMPORT TEMPLATE
# ============================================================================
USER_ACCOUNT_TEMPLATE = ModuleTemplate(
    name='user_accounts',
    display_name='User Accounts (Logins)',
    description='Import or create login profiles for parents, staff or students',
    model_name='users.User',
    unique_field='email',
    fields=[
        FieldSpec(
            name='email',
            display_name='Email / Username',
            field_type=FieldType.EMAIL,
            required=True,
            description='Login email address',
            sample_value='parent@example.com',
            validation_hint='Must be unique',
        ),
        FieldSpec(
            name='password',
            display_name='Password',
            field_type=FieldType.STRING,
            description='Initial password. If empty, a random one will be generated',
            sample_value='password123',
        ),
        FieldSpec(
            name='first_name',
            display_name='First Name',
            field_type=FieldType.STRING,
            required=True,
            sample_value='John',
        ),
        FieldSpec(
            name='last_name',
            display_name='Last Name',
            field_type=FieldType.STRING,
            sample_value='Doe',
        ),
        FieldSpec(
            name='role',
            display_name='Role',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['PARENT', 'STAFF', 'TEACHER', 'STUDENT'],
            sample_value='PARENT',
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.STRING,
            description='For parents/students: link to student record',
            sample_value='STU2024001',
        ),
        FieldSpec(
            name='employee_id',
            display_name='Employee ID',
            field_type=FieldType.STRING,
            description='For staff: link to staff record',
            sample_value='EMP001',
        ),
    ],
    instructions=[
        '📋 USER ACCOUNT IMPORT',
        '',
        '• Use to bulk create login credentials',
        '• For Parents: specify Role=PARENT and Admission Number to link',
        '• For Staff: specify Role=TEACHER/STAFF and Employee ID to link',
    ]
)


# ============================================================================
# ATTENDANCE IMPORT TEMPLATE
# ============================================================================
ATTENDANCE_TEMPLATE = ModuleTemplate(
    name='attendance',
    display_name='Attendance Records',
    description='Import historical attendance data',
    model_name='attendance.AttendanceRecord',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001',
            aliases=['student_id']
        ),
        FieldSpec(
            name='date',
            display_name='Date',
            field_type=FieldType.DATE,
            required=True,
            description='Attendance date',
            sample_value='15-01-2024',
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'LEAVE'],
            description='Attendance status',
            sample_value='PRESENT',
        ),
        FieldSpec(
            name='remarks',
            display_name='Remarks',
            field_type=FieldType.STRING,
            description='Optional remarks',
            sample_value='',
        ),
    ],
    instructions=[
        '📋 ATTENDANCE IMPORT',
        '',
        '• Use for importing historical attendance data',
        '• Status options: PRESENT, ABSENT, LATE, HALF_DAY, LEAVE',
        '• Date format: DD-MM-YYYY',
    ]
)


# ============================================================================
# FEE ALLOCATION TEMPLATE
# ============================================================================
FEE_ALLOCATION_TEMPLATE = ModuleTemplate(
    name='fee_allocations',
    display_name='Fee Allocations',
    description='Allocate fee structures to students or classes',
    model_name='fees.FeeAllocation',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001',
            aliases=['student_id']
        ),
        FieldSpec(
            name='fee_type',
            display_name='Fee Type',
            field_type=FieldType.STRING,
            required=True,
            description='Fee category (e.g., Tuition Fee)',
            sample_value='Tuition Fee',
            aliases=['fee_category', 'category']
        ),
        FieldSpec(
            name='amount',
            display_name='Amount',
            field_type=FieldType.DECIMAL,
            required=True,
            description='Allocated amount',
            sample_value='5000'
        ),
        FieldSpec(
            name='frequency',
            display_name='Frequency',
            field_type=FieldType.CHOICE,
            choices=['ONE_TIME', 'MONTHLY', 'TERM', 'QUARTERLY', 'HALF_YEARLY', 'YEARLY'],
            description='Fee collection frequency',
            sample_value='MONTHLY'
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2024-25)',
            sample_value='2024-25',
            aliases=['year', 'session']
        ),
    ],
    instructions=[
        '📋 FEE ALLOCATION IMPORT',
        '',
        '• Student must exist before allocation',
        '• Fee type should match existing fee categories',
        '• Academic year format: YYYY-YY (e.g., 2024-25)'
    ]
)


# ============================================================================
# STUDENT PHOTO TEMPLATE
# ============================================================================
STUDENT_PHOTO_TEMPLATE = ModuleTemplate(
    name='student_photos',
    display_name='Student Photos',
    description='Map student admission numbers to photo files or URLs',
    model_name='students.Student',
    unique_field='admission_number',
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001',
            aliases=['student_id']
        ),
        FieldSpec(
            name='photo_filename',
            display_name='Photo Filename',
            field_type=FieldType.STRING,
            required=True,
            description='Filename inside the uploaded ZIP',
            sample_value='STU2024001.jpg',
            aliases=['file', 'filename']
        ),
        FieldSpec(
            name='photo_url',
            display_name='Photo URL',
            field_type=FieldType.STRING,
            description='Optional external URL to photo',
            sample_value='https://example.com/photos/STU2024001.jpg'
        ),
    ],
    instructions=[
        '📋 STUDENT PHOTO IMPORT',
        '',
        '• Upload a ZIP of photos OR provide photo URLs',
        '• Filenames must match the photo_filename column',
        '• Admission number must exist'
    ]
)


# ============================================================================
# EXAM RESULT TEMPLATE
# ============================================================================
EXAM_RESULT_TEMPLATE = ModuleTemplate(
    name='exam_results',
    display_name='Exam Results',
    description='Import historical exam results and marks',
    model_name='exams.ExamResult',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            description='Student admission number',
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='exam_name',
            display_name='Exam Name',
            field_type=FieldType.STRING,
            required=True,
            description='Exam name (e.g., Midterm)',
            sample_value='Midterm'
        ),
        FieldSpec(
            name='subject_code',
            display_name='Subject Code',
            field_type=FieldType.STRING,
            required=True,
            description='Subject code',
            sample_value='MATH10'
        ),
        FieldSpec(
            name='max_marks',
            display_name='Max Marks',
            field_type=FieldType.INTEGER,
            required=True,
            description='Maximum marks',
            sample_value='100'
        ),
        FieldSpec(
            name='marks_obtained',
            display_name='Marks Obtained',
            field_type=FieldType.DECIMAL,
            required=True,
            description='Marks obtained',
            sample_value='85'
        ),
        FieldSpec(
            name='grade',
            display_name='Grade',
            field_type=FieldType.STRING,
            description='Grade/letter',
            sample_value='A'
        ),
        FieldSpec(
            name='exam_date',
            display_name='Exam Date',
            field_type=FieldType.DATE,
            description='Exam date',
            sample_value='10-09-2024'
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            max_length=20,
            description='Academic year (e.g., 2024-25)',
            sample_value='2024-25'
        ),
    ],
    instructions=[
        '📋 EXAM RESULT IMPORT',
        '',
        '• Student and subject must exist',
        '• Use one row per student per subject per exam',
        '• Academic year format: YYYY-YY'
    ]
)


# ============================================================================
# EXAM SCHEDULE TEMPLATE
# ============================================================================
EXAM_SCHEDULE_TEMPLATE = ModuleTemplate(
    name='exam_schedule',
    display_name='Exam Schedule',
    description='Import exam schedules and timetables',
    model_name='exams.ExamSchedule',
    unique_field=None,
    fields=[
        FieldSpec(
            name='exam_name',
            display_name='Exam Name',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Midterm'
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Class 10'
        ),
        FieldSpec(
            name='subject_code',
            display_name='Subject Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='MATH10'
        ),
        FieldSpec(
            name='exam_date',
            display_name='Exam Date',
            field_type=FieldType.DATE,
            required=True,
            sample_value='10-09-2024'
        ),
        FieldSpec(
            name='start_time',
            display_name='Start Time',
            field_type=FieldType.STRING,
            description='HH:MM',
            sample_value='09:00'
        ),
        FieldSpec(
            name='end_time',
            display_name='End Time',
            field_type=FieldType.STRING,
            description='HH:MM',
            sample_value='12:00'
        ),
        FieldSpec(
            name='max_marks',
            display_name='Max Marks',
            field_type=FieldType.INTEGER,
            sample_value='100'
        ),
    ],
    instructions=[
        '📋 EXAM SCHEDULE IMPORT',
        '',
        '• Class and subject must exist',
        '• Use HH:MM for times'
    ]
)


# ============================================================================
# TIMETABLE TEMPLATE
# ============================================================================
TIMETABLE_TEMPLATE = ModuleTemplate(
    name='timetable',
    display_name='Class Timetable',
    description='Import class-wise timetable/periods',
    model_name='timetable.TimetableEntry',
    unique_field=None,
    fields=[
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Class 10'
        ),
        FieldSpec(
            name='section_name',
            display_name='Section',
            field_type=FieldType.STRING,
            required=True,
            sample_value='A'
        ),
        FieldSpec(
            name='academic_year',
            display_name='Academic Year',
            field_type=FieldType.STRING,
            description='Academic year (e.g., 2024-25). Defaults to current if empty',
            sample_value='2024-25'
        ),
        FieldSpec(
            name='day_of_week',
            display_name='Day of Week',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
            sample_value='MON'
        ),
        FieldSpec(
            name='start_time',
            display_name='Start Time',
            field_type=FieldType.STRING,
            required=True,
            description='HH:MM (24h format)',
            sample_value='09:00'
        ),
        FieldSpec(
            name='end_time',
            display_name='End Time',
            field_type=FieldType.STRING,
            required=True,
            description='HH:MM (24h format)',
            sample_value='09:45'
        ),
        FieldSpec(
            name='period_number',
            display_name='Period Number',
            field_type=FieldType.INTEGER,
            required=True,
            sample_value='1'
        ),
        FieldSpec(
            name='subject_code',
            display_name='Subject Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='MATH10'
        ),
        FieldSpec(
            name='teacher_employee_id',
            display_name='Teacher Employee ID',
            field_type=FieldType.STRING,
            description='Optional teacher assignment',
            sample_value='EMP001'
        ),
        FieldSpec(
            name='room_number',
            display_name='Room Number',
            field_type=FieldType.STRING,
            sample_value='101'
        ),
    ],
    instructions=[
        '📋 TIMETABLE IMPORT',
        '',
        '• Use one row per period per day',
        '• Day values: MON, TUE, WED, THU, FRI, SAT, SUN',
        '• Time format: HH:MM (24h)'
    ]
)


# ============================================================================
# LIBRARY BOOKS TEMPLATE
# ============================================================================
LIBRARY_BOOK_TEMPLATE = ModuleTemplate(
    name='library_books',
    display_name='Library Books',
    description='Import library book catalog',
    model_name='library.Book',
    unique_field='isbn',
    fields=[
        FieldSpec(
            name='isbn',
            display_name='ISBN',
            field_type=FieldType.STRING,
            required=True,
            max_length=20,
            sample_value='9789389620001'
        ),
        FieldSpec(
            name='title',
            display_name='Title',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Mathematics Grade 10'
        ),
        FieldSpec(
            name='author',
            display_name='Author',
            field_type=FieldType.STRING,
            sample_value='NCERT'
        ),
        FieldSpec(
            name='publisher',
            display_name='Publisher',
            field_type=FieldType.STRING,
            sample_value='NCERT'
        ),
        FieldSpec(
            name='category',
            display_name='Category',
            field_type=FieldType.STRING,
            sample_value='Textbook'
        ),
        FieldSpec(
            name='copies_total',
            display_name='Copies Total',
            field_type=FieldType.INTEGER,
            sample_value='20'
        ),
        FieldSpec(
            name='location',
            display_name='Location',
            field_type=FieldType.STRING,
            sample_value='Rack A1'
        ),
        FieldSpec(
            name='published_year',
            display_name='Published Year',
            field_type=FieldType.INTEGER,
            sample_value='2022'
        ),
    ],
    instructions=[
        '📋 LIBRARY BOOK IMPORT',
        '',
        '• ISBN must be unique if provided',
        '• Use one row per book title'
    ]
)


# ============================================================================
# LIBRARY TRANSACTIONS TEMPLATE
# ============================================================================
LIBRARY_TRANSACTION_TEMPLATE = ModuleTemplate(
    name='library_transactions',
    display_name='Library Transactions',
    description='Import library issue/return history',
    model_name='library.BookIssue',
    unique_field='transaction_id',
    fields=[
        FieldSpec(
            name='transaction_id',
            display_name='Transaction ID',
            field_type=FieldType.STRING,
            required=True,
            sample_value='LIBTXN001'
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='isbn',
            display_name='ISBN',
            field_type=FieldType.STRING,
            required=True,
            sample_value='9789389620001'
        ),
        FieldSpec(
            name='issue_date',
            display_name='Issue Date',
            field_type=FieldType.DATE,
            required=True,
            sample_value='01-07-2024'
        ),
        FieldSpec(
            name='due_date',
            display_name='Due Date',
            field_type=FieldType.DATE,
            sample_value='15-07-2024'
        ),
        FieldSpec(
            name='return_date',
            display_name='Return Date',
            field_type=FieldType.DATE,
            sample_value='10-07-2024'
        ),
        FieldSpec(
            name='fine_amount',
            display_name='Fine Amount',
            field_type=FieldType.DECIMAL,
            sample_value='0'
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['ISSUED', 'RETURNED', 'OVERDUE'],
            sample_value='RETURNED'
        ),
    ],
    instructions=[
        '📋 LIBRARY TRANSACTION IMPORT',
        '',
        '• Student and book must exist',
        '• Use status: ISSUED, RETURNED, OVERDUE'
    ]
)


# ============================================================================
# PAYROLL PAYMENT TEMPLATE
# ============================================================================
PAYROLL_PAYMENT_TEMPLATE = ModuleTemplate(
    name='payroll_payments',
    display_name='Payroll Payments',
    description='Import salary payments or payslips',
    model_name='payroll.PayrollPayment',
    unique_field='payment_reference',
    fields=[
        FieldSpec(
            name='payment_reference',
            display_name='Payment Reference',
            field_type=FieldType.STRING,
            required=True,
            sample_value='SAL/2024/001'
        ),
        FieldSpec(
            name='employee_id',
            display_name='Employee ID',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            sample_value='EMP001'
        ),
        FieldSpec(
            name='period_start',
            display_name='Period Start',
            field_type=FieldType.DATE,
            required=True,
            sample_value='01-04-2024'
        ),
        FieldSpec(
            name='period_end',
            display_name='Period End',
            field_type=FieldType.DATE,
            required=True,
            sample_value='30-04-2024'
        ),
        FieldSpec(
            name='gross_amount',
            display_name='Gross Amount',
            field_type=FieldType.DECIMAL,
            required=True,
            sample_value='50000'
        ),
        FieldSpec(
            name='deductions',
            display_name='Deductions',
            field_type=FieldType.DECIMAL,
            sample_value='2000'
        ),
        FieldSpec(
            name='net_amount',
            display_name='Net Amount',
            field_type=FieldType.DECIMAL,
            required=True,
            sample_value='48000'
        ),
        FieldSpec(
            name='payment_date',
            display_name='Payment Date',
            field_type=FieldType.DATE,
            sample_value='01-05-2024'
        ),
        FieldSpec(
            name='payment_mode',
            display_name='Payment Mode',
            field_type=FieldType.CHOICE,
            choices=['CASH', 'BANK_TRANSFER', 'CHEQUE', 'UPI', 'OTHER'],
            sample_value='BANK_TRANSFER'
        ),
        FieldSpec(
            name='remarks',
            display_name='Remarks',
            field_type=FieldType.STRING,
            sample_value='April salary'
        ),
    ],
    instructions=[
        '📋 PAYROLL PAYMENT IMPORT',
        '',
        '• Employee must exist',
        '• Use one row per payment'
    ]
)


# ============================================================================
# HOSTEL ALLOCATION TEMPLATE
# ============================================================================
HOSTEL_ALLOCATION_TEMPLATE = ModuleTemplate(
    name='hostel_allocations',
    display_name='Hostel Allocations',
    description='Import hostel room allocations',
    model_name='hostel.HostelAllocation',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='hostel_name',
            display_name='Hostel Name',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Boys Hostel'
        ),
        FieldSpec(
            name='room_number',
            display_name='Room Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='101'
        ),
        FieldSpec(
            name='bed_number',
            display_name='Bed Number',
            field_type=FieldType.STRING,
            sample_value='A'
        ),
        FieldSpec(
            name='start_date',
            display_name='Start Date',
            field_type=FieldType.DATE,
            sample_value='01-06-2024'
        ),
        FieldSpec(
            name='end_date',
            display_name='End Date',
            field_type=FieldType.DATE,
            sample_value=''
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['ACTIVE', 'INACTIVE'],
            sample_value='ACTIVE'
        ),
    ],
    instructions=[
        '📋 HOSTEL ALLOCATION IMPORT',
        '',
        '• Student must exist',
        '• Use status: ACTIVE or INACTIVE'
    ]
)


# ============================================================================
# INVENTORY ITEM TEMPLATE
# ============================================================================
INVENTORY_ITEM_TEMPLATE = ModuleTemplate(
    name='inventory_items',
    display_name='Inventory Items',
    description='Import inventory and asset items',
    model_name='inventory.InventoryItem',
    unique_field='item_code',
    fields=[
        FieldSpec(
            name='item_code',
            display_name='Item Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='ASSET001'
        ),
        FieldSpec(
            name='item_name',
            display_name='Item Name',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Projector'
        ),
        FieldSpec(
            name='category',
            display_name='Category',
            field_type=FieldType.STRING,
            sample_value='Electronics'
        ),
        FieldSpec(
            name='quantity',
            display_name='Quantity',
            field_type=FieldType.INTEGER,
            sample_value='5'
        ),
        FieldSpec(
            name='unit_cost',
            display_name='Unit Cost',
            field_type=FieldType.DECIMAL,
            sample_value='25000'
        ),
        FieldSpec(
            name='purchase_date',
            display_name='Purchase Date',
            field_type=FieldType.DATE,
            sample_value='15-03-2023'
        ),
        FieldSpec(
            name='vendor',
            display_name='Vendor',
            field_type=FieldType.STRING,
            sample_value='ABC Suppliers'
        ),
        FieldSpec(
            name='location',
            display_name='Location',
            field_type=FieldType.STRING,
            sample_value='Lab 1'
        ),
        FieldSpec(
            name='condition',
            display_name='Condition',
            field_type=FieldType.CHOICE,
            choices=['NEW', 'GOOD', 'FAIR', 'DAMAGED'],
            sample_value='GOOD'
        ),
    ],
    instructions=[
        '📋 INVENTORY ITEM IMPORT',
        '',
        '• Item code must be unique'
    ]
)


# ============================================================================
# CERTIFICATE ISSUED TEMPLATE
# ============================================================================
CERTIFICATE_ISSUED_TEMPLATE = ModuleTemplate(
    name='certificates_issued',
    display_name='Certificates Issued',
    description='Import issued certificates history',
    model_name='certificates.Certificate',
    unique_field='certificate_number',
    fields=[
        FieldSpec(
            name='certificate_number',
            display_name='Certificate Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='CERT/2024/001'
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='certificate_type',
            display_name='Certificate Type',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Transfer Certificate'
        ),
        FieldSpec(
            name='issue_date',
            display_name='Issue Date',
            field_type=FieldType.DATE,
            required=True,
            sample_value='01-05-2024'
        ),
        FieldSpec(
            name='expiry_date',
            display_name='Expiry Date',
            field_type=FieldType.DATE,
            sample_value=''
        ),
        FieldSpec(
            name='remarks',
            display_name='Remarks',
            field_type=FieldType.STRING,
            sample_value=''
        ),
    ],
    instructions=[
        '📋 CERTIFICATE IMPORT',
        '',
        '• Student must exist',
        '• Certificate number must be unique'
    ]
)


# ============================================================================
# FINANCE JOURNAL ENTRY TEMPLATE
# ============================================================================
FINANCE_JOURNAL_TEMPLATE = ModuleTemplate(
    name='finance_journal_entries',
    display_name='Finance Journal Entries',
    description='Import financial journal entries',
    model_name='finance.JournalEntry',
    unique_field='entry_number',
    fields=[
        FieldSpec(
            name='entry_number',
            display_name='Entry Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='JE/2024/001'
        ),
        FieldSpec(
            name='entry_date',
            display_name='Entry Date',
            field_type=FieldType.DATE,
            required=True,
            sample_value='01-04-2024'
        ),
        FieldSpec(
            name='account_code',
            display_name='Account Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='4001'
        ),
        FieldSpec(
            name='account_name',
            display_name='Account Name',
            field_type=FieldType.STRING,
            sample_value='Tuition Revenue'
        ),
        FieldSpec(
            name='debit',
            display_name='Debit',
            field_type=FieldType.DECIMAL,
            sample_value='0'
        ),
        FieldSpec(
            name='credit',
            display_name='Credit',
            field_type=FieldType.DECIMAL,
            sample_value='5000'
        ),
        FieldSpec(
            name='narration',
            display_name='Narration',
            field_type=FieldType.STRING,
            sample_value='Invoice posting'
        ),
        FieldSpec(
            name='reference',
            display_name='Reference',
            field_type=FieldType.STRING,
            sample_value='INV/2024/001'
        ),
    ],
    instructions=[
        '📋 JOURNAL ENTRY IMPORT',
        '',
        '• Entry number must be unique',
        '• Debit/Credit should be numeric',
        '• Account code should match chart of accounts'
    ]
)


# ============================================================================
# FEE DISCOUNT TEMPLATE
# ============================================================================
FEE_DISCOUNT_TEMPLATE = ModuleTemplate(
    name='fee_discounts',
    display_name='Fee Discounts / Scholarships',
    description='Import fee discount or scholarship data',
    model_name='fees.FeeDiscount',
    unique_field=None,
    fields=[
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.FOREIGN_KEY,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='discount_code',
            display_name='Discount Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='SCHOLAR50'
        ),
        FieldSpec(
            name='discount_type',
            display_name='Discount Type',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['PERCENT', 'AMOUNT'],
            sample_value='PERCENT'
        ),
        FieldSpec(
            name='value',
            display_name='Value',
            field_type=FieldType.DECIMAL,
            required=True,
            sample_value='50'
        ),
        FieldSpec(
            name='start_date',
            display_name='Start Date',
            field_type=FieldType.DATE,
            sample_value='01-04-2024'
        ),
        FieldSpec(
            name='end_date',
            display_name='End Date',
            field_type=FieldType.DATE,
            sample_value='31-03-2025'
        ),
        FieldSpec(
            name='reason',
            display_name='Reason',
            field_type=FieldType.STRING,
            sample_value='Merit Scholarship'
        ),
    ],
    instructions=[
        '📋 FEE DISCOUNT IMPORT',
        '',
        '• Student must exist',
        '• Discount type: PERCENT or AMOUNT'
    ]
)


# ============================================================================
# HELPDESK TICKET TEMPLATE
# ============================================================================
HELPDESK_TICKET_TEMPLATE = ModuleTemplate(
    name='helpdesk_tickets',
    display_name='Helpdesk Tickets',
    description='Import historical helpdesk tickets',
    model_name='helpdesk.Ticket',
    unique_field='ticket_number',
    fields=[
        FieldSpec(
            name='ticket_number',
            display_name='Ticket Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='TCK/2024/001'
        ),
        FieldSpec(
            name='requester_type',
            display_name='Requester Type',
            field_type=FieldType.CHOICE,
            required=True,
            choices=['STUDENT', 'PARENT', 'STAFF'],
            sample_value='STUDENT'
        ),
        FieldSpec(
            name='requester_id',
            display_name='Requester ID',
            field_type=FieldType.STRING,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='subject',
            display_name='Subject',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Portal access issue'
        ),
        FieldSpec(
            name='description',
            display_name='Description',
            field_type=FieldType.STRING,
            sample_value='Unable to login to portal'
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            sample_value='RESOLVED'
        ),
        FieldSpec(
            name='priority',
            display_name='Priority',
            field_type=FieldType.CHOICE,
            choices=['LOW', 'MEDIUM', 'HIGH'],
            sample_value='MEDIUM'
        ),
        FieldSpec(
            name='created_at',
            display_name='Created At',
            field_type=FieldType.DATETIME,
            sample_value='2024-04-01 10:30:00'
        ),
        FieldSpec(
            name='resolved_at',
            display_name='Resolved At',
            field_type=FieldType.DATETIME,
            sample_value='2024-04-02 15:00:00'
        ),
    ],
    instructions=[
        '📋 HELPDESK TICKET IMPORT',
        '',
        '• Ticket number must be unique',
        '• Status: OPEN, IN_PROGRESS, RESOLVED, CLOSED'
    ]
)


# ============================================================================
# LMS COURSE TEMPLATE
# ============================================================================
LMS_COURSE_TEMPLATE = ModuleTemplate(
    name='lms_courses',
    display_name='LMS Courses',
    description='Import LMS course catalog',
    model_name='lms.Course',
    unique_field='course_code',
    fields=[
        FieldSpec(
            name='course_code',
            display_name='Course Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='MATH10-2024'
        ),
        FieldSpec(
            name='class_name',
            display_name='Class',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Class 10'
        ),
        FieldSpec(
            name='subject_code',
            display_name='Subject Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='MATH10'
        ),
        FieldSpec(
            name='course_name',
            display_name='Course Name',
            field_type=FieldType.STRING,
            required=True,
            sample_value='Mathematics Grade 10'
        ),
        FieldSpec(
            name='description',
            display_name='Description',
            field_type=FieldType.STRING,
            sample_value='Course description'
        ),
        FieldSpec(
            name='teacher_employee_id',
            display_name='Teacher Employee ID',
            field_type=FieldType.STRING,
            sample_value='EMP001'
        ),
        FieldSpec(
            name='start_time',
            display_name='Start Time',
            field_type=FieldType.DATETIME,
            description='Start datetime (YYYY-MM-DD HH:MM:SS)',
            sample_value='2024-04-01 09:00:00'
        ),
        FieldSpec(
            name='duration_minutes',
            display_name='Duration (Minutes)',
            field_type=FieldType.INTEGER,
            sample_value='45'
        ),
        FieldSpec(
            name='meeting_link',
            display_name='Meeting Link',
            field_type=FieldType.STRING,
            sample_value='https://meet.google.com/xyz-abc'
        ),
        FieldSpec(
            name='start_date',
            display_name='Start Date',
            field_type=FieldType.DATE,
            sample_value='01-04-2024'
        ),
        FieldSpec(
            name='end_date',
            display_name='End Date',
            field_type=FieldType.DATE,
            sample_value='31-03-2025'
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['ACTIVE', 'INACTIVE'],
            sample_value='ACTIVE'
        ),
    ],
    instructions=[
        '📋 LMS COURSE IMPORT',
        '',
        '• Course code must be unique'
    ]
)


# ============================================================================
# LMS ENROLLMENT TEMPLATE
# ============================================================================
LMS_ENROLLMENT_TEMPLATE = ModuleTemplate(
    name='lms_enrollments',
    display_name='LMS Enrollments',
    description='Import LMS course enrollments',
    model_name='lms.CourseEnrollment',
    unique_field=None,
    fields=[
        FieldSpec(
            name='course_code',
            display_name='Course Code',
            field_type=FieldType.STRING,
            required=True,
            sample_value='MATH10-2024'
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='role',
            display_name='Role',
            field_type=FieldType.CHOICE,
            choices=['STUDENT', 'TEACHER'],
            sample_value='STUDENT'
        ),
        FieldSpec(
            name='enrollment_date',
            display_name='Enrollment Date',
            field_type=FieldType.DATE,
            sample_value='05-04-2024'
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['ACTIVE', 'INACTIVE'],
            sample_value='ACTIVE'
        ),
    ],
    instructions=[
        '📋 LMS ENROLLMENT IMPORT',
        '',
        '• Course must exist',
        '• Role: STUDENT or TEACHER'
    ]
)


# ============================================================================
# ID CARD TEMPLATE
# ============================================================================
IDCARD_TEMPLATE = ModuleTemplate(
    name='idcards',
    display_name='ID Cards',
    description='Import ID card issue data',
    model_name='idcards.IDCard',
    unique_field='card_number',
    fields=[
        FieldSpec(
            name='card_number',
            display_name='Card Number',
            field_type=FieldType.STRING,
            required=True,
            sample_value='ID/2024/001'
        ),
        FieldSpec(
            name='admission_number',
            display_name='Admission Number',
            field_type=FieldType.STRING,
            description='Student admission number',
            sample_value='STU2024001'
        ),
        FieldSpec(
            name='employee_id',
            display_name='Employee ID',
            field_type=FieldType.STRING,
            description='Staff employee id',
            sample_value='EMP001'
        ),
        FieldSpec(
            name='template_code',
            display_name='Template Code',
            field_type=FieldType.STRING,
            sample_value='STD_DEFAULT'
        ),
        FieldSpec(
            name='file_url',
            display_name='File URL',
            field_type=FieldType.STRING,
            description='Optional file URL for generated card',
            sample_value='https://example.com/idcards/ID-2024-001.pdf'
        ),
        FieldSpec(
            name='issued_date',
            display_name='Issued Date',
            field_type=FieldType.DATE,
            sample_value='01-06-2024'
        ),
        FieldSpec(
            name='expiry_date',
            display_name='Expiry Date',
            field_type=FieldType.DATE,
            sample_value='31-03-2025'
        ),
        FieldSpec(
            name='status',
            display_name='Status',
            field_type=FieldType.CHOICE,
            choices=['ACTIVE', 'INACTIVE'],
            sample_value='ACTIVE'
        ),
        FieldSpec(
            name='qr_code',
            display_name='QR Code',
            field_type=FieldType.STRING,
            sample_value='QR123456'
        ),
    ],
    instructions=[
        '📋 ID CARD IMPORT',
        '',
        '• Card number must be unique',
        '• Provide admission_number or employee_id'
    ]
)


# ============================================================================
# MASTER TEMPLATE REGISTRY
# ============================================================================
TEMPLATE_REGISTRY = {
    'students': STUDENT_TEMPLATE,
    'staff': STAFF_TEMPLATE,
    'classes': CLASS_SECTION_TEMPLATE,
    'subjects': SUBJECT_TEMPLATE,
    'fee_structures': FEE_STRUCTURE_TEMPLATE,
    'fee_invoices': FEE_INVOICE_TEMPLATE,
    'fee_payments': FEE_PAYMENT_TEMPLATE,
    'fee_allocations': FEE_ALLOCATION_TEMPLATE,
    'student_enrollments': STUDENT_ENROLLMENT_TEMPLATE,
    'transport': TRANSPORT_TEMPLATE,
    'parents': PARENT_TEMPLATE,
    'user_accounts': USER_ACCOUNT_TEMPLATE,
    'attendance': ATTENDANCE_TEMPLATE,
    'student_photos': STUDENT_PHOTO_TEMPLATE,
    'exam_results': EXAM_RESULT_TEMPLATE,
    'exam_schedule': EXAM_SCHEDULE_TEMPLATE,
    'timetable': TIMETABLE_TEMPLATE,
    'library_books': LIBRARY_BOOK_TEMPLATE,
    'library_transactions': LIBRARY_TRANSACTION_TEMPLATE,
    'payroll_payments': PAYROLL_PAYMENT_TEMPLATE,
    'hostel_allocations': HOSTEL_ALLOCATION_TEMPLATE,
    'inventory_items': INVENTORY_ITEM_TEMPLATE,
    'certificates_issued': CERTIFICATE_ISSUED_TEMPLATE,
    'finance_journal_entries': FINANCE_JOURNAL_TEMPLATE,
    'fee_discounts': FEE_DISCOUNT_TEMPLATE,
    'helpdesk_tickets': HELPDESK_TICKET_TEMPLATE,
    'lms_courses': LMS_COURSE_TEMPLATE,
    'lms_enrollments': LMS_ENROLLMENT_TEMPLATE,
    'idcards': IDCARD_TEMPLATE,
}


def get_template(module_name: str) -> Optional[ModuleTemplate]:
    """Get template for a module"""
    return TEMPLATE_REGISTRY.get(module_name)


def get_all_templates() -> Dict[str, ModuleTemplate]:
    """Get all available templates"""
    return TEMPLATE_REGISTRY


def get_template_info() -> List[Dict]:
    """Get summary info for all templates (for API)"""
    return [
        {
            'name': t.name,  # Module key used in API calls (e.g., 'students')
            'display_name': t.display_name,  # Human readable name (e.g., 'Students')
            'description': t.description,
            'unique_field': t.unique_field,
            'supported_formats': t.supported_formats,
            'required_field_count': len(t.get_required_fields()),
            'optional_field_count': len(t.get_optional_fields()),
        }
        for t in TEMPLATE_REGISTRY.values()
    ]

