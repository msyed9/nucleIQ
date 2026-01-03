"""
Notifications Signals
"""

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification


@receiver(post_save, sender=Notification)
def send_notification_alert(sender, instance, created, **kwargs):
    """
    Send notification via push/email when created
    This is a basic implementation - in production you might want to use Celery
    """
    if created and not instance.is_read:
        # You could trigger push notification or email here
        # For now, just log it
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"New notification created for {instance.recipient.get_full_name()}: {instance.title}")
