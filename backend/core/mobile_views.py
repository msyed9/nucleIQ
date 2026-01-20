"""
Mobile App API Endpoints
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from tenants.models import Tenant

class MobileConfigViewSet(viewsets.ViewSet):
    """
    Endpoints for White-Label Mobile App
    """
    permission_classes = [AllowAny]

    @action(detail=False, methods=['get'], url_path='config/(?P<school_code>[^/.]+)')
    def get_config(self, request, school_code=None):
        """
        Fetch branding for a school based on code or domain.
        """
        try:
            # Use subdomain to find tenant (shared schema RLS strategy)
            tenant = Tenant.objects.get(subdomain=school_code)
            
            return Response({
                'id': tenant.id,
                'name': tenant.name,
                'logo_url': tenant.logo.url if tenant.logo else '',
                'colors': {
                    'primary': tenant.brand_colors.get('primary', '#4f46e5'),
                    'secondary': tenant.brand_colors.get('secondary', '#10b981'),
                    'accent': tenant.brand_colors.get('accent', '#f59e0b'),
                },
                'features': {
                    'bus_tracking': True,
                    'library': True,
                }
            })
        except Tenant.DoesNotExist:
            return Response({'error': 'School not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def register_device(self, request):
        """
        Register FCM Token for Push Notifications
        """
        # Logic to save FCM token to UserDevice model
        return Response({'status': 'registered'})
