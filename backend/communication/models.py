"""
Communication Models - SMS, Email, WhatsApp, Notice Board
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel


class CommunicationProvider(TenantAwareModel):
    """
    Communication provider configuration (Twilio, MSG91, SendGrid, etc.)
    """
    
    PROVIDER_TYPE_CHOICES = [
        ('SMS', 'SMS Provider'),
        ('EMAIL', 'Email Provider'),
        ('WHATSAPP', 'WhatsApp Provider'),
    ]
    
    PROVIDER_NAME_CHOICES = [
        ('TWILIO', 'Twilio'),
        ('MSG91', 'MSG91'),
        ('AWS_SES', 'AWS SES'),
        ('SENDGRID', 'SendGrid'),
        ('WHATSAPP_BUSINESS', 'WhatsApp Business API'),
    ]
    
    name = models.CharField(
        max_length=50,
        choices=PROVIDER_NAME_CHOICES,
        help_text=_('Provider name')
    )
    
    provider_type = models.CharField(
        max_length=20,
        choices=PROVIDER_TYPE_CHOICES,
        help_text=_('Type of provider')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this provider is active')
    )
    
    is_default = models.BooleanField(
        default=False,
        help_text=_('Whether this is the default provider for this type')
    )
    
    # Configuration stored as JSON
    config = models.JSONField(
        default=dict,
        help_text=_('Provider configuration (API keys, endpoints, etc.)')
    )
    
    # Usage limits
    daily_limit = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Daily message limit')
    )
    
    monthly_limit = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('Monthly message limit')
    )
    
    # Statistics
    total_sent = models.IntegerField(
        default=0,
        help_text=_('Total messages sent')
    )
    
    total_failed = models.IntegerField(
        default=0,
        help_text=_('Total messages failed')
    )
    
    class Meta:
        db_table = 'communication_providers'
        verbose_name = _('Communication Provider')
        verbose_name_plural = _('Communication Providers')
        ordering = ['provider_type', 'name']
        indexes = [
            models.Index(fields=['tenant', 'provider_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.get_name_display()} ({self.get_provider_type_display()})"


class MessageTemplate(TenantAwareModel):
    """
    Pre-approved message templates for SMS, Email, WhatsApp
    """
    
    TEMPLATE_TYPE_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    
    CATEGORY_CHOICES = [
        ('NOTICE', 'Notice/Announcement'),
        ('ATTENDANCE', 'Attendance Alert'),
        ('FEE', 'Fee Reminder'),
        ('EXAM', 'Exam Notification'),
        ('EVENT', 'Event Invitation'),
        ('HOMEWORK', 'Homework Assignment'),
        ('RESULT', 'Result Announcement'),
        ('LEAVE', 'Leave Approval'),
        ('GENERAL', 'General'),
    ]
    
    name = models.CharField(
        max_length=200,
        help_text=_('Template name')
    )
    
    template_type = models.CharField(
        max_length=20,
        choices=TEMPLATE_TYPE_CHOICES,
        help_text=_('Type of template')
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        help_text=_('Template category')
    )
    
    # For Email
    subject = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Email subject (supports variables)')
    )
    
    # Message content
    content = models.TextField(
        help_text=_('Message content (supports variables like {{student_name}}, {{date}}, etc.)')
    )
    
    # Variables used in template
    variables = models.JSONField(
        default=list,
        help_text=_('List of variables used in template')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this template is active')
    )
    
    # WhatsApp specific
    whatsapp_template_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('WhatsApp approved template ID')
    )
    
    class Meta:
        db_table = 'message_templates'
        verbose_name = _('Message Template')
        verbose_name_plural = _('Message Templates')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['tenant', 'template_type', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class Notice(TenantAwareModel):
    """
    Digital notice board for announcements and circulars
    """
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    TARGET_AUDIENCE_CHOICES = [
        ('ALL', 'Everyone'),
        ('STUDENTS', 'All Students'),
        ('PARENTS', 'All Parents'),
        ('STAFF', 'All Staff'),
        ('TEACHERS', 'Teachers Only'),
        ('SPECIFIC_CLASS', 'Specific Class'),
        ('SPECIFIC_SECTION', 'Specific Section'),
        ('CUSTOM', 'Custom Recipients'),
    ]
    
    title = models.CharField(
        max_length=500,
        help_text=_('Notice title')
    )
    
    content = models.TextField(
        help_text=_('Notice content')
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        help_text=_('Notice priority')
    )
    
    target_audience = models.CharField(
        max_length=50,
        choices=TARGET_AUDIENCE_CHOICES,
        help_text=_('Target audience')
    )
    
    # Specific targeting
    target_classes = models.ManyToManyField(
        'tenants.GradeLevel',
        blank=True,
        related_name='comm_notices',
        help_text=_('Specific classes (if target is SPECIFIC_CLASS)')
    )
    
    target_sections = models.ManyToManyField(
        'tenants.Section',
        blank=True,
        related_name='comm_notices',
        help_text=_('Specific sections (if target is SPECIFIC_SECTION)')
    )
    
    # Attachments
    attachment = models.FileField(
        upload_to='notices/attachments/',
        null=True,
        blank=True,
        help_text=_('Attachment file')
    )
    
    # Publishing
    published_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='published_notices',
        help_text=_('Staff who published this notice')
    )
    
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When notice was published')
    )
    
    is_published = models.BooleanField(
        default=False,
        help_text=_('Whether notice is published')
    )
    
    # Validity
    valid_from = models.DateField(
        help_text=_('Valid from date')
    )
    
    valid_until = models.DateField(
        null=True,
        blank=True,
        help_text=_('Valid until date')
    )
    
    # Send notifications
    send_sms = models.BooleanField(
        default=False,
        help_text=_('Send SMS notification')
    )
    
    send_email = models.BooleanField(
        default=False,
        help_text=_('Send email notification')
    )
    
    send_whatsapp = models.BooleanField(
        default=False,
        help_text=_('Send WhatsApp notification')
    )
    
    # Statistics
    view_count = models.IntegerField(
        default=0,
        help_text=_('Number of views')
    )
    
    class Meta:
        db_table = 'notices'
        verbose_name = _('Notice')
        verbose_name_plural = _('Notices')
        ordering = ['-published_at', '-created_at']
        indexes = [
            models.Index(fields=['tenant', 'is_published', 'valid_from']),
            models.Index(fields=['target_audience']),
        ]
    
    def __str__(self):
        return self.title
    
    def publish(self, published_by):
        """Publish the notice."""
        self.is_published = True
        self.published_by = published_by
        self.published_at = timezone.now()
        self.save()


class MessageLog(TenantAwareModel):
    """
    Log of all sent messages (SMS, Email, WhatsApp)
    """
    
    MESSAGE_TYPE_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
        ('BOUNCED', 'Bounced'),
    ]
    
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        help_text=_('Type of message')
    )
    
    provider = models.ForeignKey(
        CommunicationProvider,
        on_delete=models.SET_NULL,
        null=True,
        related_name='message_logs',
        help_text=_('Provider used')
    )
    
    template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_logs',
        help_text=_('Template used (if any)')
    )
    
    notice = models.ForeignKey(
        Notice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='message_logs',
        help_text=_('Related notice (if any)')
    )
    
    # Recipient
    recipient_type = models.CharField(
        max_length=50,
        help_text=_('Type of recipient (student, parent, staff)')
    )
    
    recipient_id = models.UUIDField(
        help_text=_('ID of recipient')
    )
    
    recipient_name = models.CharField(
        max_length=200,
        help_text=_('Name of recipient')
    )
    
    # Contact details
    to_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text=_('Phone number (for SMS/WhatsApp)')
    )
    
    to_email = models.EmailField(
        blank=True,
        help_text=_('Email address')
    )
    
    # Message content
    subject = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Email subject')
    )
    
    content = models.TextField(
        help_text=_('Message content')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text=_('Message status')
    )
    
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When message was sent')
    )
    
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When message was delivered')
    )
    
    # Provider response
    provider_message_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Message ID from provider')
    )
    
    provider_response = models.JSONField(
        default=dict,
        help_text=_('Full response from provider')
    )
    
    error_message = models.TextField(
        blank=True,
        help_text=_('Error message if failed')
    )
    
    # Cost tracking
    cost = models.DecimalField(
        max_digits=10,
        decimal_places=4,
        null=True,
        blank=True,
        help_text=_('Cost of sending message')
    )
    
    class Meta:
        db_table = 'message_logs'
        verbose_name = _('Message Log')
        verbose_name_plural = _('Message Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'message_type', 'status']),
            models.Index(fields=['recipient_type', 'recipient_id']),
            models.Index(fields=['sent_at']),
        ]
    
    def __str__(self):
        return f"{self.get_message_type_display()} to {self.recipient_name} - {self.status}"


class BroadcastMessage(TenantAwareModel):
    """
    Broadcast messages to groups (e.g., "All Class 5 Parents")
    """
    
    MESSAGE_TYPE_CHOICES = [
        ('SMS', 'SMS'),
        ('EMAIL', 'Email'),
        ('WHATSAPP', 'WhatsApp'),
        ('ALL', 'All Channels'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('SENDING', 'Sending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
    ]
    
    title = models.CharField(
        max_length=500,
        help_text=_('Broadcast title')
    )
    
    message_type = models.CharField(
        max_length=20,
        choices=MESSAGE_TYPE_CHOICES,
        help_text=_('Type of message')
    )
    
    template = models.ForeignKey(
        MessageTemplate,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='broadcasts',
        help_text=_('Template to use')
    )
    
    # For custom messages
    subject = models.CharField(
        max_length=500,
        blank=True,
        help_text=_('Email subject')
    )
    
    content = models.TextField(
        help_text=_('Message content')
    )
    
    # Target audience
    target_audience = models.CharField(
        max_length=50,
        help_text=_('Target audience (same as Notice)')
    )
    
    target_classes = models.ManyToManyField(
        'tenants.GradeLevel',
        blank=True,
        related_name='comm_broadcasts'
    )
    
    target_sections = models.ManyToManyField(
        'tenants.Section',
        blank=True,
        related_name='comm_broadcasts'
    )
    
    # Scheduling
    scheduled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When to send (null = send immediately)')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Broadcast status')
    )
    
    sent_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_broadcasts',
        help_text=_('Staff who sent this broadcast')
    )
    
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When broadcast was sent')
    )
    
    # Statistics
    total_recipients = models.IntegerField(
        default=0,
        help_text=_('Total recipients')
    )
    
    total_sent = models.IntegerField(
        default=0,
        help_text=_('Total messages sent')
    )
    
    total_delivered = models.IntegerField(
        default=0,
        help_text=_('Total messages delivered')
    )
    
    total_failed = models.IntegerField(
        default=0,
        help_text=_('Total messages failed')
    )
    
    class Meta:
        db_table = 'broadcast_messages'
        verbose_name = _('Broadcast Message')
        verbose_name_plural = _('Broadcast Messages')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['scheduled_at']),
        ]
    
    def __str__(self):
        return self.title


class SchoolEvent(TenantAwareModel):
    """
    School events for the calendar system.
    """
    
    EVENT_TYPE_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('CULTURAL', 'Cultural'),
        ('SPORTS', 'Sports'),
        ('MEETING', 'Meeting'),
        ('EXAM', 'Exam'),
        ('OTHER', 'Other'),
    ]
    
    title = models.CharField(
        max_length=500,
        help_text=_('Event title')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Event description')
    )
    
    event_type = models.CharField(
        max_length=20,
        choices=EVENT_TYPE_CHOICES,
        default='OTHER',
        help_text=_('Type of event')
    )
    
    start_date = models.DateField(
        help_text=_('Event start date')
    )
    
    end_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Event end date (optional for single-day events)')
    )
    
    start_time = models.TimeField(
        null=True,
        blank=True,
        help_text=_('Event start time (optional for all-day events)')
    )
    
    end_time = models.TimeField(
        null=True,
        blank=True,
        help_text=_('Event end time (optional)')
    )
    
    is_all_day = models.BooleanField(
        default=True,
        help_text=_('Whether this is an all-day event')
    )
    
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Event location')
    )
    
    # Target audience
    target_classes = models.ManyToManyField(
        'tenants.GradeLevel',
        blank=True,
        related_name='school_events',
        help_text=_('Specific classes (leave blank for all)')
    )
    
    # Notifications
    notify_parents = models.BooleanField(
        default=False,
        help_text=_('Send notification to parents')
    )
    
    notify_staff = models.BooleanField(
        default=False,
        help_text=_('Send notification to staff')
    )
    
    # Organizer
    organizer = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='organized_events',
        help_text=_('Staff organizing this event')
    )
    
    is_published = models.BooleanField(
        default=True,
        help_text=_('Whether this event is visible')
    )
    
    class Meta:
        db_table = 'school_events'
        verbose_name = _('School Event')
        verbose_name_plural = _('School Events')
        ordering = ['start_date', 'start_time']
        indexes = [
            models.Index(fields=['tenant', 'start_date']),
            models.Index(fields=['event_type']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.start_date})"
    
    def save(self, *args, **kwargs):
        # Set end_date to start_date if not provided
        if not self.end_date:
            self.end_date = self.start_date
        super().save(*args, **kwargs)


class DeviceToken(TenantAwareModel):
    """
    Store FCM/APNs device tokens for push notifications.
    Each user can have multiple devices registered.
    """
    
    PLATFORM_CHOICES = [
        ('ANDROID', 'Android'),
        ('IOS', 'iOS'),
        ('WEB', 'Web'),
    ]
    
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='device_tokens',
        help_text=_('User who owns this device')
    )
    
    token = models.TextField(
        help_text=_('FCM or APNs device token')
    )
    
    platform = models.CharField(
        max_length=20,
        choices=PLATFORM_CHOICES,
        help_text=_('Device platform')
    )
    
    device_name = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Device name/model')
    )
    
    device_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('Unique device identifier')
    )
    
    app_version = models.CharField(
        max_length=50,
        blank=True,
        help_text=_('App version on this device')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this token is active')
    )
    
    last_used_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Last time a notification was sent to this device')
    )
    
    # Topic subscriptions
    subscribed_topics = models.JSONField(
        default=list,
        help_text=_('List of FCM topics this device is subscribed to')
    )
    
    class Meta:
        db_table = 'device_tokens'
        verbose_name = _('Device Token')
        verbose_name_plural = _('Device Tokens')
        ordering = ['-created_at']
        unique_together = [['user', 'token']]
        indexes = [
            models.Index(fields=['user', 'is_active']),
            models.Index(fields=['platform']),
        ]
    
    def __str__(self):
        return f"{self.user.email} - {self.platform} - {self.device_name or 'Unknown'}"


class PushNotification(TenantAwareModel):
    """
    Log of push notifications sent.
    """
    
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
    ]
    
    NOTIFICATION_TYPE_CHOICES = [
        ('ANNOUNCEMENT', 'Announcement'),
        ('ATTENDANCE', 'Attendance Alert'),
        ('FEE_REMINDER', 'Fee Reminder'),
        ('EXAM_RESULT', 'Exam Result'),
        ('HOMEWORK', 'Homework'),
        ('EVENT', 'Event'),
        ('LEAVE', 'Leave Status'),
        ('GENERAL', 'General'),
    ]
    
    # Target user
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='push_notifications',
        null=True,
        blank=True,
        help_text=_('Target user (null for topic notifications)')
    )
    
    device_token = models.ForeignKey(
        DeviceToken,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications',
        help_text=_('Device token used')
    )
    
    # Content
    title = models.CharField(
        max_length=200,
        help_text=_('Notification title')
    )
    
    body = models.TextField(
        help_text=_('Notification body')
    )
    
    image_url = models.URLField(
        blank=True,
        help_text=_('Notification image URL')
    )
    
    # Data payload
    data_payload = models.JSONField(
        default=dict,
        help_text=_('Additional data sent with notification')
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='GENERAL',
        help_text=_('Type of notification')
    )
    
    # Topic (if topic-based)
    topic = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('FCM topic (for topic-based notifications)')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text=_('Notification status')
    )
    
    fcm_message_id = models.CharField(
        max_length=200,
        blank=True,
        help_text=_('FCM message ID')
    )
    
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When notification was sent')
    )
    
    error_message = models.TextField(
        blank=True,
        help_text=_('Error message if failed')
    )
    
    # Related objects
    related_object_type = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Type of related object (e.g., "student", "fee_invoice")')
    )
    
    related_object_id = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('ID of related object')
    )
    
    class Meta:
        db_table = 'push_notifications'
        verbose_name = _('Push Notification')
        verbose_name_plural = _('Push Notifications')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['notification_type']),
            models.Index(fields=['sent_at']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.status}"

