import random
from io import BytesIO

from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError

from tenants.models import Tenant
from students.models import Student
from staff.models import Staff


def _generate_placeholder_image(text, size=(500, 620)):
    """Create a simple colored placeholder with initials."""
    from PIL import Image, ImageDraw, ImageFont

    palette = [
        (68, 138, 255),
        (0, 191, 165),
        (255, 160, 0),
        (244, 81, 30),
        (124, 77, 255),
        (0, 200, 83),
    ]
    bg = random.choice(palette)
    img = Image.new('RGB', size, color=bg)
    draw = ImageDraw.Draw(img)

    initials = ''.join([part[0].upper() for part in (text or '').split() if part]) or 'N/A'

    try:
        font = ImageFont.truetype("arial.ttf", 160)
    except Exception:
        font = ImageFont.load_default()

    text_bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = text_bbox[2] - text_bbox[0]
    text_height = text_bbox[3] - text_bbox[1]
    position = ((size[0] - text_width) / 2, (size[1] - text_height) / 2)
    draw.text(position, initials, fill=(255, 255, 255), font=font)

    buf = BytesIO()
    img.save(buf, format='PNG')
    return buf.getvalue()


class Command(BaseCommand):
    help = "Assign random placeholder photos for students and staff of a tenant."

    def add_arguments(self, parser):
        parser.add_argument('--tenant', required=True, help='Tenant name or subdomain (e.g., NMS)')
        parser.add_argument('--overwrite', action='store_true', help='Overwrite existing photos')
        parser.add_argument('--limit', type=int, default=None, help='Limit number of records per model for quick runs')

    def handle(self, *args, **options):
        tenant_key = options['tenant']
        overwrite = options['overwrite']
        limit = options['limit']

        tenant = Tenant.objects.filter(subdomain__iexact=tenant_key).first() or Tenant.objects.filter(name__iexact=tenant_key).first()
        if not tenant:
            raise CommandError(f"Tenant '{tenant_key}' not found")

        self.stdout.write(self.style.NOTICE(f"Seeding placeholder photos for tenant {tenant.name}"))

        student_qs = Student.objects.filter(tenant=tenant)
        staff_qs = Staff.objects.filter(tenant=tenant)

        if limit:
            student_qs = student_qs[:limit]
            staff_qs = staff_qs[:limit]

        updated_students = 0
        for student in student_qs:
            if student.photo and not overwrite:
                continue
            img_bytes = _generate_placeholder_image(student.get_full_name())
            filename = f"{student.id}.png"
            student.photo.save(filename, ContentFile(img_bytes), save=True)
            updated_students += 1

        updated_staff = 0
        for member in staff_qs:
            if member.photo and not overwrite:
                continue
            img_bytes = _generate_placeholder_image(member.get_full_name())
            filename = f"{member.id}.png"
            member.photo.save(filename, ContentFile(img_bytes), save=True)
            updated_staff += 1

        self.stdout.write(self.style.SUCCESS(f"Updated {updated_students} students and {updated_staff} staff photos for {tenant.name}."))