"""
Management command to assign default permissions to all roles.
This ensures that all roles have basic read access to student module.
"""

from django.core.management.base import BaseCommand
from users.models import Role, Permission, RolePermission


class Command(BaseCommand):
    help = 'Assign default permissions to all roles that are missing them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        # Get the student_module.read permission
        try:
            read_perm = Permission.objects.get(resource='student_module', action='read')
            self.stdout.write(f"Found permission: {read_perm.resource}.{read_perm.action} (ID: {read_perm.id})")
        except Permission.DoesNotExist:
            self.stdout.write(self.style.ERROR("Permission 'student_module.read' not found! Run seed_permissions first."))
            return
        
        # Get all active roles
        roles = Role.objects.filter(is_active=True)
        self.stdout.write(f"\nChecking {roles.count()} active roles...")
        
        updated_count = 0
        for role in roles:
            # Check if role already has this permission
            has_perm = RolePermission.objects.filter(
                role=role,
                permission=read_perm
            ).exists()
            
            if not has_perm:
                self.stdout.write(f"  Role '{role.name}' is missing student_module.read")
                if not dry_run:
                    RolePermission.objects.create(
                        role=role,
                        permission=read_perm
                    )
                    self.stdout.write(self.style.SUCCESS(f"    -> Added permission to '{role.name}'"))
                    updated_count += 1
                else:
                    self.stdout.write(f"    -> Would add permission (dry-run)")
            else:
                self.stdout.write(f"  Role '{role.name}' already has student_module.read")
        
        if dry_run:
            self.stdout.write(self.style.WARNING("\n[DRY RUN] No changes made. Remove --dry-run to apply changes."))
        else:
            self.stdout.write(self.style.SUCCESS(f"\nDone! Updated {updated_count} roles."))
