"""
Signals for Users app
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UserPreference


@receiver(post_save, sender=User)
def create_user_preference(sender, instance, created, **kwargs):
    """
    Automatically create UserPreference when a new User is created.
    """
    if created and not hasattr(instance, 'preference'):
        UserPreference.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_preference(sender, instance, **kwargs):
    """
    Ensure UserPreference is saved when User is saved.
    """
    if hasattr(instance, 'preference'):
        instance.preference.save()
