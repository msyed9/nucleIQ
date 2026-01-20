"""
Enhanced Data Migration Views
Import, Export, Backup, and Migration functionality
Supports CSV, XLSX, and XLS file formats
"""

import io
import csv
import json
import zipfile
from datetime import datetime, date
from django.http import HttpResponse
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantAdmin

from .models import ImportJob, ImportFieldMapping
from .utils import (
    FileParser, DataTransformer, DataValidator,
    DateParser, PhoneValidator, EmailValidator,
    OPENPYXL_AVAILABLE, XLRD_AVAILABLE
)
from .templates import (
    get_template, get_all_templates, get_template_info,
    TEMPLATE_REGISTRY, FieldType
)

from students.models import Student, StudentEnrollment
from staff.models import Staff
from tenants.models import GradeLevel, Section, Subject, AcademicYear, Department
from fees.models import FeeCategory, FeeStructure, FeeAllocation
from attendance.models import AttendanceRecord
from transport.models import Route, Stop, StudentTransport

import logging
logger = logging.getLogger(__name__)

# Try to import openpyxl for Excel support
try:
    import openpyxl
    from openpyxl import Workbook
    from openpyxl.styles import Font, PatternFill, Border, Side, Alignment
    import openpyxl.utils
except ImportError:
    pass


class ModuleListView(APIView):
    """List all available import modules with their specifications"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request):
        """Get list of all importable modules"""
        modules = get_template_info()
        
        # Add format availability info
        formats_available = {
            'csv': True,
            'xlsx': OPENPYXL_AVAILABLE,
            'xls': XLRD_AVAILABLE,
        }
        
        return Response({
            'modules': modules,
            'supported_formats': formats_available,
            'max_file_size_mb': 10,
        })


class ModuleFieldsView(APIView):
    """Get detailed field information for a specific module"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request, module):
        """Get field specifications for a module"""
        template = get_template(module)
        
        if not template:
            return Response(
                {'error': f'Unknown module: {module}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response(template.to_dict())


class DownloadTemplateView(APIView):
    """Download Excel/CSV template for a specific module"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request, module):
        format_type = request.query_params.get('format', 'xlsx')
        
        template = get_template(module)
        if not template:
            return Response(
                {'error': f'Invalid module: {module}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if format_type == 'xlsx':
            if not OPENPYXL_AVAILABLE:
                return Response(
                    {'error': 'Excel support not available. Please download CSV.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return self._generate_excel_template(module, template)
        else:
            return self._generate_csv_template(module, template)
    
    def _generate_excel_template(self, module, template):
        """Generate Excel template with formatting and instructions"""
        wb = Workbook()
        ws = wb.active
        ws.title = template.display_name
        
        # Header styling
        required_font = Font(bold=True, color='FFFFFF')
        optional_font = Font(bold=True, color='FFFFFF')
        required_fill = PatternFill(start_color='2563EB', end_color='2563EB', fill_type='solid')  # Blue
        optional_fill = PatternFill(start_color='6B7280', end_color='6B7280', fill_type='solid')  # Gray
        thin_border = Border(
            left=Side(style='thin'),
            right=Side(style='thin'),
            top=Side(style='thin'),
            bottom=Side(style='thin')
        )
        center_alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        
        # Write headers
        all_fields = template.fields
        for col, field_spec in enumerate(all_fields, 1):
            cell = ws.cell(row=1, column=col, value=field_spec.display_name)
            cell.font = required_font if field_spec.required else optional_font
            cell.fill = required_fill if field_spec.required else optional_fill
            cell.border = thin_border
            cell.alignment = center_alignment
            
            # Set column width based on content
            col_letter = openpyxl.utils.get_column_letter(col)
            ws.column_dimensions[col_letter].width = max(15, len(field_spec.display_name) + 2)
        
        # Write sample data row
        for col, field_spec in enumerate(all_fields, 1):
            cell = ws.cell(row=2, column=col, value=field_spec.sample_value)
            cell.border = thin_border
        
        # Add field name row (actual column names for import)
        for col, field_spec in enumerate(all_fields, 1):
            cell = ws.cell(row=3, column=col, value=field_spec.name)
            cell.font = Font(italic=True, color='888888')
        
        # Create Instructions sheet
        instructions_ws = wb.create_sheet('Instructions')
        
        row = 1
        for instruction in template.instructions:
            instructions_ws.cell(row=row, column=1, value=instruction)
            if instruction.startswith('📋') or instruction.startswith('💡') or instruction.startswith('⚠️'):
                instructions_ws.cell(row=row, column=1).font = Font(bold=True, size=12)
            row += 1
        
        row += 1
        instructions_ws.cell(row=row, column=1, value='📝 FIELD SPECIFICATIONS:')
        instructions_ws.cell(row=row, column=1).font = Font(bold=True, size=12)
        row += 2
        
        # Field specification table
        headers = ['Field Name', 'Type', 'Required', 'Max Length', 'Description', 'Sample']
        for col, header in enumerate(headers, 1):
            cell = instructions_ws.cell(row=row, column=col, value=header)
            cell.font = Font(bold=True)
            cell.fill = PatternFill(start_color='E5E7EB', fill_type='solid')
        row += 1
        
        for field_spec in all_fields:
            instructions_ws.cell(row=row, column=1, value=field_spec.name)
            instructions_ws.cell(row=row, column=2, value=field_spec.field_type.value)
            instructions_ws.cell(row=row, column=3, value='Yes' if field_spec.required else 'No')
            instructions_ws.cell(row=row, column=4, value=field_spec.max_length or '-')
            instructions_ws.cell(row=row, column=5, value=field_spec.description)
            instructions_ws.cell(row=row, column=6, value=field_spec.sample_value)
            row += 1
        
        # Adjust column widths
        instructions_ws.column_dimensions['A'].width = 25
        instructions_ws.column_dimensions['B'].width = 12
        instructions_ws.column_dimensions['C'].width = 10
        instructions_ws.column_dimensions['D'].width = 12
        instructions_ws.column_dimensions['E'].width = 50
        instructions_ws.column_dimensions['F'].width = 20
        
        # Return response
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{module}_import_template.xlsx"'
        wb.save(response)
        return response
    
    def _generate_csv_template(self, module, template):
        """Generate CSV template"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{module}_import_template.csv"'
        
        # Add BOM for Excel compatibility
        response.write('\ufeff')
        
        writer = csv.writer(response)
        
        # Write display names as header
        headers = [f.display_name for f in template.fields]
        writer.writerow(headers)
        
        # Write actual field names (for reference)
        field_names = [f.name for f in template.fields]
        writer.writerow(field_names)
        
        # Write sample data
        sample_data = [f.sample_value for f in template.fields]
        writer.writerow(sample_data)
        
        return response


class ValidateDataView(APIView):
    """Validate uploaded file without importing"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Validate file and return preview with any errors"""
        module = request.data.get('module')
        file = request.FILES.get('file')
        
        template = get_template(module)
        if not template:
            return Response(
                {'error': f'Invalid module: {module}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Parse file
            data, _, file_type = FileParser.parse(file, file.name)
            
            if not data:
                return Response({
                    'valid': False,
                    'error': 'No data found in file',
                    'total_rows': 0
                })
            
            # Validate data
            validation_result = self._validate_data(module, template, data, request.user.tenant)
            
            return Response(validation_result)
            
        except Exception as e:
            logger.exception(f"Validation error: {e}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _validate_data(self, module, template, data, tenant):
        """Validate all rows in the data"""
        errors = []
        warnings = []
        duplicates = []
        preview_rows = []
        
        # Get unique field for duplicate detection
        unique_field = template.unique_field
        
        # Get transformer based on module
        transformer = self._get_transformer(module)
        
        for idx, row in enumerate(data, start=2):
            row_num = row.get('_row_number', idx)
            
            # Transform the row
            transformed = transformer(row) if transformer else row
            
            # Validate
            row_errors = self._validate_row(module, transformed, row_num)
            errors.extend(row_errors)
            
            # Check for duplicates
            if unique_field and transformed.get(unique_field):
                existing = self._check_duplicate(module, unique_field, transformed[unique_field], tenant)
                if existing:
                    duplicates.append({
                        'row': row_num,
                        'field': unique_field,
                        'value': transformed[unique_field],
                        'existing_id': existing.id if hasattr(existing, 'id') else None
                    })
            
            # Add to preview (first 10 rows)
            if idx <= 11:  # First 10 data rows
                preview_rows.append({
                    'row_number': row_num,
                    'data': {k: str(v) if v else '' for k, v in transformed.items() if not k.startswith('_')},
                    'has_errors': len(row_errors) > 0
                })
        
        return {
            'valid': len(errors) == 0,
            'total_rows': len(data),
            'error_count': len(errors),
            'duplicate_count': len(duplicates),
            'warning_count': len(warnings),
            'errors': errors[:50],  # Limit errors returned
            'warnings': warnings[:20],
            'duplicates': duplicates[:20],
            'preview': preview_rows,
        }
    
    def _get_transformer(self, module):
        """Get the appropriate data transformer for a module"""
        transformers = {
            'students': DataTransformer.transform_student,
            'staff': DataTransformer.transform_staff,
            'classes': DataTransformer.transform_class_section,
        }
        return transformers.get(module)
    
    def _validate_row(self, module, data, row_num):
        """Validate a single row"""
        validators = {
            'students': DataValidator.validate_student,
            'staff': DataValidator.validate_staff,
            'classes': DataValidator.validate_class_section,
        }
        
        validator = validators.get(module)
        if validator:
            return validator(data, row_num)
        return []
    
    def _check_duplicate(self, module, field, value, tenant):
        """Check if a record with the same unique field exists"""
        models = {
            'students': Student,
            'staff': Staff,
            'subjects': Subject,
        }
        
        model = models.get(module)
        if model:
            try:
                filter_kwargs = {field: value, 'tenant': tenant, 'is_deleted': False}
                return model.objects.filter(**filter_kwargs).first()
            except:
                return None
        return None


class ImportDataView(APIView):
    """Import data from CSV/XLSX/XLS file"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Import data from uploaded file"""
        module = request.data.get('module')
        file = request.FILES.get('file')
        skip_duplicates = request.data.get('skip_duplicates', 'true') == 'true'
        update_existing = request.data.get('update_existing', 'false') == 'true'
        
        template = get_template(module)
        if not template:
            return Response(
                {'error': f'Invalid module: {module}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = request.user.tenant
        
        # Create import job for tracking
        import_job = ImportJob.objects.create(
            tenant=tenant,
            module=module,
            status='VALIDATING',
            original_filename=file.name,
            file_type=file.name.split('.')[-1].lower(),
            skip_duplicates=skip_duplicates,
            update_existing=update_existing,
            created_by=request.user
        )
        
        try:
            # Parse file
            data, _, file_type = FileParser.parse(file, file.name)
            import_job.total_rows = len(data)
            import_job.save()
            
            if not data:
                import_job.status = 'FAILED'
                import_job.validation_errors = ['No data found in file']
                import_job.save()
                return Response({
                    'success': False,
                    'error': 'No data found in file',
                    'job_id': str(import_job.id)
                })
            
            # Process import
            import_job.status = 'IMPORTING'
            import_job.save()
            
            result = self._process_import(
                module, template, data, tenant, 
                skip_duplicates, update_existing, import_job
            )
            
            # Update job status
            import_job.status = 'COMPLETED' if result['failed'] == 0 else 'COMPLETED'
            import_job.successful_rows = result['success']
            import_job.failed_rows = result['failed']
            import_job.duplicate_rows = result['duplicates_skipped']
            import_job.validation_errors = result['errors'][:100]
            import_job.completed_at = timezone.now()
            import_job.save()
            
            return Response({
                'success': True,
                'job_id': str(import_job.id),
                **result
            })
            
        except Exception as e:
            logger.exception(f"Import error: {e}")
            import_job.status = 'FAILED'
            import_job.validation_errors = [str(e)]
            import_job.save()
            
            return Response(
                {'error': str(e), 'job_id': str(import_job.id)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @transaction.atomic
    def _process_import(self, module, template, data, tenant, skip_duplicates, update_existing, import_job):
        """Process the import with transaction management"""
        success = 0
        failed = 0
        duplicates_skipped = 0
        updated = 0
        errors = []
        created_ids = []
        
        transformer = self._get_transformer(module)
        unique_field = template.unique_field
        
        for idx, row in enumerate(data):
            row_num = row.get('_row_number', idx + 2)
            
            try:
                # Transform the row
                transformed = transformer(row) if transformer else row
                
                # Check for duplicates
                existing = None
                if unique_field and transformed.get(unique_field):
                    existing = self._find_existing(module, unique_field, transformed[unique_field], tenant)
                
                if existing:
                    if update_existing:
                        self._update_record(module, existing, transformed, tenant)
                        updated += 1
                    elif skip_duplicates:
                        duplicates_skipped += 1
                        continue
                    else:
                        errors.append(f'Row {row_num}: Duplicate {unique_field}: {transformed[unique_field]}')
                        failed += 1
                        continue
                else:
                    # Create new record
                    record = self._create_record(module, transformed, tenant)
                    if record:
                        created_ids.append(str(record.id))
                        success += 1
                    else:
                        failed += 1
                        errors.append(f'Row {row_num}: Failed to create record')
                
                # Update progress
                import_job.processed_rows = idx + 1
                if (idx + 1) % 50 == 0:  # Save every 50 rows
                    import_job.save()
                    
            except Exception as e:
                failed += 1
                errors.append(f'Row {row_num}: {str(e)}')
                logger.warning(f"Error importing row {row_num}: {e}")
        
        # Store created IDs for potential rollback
        import_job.created_record_ids = created_ids
        
        return {
            'success': success,
            'failed': failed,
            'updated': updated,
            'duplicates_skipped': duplicates_skipped,
            'total': len(data),
            'errors': errors[:50]
        }
    
    def _get_transformer(self, module):
        """Get data transformer for module"""
        return {
            'students': DataTransformer.transform_student,
            'staff': DataTransformer.transform_staff,
            'classes': DataTransformer.transform_class_section,
        }.get(module, lambda x: x)
    
    def _find_existing(self, module, field, value, tenant):
        """Find existing record by unique field"""
        models = {
            'students': Student,
            'staff': Staff,
            'subjects': Subject,
        }
        model = models.get(module)
        if model:
            try:
                return model.objects.filter(tenant=tenant, **{field: value}, is_deleted=False).first()
            except:
                pass
        return None
    
    def _create_record(self, module, data, tenant):
        """Create a new record based on module type"""
        creators = {
            'students': self._create_student,
            'staff': self._create_staff,
            'classes': self._create_class_section,
            'subjects': self._create_subject,
            'fee_structures': self._create_fee_structure,
            'student_enrollments': self._create_enrollment,
            'parents': self._update_parent,
            'attendance': self._create_attendance,
            'transport': self._create_transport,
        }
        
        creator = creators.get(module)
        if creator:
            return creator(data, tenant)
        return None
    
    def _update_record(self, module, existing, data, tenant):
        """Update an existing record"""
        updaters = {
            'students': self._update_student,
            'staff': self._update_staff,
            'parents': self._update_parent,
        }
        
        updater = updaters.get(module)
        if updater:
            return updater(existing, data, tenant)
        return None
    
    # ========================================
    # RECORD CREATION METHODS
    # ========================================
    
    def _create_student(self, data, tenant):
        """Create a new student record"""
        student = Student.objects.create(
            tenant=tenant,
            admission_number=data.get('admission_number'),
            first_name=data.get('first_name', ''),
            middle_name=data.get('middle_name', ''),
            last_name=data.get('last_name', ''),
            date_of_birth=data.get('date_of_birth'),
            gender=data.get('gender', 'M'),
            blood_group=data.get('blood_group', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            father_name=data.get('father_name', ''),
            father_phone=data.get('father_phone', ''),
            father_email=data.get('father_email', ''),
            father_occupation=data.get('father_occupation', ''),
            mother_name=data.get('mother_name', ''),
            mother_phone=data.get('mother_phone', ''),
            mother_email=data.get('mother_email', ''),
            mother_occupation=data.get('mother_occupation', ''),
            guardian_name=data.get('guardian_name', ''),
            guardian_phone=data.get('guardian_phone', ''),
            guardian_relation=data.get('guardian_relation', ''),
            aadhar_number=data.get('aadhar_number', ''),
            pen_number=data.get('pen_number', ''),
            nationality=data.get('nationality', 'Indian'),
            religion=data.get('religion', ''),
            caste=data.get('caste', ''),
            admission_date=data.get('admission_date', date.today()),
            previous_school_name=data.get('previous_school_name', ''),
            transfer_certificate_number=data.get('transfer_certificate_number', ''),
            notes=data.get('notes', ''),
            is_active=True
        )
        
        # Create enrollment if class/section provided
        class_name = data.get('class_name')
        section_name = data.get('section_name')
        
        if class_name:
            self._create_student_enrollment(student, class_name, section_name, data, tenant)
        
        return student
    
    def _create_student_enrollment(self, student, class_name, section_name, data, tenant):
        """Create student enrollment in class/section"""
        try:
            grade_level = GradeLevel.objects.filter(
                tenant=tenant, 
                name__iexact=class_name.strip(),
                is_deleted=False
            ).first()
            
            if not grade_level:
                return None
            
            section = None
            if section_name:
                section = Section.objects.filter(
                    tenant=tenant,
                    grade_level=grade_level,
                    name__iexact=section_name.strip(),
                    is_deleted=False
                ).first()
            
            if not section:
                # Get first section of the grade if not specified
                section = Section.objects.filter(
                    tenant=tenant,
                    grade_level=grade_level,
                    is_deleted=False
                ).first()
            
            if section:
                academic_year = AcademicYear.objects.filter(
                    tenant=tenant,
                    is_active=True,
                    is_deleted=False
                ).first()
                
                if academic_year:
                    enrollment, created = StudentEnrollment.objects.get_or_create(
                        tenant=tenant,
                        student=student,
                        academic_year=academic_year,
                        defaults={
                            'section': section,
                            'roll_number': data.get('roll_number', ''),
                            'status': 'ACTIVE',
                            'enrollment_date': data.get('admission_date', date.today())
                        }
                    )
                    return enrollment
        except Exception as e:
            logger.warning(f"Failed to create enrollment: {e}")
        
        return None
    
    def _update_student(self, student, data, tenant):
        """Update existing student record"""
        update_fields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth', 'gender',
            'blood_group', 'email', 'phone', 'address', 'father_name', 'father_phone',
            'father_email', 'father_occupation', 'mother_name', 'mother_phone',
            'mother_email', 'mother_occupation', 'guardian_name', 'guardian_phone',
            'guardian_relation', 'aadhar_number', 'pen_number', 'nationality',
            'religion', 'caste', 'notes'
        ]
        
        for field in update_fields:
            if field in data and data[field]:
                setattr(student, field, data[field])
        
        student.save()
        return student
    
    def _create_staff(self, data, tenant):
        """Create a new staff record"""
        # Map gender from import format to model format
        gender = data.get('gender', '')
        if gender == 'M':
            gender = 'MALE'
        elif gender == 'F':
            gender = 'FEMALE'
        elif gender == 'O':
            gender = 'OTHER'
        
        staff = Staff.objects.create(
            tenant=tenant,
            employee_id=data.get('employee_id'),
            first_name=data.get('first_name', ''),
            middle_name=data.get('middle_name', ''),
            last_name=data.get('last_name', ''),
            date_of_birth=data.get('date_of_birth'),
            gender=gender,
            blood_group=data.get('blood_group', ''),
            email=data.get('email', ''),
            phone=data.get('phone', ''),
            alternate_phone=data.get('alternate_phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            postal_code=data.get('postal_code', ''),
            joining_date=data.get('joining_date') or date.today(),
            designation=data.get('designation', 'TEACHER'),
            employment_type=data.get('employment_type', 'PERMANENT'),
            aadhar_number=data.get('aadhar_number', ''),
            pan_number=data.get('pan_number', ''),
            salary=data.get('salary'),
            bank_account_number=data.get('bank_account_number', ''),
            bank_name=data.get('bank_name', ''),
            bank_ifsc=data.get('bank_ifsc', ''),
            emergency_contact_name=data.get('emergency_contact_name', ''),
            emergency_contact_phone=data.get('emergency_contact_phone', ''),
            experience_years=data.get('experience_years', 0),
            status='ACTIVE'
        )
        
        # Link to department if provided
        if data.get('department'):
            dept = Department.objects.filter(
                tenant=tenant,
                name__iexact=data['department'].strip(),
                is_deleted=False
            ).first()
            if dept:
                staff.department = dept
                staff.save()
        
        return staff
    
    def _update_staff(self, staff, data, tenant):
        """Update existing staff record"""
        update_fields = [
            'first_name', 'middle_name', 'last_name', 'date_of_birth', 'email',
            'phone', 'alternate_phone', 'address', 'city', 'state', 'postal_code',
            'designation', 'employment_type', 'aadhar_number', 'pan_number',
            'bank_account_number', 'bank_name', 'bank_ifsc',
            'emergency_contact_name', 'emergency_contact_phone'
        ]
        
        for field in update_fields:
            if field in data and data[field]:
                setattr(staff, field, data[field])
        
        staff.save()
        return staff
    
    def _create_class_section(self, data, tenant):
        """Create class and section"""
        class_name = data.get('class_name', '').strip()
        section_name = data.get('section_name', '').strip()
        
        if not class_name or not section_name:
            return None
        
        # Get or create grade level
        grade_level, created = GradeLevel.objects.get_or_create(
            tenant=tenant,
            name__iexact=class_name,
            defaults={
                'name': class_name,
                'short_name': class_name.replace('Class ', '').replace('Grade ', ''),
                'display_order': 0,
                'is_active': True
            }
        )
        
        # Create section
        section, created = Section.objects.get_or_create(
            tenant=tenant,
            grade_level=grade_level,
            name__iexact=section_name,
            defaults={
                'name': section_name,
                'room_number': data.get('room_number', ''),
                'capacity': data.get('capacity', 40),
                'is_active': True
            }
        )
        
        return section
    
    def _create_subject(self, data, tenant):
        """Create subject"""
        subject = Subject.objects.create(
            tenant=tenant,
            name=data.get('subject_name', ''),
            code=data.get('subject_code', ''),
            description=data.get('description', ''),
            is_active=True
        )
        return subject
    
    def _create_fee_structure(self, data, tenant):
        """Create fee structure"""
        fee_type_name = data.get('fee_type', '').strip()
        class_name = data.get('class_name', '').strip()
        
        # Get or create fee category
        category, _ = FeeCategory.objects.get_or_create(
            tenant=tenant,
            name__iexact=fee_type_name,
            defaults={
                'name': fee_type_name,
                'code': fee_type_name[:10].upper().replace(' ', '_'),
                'is_active': True
            }
        )
        
        # Get academic year
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        ).first()
        
        if not academic_year:
            raise ValueError("No active academic year found")
        
        # Create fee structure
        fee_structure = FeeStructure.objects.create(
            tenant=tenant,
            academic_year=academic_year,
            category=category,
            class_level=class_name,
            amount=data.get('amount', 0),
            frequency=data.get('frequency', 'MONTHLY'),
            due_day=data.get('due_day', 10),
            is_mandatory=data.get('is_mandatory', 'true').lower() == 'true' if isinstance(data.get('is_mandatory'), str) else True,
            is_active=True
        )
        
        return fee_structure
    
    def _create_enrollment(self, data, tenant):
        """Create student enrollment"""
        admission_number = data.get('admission_number', '').strip()
        
        student = Student.objects.filter(
            tenant=tenant,
            admission_number=admission_number,
            is_deleted=False
        ).first()
        
        if not student:
            raise ValueError(f"Student not found: {admission_number}")
        
        return self._create_student_enrollment(
            student, 
            data.get('class_name'), 
            data.get('section_name'),
            data,
            tenant
        )
    
    def _update_parent(self, data_or_student, data_or_tenant, tenant=None):
        """Update parent information for existing student"""
        # Handle both update scenarios
        if isinstance(data_or_student, Student):
            student = data_or_student
            data = data_or_tenant
        else:
            data = data_or_student
            tenant = data_or_tenant
            admission_number = data.get('admission_number', '').strip()
            
            student = Student.objects.filter(
                tenant=tenant,
                admission_number=admission_number,
                is_deleted=False
            ).first()
            
            if not student:
                raise ValueError(f"Student not found: {admission_number}")
        
        # Update parent fields
        parent_fields = [
            'father_name', 'father_phone', 'father_email', 'father_occupation',
            'mother_name', 'mother_phone', 'mother_email', 'mother_occupation',
            'guardian_name', 'guardian_phone', 'guardian_relation'
        ]
        
        for field in parent_fields:
            if field in data and data[field]:
                setattr(student, field, data[field])
        
        student.save()
        return student
    
    def _create_attendance(self, data, tenant):
        """Create attendance record"""
        admission_number = data.get('admission_number', '').strip()
        
        student = Student.objects.filter(
            tenant=tenant,
            admission_number=admission_number,
            is_deleted=False
        ).first()
        
        if not student:
            raise ValueError(f"Student not found: {admission_number}")
        
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True,
            is_deleted=False
        ).first()
        
        attendance_date = DateParser.parse(data.get('date'))
        if not attendance_date:
            raise ValueError("Invalid date")
        
        record, created = AttendanceRecord.objects.get_or_create(
            tenant=tenant,
            student=student,
            date=attendance_date,
            defaults={
                'academic_year': academic_year,
                'record_type': 'STUDENT',
                'status': data.get('status', 'PRESENT'),
                'remarks': data.get('remarks', ''),
                'marking_method': 'MANUAL',
            }
        )
        
        return record
    
    def _create_transport(self, data, tenant):
        """Create transport allocation"""
        admission_number = data.get('admission_number', '').strip()
        route_name = data.get('route_name', '').strip()
        stop_name = data.get('stop_name', '').strip()
        
        student = Student.objects.filter(
            tenant=tenant,
            admission_number=admission_number,
            is_deleted=False
        ).first()
        
        if not student:
            raise ValueError(f"Student not found: {admission_number}")
        
        route = Route.objects.filter(
            tenant=tenant,
            name__iexact=route_name,
            is_deleted=False
        ).first()
        
        if not route:
            raise ValueError(f"Route not found: {route_name}")
        
        stop = Stop.objects.filter(
            tenant=tenant,
            route=route,
            name__iexact=stop_name,
            is_deleted=False
        ).first()
        
        if not stop:
            raise ValueError(f"Stop not found: {stop_name}")
        
        transport, created = StudentTransport.objects.update_or_create(
            tenant=tenant,
            student=student,
            defaults={
                'stop': stop,
                'is_active': True,
                'start_date': DateParser.parse(data.get('start_date'), date.today())
            }
        )
        
        return transport


class ImportJobStatusView(APIView):
    """Check status of an import job"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request, job_id):
        """Get import job status"""
        try:
            job = ImportJob.objects.get(
                id=job_id,
                tenant=request.user.tenant
            )
            
            return Response({
                'id': str(job.id),
                'module': job.module,
                'status': job.status,
                'total_rows': job.total_rows,
                'processed_rows': job.processed_rows,
                'successful_rows': job.successful_rows,
                'failed_rows': job.failed_rows,
                'duplicate_rows': job.duplicate_rows,
                'errors': job.validation_errors[:20],
                'created_at': job.created_at.isoformat(),
                'completed_at': job.completed_at.isoformat() if job.completed_at else None,
            })
        except ImportJob.DoesNotExist:
            return Response(
                {'error': 'Import job not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class ImportJobHistoryView(APIView):
    """List recent import jobs"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request):
        """Get import job history"""
        jobs = ImportJob.objects.filter(
            tenant=request.user.tenant
        ).order_by('-created_at')[:50]
        
        return Response({
            'jobs': [
                {
                    'id': str(job.id),
                    'module': job.module,
                    'status': job.status,
                    'filename': job.original_filename,
                    'total_rows': job.total_rows,
                    'successful_rows': job.successful_rows,
                    'failed_rows': job.failed_rows,
                    'created_at': job.created_at.isoformat(),
                    'created_by': job.created_by.email if job.created_by else None,
                }
                for job in jobs
            ]
        })


class RollbackImportView(APIView):
    """Rollback a completed import"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def post(self, request, job_id):
        """Rollback an import job"""
        try:
            job = ImportJob.objects.get(
                id=job_id,
                tenant=request.user.tenant,
                status='COMPLETED'
            )
            
            if not job.created_record_ids:
                return Response({
                    'success': False,
                    'error': 'No records to rollback'
                })
            
            # Get the model for this module
            models_map = {
                'students': Student,
                'staff': Staff,
                'classes': Section,
                'subjects': Subject,
            }
            
            model = models_map.get(job.module)
            if not model:
                return Response({
                    'success': False,
                    'error': 'Rollback not supported for this module'
                })
            
            # Delete created records
            deleted_count = model.objects.filter(
                id__in=job.created_record_ids,
                tenant=request.user.tenant
            ).delete()[0]
            
            job.status = 'ROLLED_BACK'
            job.save()
            
            return Response({
                'success': True,
                'deleted_count': deleted_count
            })
            
        except ImportJob.DoesNotExist:
            return Response(
                {'error': 'Import job not found or cannot be rolled back'},
                status=status.HTTP_404_NOT_FOUND
            )


class ExportDataView(APIView):
    """Export data to Excel/CSV"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request, module):
        """Export module data"""
        format_type = request.query_params.get('format', 'xlsx')
        
        template = get_template(module)
        if not template:
            return Response(
                {'error': f'Invalid module: {module}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = request.user.tenant
        
        # Get data based on module
        data = self._get_export_data(module, tenant)
        
        if format_type == 'xlsx' and OPENPYXL_AVAILABLE:
            return self._export_xlsx(module, template, data)
        else:
            return self._export_csv(module, template, data)
    
    def _get_export_data(self, module, tenant):
        """Get data for export"""
        if module == 'students':
            students = Student.objects.filter(tenant=tenant, is_deleted=False)
            return [self._student_to_dict(s) for s in students]
        elif module == 'staff':
            staff = Staff.objects.filter(tenant=tenant, is_deleted=False)
            return [self._staff_to_dict(s) for s in staff]
        elif module == 'classes':
            sections = Section.objects.filter(tenant=tenant, is_deleted=False)
            return [self._section_to_dict(s) for s in sections]
        return []
    
    def _student_to_dict(self, student):
        """Convert student to dictionary for export"""
        enrollment = student.enrollments.filter(status='ACTIVE').first()
        
        return {
            'admission_number': student.admission_number,
            'first_name': student.first_name,
            'middle_name': student.middle_name,
            'last_name': student.last_name,
            'date_of_birth': DateParser.format_for_display(student.date_of_birth) if student.date_of_birth else '',
            'gender': student.gender,
            'blood_group': student.blood_group,
            'email': student.email,
            'phone': student.phone,
            'address': student.address,
            'father_name': student.father_name,
            'father_phone': student.father_phone,
            'father_email': student.father_email,
            'mother_name': student.mother_name,
            'mother_phone': student.mother_phone,
            'mother_email': student.mother_email,
            'aadhar_number': student.aadhar_number,
            'class_name': enrollment.section.grade_level.name if enrollment and enrollment.section else '',
            'section_name': enrollment.section.name if enrollment and enrollment.section else '',
            'roll_number': enrollment.roll_number if enrollment else '',
        }
    
    def _staff_to_dict(self, staff):
        """Convert staff to dictionary for export"""
        return {
            'employee_id': staff.employee_id,
            'first_name': staff.first_name,
            'middle_name': staff.middle_name,
            'last_name': staff.last_name,
            'date_of_birth': DateParser.format_for_display(staff.date_of_birth) if staff.date_of_birth else '',
            'gender': staff.gender,
            'email': staff.email,
            'phone': staff.phone,
            'designation': staff.designation,
            'department': staff.department.name if staff.department else '',
            'joining_date': DateParser.format_for_display(staff.joining_date) if staff.joining_date else '',
        }
    
    def _section_to_dict(self, section):
        """Convert section to dictionary for export"""
        return {
            'class_name': section.grade_level.name,
            'section_name': section.name,
            'room_number': section.room_number,
            'capacity': section.capacity,
        }
    
    def _export_xlsx(self, module, template, data):
        """Export to Excel"""
        wb = Workbook()
        ws = wb.active
        ws.title = template.display_name
        
        # Headers
        field_names = [f.name for f in template.fields]
        headers = [f.display_name for f in template.fields]
        
        header_font = Font(bold=True)
        header_fill = PatternFill(start_color='E5E7EB', fill_type='solid')
        
        for col, header in enumerate(headers, 1):
            cell = ws.cell(row=1, column=col, value=header)
            cell.font = header_font
            cell.fill = header_fill
        
        # Data rows
        for row_num, row_data in enumerate(data, 2):
            for col, field_name in enumerate(field_names, 1):
                value = row_data.get(field_name, '')
                ws.cell(row=row_num, column=col, value=value)
        
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{module}_export_{datetime.now().strftime("%Y%m%d")}.xlsx"'
        wb.save(response)
        return response
    
    def _export_csv(self, module, template, data):
        """Export to CSV"""
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="{module}_export_{datetime.now().strftime("%Y%m%d")}.csv"'
        
        response.write('\ufeff')  # BOM for Excel
        
        writer = csv.writer(response)
        
        field_names = [f.name for f in template.fields]
        headers = [f.display_name for f in template.fields]
        
        writer.writerow(headers)
        
        for row_data in data:
            row = [row_data.get(f, '') for f in field_names]
            writer.writerow(row)
        
        return response


class FullBackupView(APIView):
    """Create full backup of all tenant data"""
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def get(self, request):
        """Create and download full backup"""
        tenant = request.user.tenant
        
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for module_name, template in TEMPLATE_REGISTRY.items():
                try:
                    # Get export view's data method
                    export_view = ExportDataView()
                    data = export_view._get_export_data(module_name, tenant)
                    
                    if not data:
                        continue
                    
                    # Create CSV
                    csv_buffer = io.StringIO()
                    writer = csv.DictWriter(csv_buffer, fieldnames=[f.name for f in template.fields])
                    writer.writeheader()
                    
                    for row in data:
                        writer.writerow({k: v for k, v in row.items() if k in [f.name for f in template.fields]})
                    
                    zip_file.writestr(f'{module_name}.csv', csv_buffer.getvalue())
                    
                except Exception as e:
                    logger.warning(f"Error exporting {module_name}: {e}")
            
            # Add metadata
            metadata = {
                'tenant_id': str(tenant.id),
                'tenant_name': tenant.name,
                'backup_date': datetime.now().isoformat(),
                'modules': list(TEMPLATE_REGISTRY.keys()),
            }
            zip_file.writestr('backup_metadata.json', json.dumps(metadata, indent=2))
        
        zip_buffer.seek(0)
        
        response = HttpResponse(zip_buffer.read(), content_type='application/zip')
        response['Content-Disposition'] = f'attachment; filename="school_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.zip"'
        return response
