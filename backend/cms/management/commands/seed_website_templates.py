"""
Management command to seed system website templates.
Run: python manage.py seed_website_templates
"""
from django.core.management.base import BaseCommand
from cms.models import WebsiteTemplate
import json


class Command(BaseCommand):
    help = 'Seed system website templates into the database'

    def handle(self, *args, **options):
        self.stdout.write('Seeding website templates...')
        
        templates_data = self.get_templates()
        
        for tmpl in templates_data:
            obj, created = WebsiteTemplate.objects.update_or_create(
                name=tmpl['name'],
                is_system=True,
                defaults={
                    'description': tmpl['description'],
                    'category': tmpl['category'],
                    'thumbnail': tmpl['thumbnail'],
                    'primary_color': tmpl['primaryColor'],
                    'secondary_color': tmpl['secondaryColor'],
                    'accent_color': tmpl['accentColor'],
                    'font_family': tmpl['fontFamily'],
                    'structure': {'pages': tmpl['pages']},
                    'is_active': True,
                    'version': '1.0'
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: {tmpl["name"]}')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(templates_data)} templates'))

    def get_templates(self):
        """Returns the template definitions"""
        return [
            {
                'id': 'modern-blue-academy',
                'name': 'Modern Blue Academy',
                'description': 'Clean, professional design with blue accents. Perfect for progressive schools.',
                'category': 'modern',
                'thumbnail': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                'primaryColor': '#2563eb',
                'secondaryColor': '#1e40af',
                'accentColor': '#60a5fa',
                'fontFamily': 'Inter, sans-serif',
                'pages': self._get_modern_blue_pages()
            },
            {
                'id': 'green-valley-school',
                'name': 'Green Valley School',
                'description': 'Nature-inspired design with eco-friendly vibes.',
                'category': 'modern',
                'thumbnail': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                'primaryColor': '#059669',
                'secondaryColor': '#047857',
                'accentColor': '#34d399',
                'fontFamily': 'Poppins, sans-serif',
                'pages': self._get_green_valley_pages()
            },
            {
                'id': 'classic-heritage-academy',
                'name': 'Classic Heritage Academy',
                'description': 'Traditional, prestigious design with gold accents.',
                'category': 'classic',
                'thumbnail': 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                'primaryColor': '#1a1a2e',
                'secondaryColor': '#16213e',
                'accentColor': '#d4af37',
                'fontFamily': 'Playfair Display, serif',
                'pages': self._get_classic_heritage_pages()
            },
            {
                'id': 'minimal-white-school',
                'name': 'Minimal White School',
                'description': 'Clean, minimalist design with lots of white space.',
                'category': 'minimal',
                'thumbnail': 'linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)',
                'primaryColor': '#111827',
                'secondaryColor': '#374151',
                'accentColor': '#6366f1',
                'fontFamily': 'DM Sans, sans-serif',
                'pages': self._get_minimal_white_pages()
            },
            {
                'id': 'vibrant-kids-school',
                'name': 'Vibrant Kids School',
                'description': 'Colorful, playful design perfect for kindergartens.',
                'category': 'vibrant',
                'thumbnail': 'linear-gradient(135deg, #FF6B6B 0%, #FFE66D 50%, #4ECDC4 100%)',
                'primaryColor': '#FF6B6B',
                'secondaryColor': '#4ECDC4',
                'accentColor': '#FFE66D',
                'fontFamily': 'Nunito, sans-serif',
                'pages': self._get_vibrant_kids_pages()
            },
        ]

    def _get_modern_blue_pages(self):
        return [
            {
                'title': 'Home', 'slug': 'home', 'page_type': 'HOME',
                'sections': [
                    {'id': 'hero_1', 'component_type': 'HERO', 'title': 'Welcome Hero',
                     'content': {'heading': "Shaping Tomorrow's Leaders Today", 'subheading': 'A premier institution dedicated to academic excellence.',
                                 'buttonText': 'Apply Now', 'buttonLink': '/admissions',
                                 'backgroundImage': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920'},
                     'order': 0, 'is_visible': True, 'background_color': '#1e40af', 'text_color': '#ffffff'},
                    {'id': 'stats_1', 'component_type': 'STATS', 'title': 'Key Statistics',
                     'content': {'stats': [{'value': '2500+', 'label': 'Students'}, {'value': '150+', 'label': 'Faculty'},
                                           {'value': '25+', 'label': 'Years'}, {'value': '98%', 'label': 'Success Rate'}]},
                     'order': 1, 'is_visible': True, 'background_color': '#ffffff'},
                    {'id': 'features_1', 'component_type': 'FEATURES', 'title': 'Why Choose Us',
                     'content': {'heading': 'Why Choose Our School', 'features': [
                         {'icon': '🎓', 'title': 'Academic Excellence', 'description': 'Rigorous curriculum with personalized attention.'},
                         {'icon': '🔬', 'title': 'Modern Labs', 'description': 'State-of-the-art science and computer laboratories.'},
                         {'icon': '⚽', 'title': 'Sports Facilities', 'description': 'Olympic-standard sports infrastructure.'},
                         {'icon': '🎨', 'title': 'Arts & Culture', 'description': 'Comprehensive arts, music, and theater programs.'}
                     ]}, 'order': 2, 'is_visible': True, 'background_color': '#f8fafc'},
                ]
            },
            {'title': 'About Us', 'slug': 'about', 'page_type': 'ABOUT', 'sections': [
                {'id': 'header_about', 'component_type': 'PAGE_HEADER', 'title': 'About Header',
                 'content': {'heading': 'About Our Institution', 'breadcrumb': 'Home > About Us'},
                 'order': 0, 'is_visible': True, 'background_color': '#1e40af', 'text_color': '#ffffff'},
            ]},
            {'title': 'Academics', 'slug': 'academics', 'page_type': 'ACADEMICS', 'sections': [
                {'id': 'header_acad', 'component_type': 'PAGE_HEADER', 'title': 'Academics Header',
                 'content': {'heading': 'Academic Programs', 'breadcrumb': 'Home > Academics'},
                 'order': 0, 'is_visible': True, 'background_color': '#1e40af', 'text_color': '#ffffff'},
            ]},
            {'title': 'Admissions', 'slug': 'admissions', 'page_type': 'ADMISSIONS', 'sections': [
                {'id': 'header_adm', 'component_type': 'PAGE_HEADER', 'title': 'Admissions Header',
                 'content': {'heading': 'Join Our Community', 'breadcrumb': 'Home > Admissions'},
                 'order': 0, 'is_visible': True, 'background_color': '#1e40af', 'text_color': '#ffffff'},
            ]},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': [
                {'id': 'header_contact', 'component_type': 'PAGE_HEADER', 'title': 'Contact Header',
                 'content': {'heading': 'Get In Touch', 'breadcrumb': 'Home > Contact'},
                 'order': 0, 'is_visible': True, 'background_color': '#1e40af', 'text_color': '#ffffff'},
                {'id': 'contact_form', 'component_type': 'CONTACT', 'title': 'Contact Form',
                 'content': {'address': '123 Education Way', 'phone': '+1 (555) 123-4567', 'email': 'info@academy.edu'},
                 'order': 1, 'is_visible': True},
            ]},
        ]

    def _get_green_valley_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_gv', 'component_type': 'HERO', 'title': 'Welcome Hero',
                 'content': {'heading': 'Where Nature Meets Knowledge', 'subheading': 'An eco-conscious school nurturing future leaders',
                             'buttonText': 'Explore Campus', 'buttonLink': '/about'},
                 'order': 0, 'is_visible': True, 'background_color': '#059669', 'text_color': '#ffffff'},
            ]},
            {'title': 'About Us', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': []},
        ]

    def _get_classic_heritage_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_ch', 'component_type': 'HERO', 'title': 'Welcome Hero',
                 'content': {'heading': 'A Legacy of Excellence Since 1925', 'subheading': 'Nurturing Scholars and Leaders',
                             'buttonText': 'Request Prospectus', 'buttonLink': '/admissions'},
                 'order': 0, 'is_visible': True, 'background_color': '#1a1a2e', 'text_color': '#ffffff'},
            ]},
            {'title': 'About Us', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': []},
        ]

    def _get_minimal_white_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_mw', 'component_type': 'HERO', 'title': 'Minimal Hero',
                 'content': {'heading': 'Education. Simplified.', 'subheading': 'Focus on what truly matters',
                             'buttonText': 'Learn More', 'buttonLink': '/about'},
                 'order': 0, 'is_visible': True, 'background_color': '#ffffff', 'text_color': '#111827'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': []},
        ]

    def _get_vibrant_kids_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_vk', 'component_type': 'HERO', 'title': 'Kids Hero',
                 'content': {'heading': 'Where Learning is Fun! 🎨', 'subheading': 'Nurturing young minds through play',
                             'buttonText': 'Join Us!', 'buttonLink': '/admissions'},
                 'order': 0, 'is_visible': True, 'background_color': '#FFE66D', 'text_color': '#333333'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': []},
        ]
