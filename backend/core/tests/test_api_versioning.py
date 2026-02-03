"""Tests for API version routing middleware."""

from django.test import TestCase, RequestFactory
from core.middleware import ApiVersionRoutingMiddleware
from tenants.models import Tenant, TenantSettings


class ApiVersionRoutingMiddlewareTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()
        # Middleware requires a get_response callable; provide a no-op for tests
        self.middleware = ApiVersionRoutingMiddleware(get_response=lambda req: None)

    def _create_tenant(self, default_version='v1', module_versions=None):
        tenant = Tenant.objects.create(
            name='Test School',
            subdomain='testschool',
            admin_email='admin@testschool.com'
        )
        TenantSettings.objects.create(
            tenant=tenant,
            api_default_version=default_version,
            api_module_versions=module_versions or {}
        )
        return tenant

    def test_default_version_without_tenant(self):
        request = self.factory.get('/api/students/')
        self.middleware.process_request(request)

        self.assertEqual(request.path_info, '/api/v1/students/')
        self.assertEqual(request.resolved_api_version, 'v1')

    def test_tenant_default_version(self):
        tenant = self._create_tenant(default_version='v2')
        request = self.factory.get('/api/students/')
        request.tenant = tenant

        self.middleware.process_request(request)

        self.assertEqual(request.path_info, '/api/v2/students/')
        self.assertEqual(request.resolved_api_version, 'v2')

    def test_module_override(self):
        tenant = self._create_tenant(
            default_version='v2',
            module_versions={'students': 'v1'}
        )
        request = self.factory.get('/api/students/')
        request.tenant = tenant

        self.middleware.process_request(request)

        self.assertEqual(request.path_info, '/api/v1/students/')
        self.assertEqual(request.resolved_api_version, 'v1')

    def test_invalid_module_override_falls_back(self):
        tenant = self._create_tenant(
            default_version='v2',
            module_versions={'students': 'v9'}
        )
        request = self.factory.get('/api/students/')
        request.tenant = tenant

        self.middleware.process_request(request)

        self.assertEqual(request.path_info, '/api/v2/students/')
        self.assertEqual(request.resolved_api_version, 'v2')