"""
Recycle Bin Views and Serializers
Provides tenant admin ability to view, restore, and permanently delete soft-deleted records.
"""

from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantAdmin
from django.apps import apps
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
from django.contrib.contenttypes.models import ContentType
import csv


# Models that support recycle bin (soft-delete enabled)
RECYCLABLE_MODELS = {
    'students.Student': 'Students',
    'staff.Staff': 'Staff',
    'fees.FeeStructure': 'Fee Structures',
    'fees.FeeCategory': 'Fee Categories',
    'tenants.GradeLevel': 'Classes',
    'tenants.Section': 'Sections',
    'tenants.Subject': 'Subjects',
}


class DeletedItemSerializer(serializers.Serializer):
    """Serializer for deleted items in recycle bin"""
    id = serializers.UUIDField()
    entity_type = serializers.CharField()
    entity_type_display = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField(allow_blank=True)
    deleted_at = serializers.DateTimeField()
    deleted_by = serializers.CharField(allow_null=True)
    deleted_by_email = serializers.EmailField(allow_null=True)
    created_at = serializers.DateTimeField()
    can_restore = serializers.BooleanField()


def get_item_display_name(instance):
    """Get a display name for any model instance"""
    # Try common name patterns
    if hasattr(instance, 'get_full_name'):
        return instance.get_full_name()
    if hasattr(instance, 'full_name'):
        return instance.full_name
    if hasattr(instance, 'first_name') and hasattr(instance, 'last_name'):
        return f"{instance.first_name} {instance.last_name}"
    if hasattr(instance, 'name'):
        return instance.name
    if hasattr(instance, 'title'):
        return instance.title
    if hasattr(instance, 'admission_number'):
        return f"Student: {instance.admission_number}"
    if hasattr(instance, 'employee_id'):
        return f"Staff: {instance.employee_id}"
    return str(instance.id)[:8]


def get_item_description(instance):
    """Get a description for any model instance"""
    parts = []
    
    # For students
    if hasattr(instance, 'admission_number'):
        parts.append(f"Admission: {instance.admission_number}")
    if hasattr(instance, 'email') and instance.email:
        parts.append(instance.email)
    
    # For staff
    if hasattr(instance, 'employee_id'):
        parts.append(f"ID: {instance.employee_id}")
    if hasattr(instance, 'department') and instance.department:
        parts.append(instance.department)
    
    # For fee structures
    if hasattr(instance, 'amount'):
        parts.append(f"Amount: {instance.amount}")
    if hasattr(instance, 'frequency'):
        parts.append(instance.frequency)
    
    # For classes/sections
    if hasattr(instance, 'grade_level') and instance.grade_level:
        parts.append(f"Class: {instance.grade_level.name}")
    if hasattr(instance, 'capacity'):
        parts.append(f"Capacity: {instance.capacity}")
    
    return " | ".join(parts) if parts else ""


class RecycleBinViewSet(viewsets.ViewSet):
    """
    ViewSet for managing soft-deleted records.
    Only accessible by tenant admins.
    """
    permission_classes = [IsAuthenticated, IsTenantAdmin]
    
    def list(self, request):
        """
        List all soft-deleted items for the tenant.
        
        Query params:
            - entity_type: Filter by entity type (e.g., 'students.Student')
            - search: Search by name/description
            - start_date: Filter by deleted_at >= start_date
            - end_date: Filter by deleted_at <= end_date
            - deleted_by: Filter by user ID who deleted
            - page: Page number (default: 1)
            - page_size: Items per page (default: 25)
        """
        tenant = request.user.tenant
        entity_type = request.query_params.get('entity_type')
        search = request.query_params.get('search', '')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        deleted_by = request.query_params.get('deleted_by')
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 25))
        
        all_items = []
        
        # Determine which models to query
        models_to_query = {}
        if entity_type and entity_type in RECYCLABLE_MODELS:
            models_to_query[entity_type] = RECYCLABLE_MODELS[entity_type]
        else:
            models_to_query = RECYCLABLE_MODELS
        
        # Query each model for soft-deleted records
        for model_path, display_name in models_to_query.items():
            try:
                app_label, model_name = model_path.split('.')
                Model = apps.get_model(app_label, model_name)
                
                # Use all_with_deleted to include soft-deleted records
                if hasattr(Model.objects, 'all_with_deleted'):
                    queryset = Model.objects.all_with_deleted().filter(
                        tenant=tenant,
                        is_deleted=True
                    )
                else:
                    queryset = Model.objects.filter(
                        tenant=tenant,
                        is_deleted=True
                    )
                
                # Apply date filters
                if start_date:
                    queryset = queryset.filter(deleted_at__gte=start_date)
                if end_date:
                    queryset = queryset.filter(deleted_at__lte=end_date)
                if deleted_by:
                    queryset = queryset.filter(deleted_by_id=deleted_by)
                
                # Convert to serializable format
                for item in queryset:
                    name = get_item_display_name(item)
                    description = get_item_description(item)
                    
                    # Apply search filter
                    if search and search.lower() not in name.lower() and search.lower() not in description.lower():
                        continue
                    
                    all_items.append({
                        'id': str(item.id),
                        'entity_type': model_path,
                        'entity_type_display': display_name,
                        'name': name,
                        'description': description,
                        'deleted_at': item.deleted_at,
                        'deleted_by': item.deleted_by.get_full_name() if item.deleted_by else None,
                        'deleted_by_email': item.deleted_by.email if item.deleted_by else None,
                        'created_at': item.created_at,
                        'can_restore': True,
                    })
                    
            except Exception as e:
                # Log error but continue with other models
                print(f"Error querying {model_path}: {e}")
                continue
        
        # Sort by deleted_at descending
        all_items.sort(key=lambda x: x['deleted_at'] or timezone.now(), reverse=True)
        
        # Pagination
        total_count = len(all_items)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_items = all_items[start_idx:end_idx]
        
        return Response({
            'count': total_count,
            'page': page,
            'page_size': page_size,
            'total_pages': (total_count + page_size - 1) // page_size,
            'results': paginated_items,
            'entity_types': [
                {'value': k, 'label': v} for k, v in RECYCLABLE_MODELS.items()
            ]
        })
    
    @action(detail=False, methods=['post'], url_path='restore/(?P<entity_type>[^/]+)/(?P<pk>[^/]+)')
    def restore(self, request, entity_type=None, pk=None):
        """
        Restore a soft-deleted item.
        """
        if entity_type not in RECYCLABLE_MODELS:
            return Response(
                {'error': 'Invalid entity type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            app_label, model_name = entity_type.split('.')
            Model = apps.get_model(app_label, model_name)
            
            # Get the deleted item
            if hasattr(Model.objects, 'all_with_deleted'):
                item = Model.objects.all_with_deleted().filter(
                    tenant=request.user.tenant,
                    id=pk,
                    is_deleted=True
                ).first()
            else:
                item = Model.objects.filter(
                    tenant=request.user.tenant,
                    id=pk,
                    is_deleted=True
                ).first()
            
            if not item:
                return Response(
                    {'error': 'Item not found or already restored'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Restore the item
            item.restore()
            
            return Response({
                'message': f'{RECYCLABLE_MODELS[entity_type]} restored successfully',
                'id': str(item.id),
                'name': get_item_display_name(item)
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['delete'], url_path='permanent-delete/(?P<entity_type>[^/]+)/(?P<pk>[^/]+)')
    def permanent_delete(self, request, entity_type=None, pk=None):
        """
        Permanently delete a soft-deleted item.
        This action cannot be undone.
        """
        if entity_type not in RECYCLABLE_MODELS:
            return Response(
                {'error': 'Invalid entity type'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Require confirmation
        confirm = request.query_params.get('confirm', 'false').lower() == 'true'
        if not confirm:
            return Response(
                {'error': 'Permanent deletion requires confirm=true parameter'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            app_label, model_name = entity_type.split('.')
            Model = apps.get_model(app_label, model_name)
            
            # Get the deleted item
            if hasattr(Model.objects, 'all_with_deleted'):
                item = Model.objects.all_with_deleted().filter(
                    tenant=request.user.tenant,
                    id=pk,
                    is_deleted=True
                ).first()
            else:
                item = Model.objects.filter(
                    tenant=request.user.tenant,
                    id=pk,
                    is_deleted=True
                ).first()
            
            if not item:
                return Response(
                    {'error': 'Item not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            name = get_item_display_name(item)
            
            # Permanently delete
            item.delete()
            
            return Response({
                'message': f'{RECYCLABLE_MODELS[entity_type]} permanently deleted',
                'name': name
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'], url_path='bulk-restore')
    def bulk_restore(self, request):
        """
        Restore multiple soft-deleted items.
        
        Body:
            items: [{"entity_type": "students.Student", "id": "uuid"}, ...]
        """
        items = request.data.get('items', [])
        
        if not items:
            return Response(
                {'error': 'No items provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        restored = 0
        errors = []
        
        for item_data in items:
            entity_type = item_data.get('entity_type')
            pk = item_data.get('id')
            
            if entity_type not in RECYCLABLE_MODELS:
                errors.append(f"Invalid entity type: {entity_type}")
                continue
            
            try:
                app_label, model_name = entity_type.split('.')
                Model = apps.get_model(app_label, model_name)
                
                if hasattr(Model.objects, 'all_with_deleted'):
                    item = Model.objects.all_with_deleted().filter(
                        tenant=request.user.tenant,
                        id=pk,
                        is_deleted=True
                    ).first()
                else:
                    item = Model.objects.filter(
                        tenant=request.user.tenant,
                        id=pk,
                        is_deleted=True
                    ).first()
                
                if item:
                    item.restore()
                    restored += 1
                else:
                    errors.append(f"Item {pk} not found")
                    
            except Exception as e:
                errors.append(f"Error restoring {pk}: {str(e)}")
        
        return Response({
            'restored': restored,
            'errors': errors
        })
    
    @action(detail=False, methods=['post'], url_path='bulk-delete')
    def bulk_delete(self, request):
        """
        Permanently delete multiple soft-deleted items.
        
        Body:
            items: [{"entity_type": "students.Student", "id": "uuid"}, ...]
            confirm: true
        """
        items = request.data.get('items', [])
        confirm = request.data.get('confirm', False)
        
        if not items:
            return Response(
                {'error': 'No items provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not confirm:
            return Response(
                {'error': 'Bulk permanent deletion requires confirm: true in body'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        deleted = 0
        errors = []
        
        for item_data in items:
            entity_type = item_data.get('entity_type')
            pk = item_data.get('id')
            
            if entity_type not in RECYCLABLE_MODELS:
                errors.append(f"Invalid entity type: {entity_type}")
                continue
            
            try:
                app_label, model_name = entity_type.split('.')
                Model = apps.get_model(app_label, model_name)
                
                if hasattr(Model.objects, 'all_with_deleted'):
                    item = Model.objects.all_with_deleted().filter(
                        tenant=request.user.tenant,
                        id=pk,
                        is_deleted=True
                    ).first()
                else:
                    item = Model.objects.filter(
                        tenant=request.user.tenant,
                        id=pk,
                        is_deleted=True
                    ).first()
                
                if item:
                    item.delete()
                    deleted += 1
                else:
                    errors.append(f"Item {pk} not found")
                    
            except Exception as e:
                errors.append(f"Error deleting {pk}: {str(e)}")
        
        return Response({
            'deleted': deleted,
            'errors': errors
        })
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Export recycle bin contents to CSV.
        """
        tenant = request.user.tenant
        entity_type = request.query_params.get('entity_type')
        
        all_items = []
        
        # Determine which models to query
        models_to_query = {}
        if entity_type and entity_type in RECYCLABLE_MODELS:
            models_to_query[entity_type] = RECYCLABLE_MODELS[entity_type]
        else:
            models_to_query = RECYCLABLE_MODELS
        
        # Query each model
        for model_path, display_name in models_to_query.items():
            try:
                app_label, model_name = model_path.split('.')
                Model = apps.get_model(app_label, model_name)
                
                if hasattr(Model.objects, 'all_with_deleted'):
                    queryset = Model.objects.all_with_deleted().filter(
                        tenant=tenant,
                        is_deleted=True
                    )
                else:
                    queryset = Model.objects.filter(
                        tenant=tenant,
                        is_deleted=True
                    )
                
                for item in queryset:
                    all_items.append({
                        'Entity Type': display_name,
                        'Name': get_item_display_name(item),
                        'Description': get_item_description(item),
                        'Deleted At': item.deleted_at.isoformat() if item.deleted_at else '',
                        'Deleted By': item.deleted_by.email if item.deleted_by else '',
                        'Created At': item.created_at.isoformat() if item.created_at else '',
                    })
                    
            except Exception:
                continue
        
        # Generate CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="recycle_bin_{timezone.now().strftime("%Y%m%d")}.csv"'
        
        if all_items:
            writer = csv.DictWriter(response, fieldnames=all_items[0].keys())
            writer.writeheader()
            writer.writerows(all_items)
        
        return response
