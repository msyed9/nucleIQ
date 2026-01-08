"""
URL Configuration for Parent Portal

Provides URL routing for parent-specific endpoints.
All endpoints are prefixed with /api/parent/
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .parent_views import (
    ParentLoginView,
    ParentStudentViewSet,
    ParentProfileViewSet,
    ParentDashboardViewSet
)

# Create router
router = DefaultRouter()
router.register(r'students', ParentStudentViewSet, basename='parent-student')
router.register(r'profile', ParentProfileViewSet, basename='parent-profile')
router.register(r'dashboard', ParentDashboardViewSet, basename='parent-dashboard')

urlpatterns = [
    # Authentication
    path('auth/login/', ParentLoginView.as_view(), name='parent-login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='parent-token-refresh'),
    
    # Router URLs
    path('', include(router.urls)),
]
