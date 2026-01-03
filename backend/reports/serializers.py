"""
Reports Serializers
"""

from rest_framework import serializers
from .models import (
    ReportTemplate,
    GeneratedReport,
    ScheduledReport,
    ReportWidget,
    CustomReportQuery
)


class ReportTemplateSerializer(serializers.ModelSerializer):
    """Serializer for Report Templates"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    format_display = serializers.CharField(source='get_output_format_display', read_only=True)
    
    class Meta:
        model = ReportTemplate
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class GeneratedReportSerializer(serializers.ModelSerializer):
    """Serializer for Generated Reports"""
    
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = GeneratedReport
        fields = '__all__'
        read_only_fields = ['generated_at', 'completed_at', 'generated_by']
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
        return None


class ScheduledReportSerializer(serializers.ModelSerializer):
    """Serializer for Scheduled Reports"""
    
    template_name = serializers.CharField(source='template.name', read_only=True)
    frequency_display = serializers.CharField(source='get_frequency_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ScheduledReport
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'last_run', 'next_run', 'created_by']


class ReportWidgetSerializer(serializers.ModelSerializer):
    """Serializer for Report Widgets"""
    
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = ReportWidget
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by']


class CustomReportQuerySerializer(serializers.ModelSerializer):
    """Serializer for Custom Report Queries"""
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    
    class Meta:
        model = CustomReportQuery
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'created_by', 'execution_count', 'last_executed']


class ReportGenerationRequestSerializer(serializers.Serializer):
    """Serializer for report generation requests"""
    
    template_id = serializers.IntegerField(required=True)
    format = serializers.ChoiceField(choices=['PDF', 'EXCEL', 'CSV', 'HTML'], required=False)
    filters = serializers.JSONField(required=False, default=dict)
    date_range_start = serializers.DateField(required=False)
    date_range_end = serializers.DateField(required=False)
    email_recipients = serializers.ListField(
        child=serializers.EmailField(),
        required=False
    )
