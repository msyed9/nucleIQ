"""
Management command to load pre-built ID card templates into the database
"""

from django.core.management.base import BaseCommand
from idcards.models import IDCardTemplate
from idcards.templates import get_all_templates


class Command(BaseCommand):
    help = 'Load pre-built ID card templates into the database'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing templates before loading',
        )
    
    def handle(self, *args, **options):
        # Clear existing templates if requested
        if options['clear']:
            count = IDCardTemplate.objects.filter(is_global=True).count()
            IDCardTemplate.objects.filter(is_global=True).delete()
            self.stdout.write(
                self.style.WARNING(f'Cleared {count} existing global templates')
            )
        
        # Load templates
        templates = get_all_templates()
        created_count = 0
        updated_count = 0
        
        for template_data in templates:
            template, created = IDCardTemplate.objects.update_or_create(
                name=template_data['name'],
                is_global=True,
                defaults={
                    'description': template_data.get('description', ''),
                    'card_type': template_data['card_type'],
                    'orientation': template_data['orientation'],
                    'category': template_data['category'],
                    'width_mm': template_data['width_mm'],
                    'height_mm': template_data['height_mm'],
                    'design_json': template_data['design_json'],
                    'is_active': True,
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created template: {template.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'↻ Updated template: {template.name}')
                )
        
        # Summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully loaded {len(templates)} templates'
            )
        )
        self.stdout.write(f'  - Created: {created_count}')
        self.stdout.write(f'  - Updated: {updated_count}')
        self.stdout.write('='*60 + '\n')
        
        # Show templates by category
        self.stdout.write(self.style.SUCCESS('Templates by category:'))
        categories = {}
        for template in IDCardTemplate.objects.filter(is_global=True):
            category = template.category
            if category not in categories:
                categories[category] = []
            categories[category].append(template.name)
        
        for category, names in sorted(categories.items()):
            self.stdout.write(f'\n{category}:')
            for name in names:
                self.stdout.write(f'  - {name}')
