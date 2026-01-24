"""
Views for Tenant Session Timeout Configuration
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import serializers
from core.permissions import IsTenantUser
from .models import Tenant


class SessionTimeoutSerializer(serializers.Serializer):
    """Serializer for tenant session timeout configuration."""
    
    session_timeout_minutes = serializers.IntegerField(
        min_value=5,
        max_value=1440,
        help_text="Session timeout in minutes (JWT access token). Min: 5, Max: 1440 (24 hours)"
    )
    refresh_timeout_days = serializers.IntegerField(
        min_value=1,
        max_value=30,
        help_text="Refresh token lifetime in days. Min: 1, Max: 30"
    )
    admin_session_timeout_minutes = serializers.IntegerField(
        min_value=5,
        max_value=1440,
        help_text="Django admin session timeout in minutes. Min: 5, Max: 1440 (24 hours)"
    )


class TenantSessionTimeoutViewSet(viewsets.ViewSet):
    """
    ViewSet for managing tenant session timeout settings.
    
    Endpoints:
    - GET /api/tenants/session-timeout/ - Get current session timeout settings
    - PATCH /api/tenants/session-timeout/ - Update session timeout settings
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def list(self, request):
        """
        Get current tenant session timeout settings.
        
        Response:
        {
            "session_timeout_minutes": 60,
            "refresh_timeout_days": 7,
            "admin_session_timeout_minutes": 120
        }
        """
        tenant = request.user.tenant
        
        if not tenant:
            return Response(
                {'error': 'User does not belong to a tenant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        data = {
            'session_timeout_minutes': tenant.session_timeout_minutes,
            'refresh_timeout_days': tenant.refresh_timeout_days,
            'admin_session_timeout_minutes': tenant.admin_session_timeout_minutes,
        }
        
        return Response(data)
    
    def partial_update(self, request, pk=None):
        """
        Update tenant session timeout settings.
        
        Request body (all fields optional):
        {
            "session_timeout_minutes": 60,
            "refresh_timeout_days": 7,
            "admin_session_timeout_minutes": 120
        }
        """
        tenant = request.user.tenant
        
        if not tenant:
            return Response(
                {'error': 'User does not belong to a tenant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = SessionTimeoutSerializer(data=request.data, partial=True)
        
        if not serializer.is_valid():
            return Response(
                {'errors': serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update tenant fields
        validated_data = serializer.validated_data
        
        if 'session_timeout_minutes' in validated_data:
            tenant.session_timeout_minutes = validated_data['session_timeout_minutes']
        
        if 'refresh_timeout_days' in validated_data:
            tenant.refresh_timeout_days = validated_data['refresh_timeout_days']
        
        if 'admin_session_timeout_minutes' in validated_data:
            tenant.admin_session_timeout_minutes = validated_data['admin_session_timeout_minutes']
        
        # Validate and save
        try:
            tenant.full_clean()  # This will run the clean() method we added
            tenant.save()
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Return updated values
        data = {
            'session_timeout_minutes': tenant.session_timeout_minutes,
            'refresh_timeout_days': tenant.refresh_timeout_days,
            'admin_session_timeout_minutes': tenant.admin_session_timeout_minutes,
            'message': 'Session timeout settings updated successfully'
        }
        
        return Response(data)
