"""
ID Card Views for the students app - Simple ViewSets for ID Card Designer
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from core.permissions import IsTenantUser
from .models import IDCardTemplate


class IDCardTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ID card templates.
    """
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Get tenant templates."""
        user = self.request.user
        if user.is_platform_admin or user.is_superuser:
            return IDCardTemplate.objects.all()
        return IDCardTemplate.objects.filter(
            Q(tenant=user.tenant) | Q(is_default=True),
            is_active=True
        ).order_by('name')
    
    def get_serializer_class(self):
        from rest_framework import serializers
        
        class IDCardTemplateSerializer(serializers.ModelSerializer):
            class Meta:
                model = IDCardTemplate
                fields = [
                    'id', 'name', 'description', 'template_design', 
                    'background_image', 'include_photo', 'include_qr_code',
                    'include_barcode', 'is_default', 'is_active',
                    'created_at', 'updated_at'
                ]
                read_only_fields = ['id', 'created_at', 'updated_at']
        
        return IDCardTemplateSerializer
    
    def perform_create(self, serializer):
        """Set tenant on create."""
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=True, methods=['post'])
    def set_default(self, request, pk=None):
        """Set this template as default."""
        template = self.get_object()
        
        # Unset other defaults
        IDCardTemplate.objects.filter(
            tenant=request.user.tenant,
            is_default=True
        ).update(is_default=False)
        
        # Set this as default
        template.is_default = True
        template.save()
        
        serializer = self.get_serializer(template)
        return Response(serializer.data)
