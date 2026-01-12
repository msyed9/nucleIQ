"""
ID Card Views for the students app - Simple ViewSets for ID Card Designer
Uses the idcards app models for proper functionality
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from django.db.models import Q
from core.permissions import IsTenantUser
from idcards.models import IDCardTemplate


class IDCardTemplateSerializer(serializers.ModelSerializer):
    """Serializer for the ID Card Designer frontend"""
    # Map frontend fields to model fields
    design_json = serializers.JSONField(source='config', required=False)
    card_type = serializers.CharField(source='entity_type', required=False)
    category = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = IDCardTemplate
        fields = [
            'id', 'name', 'description', 'card_type', 'entity_type',
            'orientation', 'category', 'design_json', 'config',
            'width', 'height', 'background_type', 'background_value',
            'is_default', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'entity_type': {'required': False},
            'config': {'required': False},
        }
    
    def to_representation(self, instance):
        """Convert model data to frontend-expected format"""
        data = super().to_representation(instance)
        data['design_json'] = instance.config or {}
        data['card_type'] = instance.entity_type.upper() if instance.entity_type else 'STUDENT'
        data['category'] = 'CUSTOM'
        return data
    
    def to_internal_value(self, data):
        """Convert frontend data to model format"""
        internal = super().to_internal_value(data)
        
        # Handle card_type -> entity_type conversion
        if 'card_type' in data:
            internal['entity_type'] = data['card_type'].lower()
        elif 'entity_type' not in internal:
            internal['entity_type'] = 'student'
        
        # Handle design_json -> config conversion
        if 'design_json' in data:
            internal['config'] = data['design_json']
        
        # Handle orientation (ensure lowercase)
        if 'orientation' in data:
            internal['orientation'] = data['orientation'].lower()
        
        return internal


class IDCardTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ID card templates.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    serializer_class = IDCardTemplateSerializer
    
    def get_queryset(self):
        """Get tenant templates."""
        try:
            user = self.request.user
            
            # Handle platform admin or superuser
            if getattr(user, 'is_platform_admin', False) or user.is_superuser:
                return IDCardTemplate.objects.all()
            
            # Check if user has tenant
            tenant = getattr(user, 'tenant', None)
            if not tenant:
                return IDCardTemplate.objects.none()
            
            return IDCardTemplate.objects.filter(
                Q(tenant=tenant) | Q(is_system=True),
                is_active=True
            ).order_by('name')
        except Exception as e:
            import logging
            logging.error(f"Error in IDCardTemplateViewSet.get_queryset: {e}")
            return IDCardTemplate.objects.none()
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this template as default."""
        template = self.get_object()
        
        # Unset other defaults for same entity type
        IDCardTemplate.objects.filter(
            tenant=request.user.tenant,
            entity_type=template.entity_type,
            is_default=True
        ).update(is_default=False)
        
        # Set this as default
        template.is_default = True
        template.save()
        
        serializer = self.get_serializer(template)
        return Response(serializer.data)
