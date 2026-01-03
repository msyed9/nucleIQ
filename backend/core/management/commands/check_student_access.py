from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Check student list access for tenant admin via APIClient'

    def handle(self, *args, **options):
        from rest_framework.test import APIClient
        client = APIClient()

        email = 'admin@nms.local'
        password = 'admin123'

        self.stdout.write(f'Logging in as {email}')
        # Ensure host header so middleware can detect domain and avoid DisallowedHost
        resp = client.post('/api/auth/login/', {'email': email, 'password': password}, format='json', HTTP_HOST='localhost:8000')
        self.stdout.write(f'Login status: {resp.status_code}')
        # DRF returns Response with .data; HttpResponse may not have it
        try:
            self.stdout.write(str(resp.data))
        except Exception:
            self.stdout.write(str(resp.content))

        access = resp.data.get('access') if resp.data else None
        tenant = None
        if resp.data:
            tenant = resp.data.get('tenant') or (resp.data.get('user') or {}).get('tenant')

        self.stdout.write(f'Extracted tenant: {tenant}')

        if access:
            # Set auth header and tenant header as client would
            if tenant:
                client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}', HTTP_X_TENANT_ID=tenant)
            else:
                client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

            r = client.get('/api/students/students/', HTTP_HOST='localhost:8000')
            self.stdout.write(f'Students status: {r.status_code}')
            try:
                self.stdout.write(f'Students data: {str(r.data)[:1000]}')
            except Exception:
                self.stdout.write(f'Students content: {r.content}')
        else:
            self.stdout.write('No access token returned from login')
