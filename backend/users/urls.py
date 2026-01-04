"""
URL Configuration for Users app
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    CustomTokenObtainPairView, UserViewSet, RoleViewSet,
    PermissionViewSet, ChangePasswordView, ResetPasswordView,
    ResetPasswordConfirmView, LogoutView, ImpersonationViewSet,
    PermissionsMatrixViewSet, UserPermissionsView, CheckPermissionView
)

# Create router
router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', RoleViewSet, basename='role')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'impersonate', ImpersonationViewSet, basename='impersonate')
router.register(r'permissions-matrix', PermissionsMatrixViewSet, basename='permissions-matrix')

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
    
    # User Permissions
    path('auth/permissions/', UserPermissionsView.as_view(), name='user_permissions'),
    path('auth/check-permission/', CheckPermissionView.as_view(), name='check_permission'),
    
    # Router URLs
    path('', include(router.urls)),
]
