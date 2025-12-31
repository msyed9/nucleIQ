"""
Utility functions for Academic Year management
Global context and helper functions
"""

from django.core.cache import cache
from .models import AcademicYear, AcademicTerm
from datetime import date, timedelta


def get_current_academic_year(tenant):
    """
    Get the current academic year for a tenant.
    
    Uses caching for performance.
    
    Args:
        tenant: Tenant instance
    
    Returns:
        AcademicYear instance or None
    """
    cache_key = f'current_academic_year_{tenant.id}'
    
    # Try to get from cache
    academic_year = cache.get(cache_key)
    
    if academic_year is None:
        # Get from database
        academic_year = AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True
        ).first()
        
        # Cache for 1 hour
        if academic_year:
            cache.set(cache_key, academic_year, 3600)
    
    return academic_year


def get_academic_year_by_id(tenant, year_id):
    """
    Get a specific academic year by ID.
    
    Args:
        tenant: Tenant instance
        year_id: Academic year ID
    
    Returns:
        AcademicYear instance or None
    """
    try:
        return AcademicYear.objects.get(
            tenant=tenant,
            id=year_id
        )
    except AcademicYear.DoesNotExist:
        return None


def get_or_current_academic_year(tenant, year_id=None):
    """
    Get academic year by ID or return current if not specified.
    
    Useful for views that support ?year_id=... parameter.
    
    Args:
        tenant: Tenant instance
        year_id: Optional academic year ID
    
    Returns:
        AcademicYear instance or None
    """
    if year_id:
        return get_academic_year_by_id(tenant, year_id)
    return get_current_academic_year(tenant)


def get_current_academic_term(tenant, academic_year=None):
    """
    Get the current academic term.
    
    Args:
        tenant: Tenant instance
        academic_year: Optional AcademicYear instance (defaults to current year)
    
    Returns:
        AcademicTerm instance or None
    """
    if not academic_year:
        academic_year = get_current_academic_year(tenant)
    
    if not academic_year:
        return None
    
    cache_key = f'current_academic_term_{academic_year.id}'
    
    # Try to get from cache
    term = cache.get(cache_key)
    
    if term is None:
        # Get from database
        term = AcademicTerm.objects.filter(
            academic_year=academic_year,
            is_active=True
        ).first()
        
        # Cache for 1 hour
        if term:
            cache.set(cache_key, term, 3600)
    
    return term


def get_all_academic_years(tenant):
    """
    Get all academic years for a tenant.
    
    Args:
        tenant: Tenant instance
    
    Returns:
        QuerySet of AcademicYear instances
    """
    return AcademicYear.objects.filter(tenant=tenant).order_by('-start_date')


def get_active_academic_year_by_date(tenant):
    """
    Get the currently active academic year based on today's date.
    
    This is different from is_active flag - it checks actual dates.
    
    Args:
        tenant: Tenant instance
    
    Returns:
        AcademicYear instance or None
    """
    today = date.today()
    
    return AcademicYear.objects.filter(
        tenant=tenant,
        start_date__lte=today,
        end_date__gte=today
    ).first()


def set_current_academic_year(tenant, year_id):
    """
    Set a specific academic year as current.
    
    Automatically unmarks other years.
    
    Args:
        tenant: Tenant instance
        year_id: Academic year ID to set as current
    
    Returns:
        bool: Success status
    """
    try:
        # Unmark all current years
        AcademicYear.objects.filter(
            tenant=tenant,
            is_active=True
        ).update(is_active=False)
        
        # Mark the specified year as current
        academic_year = AcademicYear.objects.get(
            tenant=tenant,
            id=year_id
        )
        academic_year.is_active = True
        academic_year.save()
        
        # Clear cache
        cache_key = f'current_academic_year_{tenant.id}'
        cache.delete(cache_key)
        
        return True
    except AcademicYear.DoesNotExist:
        return False


def set_current_academic_term(academic_year, term_id):
    """
    Set a specific term as current for an academic year.
    
    Args:
        academic_year: AcademicYear instance
        term_id: Term ID to set as current
    
    Returns:
        bool: Success status
    """
    try:
        # Unmark all current terms for this year
        AcademicTerm.objects.filter(
            academic_year=academic_year,
            is_active=True
        ).update(is_active=False)
        
        # Mark the specified term as current
        term = AcademicTerm.objects.get(
            academic_year=academic_year,
            id=term_id
        )
        term.is_active = True
        term.save()
        
        # Clear cache
        cache_key = f'current_academic_term_{academic_year.id}'
        cache.delete(cache_key)
        
        return True
    except AcademicTerm.DoesNotExist:
        return False


def create_academic_year(tenant, name, start_date, end_date, set_as_current=False, is_enrollment_open=False):
    """
    Helper function to create an academic year.
    
    Args:
        tenant: Tenant instance
        name: Academic year name
        start_date: Start date
        end_date: End date
        set_as_current: Whether to set as current year
        is_enrollment_open: Whether enrollment is open
    
    Returns:
        AcademicYear instance
    """
    academic_year = AcademicYear.objects.create(
        tenant=tenant,
        name=name,
        start_date=start_date,
        end_date=end_date,
        is_active=set_as_current,
        is_enrollment_open=is_enrollment_open
    )
    
    # Clear cache if set as current
    if set_as_current:
        cache_key = f'current_academic_year_{tenant.id}'
        cache.delete(cache_key)
    
    return academic_year


def create_standard_terms(academic_year, term_type='TERM', count=3):
    """
    Create standard terms for an academic year.
    
    Automatically divides the year into equal terms.
    
    Args:
        academic_year: AcademicYear instance
        term_type: Type of term ('TERM', 'SEMESTER', 'QUARTER', 'TRIMESTER')
        count: Number of terms to create
    
    Returns:
        List of created AcademicTerm instances
    """
    total_days = (academic_year.end_date - academic_year.start_date).days
    days_per_term = total_days // count
    
    terms = []
    current_start = academic_year.start_date
    
    for i in range(1, count + 1):
        # Calculate end date
        if i == count:
            # Last term goes to end of year
            current_end = academic_year.end_date
        else:
            current_end = current_start + timedelta(days=days_per_term - 1)
        
        # Create term
        term = AcademicTerm.objects.create(
            academic_year=academic_year,
            name=f"{term_type.capitalize()} {i}",
            term_type=term_type,
            term_number=i,
            start_date=current_start,
            end_date=current_end,
            is_active=(i == 1)  # Set first term as current
        )
        
        terms.append(term)
        
        # Next term starts day after this one ends
        current_start = current_end + timedelta(days=1)
    
    return terms
