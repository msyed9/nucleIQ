#!/usr/bin/env python
"""
Fresh Migration Setup Script for NucleiQ
=========================================

This script handles fresh database migrations in the correct dependency order.
It should be run inside the Docker container or with proper Django settings.

Usage:
    python fresh_migrations_setup.py [--clean] [--migrate] [--seed]

Options:
    --clean     Delete all existing migration files (except __init__.py)
    --migrate   Run migrations after creating them
    --seed      Seed initial data after migrations

Example:
    # Full fresh setup
    python fresh_migrations_setup.py --clean --migrate --seed
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Apps in correct dependency order
# Phase 1: Core infrastructure (no user FKs)
PHASE_1_APPS = [
    'core',
    'tenants',
]

# Phase 2: User system (depends on tenants)
PHASE_2_APPS = [
    'users',
]

# Phase 3: Main modules (depend on users/tenants)
PHASE_3_APPS = [
    'billing',
    'students',
    'staff',
    'attendance',
    'fees',
    'finance',
    'academics',
    'exams',
    'timetable',
    'communication',
    'hr',
    'payroll',
    'crm',
    'cms',
    'library',
    'transport',
    'inventory',
    'hostel',
    'lms',
    'certificates',
    'security',
    'placement',
    'helpdesk',
    'reports',
    'dashboard',
    'analytics',
    'idcards',
    'salah_tracker',
    'habit_tracker',
    'data_management',
]

ALL_APPS = PHASE_1_APPS + PHASE_2_APPS + PHASE_3_APPS


def print_header(text):
    """Print formatted header."""
    print(f"\n{'='*60}")
    print(f"  {text}")
    print('='*60)


def print_step(text):
    """Print step information."""
    print(f"\n>>> {text}")


def print_success(text):
    """Print success message."""
    print(f"  ✓ {text}")


def print_error(text):
    """Print error message."""
    print(f"  ✗ {text}")


def print_warning(text):
    """Print warning message."""
    print(f"  ⚠ {text}")


def run_command(cmd, capture=False):
    """Run shell command and return result."""
    print(f"    Running: {' '.join(cmd)}")
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        return result
    else:
        result = subprocess.run(cmd)
        return result


def clean_migrations():
    """Delete all migration files except __init__.py."""
    print_header("CLEANING MIGRATION FILES")
    
    for app in ALL_APPS:
        migrations_dir = BASE_DIR / app / 'migrations'
        if migrations_dir.exists():
            count = 0
            for file in migrations_dir.glob('*.py'):
                if file.name != '__init__.py':
                    file.unlink()
                    count += 1
            
            # Also remove __pycache__
            pycache = migrations_dir / '__pycache__'
            if pycache.exists():
                shutil.rmtree(pycache)
            
            if count > 0:
                print_success(f"{app}: Removed {count} migration files")
            else:
                print_warning(f"{app}: No migration files to remove")
        else:
            print_warning(f"{app}: migrations directory not found")


def create_migrations_phase(phase_name, apps):
    """Create migrations for a phase of apps."""
    print_header(f"CREATING MIGRATIONS - {phase_name}")
    
    failed = []
    for app in apps:
        print_step(f"Creating migrations for: {app}")
        result = run_command(['python', 'manage.py', 'makemigrations', app, '--noinput'], capture=True)
        
        if result.returncode == 0:
            if 'No changes detected' in result.stdout:
                print_warning(f"{app}: No changes detected")
            else:
                print_success(f"{app}: Migrations created")
        else:
            print_error(f"{app}: Failed to create migrations")
            print(f"    STDERR: {result.stderr}")
            failed.append(app)
    
    return failed


def apply_migrations():
    """Apply all migrations."""
    print_header("APPLYING MIGRATIONS")
    
    print_step("Running migrate command...")
    result = run_command(['python', 'manage.py', 'migrate', '--noinput'])
    
    if result.returncode == 0:
        print_success("All migrations applied successfully")
        return True
    else:
        print_error("Migration failed!")
        return False


def seed_initial_data():
    """Seed initial data (plans, permissions, etc.)."""
    print_header("SEEDING INITIAL DATA")
    
    # Seed subscription plans
    print_step("Seeding subscription plans...")
    plans_script = BASE_DIR / 'create_plans.py'
    if plans_script.exists():
        result = run_command(['python', 'manage.py', 'shell', '-c', 
                             'exec(open("create_plans.py").read())'], capture=True)
        if result.returncode == 0:
            print_success("Subscription plans seeded")
        else:
            print_warning("Failed to seed plans (may already exist)")
    else:
        print_warning("create_plans.py not found")
    
    # Seed permissions
    print_step("Seeding permissions...")
    result = run_command(['python', 'manage.py', 'seed_permissions'], capture=True)
    if result.returncode == 0:
        print_success("Permissions seeded")
    else:
        print_warning("Permissions seeding skipped (command may not exist)")
    
    # Create demo data
    print_step("Seeding demo data...")
    demo_script = BASE_DIR / 'seed_all_demo_data.py'
    if demo_script.exists():
        result = run_command(['python', 'manage.py', 'shell', '-c', 
                             'exec(open("seed_all_demo_data.py").read())'], capture=True)
        if result.returncode == 0:
            print_success("Demo data seeded")
        else:
            print_warning("Failed to seed demo data")
    else:
        print_warning("seed_all_demo_data.py not found")


def run_rls_setup():
    """Run RLS setup script."""
    print_header("SETTING UP ROW LEVEL SECURITY")
    
    rls_script = BASE_DIR / 'scripts' / 'init_rls.sql'
    if rls_script.exists():
        print_step("Executing RLS setup script...")
        # This would need to be run via psql or Django dbshell
        print_warning("RLS script needs to be run manually via:")
        print(f"    docker-compose exec db psql -U nucleiq_user -d nucleiq -f /app/backend/scripts/init_rls.sql")
        print("    OR")
        print("    python manage.py dbshell < scripts/init_rls.sql")
    else:
        print_error("init_rls.sql not found")


def show_status():
    """Show current migration status."""
    print_header("MIGRATION STATUS")
    run_command(['python', 'manage.py', 'showmigrations'])


def main():
    """Main entry point."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fresh Migration Setup for NucleiQ')
    parser.add_argument('--clean', action='store_true', help='Clean existing migration files')
    parser.add_argument('--migrate', action='store_true', help='Apply migrations after creating')
    parser.add_argument('--seed', action='store_true', help='Seed initial data after migrations')
    parser.add_argument('--status', action='store_true', help='Show migration status only')
    parser.add_argument('--rls', action='store_true', help='Show RLS setup instructions')
    
    args = parser.parse_args()
    
    print_header("NucleiQ FRESH MIGRATION SETUP")
    print(f"Working directory: {BASE_DIR}")
    
    if args.status:
        show_status()
        return
    
    if args.rls:
        run_rls_setup()
        return
    
    # Step 1: Clean migrations if requested
    if args.clean:
        response = input("\n⚠️  This will DELETE all migration files! Continue? (yes/no): ")
        if response.lower() != 'yes':
            print("Aborted.")
            return
        clean_migrations()
    
    # Step 2: Create migrations in phases
    all_failed = []
    
    # Phase 1: Core/Tenants
    failed = create_migrations_phase("Phase 1: Core Infrastructure", PHASE_1_APPS)
    all_failed.extend(failed)
    
    # Phase 2: Users
    failed = create_migrations_phase("Phase 2: User System", PHASE_2_APPS)
    all_failed.extend(failed)
    
    # Phase 3: All other apps
    failed = create_migrations_phase("Phase 3: Feature Modules", PHASE_3_APPS)
    all_failed.extend(failed)
    
    # Final pass to catch any remaining
    print_step("Final migration sweep...")
    run_command(['python', 'manage.py', 'makemigrations', '--noinput'], capture=True)
    
    # Summary
    print_header("MIGRATION CREATION SUMMARY")
    if all_failed:
        print_error(f"Failed apps: {', '.join(all_failed)}")
    else:
        print_success("All migrations created successfully!")
    
    # Step 3: Apply migrations if requested
    if args.migrate:
        if apply_migrations():
            # Step 4: Seed data if requested
            if args.seed:
                seed_initial_data()
            
            # Show RLS setup instructions
            run_rls_setup()
        else:
            print_error("Migration application failed - skipping seed")
    
    # Final status
    print_header("SETUP COMPLETE")
    print("\nNext steps:")
    print("  1. Run migrations if not done: python manage.py migrate")
    print("  2. Apply RLS policies: see instructions above")
    print("  3. Create superuser: python manage.py createsuperuser")
    print("  4. Seed data: python manage.py shell < seed_all_demo_data.py")


if __name__ == '__main__':
    main()
