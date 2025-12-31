"""
URL Configuration for Users app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView, UserViewSet, RoleViewSet,
    PermissionViewSet, ChangePasswordView, ResetPasswordView,
    ResetPasswordConfirmView, LogoutView, ImpersonationViewSet
)

# Create router
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'impersonate', ImpersonationViewSet, basename='impersonate')

app_name = 'users'

urlpatterns = [
    # JWT Authentication
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    
    # Password Management
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('auth/reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('auth/reset-password/confirm/', ResetPasswordConfirmView.as_view(), name='reset_password_confirm'),
    
    # Router URLs
    path('', include(router.urls)),
]
