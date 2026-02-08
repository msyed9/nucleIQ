"""
URL Configuration for NucleiQ
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
    Returns 200 OK always - we don't want Cloud Run to mark us unhealthy
    just because the database isn't connected yet.
    """
    response_data = {
        "status": "healthy",
        "service": "nucleiq-backend"
    }
    
    # Optionally check database, but don't fail if it's not connected
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        response_data["database"] = "connected"
    except Exception:
        response_data["database"] = "not connected"
    
    return JsonResponse(response_data, status=200)

def media_download(request, file_path):
    """
    Secure media download handler.
    """
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Authentication required'}, status=401)

    if not (request.user.is_platform_admin or request.user.is_superuser):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return JsonResponse({'error': 'Tenant context required'}, status=403)
        if request.user.tenant_id != tenant.id:
            return JsonResponse({'error': 'Tenant mismatch'}, status=403)

    normalized_path = os.path.normpath(file_path).lstrip(os.sep)

    if not default_storage.exists(normalized_path):
        raise Http404("File not found")

    file_handle = default_storage.open(normalized_path, 'rb')
    return FileResponse(file_handle, as_attachment=True, filename=os.path.basename(normalized_path))

# API v1 Patterns
v1_patterns = [
    path('', include('users.api.v1.urls')),
    path('', include('core.api.v1.urls')),
    path('communication/', include('communication.api.v1.urls')),
    path('billing/', include('billing.api.v1.urls')),
    path('dashboard/', include('dashboard.api.v1.urls')),
    path('search/', include('search.api.v1.urls')),
    path('students/', include('students.api.v1.urls')),
    path('parent/', include('students.api.v1.parent_urls')),
    path('analytics/', include('analytics.api.v1.urls')),
    path('idcards/', include('idcards.api.v1.urls')),
    path('staff/', include('staff.api.v1.urls')),
    path('attendance/', include('attendance.api.v1.urls')),
    path('fees/', include('fees.api.v1.urls')),
    path('finance/', include('finance.api.v1.urls')),
    path('tenants/', include('tenants.api.v1.urls')),
    path('timetable/', include('timetable.api.v1.urls')),
    path('academics/', include('academics.api.v1.urls')),
    path('exams/', include('exams.api.v1.urls')),
    path('hr/', include('hr.api.v1.urls')),
    path('payroll/', include('payroll.api.v1.urls')),
    path('crm/', include('crm.api.v1.urls')),
    path('cms/', include('cms.api.v1.urls')),
    path('library/', include('library.api.v1.urls')),
    path('transport/', include('transport.api.v1.urls')),
    path('inventory/', include('inventory.api.v1.urls')),
    path('hostel/', include('hostel.api.v1.urls')),
    path('salah/', include('salah_tracker.api.v1.urls')),
    path('habits/', include('habit_tracker.api.v1.urls')),
    path('lms/', include('lms.api.v1.urls')),
    path('certificates/', include('certificates.api.v1.urls')),
    path('security/', include('security.api.v1.urls')),
    path('placement/', include('placement.api.v1.urls')),
    path('helpdesk/', include('helpdesk.api.v1.urls')),
    path('reports/', include('reports.api.v1.urls')),
    path('data-management/', include('data_management.api.v1.urls')),
]

# API v2 Patterns (Future major breaking changes)
v2_patterns = [
    path('', include('users.api.v2.urls')),
    path('', include('core.api.v2.urls')),
    path('communication/', include('communication.api.v2.urls')),
    path('billing/', include('billing.api.v2.urls')),
    path('dashboard/', include('dashboard.api.v2.urls')),
    path('search/', include('search.api.v2.urls')),
    path('students/', include('students.api.v2.urls')),
    path('parent/', include('students.api.v2.parent_urls')),
    path('analytics/', include('analytics.api.v2.urls')),
    path('idcards/', include('idcards.api.v2.urls')),
    path('staff/', include('staff.api.v2.urls')),
    path('attendance/', include('attendance.api.v2.urls')),
    path('fees/', include('fees.api.v2.urls')),
    path('finance/', include('finance.api.v2.urls')),
    path('tenants/', include('tenants.api.v2.urls')),
    path('timetable/', include('timetable.api.v2.urls')),
    path('academics/', include('academics.api.v2.urls')),
    path('exams/', include('exams.api.v2.urls')),
    path('hr/', include('hr.api.v2.urls')),
    path('payroll/', include('payroll.api.v2.urls')),
    path('crm/', include('crm.api.v2.urls')),
    path('cms/', include('cms.api.v2.urls')),
    path('library/', include('library.api.v2.urls')),
    path('transport/', include('transport.api.v2.urls')),
    path('inventory/', include('inventory.api.v2.urls')),
    path('hostel/', include('hostel.api.v2.urls')),
    path('salah/', include('salah_tracker.api.v2.urls')),
    path('habits/', include('habit_tracker.api.v2.urls')),
    path('lms/', include('lms.api.v2.urls')),
    path('certificates/', include('certificates.api.v2.urls')),
    path('security/', include('security.api.v2.urls')),
    path('placement/', include('placement.api.v2.urls')),
    path('helpdesk/', include('helpdesk.api.v2.urls')),
    path('reports/', include('reports.api.v2.urls')),
    path('data-management/', include('data_management.api.v2.urls')),
]

v1_schema_urlpatterns = v1_patterns
v2_schema_urlpatterns = v2_patterns

urlpatterns = [
    # Health check (no authentication required)
    path('api/health/', health_check, name='health-check'),
    
    # Root URL - Redirect to frontend (not admin)
    path('', RedirectView.as_view(url='/dashboard/', permanent=False)),
    
    # Admin - Using obscured URL for security
    # Access at: /nq-admin-panel/
    path('nq-admin-panel/', admin_site.urls),

    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path(
        'api/v1/schema/',
        SpectacularAPIView.as_view(
            custom_settings={
                'TITLE': 'NucleiQ API v1',
                'SCHEMA_PATH_PREFIX_INSERT': '/api/v1',
            },
            urlconf=v1_schema_urlpatterns
        ),
        name='schema-v1'
    ),
    path('api/v1/docs/', SpectacularSwaggerView.as_view(url_name='schema-v1'), name='swagger-ui-v1'),
    path('api/v1/redoc/', SpectacularRedocView.as_view(url_name='schema-v1'), name='redoc-v1'),
    path(
        'api/v2/schema/',
        SpectacularAPIView.as_view(
            custom_settings={
                'TITLE': 'NucleiQ API v2',
                'SCHEMA_PATH_PREFIX_INSERT': '/api/v2',
            },
            urlconf=v2_schema_urlpatterns
        ),
        name='schema-v2'
    ),
    path('api/v2/docs/', SpectacularSwaggerView.as_view(url_name='schema-v2'), name='swagger-ui-v2'),
    path('api/v2/redoc/', SpectacularRedocView.as_view(url_name='schema-v2'), name='redoc-v2'),
    
    # Versioned API routes
    path('api/v1/', include((v1_patterns, 'v1'), namespace='v1')),
    path('api/v2/', include((v2_patterns, 'v2'), namespace='v2')),
    
    # Mobile API
    path('api/mobile/', include('core.mobile_urls')),
    
    # Media download
    path('media-download/<path:file_path>/', media_download, name='media-download'),
]

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
admin.site.site_header = 'NucleiQ Administration'
admin.site.site_title = 'NucleiQ Admin'
admin.site.index_title = 'Welcome to NucleiQ Administration'
