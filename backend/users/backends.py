"""
RBAC Custom Authentication Backend
Provides role-based authentication logic.
"""

from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model

User = get_user_model()


class RoleBasedAuthBackend(ModelBackend):
    """
    Custom authentication backend that includes role checking.
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user and verify active status and role requirements.
        
        Args:
            request: HTTP request object
            username: Username or email
            password: User password
            **kwargs: Additional authentication parameters
        
        Returns:
            User instance if authentication successful, None otherwise
        """
        # Try to get user by email (our USERNAME_FIELD)
        try:
            user = User.objects.select_related('tenant').prefetch_related('roles').get(
                email=username
            )
        except User.DoesNotExist:
            # Run the default password hasher once to reduce timing
            # difference between existing and non-existing users
            User().set_password(password)
            return None
        
        # Check password
        if not user.check_password(password):
            return None
        
        # Check if user is active
        if not user.is_active:
            return None
        
        # For regular users (non-platform admins), check tenant is active
        if not user.is_platform_admin and user.tenant:
            if not user.tenant.is_active:
                return None
        
        # Successful authentication
        return user
    
    def get_user(self, user_id):
        """
        Get user by ID with prefetched roles.
        
        Args:
            user_id: User primary key
        
        Returns:
            User instance or None
        """
        try:
            user = User.objects.select_related('tenant').prefetch_related('roles').get(pk=user_id)
            return user if user.is_active else None
        except User.DoesNotExist:
            return None
