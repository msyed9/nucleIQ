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
                    'version': '2.0'
                }
            )
            action = 'Created' if created else 'Updated'
            self.stdout.write(f'  {action}: {tmpl["name"]}')
        
        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(templates_data)} templates'))

    def get_templates(self):
        """Returns the template definitions with stunning, highly-detailed designs"""
        return [
            {
                'id': 'nexgen-innovators',
                'name': 'NexGen Innovators',
                'description': 'A sleek, futuristic dark-mode design with neon accents. Ideal for STEM and modern forward-thinking institutions.',
                'category': 'modern',
                'thumbnail': 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
                'primaryColor': '#0F172A',
                'secondaryColor': '#1E293B',
                'accentColor': '#38BDF8',
                'fontFamily': '"Outfit", sans-serif',
                'pages': self._get_nexgen_pages()
            },
            {
                'id': 'elevate-academy',
                'name': 'Elevate Academy',
                'description': 'A premium, highly professional template with deep navy and rich gold styling for prestigious academies.',
                'category': 'professional',
                'thumbnail': 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                'primaryColor': '#1A1832',
                'secondaryColor': '#2D2A54',
                'accentColor': '#D4AF37',
                'fontFamily': '"Playfair Display", serif',
                'pages': self._get_elevate_pages()
            },
            {
                'id': 'lumina-kids',
                'name': 'Lumina Kids Primary',
                'description': 'Vibrant, colorful, and playful. Uses soft, candy-like colors perfect for kindergartens and primary schools.',
                'category': 'vibrant',
                'thumbnail': 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
                'primaryColor': '#FF6B6B',
                'secondaryColor': '#4ECDC4',
                'accentColor': '#FFE66D',
                'fontFamily': '"Nunito", "Comic Sans MS", sans-serif',
                'pages': self._get_lumina_pages()
            },
            {
                'id': 'verdant-charter',
                'name': 'Verdant Charter',
                'description': 'An eco-friendly, nature-inspired theme utilizing deep greens and earthy tones for an organic feel.',
                'category': 'classic',
                'thumbnail': 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                'primaryColor': '#064E3B',
                'secondaryColor': '#047857',
                'accentColor': '#FCD34D',
                'fontFamily': '"Inter", sans-serif',
                'pages': self._get_verdant_pages()
            },
            {
                'id': 'apex-minimal',
                'name': 'Apex Minimal',
                'description': 'Clean, ultra-minimalist design with high contrast, expansive white space, and bold typography.',
                'category': 'minimal',
                'thumbnail': 'linear-gradient(to right, #ece9e6, #ffffff)',
                'primaryColor': '#FFFFFF',
                'secondaryColor': '#F3F4F6',
                'accentColor': '#6366F1',
                'fontFamily': '"DM Sans", sans-serif',
                'pages': self._get_apex_pages()
            },
            {
                'id': 'global-university',
                'name': 'Global University',
                'description': 'A prestigious, modern university template aimed at higher education and extensive campuses.',
                'category': 'professional',
                'thumbnail': 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
                'primaryColor': '#0F2027',
                'secondaryColor': '#203A43',
                'accentColor': '#F5A623',
                'fontFamily': '"Merriweather", serif',
                'pages': self._get_global_pages()
            },
            {
                'id': 'athletic-excellence',
                'name': 'Athletic Excellence',
                'description': 'High-energy, bold design for sports academies and athletic programs. Deep blacks and vibrant orange.',
                'category': 'modern',
                'thumbnail': 'linear-gradient(135deg, #000000 0%, #434343 100%)',
                'primaryColor': '#111111',
                'secondaryColor': '#222222',
                'accentColor': '#FF4D00',
                'fontFamily': '"Oswald", sans-serif',
                'pages': self._get_athletic_pages()
            },
            {
                'id': 'creative-arts',
                'name': 'Creative Arts Institute',
                'description': 'A visually stunning layout with asymmetrical elements and pastel highlights for art and design schools.',
                'category': 'vibrant',
                'thumbnail': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                'primaryColor': '#FAFAFA',
                'secondaryColor': '#FFFFFF',
                'accentColor': '#FF6B6B',
                'fontFamily': '"Poppins", sans-serif',
                'pages': self._get_creative_pages()
            },
        ]

    def _get_nexgen_pages(self):
        return [
            {
                'title': 'Home', 'slug': 'home', 'page_type': 'HOME',
                'sections': [
                    {'id': 'hero_1', 'component_type': 'HERO', 'title': 'Hero',
                     'content': {'heading': "Empowering the Next Generation of Innovators", 'subheading': 'Cutting-edge curriculum, state-of-the-art facilities, and a limitless future.',
                                 'buttonText': 'Discover Our Programs', 'buttonLink': '/academics',
                                 'backgroundImage': 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80'},
                     'order': 0, 'is_visible': True, 'background_color': '#0F172A', 'text_color': '#FFFFFF'},
                    {'id': 'features_1', 'component_type': 'FEATURES', 'title': 'Features',
                     'content': {'heading': 'The NexGen Advantage', 'features': [
                         {'icon': '🚀', 'title': 'Advanced Robotics', 'description': 'Hands-on learning in our dedicated AI and Robotics lab.'},
                         {'icon': '💻', 'title': '1:1 Tech Program', 'description': 'Every student is equipped with the latest technology.'},
                         {'icon': '🌐', 'title': 'Global Connectivity', 'description': 'Collaborate with schools around the world.'},
                         {'icon': '🔬', 'title': 'STEM Focused', 'description': 'Award-winning science and mathematics curriculum.'}
                     ]}, 'order': 1, 'is_visible': True, 'background_color': '#1E293B', 'text_color': '#E2E8F0'},
                    {'id': 'stats_1', 'component_type': 'STATS', 'title': 'Stats',
                     'content': {'stats': [{'value': '100%', 'label': 'College Acceptance'}, {'value': '40+', 'label': 'Tech Labs'},
                                           {'value': '15:1', 'label': 'Student-Teacher Ratio'}, {'value': '2K+', 'label': 'Alumni Network'}]},
                     'order': 2, 'is_visible': True, 'background_color': '#0F172A', 'text_color': '#38BDF8'},
                    {'id': 'cta_1', 'component_type': 'CTA', 'title': 'Call to Action',
                     'content': {'heading': 'Ready to Join the Future?', 'subheading': 'Applications are now open for the upcoming academic year.',
                                 'buttonText': 'Apply Now', 'buttonLink': '/admissions'},
                     'order': 3, 'is_visible': True, 'background_color': '#38BDF8', 'text_color': '#0F172A'},
                ]
            },
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': [
                {'id': 'header_about', 'component_type': 'PAGE_HEADER', 'title': 'About Header',
                 'content': {'heading': 'Who We Are', 'breadcrumb': 'Home > About'},
                 'order': 0, 'is_visible': True, 'background_color': '#0F172A', 'text_color': '#FFFFFF'},
            ]},
            {'title': 'Contact', 'slug': 'contact', 'page_type': 'CONTACT', 'sections': [
                {'id': 'header_contact', 'component_type': 'PAGE_HEADER', 'title': 'Contact Header',
                 'content': {'heading': 'Connect With Us', 'breadcrumb': 'Home > Contact'},
                 'order': 0, 'is_visible': True, 'background_color': '#0F172A', 'text_color': '#FFFFFF'},
            ]}
        ]

    def _get_elevate_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_2', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'A Tradition of Excellence', 'subheading': 'Nurturing intellectual curiosity and moral character in a stately environment.',
                             'buttonText': 'Request Prospectus', 'buttonLink': '/admissions',
                             'backgroundImage': 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#1A1832', 'text_color': '#FFFFFF'},
                {'id': 'features_2', 'component_type': 'FEATURES', 'title': 'Core Values',
                 'content': {'heading': 'Our Core Pillars', 'features': [
                     {'icon': '🏛️', 'title': 'Heritage', 'description': 'Built upon decades of esteemed educational traditions.'},
                     {'icon': '⚖️', 'title': 'Integrity', 'description': 'Fostering strong moral compasses in all our students.'},
                     {'icon': '🎻', 'title': 'Arts', 'description': 'A profoundly deep appreciation for classical arts and music.'},
                     {'icon': '🏆', 'title': 'Achievement', 'description': 'Unparalleled academic tracking and scholarship program.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#FFFFFF', 'text_color': '#1A1832'},
                {'id': 'testimonial_1', 'component_type': 'TESTIMONIALS', 'title': 'Testimonials',
                 'content': {'heading': 'Voices of Elevate', 'testimonials': [
                     {'name': 'Arthur Pendelton', 'quote': '"The level of academic rigor combined with pastoral care is simply unmatched."', 'role': 'Parent'},
                     {'name': 'Dr. Eleanor Vance', 'quote': '"We prepare our students not just for exams, but for life."', 'role': 'Headmistress'}
                 ]}, 'order': 2, 'is_visible': True, 'background_color': '#F8F9FA', 'text_color': '#1A1832'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Admissions', 'slug': 'admissions', 'page_type': 'ADMISSIONS', 'sections': []}
        ]

    def _get_lumina_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_3', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Sparking Joy in Every Child! ✨', 'subheading': 'Where imagination meets education in a vibrant, safe, and loving environment.',
                             'buttonText': 'Book a Tour', 'buttonLink': '/contact',
                             'backgroundImage': 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#FF6B6B', 'text_color': '#FFFFFF'},
                {'id': 'features_3', 'component_type': 'FEATURES', 'title': 'Why Lumina?',
                 'content': {'heading': 'Why Kids Love Us', 'features': [
                     {'icon': '🎨', 'title': 'Creative Play', 'description': 'Learning through art, music, and interactive playsets.'},
                     {'icon': '🌳', 'title': 'Outdoor Adventures', 'description': 'Spacious and secure outdoor playgrounds.'},
                     {'icon': '🍎', 'title': 'Healthy Meals', 'description': 'Nutritious organic meals prepared fresh daily.'},
                     {'icon': '🤗', 'title': 'Caring Staff', 'description': 'Certified early childhood educators who truly care.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#FFFFFF', 'text_color': '#333333'},
            ]},
            {'title': 'Programs', 'slug': 'programs', 'page_type': 'ACADEMICS', 'sections': []}
        ]

    def _get_verdant_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_4', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Rooted in Nature, Growing in Knowledge', 'subheading': 'An environment where students grow in harmony with the natural world.',
                             'buttonText': 'Discover Verdant', 'buttonLink': '/about',
                             'backgroundImage': 'https://images.unsplash.com/photo-1425421669292-0c3da3b8f529?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#064E3B', 'text_color': '#FFFFFF'},
                {'id': 'features_4', 'component_type': 'FEATURES', 'title': 'Features',
                 'content': {'heading': 'A Unique Approach', 'features': [
                     {'icon': '🌱', 'title': 'Eco-Curriculum', 'description': 'Integrating environmental science into daily learning.'},
                     {'icon': '🏕️', 'title': 'Outdoor Classrooms', 'description': 'Breathing fresh air while engaging with subjects.'},
                     {'icon': '🌻', 'title': 'Community Garden', 'description': 'Students grow and harvest their own organic vegetables.'},
                     {'icon': '♻️', 'title': 'Zero Waste', 'description': 'Proud to be a certified zero-waste institution.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#F0FDF4', 'text_color': '#064E3B'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []}
        ]

    def _get_apex_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_5', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Focus. Clarity. Excellence.', 'subheading': 'A radically simplified educational approach prioritizing deep conceptual understanding.',
                             'buttonText': 'View Curriculum', 'buttonLink': '/academics',
                             'backgroundImage': 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#FFFFFF', 'text_color': '#000000'},
                {'id': 'features_5', 'component_type': 'FEATURES', 'title': 'Features',
                 'content': {'heading': 'The Apex Philosophy', 'features': [
                     {'icon': '🧠', 'title': 'Deep Work', 'description': 'Extended periods of distraction-free focused learning.'},
                     {'icon': '📐', 'title': 'Minimal Distractions', 'description': 'Clean, organized environment conducive to focus.'},
                     {'icon': '🤝', 'title': 'Socratic Method', 'description': 'Dialogue-centric learning rather than rote memorization.'},
                     {'icon': '📈', 'title': 'Mastery', 'description': 'Advancement based on true mastery of subjects.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#F9FAFB', 'text_color': '#111827'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []}
        ]

    def _get_global_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_global', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Shape Your Future Globally', 'subheading': 'World-class education, groundbreaking research, and a diverse global community.',
                             'buttonText': 'Explore Programs', 'buttonLink': '/academics',
                             'backgroundImage': 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#0F2027', 'text_color': '#FFFFFF'},
                {'id': 'features_global', 'component_type': 'FEATURES', 'title': 'Global Impact',
                 'content': {'heading': 'Why Choose Global University?', 'features': [
                     {'icon': '🌍', 'title': 'Global Campus', 'description': 'Study abroad programs in over 50 countries.'},
                     {'icon': '🔬', 'title': 'Advanced Research', 'description': 'R1 Carnegie classification with top-tier facilities.'},
                     {'icon': '💼', 'title': 'Career Ready', 'description': '98% employed or in grad school within 6 months.'},
                     {'icon': '🎓', 'title': 'Alumni Network', 'description': 'Connect with over 300,000 alumni worldwide.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#FFFFFF', 'text_color': '#111827'},
            ]},
            {'title': 'About', 'slug': 'about', 'page_type': 'ABOUT', 'sections': []},
            {'title': 'Admissions', 'slug': 'admissions', 'page_type': 'ADMISSIONS', 'sections': []}
        ]

    def _get_athletic_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_athletic', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Train Like A Champion', 'subheading': 'Elite coaching, world-class facilities, and a culture of relentless pursuit.',
                             'buttonText': 'Join the Team', 'buttonLink': '/admissions',
                             'backgroundImage': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#111111', 'text_color': '#FFFFFF'},
                {'id': 'stats_athletic', 'component_type': 'STATS', 'title': 'Athletic Stats',
                 'content': {'stats': [{'value': '15', 'label': 'National Titles'}, {'value': '40+', 'label': 'Pro Athletes'},
                                       {'value': '12', 'label': 'Elite Facilities'}, {'value': '100%', 'label': 'Commitment'}]},
                 'order': 1, 'is_visible': True, 'background_color': '#FF4D00', 'text_color': '#111111'},
            ]},
            {'title': 'Programs', 'slug': 'programs', 'page_type': 'ACADEMICS', 'sections': []}
        ]

    def _get_creative_pages(self):
        return [
            {'title': 'Home', 'slug': 'home', 'page_type': 'HOME', 'sections': [
                {'id': 'hero_creative', 'component_type': 'HERO', 'title': 'Hero',
                 'content': {'heading': 'Ignite Your Creativity', 'subheading': 'Where imagination takes form. Join the next generation of visionary artists.',
                             'buttonText': 'View Portfolio', 'buttonLink': '/gallery',
                             'backgroundImage': 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1920&q=80'},
                 'order': 0, 'is_visible': True, 'background_color': '#FAFAFA', 'text_color': '#333333'},
                {'id': 'features_creative', 'component_type': 'FEATURES', 'title': 'Disciplines',
                 'content': {'heading': 'Our Creative Disciplines', 'features': [
                     {'icon': '🖌️', 'title': 'Fine Arts', 'description': 'Master traditional techniques and contemporary practices.'},
                     {'icon': '📸', 'title': 'Photography', 'description': 'Capture the world through professional lenses.'},
                     {'icon': '🎬', 'title': 'Film & Media', 'description': 'Tell your story on the big screen.'},
                     {'icon': '✨', 'title': 'Digital Design', 'description': 'UI/UX, 3D modeling, and interactive media.'}
                 ]}, 'order': 1, 'is_visible': True, 'background_color': '#FFFFFF', 'text_color': '#333333'},
            ]},
            {'title': 'Gallery', 'slug': 'gallery', 'page_type': 'CUSTOM', 'sections': []}
        ]
