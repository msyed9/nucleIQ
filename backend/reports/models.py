"""
Reports Models for Report Generation and Analytics
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.contrib.postgres.fields import JSONField
from core.models import BaseModel, TenantAwareModel
from django.conf import settings


class ReportTemplate(TenantAwareModel):
    """
    Report template definitions for custom report builder
    """
    
    CATEGORY_CHOICES = (
        ('STUDENT', 'Student Reports'),
        ('ACADEMIC', 'Academic Reports'),
        ('FINANCE', 'Financial Reports'),
        ('ATTENDANCE', 'Attendance Reports'),
        ('STAFF', 'Staff Reports'),
        ('EXAM', 'Exam Reports'),
        ('LIBRARY', 'Library Reports'),
        ('TRANSPORT', 'Transport Reports'),
        ('HOSTEL', 'Hostel Reports'),
        ('CUSTOM', 'Custom Reports'),
    )
    
    FORMAT_CHOICES = (
        ('PDF', 'PDF Document'),
        ('EXCEL', 'Excel Spreadsheet'),
        ('CSV', 'CSV File'),
        ('HTML', 'HTML Page'),
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES)
    
    # Template Configuration
    data_source = models.CharField(max_length=255, help_text=_('Model or API endpoint'))
    fields = models.JSONField(
        default=list,
        help_text=_('List of fields to include in report')
    )
    filters = models.JSONField(
        default=dict,
        help_text=_('Default filters as JSON')
    )
    grouping = models.JSONField(
        default=list,
        help_text=_('Fields to group by')
    )
    aggregations = models.JSONField(
        default=dict,
        help_text=_('Aggregation functions to apply')
    )
    sorting = models.JSONField(
        default=list,
        help_text=_('Sort order configuration')
    )
    
    # Formatting
    output_format = models.CharField(
        max_length=10,
        choices=FORMAT_CHOICES,
        default='PDF'
    )
    template_file = models.FileField(
        upload_to='report_templates/',
        null=True,
        blank=True,
        help_text=_('Custom template file (HTML/Excel)')
    )
    
    # Chart/Visualization Configuration
    include_charts = models.BooleanField(default=False)
    chart_config = models.JSONField(
        default=dict,
        help_text=_('Chart.js configuration')
    )
    
    # Access Control
    is_public = models.BooleanField(
        default=False,
        help_text=_('Available to all users in tenant')
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_report_templates'
    )
    
    class Meta:
        db_table = 'report_templates'
        verbose_name = _('Report Template')
        verbose_name_plural = _('Report Templates')
        ordering = ['category', 'name']
        indexes = [
            models.Index(fields=['tenant', 'category']),
            models.Index(fields=['created_by']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class GeneratedReport(TenantAwareModel):
    """
    Track generated reports for download and audit
    """
    
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('GENERATING', 'Generating'),
        ('COMPLETED', 'Completed'),
        ('FAILED', 'Failed'),
    )
    
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='generated_reports',
        null=True,
        blank=True
    )
    
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    
    # Generation Details
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports'
    )
    generated_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Parameters
    filters_used = models.JSONField(
        default=dict,
        help_text=_('Filters applied when generating')
    )
    date_range_start = models.DateField(null=True, blank=True)
    date_range_end = models.DateField(null=True, blank=True)
    
    # Output
    file = models.FileField(
        upload_to='generated_reports/%Y/%m/',
        null=True,
        blank=True
    )
    file_size = models.IntegerField(
        default=0,
        help_text=_('File size in bytes')
    )
    format = models.CharField(max_length=10, default='PDF')
    
    # Error Handling
    error_message = models.TextField(blank=True)
    
    # Stats
    rows_count = models.IntegerField(default=0)
    generation_time = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text=_('Generation time in seconds')
    )
    
    class Meta:
        db_table = 'generated_reports'
        verbose_name = _('Generated Report')
        verbose_name_plural = _('Generated Reports')
        ordering = ['-generated_at']
        indexes = [
            models.Index(fields=['tenant', '-generated_at']),
            models.Index(fields=['generated_by']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.generated_at.strftime('%Y-%m-%d %H:%M')}"


class ScheduledReport(TenantAwareModel):
    """
    Scheduled report generation and email delivery
    """
    
    FREQUENCY_CHOICES = (
        ('DAILY', 'Daily'),
        ('WEEKLY', 'Weekly'),
        ('BIWEEKLY', 'Bi-Weekly'),
        ('MONTHLY', 'Monthly'),
        ('QUARTERLY', 'Quarterly'),
        ('YEARLY', 'Yearly'),
    )
    
    DAY_CHOICES = (
        (1, 'Monday'),
        (2, 'Tuesday'),
        (3, 'Wednesday'),
        (4, 'Thursday'),
        (5, 'Friday'),
        (6, 'Saturday'),
        (7, 'Sunday'),
    )
    
    template = models.ForeignKey(
        ReportTemplate,
        on_delete=models.CASCADE,
        related_name='scheduled_reports'
    )
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Schedule Configuration
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    day_of_week = models.IntegerField(
        choices=DAY_CHOICES,
        null=True,
        blank=True,
        help_text=_('For weekly/biweekly schedules')
    )
    day_of_month = models.IntegerField(
        null=True,
        blank=True,
        help_text=_('For monthly schedules (1-31)')
    )
    time = models.TimeField(help_text=_('Time to generate report'))
    
    # Email Configuration
    email_recipients = models.JSONField(
        default=list,
        help_text=_('List of email addresses')
    )
    email_subject = models.CharField(max_length=255)
    email_body = models.TextField(blank=True)
    include_as_attachment = models.BooleanField(default=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    last_run = models.DateTimeField(null=True, blank=True)
    next_run = models.DateTimeField(null=True, blank=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='scheduled_reports'
    )
    
    class Meta:
        db_table = 'scheduled_reports'
        verbose_name = _('Scheduled Report')
        verbose_name_plural = _('Scheduled Reports')
        ordering = ['next_run']
        indexes = [
            models.Index(fields=['tenant', 'is_active']),
            models.Index(fields=['next_run']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})"


class ReportWidget(TenantAwareModel):
    """
    Dashboard widgets for analytics visualization
    """
    
    WIDGET_TYPE_CHOICES = (
        ('CHART_LINE', 'Line Chart'),
        ('CHART_BAR', 'Bar Chart'),
        ('CHART_PIE', 'Pie Chart'),
        ('CHART_DOUGHNUT', 'Doughnut Chart'),
        ('CHART_AREA', 'Area Chart'),
        ('STAT_CARD', 'Stat Card'),
        ('TABLE', 'Data Table'),
        ('HEATMAP', 'Heatmap'),
    )
    
    name = models.CharField(max_length=255)
    widget_type = models.CharField(max_length=20, choices=WIDGET_TYPE_CHOICES)
    
    # Data Configuration
    data_source = models.CharField(max_length=255)
    query_params = models.JSONField(default=dict)
    refresh_interval = models.IntegerField(
        default=300,
        help_text=_('Refresh interval in seconds')
    )
    
    # Visualization
    chart_config = models.JSONField(
        default=dict,
        help_text=_('Chart.js or visualization config')
    )
    
    # Layout
    width = models.IntegerField(default=6, help_text=_('Grid width (1-12)'))
    height = models.IntegerField(default=4, help_text=_('Grid height units'))
    order = models.IntegerField(default=0)
    
    # Access
    is_public = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_widgets'
    )
    
    class Meta:
        db_table = 'report_widgets'
        verbose_name = _('Report Widget')
        verbose_name_plural = _('Report Widgets')
        ordering = ['order']
    
    def __str__(self):
        return f"{self.name} ({self.get_widget_type_display()})"


class CustomReportQuery(TenantAwareModel):
    """
    Custom queries built using the report builder
    """
    
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    
    # Query Configuration
    base_model = models.CharField(max_length=255)
    selected_fields = models.JSONField(default=list)
    filters = models.JSONField(default=list)
    joins = models.JSONField(default=list)
    aggregations = models.JSONField(default=list)
    group_by = models.JSONField(default=list)
    order_by = models.JSONField(default=list)
    
    # Access
    is_shared = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='custom_queries'
    )
    
    # Usage Stats
    execution_count = models.IntegerField(default=0)
    last_executed = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'custom_report_queries'
        verbose_name = _('Custom Report Query')
        verbose_name_plural = _('Custom Report Queries')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
