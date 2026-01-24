"""
Test Cases for Session Timeout Configuration

These tests verify that the session timeout configuration works correctly
for both JWT tokens and Django admin sessions.
"""

from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from tenants.models import Tenant
from users.serializers import CustomTokenObtainPairSerializer, UnifiedLoginSerializer
from users.middleware_session import AdminSessionTimeoutMiddleware
from datetime import datetime, timedelta
import jwt
from django.conf import settings

User = get_user_model()


class SessionTimeoutModelTest(TestCase):
    """Test the Tenant model session timeout fields and validation."""
    
    def setUp(self):
        self.tenant = Tenant.objects.create(
            name="Test School",
            subdomain="testschool",
            admin_email="admin@testschool.com"
        )
    
    def test_default_timeout_values(self):
        """Test that default timeout values are set correctly."""
        self.assertEqual(self.tenant.session_timeout_minutes, 60)
        self.assertEqual(self.tenant.refresh_timeout_days, 7)
        self.assertEqual(self.tenant.admin_session_timeout_minutes, 120)
    
    def test_session_timeout_validation_min(self):
        """Test that session timeout cannot be less than 5 minutes."""
        from django.core.exceptions import ValidationError
        
        self.tenant.session_timeout_minutes = 4
        with self.assertRaises(ValidationError):
            self.tenant.full_clean()
    
    def test_session_timeout_validation_max(self):
        """Test that session timeout cannot exceed 1440 minutes."""
        from django.core.exceptions import ValidationError
        
        self.tenant.session_timeout_minutes = 1441
        with self.assertRaises(ValidationError):
            self.tenant.full_clean()
    
    def test_refresh_timeout_validation_min(self):
        """Test that refresh timeout cannot be less than 1 day."""
        from django.core.exceptions import ValidationError
        
        self.tenant.refresh_timeout_days = 0
        with self.assertRaises(ValidationError):
            self.tenant.full_clean()
    
    def test_refresh_timeout_validation_max(self):
        """Test that refresh timeout cannot exceed 30 days."""
        from django.core.exceptions import ValidationError
        
        self.tenant.refresh_timeout_days = 31
        with self.assertRaises(ValidationError):
            self.tenant.full_clean()
    
    def test_valid_custom_timeouts(self):
        """Test that valid custom timeout values are accepted."""
        self.tenant.session_timeout_minutes = 30
        self.tenant.refresh_timeout_days = 14
        self.tenant.admin_session_timeout_minutes = 90
        
        # Should not raise any exception
        self.tenant.full_clean()
        self.tenant.save()
        
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.session_timeout_minutes, 30)
        self.assertEqual(self.tenant.refresh_timeout_days, 14)
        self.assertEqual(self.tenant.admin_session_timeout_minutes, 90)


class SessionTimeoutAPITest(APITestCase):
    """Test the session timeout API endpoints."""
    
    def setUp(self):
        # Create tenant
        self.tenant = Tenant.objects.create(
            name="Test School",
            subdomain="testschool",
            admin_email="admin@testschool.com"
        )
        
        # Create user
        self.user = User.objects.create_user(
            email="admin@testschool.com",
            password="testpass123",
            tenant=self.tenant,
            first_name="Admin",
            last_name="User"
        )
        
        # Authenticate
        self.client.force_authenticate(user=self.user)
    
    def test_get_session_timeout_settings(self):
        """Test retrieving current session timeout settings."""
        response = self.client.get('/api/tenants/session-timeout/')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['session_timeout_minutes'], 60)
        self.assertEqual(response.data['refresh_timeout_days'], 7)
        self.assertEqual(response.data['admin_session_timeout_minutes'], 120)
    
    def test_update_session_timeout_settings(self):
        """Test updating session timeout settings."""
        data = {
            'session_timeout_minutes': 30,
            'refresh_timeout_days': 14,
            'admin_session_timeout_minutes': 90
        }
        
        response = self.client.patch('/api/tenants/session-timeout/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['session_timeout_minutes'], 30)
        self.assertEqual(response.data['refresh_timeout_days'], 14)
        self.assertEqual(response.data['admin_session_timeout_minutes'], 90)
        
        # Verify in database
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.session_timeout_minutes, 30)
        self.assertEqual(self.tenant.refresh_timeout_days, 14)
        self.assertEqual(self.tenant.admin_session_timeout_minutes, 90)
    
    def test_update_partial_settings(self):
        """Test partial update (only updating some fields)."""
        data = {
            'session_timeout_minutes': 45
        }
        
        response = self.client.patch('/api/tenants/session-timeout/', data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['session_timeout_minutes'], 45)
        self.assertEqual(response.data['refresh_timeout_days'], 7)  # Unchanged
    
    def test_update_with_invalid_values(self):
        """Test that invalid values are rejected."""
        data = {
            'session_timeout_minutes': 2000  # Exceeds maximum
        }
        
        response = self.client.patch('/api/tenants/session-timeout/', data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AdminSessionMiddlewareTest(TestCase):
    """Test the AdminSessionTimeoutMiddleware."""
    
    def setUp(self):
        self.factory = RequestFactory()
        self.middleware = AdminSessionTimeoutMiddleware(lambda x: None)
        
        self.tenant = Tenant.objects.create(
            name="Test School",
            subdomain="testschool",
            admin_email="admin@testschool.com",
            admin_session_timeout_minutes=90
        )
        
        self.user = User.objects.create_user(
            email="admin@testschool.com",
            password="testpass123",
            tenant=self.tenant
        )
    
    def test_admin_session_timeout_applied(self):
        """Test that admin session timeout is applied to admin requests."""
        request = self.factory.get('/admin/')
        request.user = self.user
        request.session = {}
        
        # Mock session.set_expiry
        expiry_set = []
        request.session.set_expiry = lambda x: expiry_set.append(x)
        
        self.middleware.process_request(request)
        
        # Verify session expiry was set to 90 minutes (in seconds)
        expected_seconds = 90 * 60
        self.assertEqual(expiry_set[0], expected_seconds)
    
    def test_non_admin_request_not_affected(self):
        """Test that non-admin requests are not affected."""
        request = self.factory.get('/api/students/')
        request.user = self.user
        request.session = {}
        
        expiry_set = []
        request.session.set_expiry = lambda x: expiry_set.append(x)
        
        self.middleware.process_request(request)
        
        # Session expiry should not be set for non-admin requests
        self.assertEqual(len(expiry_set), 0)


# Manual Testing Guide
"""
MANUAL TESTING STEPS:

1. Apply Migration:
   python backend/manage.py migrate tenants

2. Test JWT Token Timeout:
   a. Log in via API: POST /api/auth/unified-login/
   b. Decode the access token and check 'exp' claim
   c. Verify it expires in tenant's session_timeout_minutes

3. Test Refresh Token Timeout:
   a. Decode the refresh token and check 'exp' claim
   b. Verify it expires in tenant's refresh_timeout_days

4. Test Django Admin Session:
   a. Log into Django admin at /admin/
   b. Check browser cookies for sessionid
   c. Wait for admin_session_timeout_minutes + 1 minute
   d. Try accessing admin page - should be logged out

5. Test API Endpoint:
   a. GET /api/tenants/session-timeout/ - Should return current values
   b. PATCH /api/tenants/session-timeout/ with new values
   c. Log in again and verify new timeouts are applied

6. Test Validation:
   a. Try setting session_timeout_minutes = 2 (should fail)
   b. Try setting refresh_timeout_days = 50 (should fail)
   c. Try valid values - should succeed

7. Test Tenant Isolation:
   a. Create two tenants with different timeout values
   b. Log in as users from each tenant
   c. Verify each gets their tenant's timeout values
"""
