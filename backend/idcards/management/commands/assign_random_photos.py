from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
import requests, random

from tenants.models import Tenant
from students.models import Student
from staff.models import Staff


class Command(BaseCommand):
    help = 'Assign real-looking random photos from randomuser.me to students and staff of a tenant'

    def add_arguments(self, parser):
        parser.add_argument('--tenant', required=True, help='Tenant subdomain or name')
        parser.add_argument('--overwrite', action='store_true', help='Overwrite existing photos')
        parser.add_argument('--results', type=int, default=60, help='Number of randomuser results to fetch')

    def handle(self, *args, **options):
        tenant_key = options['tenant']
        overwrite = options['overwrite']
        results = options['results']

        tenant = Tenant.objects.filter(subdomain__iexact=tenant_key).first() or Tenant.objects.filter(name__iexact=tenant_key).first()
        if not tenant:
            self.stdout.write(self.style.ERROR(f"Tenant '{tenant_key}' not found"))
            return

        self.stdout.write(f'Fetching random user pool ({results})...')
        try:
            resp = requests.get(f'https://randomuser.me/api/?results={results}&inc=picture,gender', timeout=15, verify=False)
            pool = resp.json().get('results', [])
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Failed to fetch images: {e}'))
            return

        male_photos = [r['picture']['large'] for r in pool if r.get('gender') == 'male']
        female_photos = [r['picture']['large'] for r in pool if r.get('gender') == 'female']
        self.stdout.write(f'Pools: {len(male_photos)} male, {len(female_photos)} female')

        cache = {}
        def download(url):
            if not url:
                return None
            if url in cache:
                return cache[url]
            try:
                r = requests.get(url, timeout=15, verify=False)
                if r.status_code == 200:
                    cache[url] = r.content
                    return r.content
            except Exception:
                return None
            return None

        # Students
        students = Student.objects.filter(tenant=tenant)
        self.stdout.write(f'Processing {students.count()} students...')
        for i, stu in enumerate(students):
            if stu.photo and not overwrite:
                continue
            gender_key = 'male' if stu.gender == 'M' else 'female'
            pool_list = male_photos if gender_key == 'male' else female_photos
            if not pool_list:
                pool_list = male_photos + female_photos
            if not pool_list:
                self.stdout.write(self.style.WARNING('No photos available in pool'))
                break
            url = random.choice(pool_list)
            content = download(url)
            if not content:
                continue
            filename = f"student_{stu.admission_number}_{random.randint(1000,9999)}.jpg"
            try:
                stu.photo.save(filename, ContentFile(content), save=True)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to save photo for {stu.admission_number}: {e}'))
            if (i+1) % 20 == 0:
                self.stdout.write(f'Updated {i+1}/{students.count()} students')

        # Staff
        staff_qs = Staff.objects.filter(tenant=tenant)
        self.stdout.write(f'Processing {staff_qs.count()} staff...')
        for i, member in enumerate(staff_qs):
            if member.photo and not overwrite:
                continue
            gender_key = member.gender.lower() if hasattr(member,'gender') and member.gender else 'male'
            pool_list = male_photos if gender_key.startswith('m') else female_photos
            if not pool_list:
                pool_list = male_photos + female_photos
            if not pool_list:
                break
            url = random.choice(pool_list)
            content = download(url)
            if not content:
                continue
            filename = f"staff_{getattr(member,'employee_id',member.id)}_{random.randint(1000,9999)}.jpg"
            try:
                member.photo.save(filename, ContentFile(content), save=True)
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Failed to save photo for staff {member.id}: {e}'))

        self.stdout.write(self.style.SUCCESS('Finished assigning photos'))
