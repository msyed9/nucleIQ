"""
Student admission number generation utilities
"""

from django.db import transaction
from datetime import datetime
from tenants.models import TenantSettings
from students.models import Student


def generate_admission_number(tenant, academic_year=None):
    """
    Generate admission number based on tenant settings.
    
    Args:
        tenant: Tenant instance
        academic_year: Optional academic year instance
        
    Returns:
        str: Generated admission number
        
    Available placeholders:
        {YEAR} - Current year (YYYY)
        {YY} - Short year (YY)
        {MONTH} - Current month (MM)
        {SEQUENCE} - Auto-incrementing sequence
        {SEQUENCE:04d} - Zero-padded sequence (e.g., 0001)
        {ACADYEAR} - Academic year (e.g., 2024-25)
        {PREFIX} - Admission number prefix from settings
    """
    
    settings = tenant.settings
    
    # Check if auto-generation is enabled
    if not settings.auto_generate_admission_number:
        return None
    
    # Get the format template
    format_template = settings.admission_number_format or 'ADM{YEAR}{SEQUENCE:04d}'
    
    # Increment sequence number atomically
    with transaction.atomic():
        settings.refresh_from_db()
        current_sequence = settings.admission_number_sequence
        settings.admission_number_sequence += 1
        settings.save(update_fields=['admission_number_sequence'])
    
    # Prepare replacement values
    now = datetime.now()
    replacements = {
        '{YEAR}': str(now.year),
        '{YY}': str(now.year)[2:],
        '{MONTH}': f'{now.month:02d}',
        '{PREFIX}': settings.admission_number_prefix or '',
    }
    
    # Handle academic year if provided
    if academic_year:
        start_year = str(academic_year.start_date.year)
        end_year = str(academic_year.end_date.year)[2:]
        replacements['{ACADYEAR}'] = f'{start_year}-{end_year}'
    
    # Build admission number
    admission_number = format_template
    
    # Replace simple placeholders first
    for placeholder, value in replacements.items():
        admission_number = admission_number.replace(placeholder, value)
    
    # Handle formatted sequence (e.g., {SEQUENCE:04d})
    import re
    sequence_pattern = r'\{SEQUENCE(?::(\d+)d)?\}'
    match = re.search(sequence_pattern, admission_number)
    
    if match:
        format_spec = match.group(1)
        if format_spec:
            # Zero-padded sequence
            sequence_str = f'{current_sequence:0{int(format_spec)}d}'
        else:
            # Plain sequence
            sequence_str = str(current_sequence)
        
        admission_number = re.sub(sequence_pattern, sequence_str, admission_number)
    
    return admission_number


def validate_admission_number_unique(admission_number, tenant, exclude_id=None):
    """
    Validate that admission number is unique within tenant.
    
    Args:
        admission_number: Admission number to validate
        tenant: Tenant instance
        exclude_id: Optional student ID to exclude (for updates)
        
    Returns:
        tuple: (is_valid, error_message)
    """
    if not admission_number:
        return False, "Admission number is required"
    
    # Check for duplicates
    query = Student.objects.filter(
        tenant=tenant,
        admission_number=admission_number
    )
    
    if exclude_id:
        query = query.exclude(id=exclude_id)
    
    if query.exists():
        existing_student = query.first()
        return False, f"Admission number '{admission_number}' already exists for {existing_student.get_full_name()}"
    
    return True, None


def get_next_admission_number_preview(tenant, academic_year=None):
    """
    Preview what the next admission number would be without incrementing the sequence.
    Automatically detects and skips existing admission numbers.
    
    Args:
        tenant: Tenant instance
        academic_year: Optional academic year instance
        
    Returns:
        str: Preview of next admission number or None if auto-generation is disabled
    """
    import re
    
    settings = tenant.settings
    
    if not settings.auto_generate_admission_number:
        return None
    
    format_template = settings.admission_number_format or 'ADM{YEAR}{SEQUENCE:04d}'
    current_sequence = settings.admission_number_sequence
    
    # Prepare replacement values
    now = datetime.now()
    replacements = {
        '{YEAR}': str(now.year),
        '{YY}': str(now.year)[2:],
        '{MONTH}': f'{now.month:02d}',
        '{PREFIX}': settings.admission_number_prefix or '',
    }
    
    if academic_year:
        start_year = str(academic_year.start_date.year)
        end_year = str(academic_year.end_date.year)[2:]
        replacements['{ACADYEAR}'] = f'{start_year}-{end_year}'
    
    sequence_pattern = r'\{SEQUENCE(?::(\d+)d)?\}'
    
    # Build admission number with given sequence
    def build_admission_number(seq):
        result = format_template
        for placeholder, value in replacements.items():
            result = result.replace(placeholder, value)
        
        match = re.search(sequence_pattern, result)
        if match:
            format_spec = match.group(1)
            if format_spec:
                sequence_str = f'{seq:0{int(format_spec)}d}'
            else:
                sequence_str = str(seq)
            result = re.sub(sequence_pattern, sequence_str, result)
        
        return result
    
    # Find the next available admission number (skip existing ones)
    test_sequence = current_sequence
    max_attempts = 100  # Prevent infinite loop
    
    for _ in range(max_attempts):
        candidate = build_admission_number(test_sequence)
        
        # Check if this admission number already exists
        if not Student.objects.filter(tenant=tenant, admission_number=candidate).exists():
            # Found an available admission number
            # Update the sequence if we had to skip some
            if test_sequence != current_sequence:
                settings.admission_number_sequence = test_sequence
                settings.save(update_fields=['admission_number_sequence'])
            return candidate
        
        test_sequence += 1
    
    # Fallback: return the last candidate even if it exists (will fail on save)
    return build_admission_number(test_sequence)

