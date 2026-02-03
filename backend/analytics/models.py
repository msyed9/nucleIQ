"""
Analytics Models for Platform Intelligence
Tracks tenant health, usage metrics, and predictions
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import BaseModel
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal


class TenantMetric(BaseModel):
    """
    Daily aggregated metrics for each tenant.
    Used for health scoring and trend analysis.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='metrics'
    )
    
    date = models.DateField(db_index=True)
    
    # User Activity
    total_users = models.IntegerField(default=0)
    active_users = models.IntegerField(default=0)  # Logged in today
    dau = models.IntegerField(default=0)  # Daily Active Users
    
    # Module Usage
    modules_used = models.JSONField(
        default=list,
        help_text=_('List of modules used today')
    )
    module_count = models.IntegerField(default=0)
    
    # Resource Usage
    storage_used_mb = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0')
    )
    database_rows = models.IntegerField(default=0)
    api_calls = models.IntegerField(default=0)
    
    # Communication
    sms_sent = models.IntegerField(default=0)
    emails_sent = models.IntegerField(default=0)
    
    # System Health
    error_count = models.IntegerField(default=0)
    error_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('0'),
        help_text=_('Error rate percentage')
    )
    
    # Performance
    avg_response_time_ms = models.IntegerField(default=0)
    
    # Health Score (0-100)
    health_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal('100'),
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    class Meta:
        db_table = 'tenant_metrics'
        verbose_name = _('Tenant Metric')
        verbose_name_plural = _('Tenant Metrics')
        ordering = ['-date']
        unique_together = ['tenant', 'date']
        indexes = [
            models.Index(fields=['tenant', '-date']),
            models.Index(fields=['date']),
            models.Index(fields=['health_score']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.date}"
    
    def calculate_health_score(self):
        """
        Calculate health score (0-100) based on multiple factors.
        
        Algorithm:
        - DAU/Total Users (40%)
        - Error Rate (30%)
        - Module Adoption (20%)
        - API Activity (10%)
        """
        score = Decimal('0')
        
        # Factor 1: User Engagement (40 points)
        if self.total_users > 0:
            engagement_rate = (self.dau / self.total_users) * 100
            score += min(engagement_rate * Decimal('0.4'), Decimal('40'))
        
        # Factor 2: Error Rate (30 points) - inverse
        error_penalty = min(self.error_rate, Decimal('100'))
        score += Decimal('30') - (error_penalty * Decimal('0.3'))
        
        # Factor 3: Module Adoption (20 points)
        # Ideal: Using 5+ modules
        module_score = min(self.module_count / 5, 1) * Decimal('20')
        score += module_score
        
        # Factor 4: API Activity (10 points)
        # Healthy: 100+ API calls per day
        api_score = min(self.api_calls / 100, 1) * Decimal('10')
        score += api_score
        
        self.health_score = max(min(score, Decimal('100')), Decimal('0'))
        return self.health_score


class UsageLog(BaseModel):
    """
    Detailed usage logs for tracking user behavior.
    """
    
    ACTION_TYPES = [
        ('LOGIN', 'Login'),
        ('API_CALL', 'API Call'),
        ('MODULE_ACCESS', 'Module Access'),
        ('FEATURE_USE', 'Feature Use'),
        ('ERROR', 'Error'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='usage_logs'
    )
    
    user = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    action_type = models.CharField(max_length=20, choices=ACTION_TYPES, db_index=True)
    module = models.CharField(max_length=50, blank=True, db_index=True)
    feature = models.CharField(max_length=100, blank=True)
    
    # Request details
    endpoint = models.CharField(max_length=200, blank=True)
    method = models.CharField(max_length=10, blank=True)
    status_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    
    # Error tracking
    is_error = models.BooleanField(default=False, db_index=True)
    error_message = models.TextField(blank=True)
    
    # Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=500, blank=True)
    
    class Meta:
        db_table = 'usage_logs'
        verbose_name = _('Usage Log')
        verbose_name_plural = _('Usage Logs')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['action_type', '-created_at']),
            models.Index(fields=['is_error']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.action_type} - {self.created_at}"


class TenantHealthAlert(BaseModel):
    """
    Alerts for tenant health issues.
    """
    
    ALERT_TYPES = [
        ('CHURN_RISK', 'Churn Risk'),
        ('LOW_HEALTH', 'Low Health Score'),
        ('HIGH_ERRORS', 'High Error Rate'),
        ('LOW_ENGAGEMENT', 'Low User Engagement'),
        ('LIMIT_REACHED', 'Limit Reached'),
    ]
    
    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='health_alerts'
    )
    
    alert_type = models.CharField(max_length=20, choices=ALERT_TYPES, db_index=True)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, db_index=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Metrics
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    threshold_value = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    
    # Status
    is_resolved = models.BooleanField(default=False, db_index=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'tenant_health_alerts'
        verbose_name = _('Health Alert')
        verbose_name_plural = _('Health Alerts')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', '-created_at']),
            models.Index(fields=['alert_type', 'severity']),
            models.Index(fields=['is_resolved']),
        ]
    
    def __str__(self):
        return f"{self.tenant.name} - {self.alert_type} ({self.severity})"


class AlertRule(BaseModel):
    """
    Tenant-level analytics alert rules.
    """

    METRIC_CHOICES = [
        ('ATTENDANCE_RATE', 'Attendance Rate'),
        ('FEE_DELINQUENCY', 'Fee Delinquency'),
        ('FEE_COLLECTION_RATE', 'Fee Collection Rate'),
    ]

    COMPARATOR_CHOICES = [
        ('LT', '<'),
        ('LTE', '<='),
        ('GT', '>'),
        ('GTE', '>='),
    ]

    SEVERITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
        ('CRITICAL', 'Critical'),
    ]

    SCOPE_CHOICES = [
        ('ALL', 'All'),
        ('GRADE', 'Grade'),
        ('SECTION', 'Section'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='alert_rules'
    )

    name = models.CharField(max_length=200)
    metric = models.CharField(max_length=30, choices=METRIC_CHOICES)
    comparator = models.CharField(max_length=5, choices=COMPARATOR_CHOICES, default='LT')
    threshold_value = models.DecimalField(max_digits=10, decimal_places=2)
    window_days = models.IntegerField(default=30)
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default='MEDIUM')
    scope = models.CharField(max_length=10, choices=SCOPE_CHOICES, default='ALL')

    grade_level = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    gender = models.CharField(max_length=1, blank=True)
    is_active = models.BooleanField(default=True)

    created_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    class Meta:
        db_table = 'analytics_alert_rules'
        verbose_name = _('Analytics Alert Rule')
        verbose_name_plural = _('Analytics Alert Rules')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'metric']),
            models.Index(fields=['tenant', 'is_active']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.name}"


class AlertEvent(BaseModel):
    """
    Triggered events for alert rules.
    """

    STATUS_CHOICES = [
        ('OPEN', 'Open'),
        ('RESOLVED', 'Resolved'),
    ]

    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='alert_events'
    )

    rule = models.ForeignKey(
        AlertRule,
        on_delete=models.CASCADE,
        related_name='events'
    )

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='OPEN')
    current_value = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    triggered_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    details = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'analytics_alert_events'
        verbose_name = _('Analytics Alert Event')
        verbose_name_plural = _('Analytics Alert Events')
        ordering = ['-triggered_at']
        indexes = [
            models.Index(fields=['tenant', 'status']),
            models.Index(fields=['tenant', '-triggered_at']),
        ]

    def __str__(self):
        return f"{self.tenant.name} - {self.rule.name} - {self.status}"


class ChurnPrediction(BaseModel):
    """
    ML-based churn prediction for tenants.
    """
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='churn_predictions'
    )
    
    prediction_date = models.DateField(db_index=True)
    
    # Churn probability (0-100%)
    churn_probability = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    
    # Risk level
    risk_level = models.CharField(
        max_length=10,
        choices=[
            ('LOW', 'Low'),
            ('MEDIUM', 'Medium'),
            ('HIGH', 'High'),
        ],
        db_index=True
    )
    
    # Contributing factors
    factors = models.JSONField(
        default=dict,
        help_text=_('Factors contributing to churn risk')
    )
    
    # Recommendations
    recommendations = models.JSONField(
        default=list,
        help_text=_('Recommended actions to prevent churn')
    )
    
    class Meta:
        db_table = 'churn_predictions'
        verbose_name = _('Churn Prediction')
        verbose_name_plural = _('Churn Predictions')
        ordering = ['-prediction_date']
        unique_together = ['tenant', 'prediction_date']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.churn_probability}% ({self.risk_level})"


class UpsellOpportunity(BaseModel):
    """
    Identifies upsell opportunities for tenants.
    """
    
    OPPORTUNITY_TYPES = [
        ('LIMIT_APPROACHING', 'Approaching Limit'),
        ('FEATURE_REQUEST', 'Feature Request'),
        ('HIGH_USAGE', 'High Usage'),
        ('MODULE_INTEREST', 'Module Interest'),
    ]
    
    tenant = models.ForeignKey(
        'tenants.Tenant',
        on_delete=models.CASCADE,
        related_name='upsell_opportunities'
    )
    
    opportunity_type = models.CharField(max_length=20, choices=OPPORTUNITY_TYPES)
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Suggested plan/addon
    suggested_plan = models.CharField(max_length=50, blank=True)
    estimated_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    
    # Metrics
    current_usage = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    limit = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    usage_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True)
    
    # Status
    is_contacted = models.BooleanField(default=False)
    contacted_at = models.DateTimeField(null=True, blank=True)
    is_converted = models.BooleanField(default=False)
    converted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'upsell_opportunities'
        verbose_name = _('Upsell Opportunity')
        verbose_name_plural = _('Upsell Opportunities')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.name} - {self.opportunity_type}"
