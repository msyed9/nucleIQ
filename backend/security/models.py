"""
Security & Gate Pass Models
"""
from django.db import models
from core.models import TenantAwareModel
from django.utils import timezone

class GatePass(TenantAwareModel):
    """
    Pass for leaving campus
    """
    TYPE_CHOICES = [
        ('EARLY_EXIT', 'Early Exit'),
        ('VISITOR', 'Visitor Entry'),
        ('MATERIAL', 'Material Outward'),
    ]
    STATUS_CHOICES = [
        ('REQUESTED', 'Requested'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('USED', 'Used (Exited)'),
    ]
    
    pass_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='EARLY_EXIT')
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, null=True, blank=True)
    visitor_name = models.CharField(max_length=100, blank=True)
    
    reason = models.TextField()
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='REQUESTED')
    
    approved_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, related_name='approved_passes')
    
    # QR Code Token (Simple UUID)
    token = models.CharField(max_length=100, unique=True, blank=True)

    class Meta:
        db_table = 'security_gate_passes'

    def save(self, *args, **kwargs):
        if not self.token:
            import uuid
            self.token = str(uuid.uuid4())
        super().save(*args, **kwargs)

class GateLog(TenantAwareModel):
    """
    Scan Log
    """
    gate_pass = models.ForeignKey(GatePass, on_delete=models.CASCADE, related_name='logs')
    guard = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True) # Guard user
    scanned_at = models.DateTimeField(auto_now_add=True)
    action = models.CharField(max_length=10, choices=[('IN', 'In'), ('OUT', 'Out')])
    
    class Meta:
        db_table = 'security_gate_logs'
