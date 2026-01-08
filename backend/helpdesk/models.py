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
        ('HOSTEL', 'Hostel Issue'),
        ('LIBRARY', 'Library Issue'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('URGENT', 'Urgent')
    ]
    
    raised_by = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='raised_tickets'
    )
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    assigned_to = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets'
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='OPEN'
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM'
    )
    
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'helpdesk_tickets'
        verbose_name = 'Helpdesk Ticket'
        verbose_name_plural = 'Helpdesk Tickets'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'status', 'created_at']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['raised_by', 'status']),
            models.Index(fields=['category', 'priority']),
        ]

    def __str__(self):
        return f"{self.subject} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Auto-assignment logic stub
        if not self.pk and not self.assigned_to:
            pass  # Could query Staff with designation='ACCOUNTANT' for FEE category
        super().save(*args, **kwargs)

class TicketComment(TenantAwareModel):
    ticket = models.ForeignKey(
        HelpdeskTicket,
        on_delete=models.CASCADE,
        related_name='comments'
    )
    commented_by = models.ForeignKey('users.User', on_delete=models.CASCADE)
    content = models.TextField()
    
    class Meta:
        db_table = 'helpdesk_comments'
        verbose_name = 'Ticket Comment'
        verbose_name_plural = 'Ticket Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['tenant', 'ticket', 'created_at']),
        ]

    def __str__(self):
        return f"Comment on {self.ticket.subject} by {self.commented_by.get_full_name()}"
