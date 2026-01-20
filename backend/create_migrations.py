#!/usr/bin/env python
"""
Script to create migrations in the correct dependency order.
Run this inside the Docker container or with proper Django settings.
"""
import os
import sys
import subprocess

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

# Apps in dependency order (base apps first, then dependent apps)
APPS_IN_ORDER = [
    # Core/Base apps (no dependencies)
    'core',
    'tenants',
    'users',
    
    # Apps that depend on users/tenants
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

def run_makemigrations(app=None):
    """Run makemigrations for a specific app or all apps."""
    cmd = ['python', 'manage.py', 'makemigrations']
    if app:
        cmd.append(app)
    cmd.append('--noinput')
    
    print(f"\n{'='*50}")
    print(f"Running: {' '.join(cmd)}")
    print('='*50)
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    return result.returncode == 0

def main():
    print("Creating migrations in dependency order...")
    
    # First, try to create migrations for each app individually
    failed_apps = []
    for app in APPS_IN_ORDER:
        if not run_makemigrations(app):
            failed_apps.append(app)
    
    # Now run makemigrations without app name to catch any remaining
    print("\n\nRunning final makemigrations for any remaining apps...")
    run_makemigrations()
    
    if failed_apps:
        print(f"\n\nApps that had issues: {failed_apps}")
    
    print("\n\nDone! Now run: python manage.py migrate")

if __name__ == '__main__':
    main()
