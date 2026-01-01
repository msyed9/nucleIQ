from django.core.management.base import BaseCommand
from students.models import Student
from staff.models import Staff
import requests
from django.core.files.base import ContentFile
import random

class Command(BaseCommand):
    help = 'Update students and staff with random photos'

    def handle(self, *args, **options):
        self.stdout.write('Fetching random user data...')
        results = []
        try:
            # Fetch 50 users to use as a pool
            resp = requests.get('https://randomuser.me/api/?results=50&inc=picture,gender')
            results = resp.json().get('results', [])
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching photos: {e}'))
            return

        if not results:
            self.stdout.write(self.style.ERROR('No results from randomuser.me'))
            return

        male_photos = [r['picture']['large'] for r in results if r['gender'] == 'male']
        female_photos = [r['picture']['large'] for r in results if r['gender'] == 'female']
        
        self.stdout.write(f'Pool size: {len(male_photos)} Male, {len(female_photos)} Female')

        # Cache downloaded images content
        image_content_cache = {} 

        def get_image_content(url):
            if url in image_content_cache:
                return image_content_cache[url]
            try:
                r = requests.get(url, timeout=10)
                if r.status_code == 200:
                    image_content_cache[url] = r.content
                    return r.content
            except Exception as e:
                # self.stdout.write(f"Failed to download {url}: {e}")
                pass
            return None

        # Update Staff
        staff_members = Staff.objects.filter(photo='')
        total_staff = staff_members.count()
        self.stdout.write(f'Updating {total_staff} staff members...')
        
        for i, staff in enumerate(staff_members):
            pool = male_photos if staff.gender == 'MALE' else female_photos
            if not pool: pool = male_photos + female_photos
            
            if pool:
                url = random.choice(pool)
                content = get_image_content(url)
                if content:
                    filename = f"staff_{staff.employee_id}_{random.randint(1000, 9999)}.jpg"
                    staff.photo.save(filename, ContentFile(content), save=True)
                    if i % 10 == 0:
                        self.stdout.write(f'Processed {i+1}/{total_staff} staff')

        # Update Students
        students = Student.objects.filter(photo='')
        total_students = students.count()
        self.stdout.write(f'Updating {total_students} students...')
        
        for i, student in enumerate(students):
            gender_key = 'male' if student.gender == 'M' else 'female'
            pool = male_photos if gender_key == 'male' else female_photos
            # Fallback if pool is empty (unlikely with 50 results unless skew)
            if not pool: pool = male_photos + female_photos

            if pool:
                url = random.choice(pool)
                content = get_image_content(url)
                if content:
                    filename = f"student_{student.admission_number}_{random.randint(1000, 9999)}.jpg"
                    student.photo.save(filename, ContentFile(content), save=True)
            
            if i % 50 == 0:
                self.stdout.write(f'Processed {i+1}/{total_students} students')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully updated photos for {total_staff} staff and {total_students} students'))
