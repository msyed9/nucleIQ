from django.core.management.base import BaseCommand
from django.core.management import call_command
import os


class Command(BaseCommand):
    help = 'Import JSON files produced by export_all. By default loads all files from the exports directory.'

    def add_arguments(self, parser):
        parser.add_argument('--input-dir', default=os.path.join('backend', 'data_management', 'exports'), help='Directory containing JSON files to import')
        parser.add_argument('--files', nargs='*', help='Specific files to load (relative to input-dir)')

    def handle(self, *args, **options):
        input_dir = options['input_dir']
        files = options.get('files') or []

        if not os.path.isdir(input_dir):
            self.stderr.write(self.style.ERROR(f'Input directory not found: {input_dir}'))
            return

        if not files:
            files = [f for f in os.listdir(input_dir) if f.endswith('.json')]

        if not files:
            self.stdout.write('No JSON files found to import.')
            return

        for fname in files:
            path = os.path.join(input_dir, fname)
            if not os.path.isfile(path):
                self.stderr.write(self.style.WARNING(f'Skipping missing file: {path}'))
                continue
            try:
                self.stdout.write(f'Loading {path}')
                call_command('loaddata', path)
            except Exception as e:
                self.stderr.write(self.style.ERROR(f'Failed to load {path}: {e}'))

        self.stdout.write(self.style.SUCCESS('Import complete.'))
