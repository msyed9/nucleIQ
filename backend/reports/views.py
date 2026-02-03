"""
Reports API Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from core.permissions import IsTenantUser
from django.db.models import Q
from django.http import FileResponse
from django.core.files.base import ContentFile
from django.utils import timezone
from django.utils.dateparse import parse_date
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
from analytics.models import UsageLog


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
            status='PENDING',
            generated_by=request.user,
            filters_used=filters,
            date_range_start=request.data.get('date_range_start'),
            date_range_end=request.data.get('date_range_end'),
            format=output_format
        )

        should_async = bool(request.data.get('async'))
        try:
            service = ReportGenerationService(template)
            estimated_rows = service.estimate_count(filters=filters, date_range=date_range)
            if estimated_rows and estimated_rows >= 2000:
                should_async = True
        except Exception:
            estimated_rows = None

        if should_async:
            try:
                from .tasks import generate_report_async

                gen_report.is_async = True
                gen_report.status = 'GENERATING'
                gen_report.save(update_fields=['is_async', 'status', 'updated_at'])

                task = generate_report_async.delay(str(gen_report.id))
                gen_report.celery_task_id = task.id
                gen_report.save(update_fields=['celery_task_id', 'updated_at'])

                serializer = GeneratedReportSerializer(gen_report, context={'request': request})
                return Response(serializer.data, status=status.HTTP_202_ACCEPTED)
            except Exception as e:
                gen_report.error_message = f"Failed to enqueue async task: {e}"
                gen_report.status = 'FAILED'
                gen_report.save(update_fields=['status', 'error_message', 'updated_at'])
                return Response(
                    {'error': f'Report generation failed: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
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
            elif output_format == 'EXCEL':
                file_buffer = service.generate_excel()
                filename = f"{template.name.replace(' ', '_')}.xlsx"
            elif output_format == 'CSV':
                file_buffer = service.generate_csv()
                filename = f"{template.name.replace(' ', '_')}.csv"
            else:
                file_buffer = service.generate_pdf()
                filename = f"{template.name.replace(' ', '_')}.pdf"

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
    permission_classes = [IsAuthenticated, IsTenantUser]

    def _log_analytics_usage(self, request, feature):
        try:
            UsageLog.objects.create(
                tenant=request.user.tenant,
                user=request.user,
                action_type='FEATURE_USE',
                module='analytics',
                feature=feature,
                endpoint=request.path[:200],
                method=request.method[:10]
            )
        except Exception:
            pass

    def _get_filters(self, request):
        return {
            'grade_id': request.query_params.get('grade_id'),
            'section_id': request.query_params.get('section_id'),
            'class_name': request.query_params.get('class_name'),
            'gender': request.query_params.get('gender'),
            'religion': request.query_params.get('religion'),
            'caste': request.query_params.get('caste'),
        }

    def _parse_date_range(self, request):
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        start = parse_date(start_date) if start_date else None
        end = parse_date(end_date) if end_date else None
        return start, end

    def _require_finance_role(self, request):
        user = request.user
        if user.is_superuser or user.is_platform_admin or user.is_staff:
            return True

        role_codes = set(user.roles.filter(is_active=True).values_list('code', flat=True))
        return 'accountant' in role_codes or 'finance' in role_codes
    
    @action(detail=False, methods=['get'])
    def student_performance(self, request):
        """Get student performance analytics"""
        service = AnalyticsDataService(request.user.tenant, request.user)
        academic_year = request.query_params.get('academic_year')
        start_date, end_date = self._parse_date_range(request)
        segment_by = request.query_params.get('segment_by')
        filters = self._get_filters(request)

        data = service.get_student_performance_analytics(
            academic_year=academic_year,
            start_date=start_date,
            end_date=end_date,
            filters=filters,
            segment_by=segment_by
        )
        self._log_analytics_usage(request, 'student_performance')
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def attendance_trends(self, request):
        """Get attendance trends"""
        service = AnalyticsDataService(request.user.tenant, request.user)
        days = int(request.query_params.get('days', 30))
        start_date, end_date = self._parse_date_range(request)
        filters = self._get_filters(request)

        data = service.get_attendance_trends(
            days=days,
            start_date=start_date,
            end_date=end_date,
            filters=filters
        )
        self._log_analytics_usage(request, 'attendance_trends')
        return Response(data)
    
    @action(detail=False, methods=['get'])
    def fee_collection_trends(self, request):
        """Get fee collection trends"""
        if not self._require_finance_role(request):
            return Response({'error': 'You do not have access to fee analytics.'}, status=status.HTTP_403_FORBIDDEN)

        service = AnalyticsDataService(request.user.tenant, request.user)
        months = int(request.query_params.get('months', 12))
        start_date, end_date = self._parse_date_range(request)
        filters = self._get_filters(request)

        data = service.get_fee_collection_trends(
            months=months,
            start_date=start_date,
            end_date=end_date,
            filters=filters
        )
        self._log_analytics_usage(request, 'fee_collection_trends')
        return Response(data)

    @action(detail=False, methods=['get'])
    def class_section_drilldown(self, request):
        """Get class/section drilldown analytics"""
        service = AnalyticsDataService(request.user.tenant, request.user)
        start_date, end_date = self._parse_date_range(request)
        filters = self._get_filters(request)

        data = service.get_class_section_drilldown(
            start_date=start_date,
            end_date=end_date,
            filters=filters
        )
        self._log_analytics_usage(request, 'class_section_drilldown')
        return Response(data)

    @action(detail=False, methods=['get'])
    def fee_ageing_buckets(self, request):
        """Get fee ageing buckets"""
        if not self._require_finance_role(request):
            return Response({'error': 'You do not have access to fee analytics.'}, status=status.HTTP_403_FORBIDDEN)

        service = AnalyticsDataService(request.user.tenant, request.user)
        as_of_date = request.query_params.get('as_of_date')
        as_of_date = parse_date(as_of_date) if as_of_date else None
        filters = self._get_filters(request)

        data = service.get_fee_ageing_buckets(
            as_of_date=as_of_date,
            filters=filters
        )
        self._log_analytics_usage(request, 'fee_ageing_buckets')
        return Response(data)

    @action(detail=False, methods=['get'])
    def attendance_anomalies(self, request):
        """Get attendance anomalies"""
        service = AnalyticsDataService(request.user.tenant, request.user)
        start_date, end_date = self._parse_date_range(request)
        filters = self._get_filters(request)
        threshold = request.query_params.get('threshold', 80)

        try:
            threshold = float(threshold)
        except (TypeError, ValueError):
            threshold = 80

        data = service.get_attendance_anomalies(
            start_date=start_date,
            end_date=end_date,
            threshold=threshold,
            filters=filters
        )
        self._log_analytics_usage(request, 'attendance_anomalies')
        return Response(data)
