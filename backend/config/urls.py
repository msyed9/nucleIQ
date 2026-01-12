"""
URL Configuration for NucleIQ
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from django.http import JsonResponse
from django.db import connection
from config.admin import admin_site  # Import custom admin
from django.http import FileResponse, Http404
from django.core.files.storage import default_storage
import os
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView
)


def health_check(request):
    """
    Health check endpoint for container orchestration and load balancers.
    Returns 200 OK if the service is healthy, 503 if database is unreachable.
    """
    try:
        # Check database connectivity
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        return JsonResponse({
            "status": "healthy",
            "database": "connected",
            "service": "nucleiq-backend"
        }, status=200)
    except Exception as e:
        return JsonResponse({
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }, status=503)


urlpatterns = [
    # Health check (no authentication required)
    path('api/health/', health_check, name='health-check'),
    
    # Root URL - Redirect to Admin (Platform Owner access)
    path('', RedirectView.as_view(url='/admin/', permanent=False)),
    
    # Admin - Using custom admin site
    path('admin/', admin_site.urls),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # API endpoints
    path('api/', include('users.urls')),
# Trigger reload
    path('api/billing/', include('billing.urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/search/', include('search.urls')),
    path('api/students/', include('students.urls')),
    path('api/parent/', include('students.parent_urls')),  # Parent Portal
    path('api/analytics/', include('analytics.urls')),
    path('api/idcards/', include('idcards.urls')),  # ID Card system
    path('api/staff/', include('staff.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/fees/', include('fees.urls')),
    path('api/finance/', include('finance.urls')),
    path('api/tenants/', include('tenants.urls')),
    path('api/timetable/', include('timetable.urls')),
    path('api/academics/', include('academics.urls')),
    path('api/exams/', include('exams.urls')),
    path('api/hr/', include('hr.urls')),
    path('api/payroll/', include('payroll.urls')),
    path('api/communication/', include('communication.urls')),
    path('api/crm/', include('crm.urls')),
    path('api/cms/', include('cms.urls')),
    path('api/library/', include('library.urls')),
    path('api/transport/', include('transport.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/hostel/', include('hostel.urls')),
    path('api/salah/', include('salah_tracker.urls')),
    path('api/habits/', include('habit_tracker.urls')),
    # path('api/alumni/', include('alumni.urls')),  # Moved to students app
    path('api/lms/', include('lms.urls')),
    
    # Mobile API
    path('api/mobile/', include('core.mobile_urls')),
    
    # Phase 6
    path('api/certificates/', include('certificates.urls')),
    path('api/security/', include('security.urls')),
    path('api/placement/', include('placement.urls')),
    path('api/helpdesk/', include('helpdesk.urls')),
    
    # Phase 7
    path('api/reports/', include('reports.urls')),
    
    # Data Management - Bulk Import/Export/Backup
    path('api/data-management/', include('data_management.urls')),
    
    # Phase 8 - Notifications moved to communication app
    # path('api/notifications/', include('notifications.urls')),
]


# Download media with attachment (forces browser to download)
def media_download(request, file_path):
    # file_path should be relative path inside MEDIA_ROOT, e.g. 'idcards/...zip'
    try:
        if not default_storage.exists(file_path):
            raise Http404
        f = default_storage.open(file_path, 'rb')
        return FileResponse(f, as_attachment=True, filename=os.path.basename(file_path))
    except Exception:
        raise Http404


# Expose a simple download endpoint at /media-download/<path:file_path>/
urlpatterns = [
    path('media-download/<path:file_path>/', media_download, name='media-download'),
] + urlpatterns

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug toolbar
    if 'debug_toolbar' in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns

# Customize admin site
admin.site.site_header = 'NucleIQ Administration'
admin.site.site_title = 'NucleIQ Admin'
admin.site.index_title = 'Welcome to NucleIQ Administration'
