"""
Django Management Command: create_rls_policies
================================================

Creates/updates Row Level Security (RLS) policies for all tenant-aware tables.
This command is idempotent and safe to run multiple times.

Usage:
    python manage.py create_rls_policies
    python manage.py create_rls_policies --check  # Verify only, no changes
    python manage.py create_rls_policies --verbose
"""

from django.core.management.base import BaseCommand, CommandError
from django.db import connection
from django.apps import apps
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Create or update Row Level Security (RLS) policies for tenant-aware tables'

    def add_arguments(self, parser):
        parser.add_argument(
            '--check',
            action='store_true',
            help='Check RLS status without making changes',
        )
        parser.add_argument(
            '--verbose',
            action='store_true',
            help='Show detailed output',
        )
        parser.add_argument(
            '--table',
            type=str,
            help='Apply RLS to a specific table only',
        )

    def handle(self, *args, **options):
        check_only = options['check']
        verbose = options['verbose']
        specific_table = options.get('table')

        self.stdout.write(self.style.HTTP_INFO('='*60))
        self.stdout.write(self.style.HTTP_INFO('  NucleiQ RLS Policy Management'))
        self.stdout.write(self.style.HTTP_INFO('='*60))

        if check_only:
            self.stdout.write(self.style.WARNING('\nRunning in CHECK mode (no changes will be made)\n'))
        
        # Get all tenant-aware tables
        tenant_tables = self.get_tenant_aware_tables()
        
        if specific_table:
            if specific_table in tenant_tables:
                tenant_tables = [specific_table]
            else:
                raise CommandError(f"Table '{specific_table}' not found or not tenant-aware")
        
        self.stdout.write(f'\nFound {len(tenant_tables)} tenant-aware tables\n')
        
        if verbose:
            for table in tenant_tables:
                self.stdout.write(f'  - {table}')
            self.stdout.write('')
        
        if check_only:
            self.check_rls_status(tenant_tables)
        else:
            self.apply_rls_policies(tenant_tables, verbose)
        
        self.stdout.write(self.style.SUCCESS('\nRLS policy management complete!'))

    def get_tenant_aware_tables(self):
        """Discover all tables with a tenant_id column."""
        tables = []
        
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.columns 
                WHERE column_name = 'tenant_id' 
                AND table_schema = 'public'
                ORDER BY table_name
            """)
            tables = [row[0] for row in cursor.fetchall()]
        
        return tables

    def check_rls_status(self, tables):
        """Check and report RLS status for tables."""
        self.stdout.write('\nRLS Status Report:')
        self.stdout.write('-' * 50)
        
        enabled_count = 0
        disabled_count = 0
        
        with connection.cursor() as cursor:
            for table in tables:
                cursor.execute("""
                    SELECT relrowsecurity, relforcerowsecurity
                    FROM pg_class
                    WHERE relname = %s
                """, [table])
                
                result = cursor.fetchone()
                if result:
                    rls_enabled, rls_forced = result
                    
                    # Check for policies
                    cursor.execute("""
                        SELECT COUNT(*) FROM pg_policies WHERE tablename = %s
                    """, [table])
                    policy_count = cursor.fetchone()[0]
                    
                    if rls_enabled:
                        status = self.style.SUCCESS('✓ ENABLED')
                        enabled_count += 1
                    else:
                        status = self.style.ERROR('✗ DISABLED')
                        disabled_count += 1
                    
                    forced = 'Yes' if rls_forced else 'No'
                    self.stdout.write(f'  {table:40} {status} | Forced: {forced} | Policies: {policy_count}')
                else:
                    self.stdout.write(f'  {table:40} {self.style.WARNING("? NOT FOUND")}')
        
        self.stdout.write('-' * 50)
        self.stdout.write(f'Total: {len(tables)} | Enabled: {enabled_count} | Disabled: {disabled_count}')

    def apply_rls_policies(self, tables, verbose=False):
        """Apply RLS policies to tables."""
        success_count = 0
        error_count = 0
        
        with connection.cursor() as cursor:
            for table in tables:
                try:
                    if verbose:
                        self.stdout.write(f'  Processing: {table}...')
                    
                    # Enable RLS on table
                    cursor.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')
                    
                    # Force RLS for table owner too
                    cursor.execute(f'ALTER TABLE "{table}" FORCE ROW LEVEL SECURITY')
                    
                    # Drop existing policy if exists
                    cursor.execute(f'DROP POLICY IF EXISTS tenant_isolation_policy ON "{table}"')
                    
                    # Create comprehensive RLS policy
                    policy_sql = f'''
                        CREATE POLICY tenant_isolation_policy ON "{table}"
                            FOR ALL
                            USING (
                                tenant_id = get_current_tenant_id()
                                OR is_super_admin() = TRUE
                                OR get_current_tenant_id() IS NULL
                            )
                            WITH CHECK (
                                tenant_id = get_current_tenant_id()
                                OR is_super_admin() = TRUE
                            )
                    '''
                    cursor.execute(policy_sql)
                    
                    success_count += 1
                    if verbose:
                        self.stdout.write(self.style.SUCCESS(f'    ✓ RLS enabled on {table}'))
                    
                except Exception as e:
                    error_count += 1
                    self.stdout.write(self.style.ERROR(f'    ✗ Error on {table}: {str(e)}'))
        
        self.stdout.write('')
        self.stdout.write(f'Results: {success_count} succeeded, {error_count} failed')
        
        # Apply RLS to special tables
        self._apply_special_table_policies(cursor, verbose)

    def _apply_special_table_policies(self, cursor, verbose):
        """Apply RLS to special tables that need different policies."""
        special_tables = {
            'tenants': '''
                CREATE POLICY tenant_self_access ON tenants
                    FOR ALL
                    USING (
                        id = get_current_tenant_id()
                        OR is_super_admin() = TRUE
                        OR get_current_tenant_id() IS NULL
                    )
            ''',
            'tenant_branding': '''
                CREATE POLICY branding_tenant_access ON tenant_branding
                    FOR ALL
                    USING (
                        tenant_id = get_current_tenant_id()
                        OR is_super_admin() = TRUE
                        OR get_current_tenant_id() IS NULL
                    )
            ''',
        }
        
        if verbose:
            self.stdout.write('\nApplying special table policies...')
        
        for table, policy_sql in special_tables.items():
            try:
                # Check if table exists
                cursor.execute("""
                    SELECT 1 FROM information_schema.tables 
                    WHERE table_name = %s AND table_schema = 'public'
                """, [table])
                
                if cursor.fetchone():
                    cursor.execute(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY')
                    cursor.execute(f'ALTER TABLE "{table}" FORCE ROW LEVEL SECURITY')
                    
                    # Extract policy name from SQL
                    policy_name = policy_sql.split(' ON ')[0].replace('CREATE POLICY ', '').strip()
                    cursor.execute(f'DROP POLICY IF EXISTS {policy_name} ON "{table}"')
                    
                    cursor.execute(policy_sql)
                    
                    if verbose:
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Special policy applied to {table}'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'  ⚠ {table}: {str(e)}'))
