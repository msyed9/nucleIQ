"""
Helpdesk & Ticketing Models
"""
from django.db import models
from core.models import TenantAwareModel
from django.utils import timezone

class HelpdeskTicket(TenantAwareModel):
    CATEGORY_CHOICES = [
        ('FEE', 'Fee Issue'),
        ('ACADEMIC', 'Academic Query'),
        ('TRANSPORT', 'Transport Issue'),
        ('IT', 'Platform/Tech Support'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    PRIORITY_CHOICES = [('LOW', 'Low'), ('MEDIUM', 'Medium'), ('HIGH', 'High'), ('URGENT', 'Urgent')]
    
    raised_by = models.ForeignKey('users.User', on_delete=models.CASCADE, related_name='raised_tickets')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    assigned_to = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')
    
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'helpdesk_tickets'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Auto-assignment logic stub
        if not self.pk and not self.assigned_to:
            pass # Could query Staff with designation='ACCOUNTANT' for FEE category
        super().save(*args, **kwargs)

class TicketComment(TenantAwareModel):
    ticket = models.ForeignKey(HelpdeskTicket, on_delete=models.CASCADE, related_name='comments')
    commented_by = models.ForeignKey('users.User', on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'helpdesk_comments'
