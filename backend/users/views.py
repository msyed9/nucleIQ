"""
Views for User Management and Authentication
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from core.permissions import IsTenantUser, IsPlatformAdmin, HasModulePermission
from .models import (
    User, UserPreference, Role, Permission,
    RolePermission, UserRole, ImpersonationLog
)
from .serializers import (
    UserSerializer, UserCreateSerializer, UserProfileSerializer,
    UserPreferenceSerializer, RoleSerializer, PermissionSerializer,
    ChangePasswordSerializer, ResetPasswordSerializer,
    ResetPasswordConfirmSerializer, ImpersonationLogSerializer
)

User = get_user_model()


from .serializers import UserProfileSerializer


from .serializers import UserProfileSerializer, CustomTokenObtainPairSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Custom JWT token obtain view with additional user data.
    """
    serializer_class = CustomTokenObtainPairSerializer
    def post(self, request, *args, **kwargs):
        """Override to include user profile in response."""
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            # Get user
            user = User.objects.get(email=request.data.get('email'))
            
            # Update last login info
            user.last_login_ip = self.get_client_ip(request)
            user.save(update_fields=['last_login_ip'])
            
            # Add user profile to response
            serializer = UserProfileSerializer(user)
            response.data['user'] = serializer.data
            # Also include tenant id explicitly for frontend convenience
            tenant_id = None
            try:
                tenant_id = serializer.data.get('tenant')
            except Exception:
                tenant_id = None
            response.data['tenant'] = tenant_id
        
        return response
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users.
    
    Endpoints:
    - GET /users/ - List users
    - POST /users/ - Create user
    - GET /users/{id}/ - Retrieve user
    - PUT /users/{id}/ - Update user
    - PATCH /users/{id}/ - Partial update user
    - DELETE /users/{id}/ - Soft delete user
    - GET /users/me/ - Get current user profile
    - PATCH /users/me/preferences/ - Update current user preferences
    - POST /users/{id}/activate/ - Activate user
    - POST /users/{id}/deactivate/ - Deactivate user
    """
    
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_permissions(self):
        """
        Override permissions for specific actions.
        'me' and 'preferences' don't require tenant context.
        """
        if self.action in ['me', 'preferences']:
            return [IsAuthenticated()]
        return super().get_permissions()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action."""
        if self.action == 'create':
            return UserCreateSerializer
        elif self.action == 'me':
            return UserProfileSerializer
        return UserSerializer
    
    def get_queryset(self):
        """Filter users by tenant."""
        user = self.request.user
        
        # Platform admins can see all users
        if user.is_platform_admin or user.is_superuser:
            return User.objects.all()
        
        # Regular users see only their tenant's users
        return User.objects.filter(tenant=user.tenant)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user profile."""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['patch'])
    def preferences(self, request):
        """Update current user preferences."""
        try:
            preference = request.user.preference
        except UserPreference.DoesNotExist:
            preference = UserPreference.objects.create(user=request.user)
        
        serializer = UserPreferenceSerializer(
            preference,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user."""
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=['is_active'])
        
        return Response({
            'status': 'success',
            'message': f'User {user.email} activated successfully'
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user."""
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=['is_active'])
        
        return Response({
            'status': 'success',
            'message': f'User {user.email} deactivated successfully'
        })
    
    def perform_create(self, serializer):
        """Set created_by when creating user."""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Set updated_by when updating user."""
        serializer.save(updated_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete user instead of hard delete."""
        user = self.get_object()
        user.soft_delete(user=request.user)
        
        return Response({
            'status': 'success',
            'message': f'User {user.email} deleted successfully'
        }, status=status.HTTP_204_NO_CONTENT)


class ChangePasswordView(generics.UpdateAPIView):
    """
    View for changing user password.
    
    POST /auth/change-password/
    """
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def update(self, request, *args, **kwargs):
        """Change user password."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Set new password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        
        return Response({
            'status': 'success',
            'message': 'Password changed successfully'
        })


class ResetPasswordView(generics.GenericAPIView):
    """
    View for requesting password reset.
    
    POST /auth/reset-password/
    """
    
    serializer_class = ResetPasswordSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Send password reset email."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        email = serializer.validated_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generate reset token
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Build reset URL
            reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}/"
            
            # Send email
            send_mail(
                subject='Password Reset Request',
                message=f'Click the link to reset your password: {reset_url}',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
            
        except User.DoesNotExist:
            # Don't reveal if email exists
            pass
        
        return Response({
            'status': 'success',
            'message': 'If the email exists, a password reset link has been sent'
        })


class ResetPasswordConfirmView(generics.GenericAPIView):
    """
    View for confirming password reset.
    
    POST /auth/reset-password/confirm/
    """
    
    serializer_class = ResetPasswordConfirmSerializer
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Confirm password reset with token."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Decode UID and get user
            uid = serializer.validated_data['token'].split('-')[0]
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
            
            # Verify token
            token = serializer.validated_data['token']
            if not default_token_generator.check_token(user, token):
                return Response({
                    'status': 'error',
                    'message': 'Invalid or expired reset token'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Set new password
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            
            return Response({
                'status': 'success',
                'message': 'Password reset successfully'
            })
            
        except (User.DoesNotExist, ValueError, TypeError):
            return Response({
                'status': 'error',
                'message': 'Invalid reset token'
            }, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(generics.GenericAPIView):
    """
    View for user logout (blacklist refresh token).
    
    POST /auth/logout/
    """
    
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout user by blacklisting refresh token."""
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'status': 'success',
                'message': 'Logged out successfully'
            })
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class RoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing roles.
    
    Endpoints:
    - GET /roles/ - List roles
    - POST /roles/ - Create role
    - GET /roles/{id}/ - Retrieve role
    - PUT /roles/{id}/ - Update role
    - PATCH /roles/{id}/ - Partial update role
    - DELETE /roles/{id}/ - Delete role
    """
    
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Filter roles by tenant."""
        user = self.request.user
        
        # Platform admins can see all roles
        if user.is_platform_admin or user.is_superuser:
            return Role.objects.all()
        
        # Regular users see only their tenant's roles
        return Role.objects.filter(tenant=user.tenant)
    
    def perform_create(self, serializer):
        """Set created_by when creating role."""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Set updated_by when updating role."""
        serializer.save(updated_by=self.request.user)


class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for viewing permissions (read-only).
    
    Endpoints:
    - GET /permissions/ - List permissions
    - GET /permissions/{id}/ - Retrieve permission
    """
    
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_resource(self, request):
        """Get permissions grouped by resource."""
        permissions = Permission.objects.all()
        
        # Group by resource
        grouped = {}
        for perm in permissions:
            if perm.resource not in grouped:
                grouped[perm.resource] = []
            grouped[perm.resource].append(PermissionSerializer(perm).data)
        
        return Response(grouped)


class ImpersonationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for platform admin impersonation.
    
    Endpoints:
    - POST /impersonate/ - Start impersonation
    - POST /impersonate/{id}/end/ - End impersonation
    - GET /impersonate/logs/ - View impersonation logs
    """
    
    queryset = ImpersonationLog.objects.all()
    serializer_class = ImpersonationLogSerializer
    permission_classes = [IsAuthenticated, IsPlatformAdmin]
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """Start impersonating a user."""
        user_id = request.data.get('user_id')
        reason = request.data.get('reason', '')
        
        if not user_id:
            return Response({
                'status': 'error',
                'message': 'user_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            target_user = User.objects.get(id=user_id)
            
            # Create impersonation log
            log = ImpersonationLog.objects.create(
                impersonator=request.user,
                impersonated_user=target_user,
                tenant=target_user.tenant,
                ip_address=self.get_client_ip(request),
                reason=reason
            )
            
            # Generate token for impersonated user
            refresh = RefreshToken.for_user(target_user)
            
            return Response({
                'status': 'success',
                'message': f'Impersonating {target_user.email}',
                'impersonation_log_id': str(log.id),
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserProfileSerializer(target_user).data
            })
            
        except User.DoesNotExist:
            return Response({
                'status': 'error',
                'message': 'User not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'])
    def end(self, request, pk=None):
        """End an impersonation session."""
        log = self.get_object()
        log.ended_at = timezone.now()
        log.save(update_fields=['ended_at'])
        
        return Response({
            'status': 'success',
            'message': 'Impersonation ended'
        })
    
    @action(detail=False, methods=['get'])
    def logs(self, request):
        """Get impersonation logs."""
        logs = ImpersonationLog.objects.all().order_by('-started_at')
        
        # Filter by date range if provided
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if start_date:
            logs = logs.filter(started_at__gte=start_date)
        if end_date:
            logs = logs.filter(started_at__lte=end_date)
        
        serializer = ImpersonationLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    def get_client_ip(self, request):
        """Get client IP address from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
