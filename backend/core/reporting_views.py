"""
Advanced Reporting API Views
Provides endpoints for generating and exporting reports
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from datetime import datetime, date, timedelta

from core.permissions import IsTenantUser
from .reporting_service import AdvancedReportingService


class ReportingViewSet(viewsets.ViewSet):
    """
    ViewSet for generating various reports.
    Supports multiple report types and export formats.
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get_reporting_service(self):
        """Get reporting service for current tenant."""
        return AdvancedReportingService(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['get'])
    def types(self, request):
        """Get available report types and subtypes."""
        return Response(AdvancedReportingService.REPORT_TYPES)
    
    @action(detail=False, methods=['get', 'post'])
    def generate(self, request):
        """
        Generate a report based on type and parameters.
        
        Query/POST params:
        - report_type: ATTENDANCE, FEES, ACADEMICS, STUDENTS, etc.
        - subtype: Specific report subtype (e.g., DAILY, MONTHLY)
        - start_date: Start date for date-range reports (YYYY-MM-DD)
        - end_date: End date for date-range reports (YYYY-MM-DD)
        - filters: JSON object with additional filters
        - format: Output format (json, excel, csv, pdf)
        """
        # Get parameters from query or body
        data = request.data if request.method == 'POST' else request.query_params
        
        report_type = data.get('report_type', '').upper()
        subtype = data.get('subtype', '').upper()
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        filters = data.get('filters', {})
        export_format = data.get('format', 'json').lower()
        
        if not report_type:
            return Response(
                {'error': 'report_type is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Parse dates
        if start_date:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid start_date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            start_date = date.today() - timedelta(days=30)
        
        if end_date:
            try:
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                return Response(
                    {'error': 'Invalid end_date format. Use YYYY-MM-DD'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            end_date = date.today()
        
        # Parse filters if string
        if isinstance(filters, str):
            import json
            try:
                filters = json.loads(filters)
            except json.JSONDecodeError:
                filters = {}
        
        service = self.get_reporting_service()
        
        # Generate report based on type
        try:
            if report_type == 'FEES':
                if subtype == 'COLLECTION':
                    group_by = data.get('group_by', 'date')
                    report_data = service.generate_fee_collection_report(
                        start_date=start_date,
                        end_date=end_date,
                        group_by=group_by,
                        filters=filters
                    )
                elif subtype == 'PENDING':
                    report_data = service.generate_fee_pending_report(
                        as_of_date=end_date,
                        filters=filters
                    )
                else:
                    return Response(
                        {'error': f'Unknown FEES subtype: {subtype}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            
            elif report_type == 'ATTENDANCE':
                report_data = service.generate_attendance_report(
                    report_subtype=subtype or 'DAILY',
                    start_date=start_date,
                    end_date=end_date,
                    filters=filters
                )
            
            elif report_type == 'ACADEMICS':
                academic_year_id = data.get('academic_year_id')
                report_data = service.generate_academic_report(
                    report_subtype=subtype or 'RESULT_ANALYSIS',
                    academic_year_id=academic_year_id,
                    filters=filters
                )
            
            elif report_type == 'STUDENTS':
                report_data = service.generate_student_report(
                    report_subtype=subtype or 'ENROLLMENT',
                    filters=filters
                )
            
            else:
                return Response(
                    {'error': f'Unknown report_type: {report_type}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Handle export format
            if export_format == 'json':
                return Response(report_data)
            
            elif export_format == 'excel':
                excel_data = service.export_to_excel(report_data)
                response = HttpResponse(
                    excel_data,
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                filename = f"{report_type}_{subtype}_{date.today().isoformat()}.xlsx"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            
            elif export_format == 'csv':
                csv_data = service.export_to_csv(report_data)
                response = HttpResponse(csv_data, content_type='text/csv')
                filename = f"{report_type}_{subtype}_{date.today().isoformat()}.csv"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            
            elif export_format == 'pdf':
                pdf_data = service.export_to_pdf(report_data)
                response = HttpResponse(pdf_data, content_type='application/pdf')
                filename = f"{report_type}_{subtype}_{date.today().isoformat()}.pdf"
                response['Content-Disposition'] = f'attachment; filename="{filename}"'
                return response
            
            else:
                return Response(report_data)
                
        except Exception as e:
            return Response(
                {'error': f'Report generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def fee_collection(self, request):
        """Shortcut for fee collection report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'FEES'
        request.query_params['subtype'] = 'COLLECTION'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def fee_pending(self, request):
        """Shortcut for pending fees report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'FEES'
        request.query_params['subtype'] = 'PENDING'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def attendance_daily(self, request):
        """Shortcut for daily attendance report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'ATTENDANCE'
        request.query_params['subtype'] = 'DAILY'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def attendance_class_wise(self, request):
        """Shortcut for class-wise attendance report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'ATTENDANCE'
        request.query_params['subtype'] = 'CLASS_WISE'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def student_enrollment(self, request):
        """Shortcut for enrollment report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'STUDENTS'
        request.query_params['subtype'] = 'ENROLLMENT'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def class_strength(self, request):
        """Shortcut for class strength report."""
        request.query_params._mutable = True
        request.query_params['report_type'] = 'STUDENTS'
        request.query_params['subtype'] = 'CLASS_STRENGTH'
        request.query_params._mutable = False
        return self.generate(request)
    
    @action(detail=False, methods=['get'])
    def dashboard_summary(self, request):
        """
        Get a comprehensive dashboard summary with key metrics.
        Used by dashboard widgets.
        """
        from students.models import Student, Enrollment
        from fees.models import FeeInvoice, FeeTransaction
        from attendance.models import Attendance
        from staff.models import Staff
        from django.db.models import Sum, Count, Q
        
        tenant = request.user.tenant
        today = date.today()
        month_start = today.replace(day=1)
        
        # Student metrics
        total_students = Student.objects.filter(tenant=tenant, is_active=True).count()
        active_enrollments = Enrollment.objects.filter(tenant=tenant, status='ACTIVE').count()
        
        # Boys/Girls count
        boys_count = Student.objects.filter(tenant=tenant, is_active=True, gender='MALE').count()
        girls_count = Student.objects.filter(tenant=tenant, is_active=True, gender='FEMALE').count()
        
        # Staff metrics
        total_staff = Staff.objects.filter(tenant=tenant, is_active=True).count()
        teachers_count = Staff.objects.filter(tenant=tenant, is_active=True, department__name__icontains='teaching').count()
        
        # Attendance today
        today_attendance = Attendance.objects.filter(
            tenant=tenant,
            date=today
        ).aggregate(
            present=Count('id', filter=Q(status='PRESENT')),
            absent=Count('id', filter=Q(status='ABSENT')),
            total=Count('id')
        )
        
        attendance_percentage = 0
        if today_attendance['total']:
            attendance_percentage = round(
                today_attendance['present'] / today_attendance['total'] * 100, 1
            )
        
        # Fee metrics
        fee_collected_this_month = FeeTransaction.objects.filter(
            tenant=tenant,
            transaction_date__gte=month_start,
            transaction_date__lte=today
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_pending_fees = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL']
        ).aggregate(total=Sum('balance_amount'))['total'] or 0
        
        fee_defaulters = FeeInvoice.objects.filter(
            tenant=tenant,
            status__in=['PENDING', 'PARTIAL'],
            due_date__lt=today
        ).values('student').distinct().count()
        
        return Response({
            'students': {
                'total': total_students,
                'active_enrollments': active_enrollments,
                'boys': boys_count,
                'girls': girls_count
            },
            'staff': {
                'total': total_staff,
                'teachers': teachers_count
            },
            'attendance': {
                'date': today.isoformat(),
                'present': today_attendance['present'] or 0,
                'absent': today_attendance['absent'] or 0,
                'total': today_attendance['total'] or 0,
                'percentage': attendance_percentage
            },
            'fees': {
                'collected_this_month': float(fee_collected_this_month),
                'total_pending': float(total_pending_fees),
                'defaulters_count': fee_defaulters
            }
        })
