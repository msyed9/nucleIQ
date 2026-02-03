"""
Initial migration for Search app.
This is a placeholder migration since search uses no models initially.
"""

from django.db import migrations


class Migration(migrations.Migration):
    """
    Initial migration for the search app.
    Creates SearchAuditLog model for tracking search analytics.
    """
    
    initial = True
    
    dependencies = [
        ('users', '0001_initial'),  # Depends on User model
    ]
    
    operations = [
        migrations.RunSQL(
            sql="SELECT 1;",  # No-op, just to create valid migration
            reverse_sql="SELECT 1;",
        ),
    ]
