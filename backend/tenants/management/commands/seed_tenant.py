from django.core.management.base import BaseCommand
from django.conf import settings
import os
from datetime import date


class Command(BaseCommand):
    help = 'Seed dummy data for a tenant (branding, sample student, staff)'

    def add_arguments(self, parser):
        parser.add_argument('--subdomain', type=str, default='nms', help='Tenant subdomain')
        parser.add_argument('--base-url', type=str, default=os.environ.get('SITE_URL', 'http://localhost:8000'), help='Base URL for asset links')

    def handle(self, *args, **options):
        from tenants.models import Tenant, TenantBranding
        from django.contrib.auth import get_user_model
        User = get_user_model()

        subdomain = options['subdomain']
        base_url = options['base_url'].rstrip('/')

        tenant, created = Tenant.objects.get_or_create(
            subdomain=subdomain,
            defaults={
                'name': 'NMS School',
                'admin_email': f'admin@{subdomain}.local',
                'max_students': 500,
                'max_staff': 100,
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created tenant: {tenant}'))
        else:
            self.stdout.write(self.style.NOTICE(f'Tenant already exists: {tenant}'))

        # Prepare media directories
        media_root = settings.MEDIA_ROOT
        tenant_media_dir = os.path.join(media_root, 'tenants', subdomain)
        os.makedirs(tenant_media_dir, exist_ok=True)

        # Simple SVG assets
        logo_path = os.path.join(tenant_media_dir, 'logo.svg')
        favicon_path = os.path.join(tenant_media_dir, 'favicon.svg')
        login_bg_path = os.path.join(tenant_media_dir, 'login_bg.svg')
        gallery1_path = os.path.join(tenant_media_dir, 'gallery1.svg')
        gallery2_path = os.path.join(tenant_media_dir, 'gallery2.svg')

        svg_template = lambda text, w=400, h=120: f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}"><rect width="100%" height="100%" fill="#1976D2"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#fff">{text}</text></svg>'''

        with open(logo_path, 'w', encoding='utf-8') as f:
            f.write(svg_template('NMS'))
        with open(favicon_path, 'w', encoding='utf-8') as f:
            f.write(svg_template('N', 64, 64))
        with open(login_bg_path, 'w', encoding='utf-8') as f:
            f.write(svg_template('Welcome to NMS', 1200, 600))
        with open(gallery1_path, 'w', encoding='utf-8') as f:
            f.write(svg_template('Gallery 1'))
        with open(gallery2_path, 'w', encoding='utf-8') as f:
            f.write(svg_template('Gallery 2'))

        # Compose URLs
        logo_url = f"{base_url}/media/tenants/{subdomain}/logo.svg"
        favicon_url = f"{base_url}/media/tenants/{subdomain}/favicon.svg"
        login_bg_url = f"{base_url}/media/tenants/{subdomain}/login_bg.svg"
        gallery_urls = [
            f"{base_url}/media/tenants/{subdomain}/gallery1.svg",
            f"{base_url}/media/tenants/{subdomain}/gallery2.svg",
        ]

        branding_vals = {
            'logo_url': logo_url,
            'favicon_url': favicon_url,
            'login_background_url': login_bg_url,
            'email_header_image': login_bg_url,
            'primary_color': '#1976D2',
            'secondary_color': '#424242',
            'sidebar_color': '#263238',
            'font_family': 'Inter, sans-serif',
            'gallery_images': gallery_urls,
        }

        TenantBranding.objects.update_or_create(tenant=tenant, defaults=branding_vals)
        self.stdout.write(self.style.SUCCESS('Tenant branding created/updated'))

        # Create sample student
        try:
            from students.models import Student
            students_dir = os.path.join(media_root, 'students', 'photos')
            os.makedirs(students_dir, exist_ok=True)
            student_photo = os.path.join(students_dir, f'{subdomain}_student1.svg')
            with open(student_photo, 'w', encoding='utf-8') as f:
                f.write(svg_template('Student 1', 300, 300))

            student_data = {
                'tenant': tenant,
                'admission_number': f'{subdomain.upper()}-STU-001',
                'admission_date': date.today(),
                'first_name': 'Test',
                'last_name': 'Student',
                'date_of_birth': date(2015, 6, 1),
                'gender': 'M',
                'email': f'student1@{subdomain}.local',
                'phone': '9999999999',
                'address': '123 Main Street',
                'father_name': 'Father Name',
                'father_phone': '9999999998',
                'mother_name': 'Mother Name',
            }

            stu, sc = Student.objects.get_or_create(tenant=tenant, admission_number=student_data['admission_number'], defaults=student_data)
            if sc:
                # attach photo path relative to MEDIA_ROOT
                stu.photo.name = f'students/photos/{subdomain}_student1.svg'
                stu.save()
                self.stdout.write(self.style.SUCCESS('Sample student created'))
            else:
                self.stdout.write(self.style.NOTICE('Sample student already exists'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not create sample student: {e}'))

        # Create sample staff
        try:
            from staff.models import Staff
            staff_dir = os.path.join(media_root, 'staff', 'photos')
            os.makedirs(staff_dir, exist_ok=True)
            staff_photo = os.path.join(staff_dir, f'{subdomain}_staff1.svg')
            with open(staff_photo, 'w', encoding='utf-8') as f:
                f.write(svg_template('Staff 1', 300, 300))

            staff_data = {
                'tenant': tenant,
                'employee_id': f'{subdomain.upper()}-STF-001',
                'first_name': 'Test',
                'last_name': 'Staff',
                'designation': 'TEACHER',
                'joining_date': date.today(),
                'email': f'staff1@{subdomain}.local',
            }

            st, sc = Staff.objects.get_or_create(tenant=tenant, employee_id=staff_data['employee_id'], defaults=staff_data)
            if sc:
                self.stdout.write(self.style.SUCCESS('Sample staff created'))
            else:
                self.stdout.write(self.style.NOTICE('Sample staff already exists'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not create sample staff: {e}'))

        # Create an admin user for tenant (staff user)
        try:
            user_email = f'admin@{subdomain}.local'
            # If user exists, ensure tenant is set; otherwise create with tenant using manager
            existing = User.objects.filter(email=user_email).first()
            if existing:
                changed = False
                if not existing.tenant_id:
                    existing.tenant = tenant
                    changed = True
                if not existing.is_staff:
                    existing.is_staff = True
                    changed = True
                if changed:
                    existing.set_password('admin123')
                    existing.save()
                self.stdout.write(self.style.NOTICE(f'Tenant admin already exists: {user_email}'))
            else:
                # use manager to create without hitting TenantAwareModel.save tenant check
                try:
                    user = User.objects.create_user(email=user_email, password='admin123', tenant=tenant, is_staff=True, is_active=True)
                    self.stdout.write(self.style.SUCCESS(f'Created tenant admin user: {user_email} / admin123'))
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Create_user failed: {e}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not create tenant admin user: {e}'))

        # Ensure tenant admin has an Administrator role with basic module permissions
        try:
            # reload user instance
            admin_user = User.objects.filter(email=f'admin@{subdomain}.local').first()
            if admin_user:
                from users.models import Role, Permission, RolePermission, UserRole

                role, _ = Role.objects.get_or_create(
                    tenant=tenant,
                    code='administrator',
                    defaults={'name': 'Administrator', 'is_active': True}
                )

                # Ensure basic permissions exist and assign to role
                perms = [
                    ('student_module', 'read'),
                    ('student_module', 'create'),
                    ('student_module', 'update'),
                    ('student_module', 'delete'),
                ]

                for resource, action in perms:
                    perm, _ = Permission.objects.get_or_create(resource=resource, action=action)
                    RolePermission.objects.get_or_create(role=role, permission=perm)

                # Assign role to user
                UserRole.objects.get_or_create(user=admin_user, role=role)
                self.stdout.write(self.style.SUCCESS('Assigned Administrator role and permissions to tenant admin'))
            else:
                self.stdout.write(self.style.WARNING('Tenant admin user not found; skipping role assignment'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Could not assign role/permissions: {e}'))

        self.stdout.write(self.style.SUCCESS('Seeding complete'))
