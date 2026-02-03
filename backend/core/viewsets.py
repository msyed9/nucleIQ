"""
Core ViewSet Mixins and Base Classes

This module provides standardized ViewSet classes that handle:
- Tenant isolation
- Consistent response formats
- Error handling
- Pagination
- Common filtering patterns

Usage:
    from core.viewsets import TenantModelViewSet, TenantReadOnlyViewSet

    class MyViewSet(TenantModelViewSet):
        queryset = MyModel.objects.all()
        serializer_class = MySerializer
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import transaction
from django.core.exceptions import ValidationError

from .middleware import get_current_tenant
from .permissions import IsTenantUser, IsTenantAdmin


# =============================================================================
# Response Utilities
# =============================================================================

def success_response(data=None, message=None, http_status=status.HTTP_200_OK):
    """
    Create a standardized success response.
    
    Args:
        data: The response data payload
        message: Optional success message
        http_status: HTTP status code (default: 200)
    
    Returns:
        Response object with standardized format
    """
    response_data = {
        'success': True,
    }
    if message:
        response_data['message'] = message
    if data is not None:
        response_data['data'] = data
    return Response(response_data, status=http_status)


def error_response(message, errors=None, http_status=status.HTTP_400_BAD_REQUEST):
    """
    Create a standardized error response.
    
    Args:
        message: Error message
        errors: Optional dictionary of field-level errors
        http_status: HTTP status code (default: 400)
    
    Returns:
        Response object with standardized error format
    """
    response_data = {
        'success': False,
        'message': message,
    }
    if errors:
        response_data['errors'] = errors
    return Response(response_data, status=http_status)


def paginated_response(queryset, request, serializer_class, page_size=20):
    """
    Create a paginated response for list endpoints.
    
    Args:
        queryset: The queryset to paginate
        request: The HTTP request
        serializer_class: Serializer class to use
        page_size: Number of items per page
    
    Returns:
        Response with paginated data
    """
    paginator = StandardPagination()
    paginator.page_size = page_size
    page = paginator.paginate_queryset(queryset, request)
    if page is not None:
        serializer = serializer_class(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)
    serializer = serializer_class(queryset, many=True, context={'request': request})
    return Response(serializer.data)


# =============================================================================
# Pagination Classes
# =============================================================================

class StandardPagination(PageNumberPagination):
    """Standard pagination for API responses."""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })


class LargePagination(PageNumberPagination):
    """Pagination for larger datasets."""
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 200


class SmallPagination(PageNumberPagination):
    """Pagination for smaller datasets or nested lists."""
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50


# =============================================================================
# User-Staff Association Utilities
# =============================================================================

def get_staff_for_user(user):
    """
    Get the Staff profile associated with a User.
    
    Args:
        user: User instance
    
    Returns:
        Staff instance or None if not found
    """
    from staff.models import Staff
    try:
        return Staff.objects.get(user=user, is_deleted=False)
    except Staff.DoesNotExist:
        return None


def get_student_for_user(user):
    """
    Get the Student profile associated with a User (parent viewing child).
    
    Args:
        user: User instance
    
    Returns:
        List of Student instances linked to this parent user
    """
    from students.models import Student
    return Student.objects.filter(
        parent_user=user,
        is_deleted=False
    )


def require_staff_profile(view_func):
    """
    Decorator to require a staff profile for an action.
    
    Usage:
        @action(detail=True, methods=['post'])
        @require_staff_profile
        def approve(self, request, pk=None):
            staff = request.staff_profile  # Available after decorator
            ...
    """
    def wrapper(self, request, *args, **kwargs):
        staff = get_staff_for_user(request.user)
        if not staff:
            return error_response(
                'Staff profile not found. This action requires a staff account.',
                http_status=status.HTTP_403_FORBIDDEN
            )
        request.staff_profile = staff
        return view_func(self, request, *args, **kwargs)
    return wrapper


# =============================================================================
# Tenant Mixins
# =============================================================================

class TenantFilterMixin:
    """
    Mixin that automatically filters querysets by the current tenant.
    
    This mixin assumes:
    - The model has a 'tenant' field
    - Optionally has an 'is_deleted' field for soft deletion
    """
    
    def get_queryset(self):
        """Filter queryset by current tenant."""
        queryset = super().get_queryset()
        tenant = get_current_tenant()
        
        if tenant is None:
            # If no tenant context, return empty queryset for safety
            return queryset.none()
        
        # Apply tenant filter
        queryset = queryset.filter(tenant=tenant)
        
        # Apply soft delete filter if model supports it
        if hasattr(queryset.model, 'is_deleted'):
            queryset = queryset.filter(is_deleted=False)
        
        return queryset


class TenantCreateMixin:
    """
    Mixin that automatically sets tenant on object creation.
    """
    
    def perform_create(self, serializer):
        """Set tenant when creating objects."""
        tenant = get_current_tenant()
        if tenant is None:
            raise ValidationError("Tenant context is required for this operation.")
        serializer.save(tenant=tenant)


class TenantUpdateMixin:
    """
    Mixin for handling updates with tenant validation.
    """
    
    def perform_update(self, serializer):
        """Update with tenant validation."""
        instance = serializer.instance
        tenant = get_current_tenant()
        
        # Verify the object belongs to current tenant
        if hasattr(instance, 'tenant') and instance.tenant != tenant:
            raise ValidationError("Cannot modify objects from other tenants.")
        
        serializer.save()


class SoftDeleteMixin:
    """
    Mixin for soft deletion instead of actual deletion.
    """
    
    def perform_destroy(self, instance):
        """Soft delete the instance instead of removing it."""
        if hasattr(instance, 'is_deleted'):
            instance.is_deleted = True
            instance.save(update_fields=['is_deleted'])
        else:
            instance.delete()


class AuditMixin:
    """
    Mixin for tracking who created/modified records.
    """
    
    def perform_create(self, serializer):
        """Set created_by when creating objects."""
        extra_kwargs = {}
        
        if hasattr(serializer.Meta.model, 'created_by'):
            extra_kwargs['created_by'] = self.request.user
        
        # Call parent perform_create if it exists
        if hasattr(super(), 'perform_create'):
            super().perform_create(serializer)
        else:
            serializer.save(**extra_kwargs)
    
    def perform_update(self, serializer):
        """Set modified_by when updating objects."""
        extra_kwargs = {}
        
        if hasattr(serializer.Meta.model, 'modified_by'):
            extra_kwargs['modified_by'] = self.request.user
        
        # Call parent perform_update if it exists
        if hasattr(super(), 'perform_update'):
            super().perform_update(serializer)
        else:
            serializer.save(**extra_kwargs)


# =============================================================================
# Base ViewSet Classes
# =============================================================================

class TenantModelViewSet(
    TenantFilterMixin,
    TenantCreateMixin,
    TenantUpdateMixin,
    SoftDeleteMixin,
    viewsets.ModelViewSet
):
    """
    Full-featured ModelViewSet with tenant isolation.
    
    Features:
    - Automatic tenant filtering on all queries
    - Automatic tenant assignment on create
    - Soft deletion support
    - Standard pagination
    - Common filter backends
    
    Usage:
        class StudentViewSet(TenantModelViewSet):
            queryset = Student.objects.all()
            serializer_class = StudentSerializer
            filterset_fields = ['grade', 'section', 'is_active']
            search_fields = ['first_name', 'last_name', 'admission_number']
            ordering_fields = ['first_name', 'created_at']
            ordering = ['-created_at']
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    
    def get_serializer_context(self):
        """Add tenant to serializer context."""
        context = super().get_serializer_context()
        context['tenant'] = get_current_tenant()
        return context


class TenantReadOnlyViewSet(
    TenantFilterMixin,
    viewsets.ReadOnlyModelViewSet
):
    """
    Read-only ModelViewSet with tenant isolation.
    
    Use this for logs, history, and other read-only data.
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]


class TenantAdminViewSet(
    TenantFilterMixin,
    TenantCreateMixin,
    TenantUpdateMixin,
    SoftDeleteMixin,
    viewsets.ModelViewSet
):
    """
    ModelViewSet requiring tenant admin permissions.
    
    Use this for configuration and settings endpoints.
    """
    
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    pagination_class = StandardPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]


# =============================================================================
# Action Helpers
# =============================================================================

class BulkActionMixin:
    """
    Mixin providing bulk action helpers.
    """
    
    def bulk_create_with_tenant(self, model_class, items_data):
        """
        Bulk create items with tenant assignment.
        
        Args:
            model_class: The Django model class
            items_data: List of dictionaries with item data
        
        Returns:
            List of created instances
        """
        tenant = get_current_tenant()
        instances = []
        
        with transaction.atomic():
            for data in items_data:
                data['tenant'] = tenant
                instances.append(model_class(**data))
            
            model_class.objects.bulk_create(instances)
        
        return instances
    
    def bulk_update_with_validation(self, queryset, updates, fields):
        """
        Bulk update with tenant validation.
        
        Args:
            queryset: Queryset of objects to update
            updates: Dictionary of field updates
            fields: List of fields being updated
        
        Returns:
            Number of updated records
        """
        tenant = get_current_tenant()
        
        # Ensure we only update tenant's records
        queryset = queryset.filter(tenant=tenant)
        
        return queryset.update(**updates)


class ExportMixin:
    """
    Mixin providing export functionality.
    """
    
    def export_to_csv(self, queryset, fields, filename):
        """
        Export queryset to CSV.
        
        Args:
            queryset: The queryset to export
            fields: List of field names to include
            filename: Name of the CSV file
        
        Returns:
            HttpResponse with CSV content
        """
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        
        # Write header
        writer.writerow(fields)
        
        # Write data
        for obj in queryset:
            row = []
            for field in fields:
                value = getattr(obj, field, '')
                if callable(value):
                    value = value()
                row.append(str(value) if value else '')
            writer.writerow(row)
        
        return response
    
    def export_to_excel(self, queryset, fields, filename):
        """
        Export queryset to Excel.
        
        Args:
            queryset: The queryset to export
            fields: List of field names to include
            filename: Name of the Excel file
        
        Returns:
            HttpResponse with Excel content
        """
        import io
        from django.http import HttpResponse
        
        try:
            import openpyxl
            from openpyxl import Workbook
        except ImportError:
            return error_response(
                'Excel export requires openpyxl library',
                http_status=status.HTTP_501_NOT_IMPLEMENTED
            )
        
        wb = Workbook()
        ws = wb.active
        
        # Write header
        for col, field in enumerate(fields, 1):
            ws.cell(row=1, column=col, value=field)
        
        # Write data
        for row_num, obj in enumerate(queryset, 2):
            for col, field in enumerate(fields, 1):
                value = getattr(obj, field, '')
                if callable(value):
                    value = value()
                ws.cell(row=row_num, column=col, value=str(value) if value else '')
        
        # Save to buffer
        buffer = io.BytesIO()
        wb.save(buffer)
        buffer.seek(0)
        
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        return response


# =============================================================================
# Validation Helpers
# =============================================================================

def validate_tenant_object(model_class, object_id, error_message=None):
    """
    Validate that an object exists and belongs to current tenant.
    
    Args:
        model_class: The Django model class
        object_id: The ID of the object
        error_message: Custom error message
    
    Returns:
        The object if valid
    
    Raises:
        ValidationError if object not found or belongs to different tenant
    """
    tenant = get_current_tenant()
    
    try:
        obj = model_class.objects.get(id=object_id, tenant=tenant)
        if hasattr(obj, 'is_deleted') and obj.is_deleted:
            raise model_class.DoesNotExist()
        return obj
    except model_class.DoesNotExist:
        raise ValidationError(
            error_message or f'{model_class.__name__} not found.'
        )


def validate_date_range(start_date, end_date, max_days=365):
    """
    Validate a date range.
    
    Args:
        start_date: Start date
        end_date: End date
        max_days: Maximum allowed days in range
    
    Raises:
        ValidationError if dates are invalid
    """
    if start_date > end_date:
        raise ValidationError('Start date must be before end date.')
    
    if (end_date - start_date).days > max_days:
        raise ValidationError(f'Date range cannot exceed {max_days} days.')


def validate_time_range(start_time, end_time):
    """
    Validate a time range.
    
    Args:
        start_time: Start time
        end_time: End time
    
    Raises:
        ValidationError if times are invalid
    """
    if start_time >= end_time:
        raise ValidationError('Start time must be before end time.')
