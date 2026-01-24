from django.core.management.base import BaseCommand
from django.conf import settings
from django.core.management import call_command
import os


class Command(BaseCommand):
    help = 'Export data for listed apps (or all non-django apps) to JSON files.'

    def add_arguments(self, parser):
        parser.add_argument('--apps', nargs='*', help='App labels to export')
        parser.add_argument('--output-dir', default=os.path.join('backend', 'data_management', 'exports'), help='Output directory')

    def handle(self, *args, **options):
        apps = options.get('apps') or []
        output_dir = options['output_dir']
        os.makedirs(output_dir, exist_ok=True)

        if not apps:
            apps = [a.split('.')[-1] for a in settings.INSTALLED_APPS if not a.startswith('django.') and 'data_management' not in a]

        for app in apps:
            out_path = os.path.join(output_dir, f'{app}.json')
            try:
                with open(out_path, 'w', encoding='utf-8') as f:
                    self.stdout.write(f'Exporting {app} -> {out_path}')
                    call_command('dumpdata', app, indent=2, stdout=f)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Failed to export {app}: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Export complete. Files saved to {output_dir}'))
