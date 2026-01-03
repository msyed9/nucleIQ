"""
Reports API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.http import FileResponse
from django.core.files.base import ContentFile
from django.utils import timezone
from datetime import datetime
import time

from .models import (
    ReportTemplate,
    GeneratedReport,
    ScheduledReport,
    ReportWidget,
    CustomReportQuery
)
from .serializers import (
    ReportTemplateSerializer,
    GeneratedReportSerializer,
    ScheduledReportSerializer,
    ReportWidgetSerializer,
    CustomReportQuerySerializer,
    ReportGenerationRequestSerializer
)
from .services import ReportGenerationService, AnalyticsDataService


class ReportTemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for Report Templates"""
    serializer_class = ReportTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ReportTemplate.objects.filter(tenant=user.tenant)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Show only public templates or user's own
        if not self.request.user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(created_by=user)
            )
        
        return queryset.order_by('category', 'name')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        """Generate report from template"""
        template = self.get_object()
        
        # Get generation parameters
        filters = request.data.get('filters', {})
        date_range = None
        if request.data.get('date_range_start') and request.data.get('date_range_end'):
            date_range = {
                'start': request.data['date_range_start'],
                'end': request.data['date_range_end']
            }
        
        output_format = request.data.get('format', template.output_format)
        
        # Create generation record
        gen_report = GeneratedReport.objects.create(
            tenant=request.user.tenant,
            template=template,
            name=f"{template.name} - {timezone.now().strftime('%Y-%m-%d %H:%M')}",
            status='GENERATING',
            generated_by=request.user,
            filters_used=filters,
            date_range_start=request.data.get('date_range_start'),
            date_range_end=request.data.get('date_range_end'),
            format=output_format
        )
        
        try:
            start_time = time.time()
            
            # Generate report
            service = ReportGenerationService(template)
            service.fetch_data(filters=filters, date_range=date_range)
            
            # Generate file based on format
            if output_format == 'PDF':
                file_buffer = service.generate_pdf()
                filename = f"{template.name.replace(' ', '_')}.pdf"
                content_type = 'application/pdf'
            elif output_format == 'EXCEL':
                file_buffer = service.generate_excel()
                filename = f"{template.name.replace(' ', '_')}.xlsx"
                content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            elif output_format == 'CSV':
                file_buffer = service.generate_csv()
                filename = f"{template.name.replace(' ', '_')}.csv"
                content_type = 'text/csv'
            else:
                file_buffer = service.generate_pdf()
                filename = f"{template.name.replace(' ', '_')}.pdf"
                content_type = 'application/pdf'
            
            # Save file
            gen_report.file.save(filename, ContentFile(file_buffer.read()), save=False)
            gen_report.file_size = gen_report.file.size
            gen_report.rows_count = len(service.data)
            gen_report.status = 'COMPLETED'
            gen_report.completed_at = timezone.now()
            gen_report.generation_time = round(time.time() - start_time, 2)
            gen_report.save()
            
            serializer = GeneratedReportSerializer(gen_report, context={'request': request})
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            gen_report.status = 'FAILED'
            gen_report.error_message = str(e)
            gen_report.save()
            
            return Response(
                {'error': f'Report generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GeneratedReportViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Generated Reports"""
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return GeneratedReport.objects.filter(
            tenant=self.request.user.tenant
        ).order_by('-generated_at')
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """Download generated report file"""
        report = self.get_object()
        
        if not report.file:
            return Response(
                {'error': 'Report file not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return FileResponse(
            report.file.open('rb'),
            as_attachment=True,
            filename=report.file.name.split('/')[-1]
        )


class ScheduledReportViewSet(viewsets.ModelViewSet):
    """ViewSet for Scheduled Reports"""
    serializer_class = ScheduledReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return ScheduledReport.objects.filter(
            tenant=self.request.user.tenant
        ).order_by('next_run')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Toggle schedule active status"""
        schedule = self.get_object()
        schedule.is_active = not schedule.is_active
        schedule.save()
        
        serializer = self.get_serializer(schedule)
        return Response(serializer.data)


class ReportWidgetViewSet(viewsets.ModelViewSet):
    """ViewSet for Report Widgets"""
    serializer_class = ReportWidgetSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = ReportWidget.objects.filter(tenant=user.tenant)
        
        if not user.is_staff:
            queryset = queryset.filter(
                Q(is_public=True) | Q(created_by=user)
            )
        
        return queryset.order_by('order')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )


class CustomReportQueryViewSet(viewsets.ModelViewSet):
    """ViewSet for Custom Report Queries"""
    serializer_class = CustomReportQuerySerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        queryset = CustomReportQuery.objects.filter(tenant=user.tenant)
        
        if not user.is_staff:
            queryset = queryset.filter(
                Q(is_shared=True) | Q(created_by=user)
            )
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def execute(self, request, pk=None):
        """Execute custom query"""
        query = self.get_object()
        
        # Update usage stats
        query.execution_count += 1
        query.last_executed = timezone.now()
        query.save()
        
        # Execute query logic here
        # This would use the query configuration to build and execute the query
        
        return Response({'message': 'Query executed successfully'})


class AnalyticsViewSet(viewsets.ViewSet):
    """ViewSet for Analytics Data"""
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def student_performance(self, request):
        """Get student performance analytics"""
        service = AnalyticsDataService(request.user.tenant)
        academic_year = request.query_params.get('academic_year')
        
        data = service.get_student_performance_analytics(academic_year)
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def attendance_trends(self, request):
        """Get attendance trends"""
        service = AnalyticsDataService(request.user.tenant)
        days = int(request.query_params.get('days', 30))
        
        data = service.get_attendance_trends(days)
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def fee_collection_trends(self, request):
        """Get fee collection trends"""
        service = AnalyticsDataService(request.user.tenant)
        months = int(request.query_params.get('months', 12))
        
        data = service.get_fee_collection_trends(months)
        return Response(data)
