"""
Notifications & Communication Models
"""

from django.db import models
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from tenants.models import Tenant
from users.models import User


class Notification(models.Model):
    """In-app notifications"""
    TYPE_CHOICES = [
        ('INFO', 'Information'),
        ('SUCCESS', 'Success'),
        ('WARNING', 'Warning'),
        ('ERROR', 'Error'),
        ('REMINDER', 'Reminder'),
    ]
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications_received')
    sender = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications_sent')
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='INFO')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    action_url = models.URLField(blank=True, null=True, help_text="URL to navigate when clicked")
    icon = models.CharField(max_length=50, blank=True, help_text="Icon class name")
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_archived = models.BooleanField(default=False)
    archived_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True, help_text="Auto-delete after this date")
    
    metadata = models.JSONField(default=dict, blank=True, help_text="Additional data")
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['tenant', 'recipient', 'is_read']),
        ]
        
    def __str__(self):
        return f"{self.title} - {self.recipient.get_full_name()}"
        
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])
            
    def archive(self):
        """Archive notification"""
        if not self.is_archived:
            self.is_archived = True
            self.archived_at = timezone.now()
            self.save(update_fields=['is_archived', 'archived_at'])


class EmailCampaign(models.Model):
    """Email campaign management"""
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('SENDING', 'Sending'),
        ('SENT', 'Sent'),
        ('FAILED', 'Failed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    RECIPIENT_TYPE_CHOICES = [
        ('ALL_STUDENTS', 'All Students'),
        ('ALL_STAFF', 'All Staff'),
        ('ALL_PARENTS', 'All Parents'),
        ('SPECIFIC_CLASS', 'Specific Class'),
        ('SPECIFIC_DEPARTMENT', 'Specific Department'),
        ('CUSTOM_LIST', 'Custom List'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='email_campaigns')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_campaigns')
    
    name = models.CharField(max_length=200, help_text="Campaign name for internal use")
    subject = models.CharField(max_length=200)
    body = models.TextField(help_text="Email body (HTML supported)")
    template = models.CharField(max_length=100, blank=True, help_text="Email template name")
    
    recipient_type = models.CharField(max_length=30, choices=RECIPIENT_TYPE_CHOICES)
    recipient_filters = models.JSONField(default=dict, blank=True, help_text="Additional filters")
    recipient_emails = ArrayField(
        models.EmailField(),
        blank=True,
        default=list,
        help_text="Manual email list"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    total_recipients = models.IntegerField(default=0)
    sent_count = models.IntegerField(default=0)
    delivered_count = models.IntegerField(default=0)
    failed_count = models.IntegerField(default=0)
    opened_count = models.IntegerField(default=0)
    clicked_count = models.IntegerField(default=0)
    
    attachments = models.JSONField(default=list, blank=True, help_text="File URLs to attach")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.name} ({self.status})"
        
    @property
    def delivery_rate(self):
        """Calculate delivery rate percentage"""
        if self.sent_count == 0:
            return 0
        return (self.delivered_count / self.sent_count) * 100
        
    @property
    def open_rate(self):
        """Calculate open rate percentage"""
        if self.delivered_count == 0:
            return 0
        return (self.opened_count / self.delivered_count) * 100


class EmailLog(models.Model):
    """Individual email delivery log"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('OPENED', 'Opened'),
        ('CLICKED', 'Clicked'),
        ('BOUNCED', 'Bounced'),
        ('FAILED', 'Failed'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='email_logs')
    campaign = models.ForeignKey(EmailCampaign, on_delete=models.CASCADE, null=True, blank=True, related_name='email_logs')
    
    recipient_email = models.EmailField()
    recipient_name = models.CharField(max_length=200, blank=True)
    subject = models.CharField(max_length=200)
    body = models.TextField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    bounced_at = models.DateTimeField(null=True, blank=True)
    
    error_message = models.TextField(blank=True)
    provider = models.CharField(max_length=50, blank=True, help_text="Email service provider")
    message_id = models.CharField(max_length=200, blank=True, help_text="Provider message ID")
    
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['campaign', 'status']),
        ]
        
    def __str__(self):
        return f"{self.recipient_email} - {self.status}"


class SMSMessage(models.Model):
    """SMS messaging"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('QUEUED', 'Queued'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('FAILED', 'Failed'),
        ('REJECTED', 'Rejected'),
    ]
    
    TYPE_CHOICES = [
        ('TRANSACTIONAL', 'Transactional'),
        ('PROMOTIONAL', 'Promotional'),
        ('OTP', 'OTP'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='sms_messages')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='sms_sent')
    
    recipient_phone = models.CharField(max_length=20)
    recipient_name = models.CharField(max_length=200, blank=True)
    message = models.TextField(max_length=1000)
    
    message_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='TRANSACTIONAL')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    provider = models.CharField(max_length=50, default='MSG91', help_text="SMS gateway provider")
    message_id = models.CharField(max_length=200, blank=True, help_text="Provider message ID")
    credits_used = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['recipient_phone', '-created_at']),
        ]
        
    def __str__(self):
        return f"SMS to {self.recipient_phone} - {self.status}"
        
    @property
    def character_count(self):
        """Get message character count"""
        return len(self.message)
        
    @property
    def sms_parts(self):
        """Calculate SMS parts (160 chars per part)"""
        return (self.character_count + 159) // 160


class WhatsAppMessage(models.Model):
    """WhatsApp messaging"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('QUEUED', 'Queued'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('READ', 'Read'),
        ('FAILED', 'Failed'),
    ]
    
    MESSAGE_TYPE_CHOICES = [
        ('TEXT', 'Text'),
        ('IMAGE', 'Image'),
        ('DOCUMENT', 'Document'),
        ('TEMPLATE', 'Template'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='whatsapp_messages')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='whatsapp_sent')
    
    recipient_phone = models.CharField(max_length=20)
    recipient_name = models.CharField(max_length=200, blank=True)
    
    message_type = models.CharField(max_length=20, choices=MESSAGE_TYPE_CHOICES, default='TEXT')
    message = models.TextField(blank=True)
    media_url = models.URLField(blank=True, help_text="URL for image/document")
    template_name = models.CharField(max_length=100, blank=True)
    template_params = models.JSONField(default=dict, blank=True)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    scheduled_at = models.DateTimeField(null=True, blank=True)
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    
    provider = models.CharField(max_length=50, default='TWILIO', help_text="WhatsApp provider")
    message_id = models.CharField(max_length=200, blank=True)
    conversation_id = models.CharField(max_length=200, blank=True, help_text="Thread ID")
    
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['conversation_id', '-created_at']),
        ]
        
    def __str__(self):
        return f"WhatsApp to {self.recipient_phone} - {self.status}"


class PushNotification(models.Model):
    """Push notifications for mobile/web"""
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('SENT', 'Sent'),
        ('DELIVERED', 'Delivered'),
        ('CLICKED', 'Clicked'),
        ('FAILED', 'Failed'),
    ]
    
    PLATFORM_CHOICES = [
        ('WEB', 'Web'),
        ('ANDROID', 'Android'),
        ('IOS', 'iOS'),
        ('ALL', 'All Platforms'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='push_notifications')
    sent_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='push_sent')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_received')
    
    title = models.CharField(max_length=200)
    body = models.TextField(max_length=500)
    icon = models.URLField(blank=True)
    image = models.URLField(blank=True)
    
    platform = models.CharField(max_length=20, choices=PLATFORM_CHOICES, default='ALL')
    action_url = models.URLField(blank=True)
    data = models.JSONField(default=dict, blank=True, help_text="Additional payload data")
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    sent_at = models.DateTimeField(null=True, blank=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    clicked_at = models.DateTimeField(null=True, blank=True)
    
    device_tokens = ArrayField(
        models.CharField(max_length=500),
        blank=True,
        default=list,
        help_text="FCM device tokens"
    )
    
    provider = models.CharField(max_length=50, default='FCM', help_text="Push notification provider")
    message_id = models.CharField(max_length=200, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.title} - {self.recipient.get_full_name()}"


class CommunicationTemplate(models.Model):
    """Reusable templates for SMS/Email/WhatsApp"""
    TYPE_CHOICES = [
        ('EMAIL', 'Email'),
        ('SMS', 'SMS'),
        ('WHATSAPP', 'WhatsApp'),
        ('PUSH', 'Push Notification'),
    ]
    
    CATEGORY_CHOICES = [
        ('ACADEMIC', 'Academic'),
        ('FEE', 'Fee Related'),
        ('ATTENDANCE', 'Attendance'),
        ('EXAM', 'Examination'),
        ('EVENT', 'Event/Activity'),
        ('ANNOUNCEMENT', 'Announcement'),
        ('REMINDER', 'Reminder'),
        ('ALERT', 'Alert'),
    ]
    
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='communication_templates')
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    
    name = models.CharField(max_length=200)
    template_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    category = models.CharField(max_length=30, choices=CATEGORY_CHOICES)
    
    subject = models.CharField(max_length=200, blank=True, help_text="For email/push")
    body = models.TextField(help_text="Template body with placeholders {{variable}}")
    
    variables = ArrayField(
        models.CharField(max_length=100),
        blank=True,
        default=list,
        help_text="Available variables like student_name, class, etc."
    )
    
    is_active = models.BooleanField(default=True)
    usage_count = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['template_type', 'name']
        
    def __str__(self):
        return f"{self.name} ({self.template_type})"
        
    def render(self, context):
        """Render template with context variables"""
        rendered = self.body
        for key, value in context.items():
            placeholder = f"{{{{{key}}}}}"
            rendered = rendered.replace(placeholder, str(value))
        return rendered
