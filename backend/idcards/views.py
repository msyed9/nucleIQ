"""
API Views for ID Cards
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser
from .models import IDCardTemplate, IDCardDesign, IDCardGeneration
from .serializers import (
    IDCardTemplateSerializer,
    IDCardDesignSerializer,
    IDCardGenerationSerializer
)


class IDCardTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for ID card templates (read-only).
    Shows global templates and tenant-specific templates.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = IDCardTemplateSerializer
    
    def get_queryset(self):
        """Get global templates and tenant-specific templates."""
        from django.db.models import Q
        
        return IDCardTemplate.objects.filter(
            Q(is_global=True) | Q(tenant=self.request.user.tenant),
            is_active=True
        ).order_by('category', 'name')
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get templates grouped by category."""
        queryset = self.get_queryset()
        
        categories = {}
        for template in queryset:
            category = template.category
            if category not in categories:
                categories[category] = []
            
            categories[category].append(
                IDCardTemplateSerializer(template).data
            )
        
        return Response(categories)


class IDCardDesignViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ID card designs.
    Allows tenants to create and manage custom designs.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = IDCardDesignSerializer
    
    def get_queryset(self):
        return IDCardDesign.objects.filter(
            tenant=self.request.user.tenant
        )
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this design as default."""
        design = self.get_object()
        
        # Unset other defaults
        IDCardDesign.objects.filter(
            tenant=request.user.tenant,
            card_type=design.card_type,
            is_default=True
        ).update(is_default=False)
        
        # Set this as default
        design.is_default = True
        design.save()
        
        serializer = self.get_serializer(design)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a design."""
        original = self.get_object()
        
        # Create copy
        duplicate = IDCardDesign.objects.create(
            tenant=request.user.tenant,
            name=f"{original.name} (Copy)",
            description=original.description,
            card_type=original.card_type,
            orientation=original.orientation,
            width_mm=original.width_mm,
            height_mm=original.height_mm,
            design_json=original.design_json.copy(),
            is_active=True,
            is_default=False
        )
        
        serializer = self.get_serializer(duplicate)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IDCardGenerationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ID card generations.
    Track bulk generation requests.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = IDCardGenerationSerializer
    
    def get_queryset(self):
        return IDCardGeneration.objects.filter(
            tenant=self.request.user.tenant
        )
    
    def perform_create(self, serializer):
        """Set tenant and user on create."""
        serializer.save(
            tenant=self.request.user.tenant,
            generated_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """Regenerate ID cards."""
        generation = self.get_object()
        
        # Create new generation with same parameters
        new_generation = IDCardGeneration.objects.create(
            tenant=request.user.tenant,
            design=generation.design,
            card_type=generation.card_type,
            filters=generation.filters.copy(),
            generated_by=request.user,
            status='PENDING'
        )
        
        # Trigger async task
        from .tasks import generate_cards_async
        task = generate_cards_async.delay(str(new_generation.id))
        
        serializer = self.get_serializer(new_generation)
        return Response({
            **serializer.data,
            'task_id': task.id
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def generate_bulk(self, request):
        """Generate ID cards in bulk with filters."""
        design_id = request.data.get('design_id')
        card_type = request.data.get('card_type', 'STUDENT')
        filters = request.data.get('filters', {})
        
        if not design_id:
            return Response(
                {'error': 'design_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .models import IDCardDesign
            design = IDCardDesign.objects.get(
                id=design_id,
                tenant=request.user.tenant
            )
        except IDCardDesign.DoesNotExist:
            return Response(
                {'error': 'Design not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Create generation record
        generation = IDCardGeneration.objects.create(
            tenant=request.user.tenant,
            design=design,
            card_type=card_type,
            filters=filters,
            generated_by=request.user,
            status='PENDING'
        )
        
        # Trigger async task
        from .tasks import generate_cards_async
        task = generate_cards_async.delay(str(generation.id))
        
        serializer = self.get_serializer(generation)
        return Response({
            **serializer.data,
            'task_id': task.id,
            'status_url': f'/api/idcards/generations/{generation.id}/'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def task_status(self, request, pk=None):
        """Get task status for a generation."""
        generation = self.get_object()
        
        return Response({
            'id': generation.id,
            'status': generation.status,
            'total_cards': generation.total_cards,
            'error_message': generation.error_message,
            'output_file': generation.output_file.url if generation.output_file else None,
            'created_at': generation.created_at,
        })

