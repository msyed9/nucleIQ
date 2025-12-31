"""
Exam Results Views - Result Entry and Grade Card Generation
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone
from django.db.models import Avg, Count, Q
from django.http import HttpResponse
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO

from .models import GradeConfiguration, GradeScale, ExamResult, Exam
from .serializers import (
    GradeConfigurationSerializer, GradeScaleSerializer,
    ExamResultSerializer, BulkResultEntrySerializer
)
from core.middleware import get_current_tenant
from students.models import Student


class GradeConfigurationViewSet(viewsets.ModelViewSet):
    """ViewSet for GradeConfiguration management."""
    
    serializer_class = GradeConfigurationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['academic_year', 'is_default']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name']
    ordering = ['-is_default', 'name']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return GradeConfiguration.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).prefetch_related('scales')


class GradeScaleViewSet(viewsets.ModelViewSet):
    """ViewSet for GradeScale management."""
    
    serializer_class = GradeScaleSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['configuration']
    ordering_fields = ['min_percentage']
    ordering = ['-min_percentage']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return GradeScale.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('configuration')


class ExamResultViewSet(viewsets.ModelViewSet):
    """ViewSet for ExamResult management with bulk entry and grade card generation."""
    
    serializer_class = ExamResultSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['exam', 'student', 'section', 'status', 'is_pass', 'is_absent']
    search_fields = ['student__first_name', 'student__last_name', 'student__roll_number']
    ordering_fields = ['marks_obtained', 'percentage', 'created_at']
    ordering = ['section', 'student__roll_number']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return ExamResult.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).select_related('exam', 'student', 'section', 'entered_by')
    
    def perform_create(self, serializer):
        """Set entered_by to current user."""
        serializer.save(entered_by=self.request.user)
    
    @action(detail=False, methods=['post'])
    def bulk_entry(self, request):
        """
        Bulk result entry for a section.
        
        POST /api/exams/results/bulk_entry/
        {
            "exam_id": "uuid",
            "section_id": "uuid",
            "results": [
                {
                    "student_id": "uuid",
                    "marks_obtained": "85.50",
                    "is_absent": false,
                    "remarks": "Good performance"
                },
                ...
            ]
        }
        """
        serializer = BulkResultEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        tenant = get_current_tenant()
        
        try:
            exam = Exam.objects.get(pk=data['exam_id'], tenant=tenant)
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Exam not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        created_results = []
        updated_results = []
        errors = []
        
        for result_data in data['results']:
            try:
                student_id = result_data.get('student_id')
                marks = result_data.get('marks_obtained', 0)
                is_absent = result_data.get('is_absent', False)
                remarks = result_data.get('remarks', '')
                
                # Get or create result
                result, created = ExamResult.objects.update_or_create(
                    tenant=tenant,
                    exam=exam,
                    student_id=student_id,
                    defaults={
                        'section_id': data['section_id'],
                        'marks_obtained': marks if not is_absent else 0,
                        'is_absent': is_absent,
                        'remarks': remarks,
                        'entered_by': request.user,
                        'status': 'DRAFT'
                    }
                )
                
                if created:
                    created_results.append(result)
                else:
                    updated_results.append(result)
                    
            except Exception as e:
                errors.append({
                    'student_id': result_data.get('student_id'),
                    'error': str(e)
                })
        
        return Response({
            'created': len(created_results),
            'updated': len(updated_results),
            'errors': errors,
            'message': f'Successfully processed {len(created_results) + len(updated_results)} results'
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['post'])
    def publish_results(self, request):
        """
        Publish results for an exam.
        
        POST /api/exams/results/publish_results/
        {
            "exam_id": "uuid",
            "section_id": "uuid" (optional)
        }
        """
        exam_id = request.data.get('exam_id')
        section_id = request.data.get('section_id')
        
        tenant = get_current_tenant()
        
        results = ExamResult.objects.filter(
            tenant=tenant,
            exam_id=exam_id,
            status='DRAFT'
        )
        
        if section_id:
            results = results.filter(section_id=section_id)
        
        count = results.update(
            status='PUBLISHED',
            published_at=timezone.now()
        )
        
        return Response({
            'published_count': count,
            'message': f'Successfully published {count} results'
        })
    
    @action(detail=False, methods=['get'])
    def analytics(self, request):
        """
        Get analytics for an exam.
        
        GET /api/exams/results/analytics/?exam_id=uuid&section_id=uuid
        """
        exam_id = request.query_params.get('exam_id')
        section_id = request.query_params.get('section_id')
        
        if not exam_id:
            return Response(
                {'error': 'exam_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tenant = get_current_tenant()
        
        results = ExamResult.objects.filter(
            tenant=tenant,
            exam_id=exam_id,
            is_deleted=False,
            is_absent=False
        )
        
        if section_id:
            results = results.filter(section_id=section_id)
        
        analytics = results.aggregate(
            total_students=Count('id'),
            passed=Count('id', filter=Q(is_pass=True)),
            failed=Count('id', filter=Q(is_pass=False)),
            average_marks=Avg('marks_obtained'),
            average_percentage=Avg('percentage')
        )
        
        # Grade distribution
        grade_distribution = {}
        for result in results:
            grade = result.grade or 'N/A'
            grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
        
        analytics['grade_distribution'] = grade_distribution
        analytics['pass_percentage'] = (
            (analytics['passed'] / analytics['total_students'] * 100)
            if analytics['total_students'] > 0 else 0
        )
        
        return Response(analytics)
    
    @action(detail=True, methods=['get'])
    def grade_card(self, request, pk=None):
        """
        Generate and download grade card PDF for a student.
        
        GET /api/exams/results/{id}/grade_card/
        """
        result = self.get_object()
        
        # Create PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#283593'),
            spaceAfter=12
        )
        
        # Title
        tenant = get_current_tenant()
        elements.append(Paragraph(f"{tenant.name}", title_style))
        elements.append(Paragraph("GRADE CARD", heading_style))
        elements.append(Spacer(1, 0.3*inch))
        
        # Student Information
        student_data = [
            ['Student Name:', result.student.get_full_name()],
            ['Roll Number:', result.student.roll_number],
            ['Class:', f"{result.section.grade_level.name} - {result.section.name}"],
            ['Exam:', result.exam.name],
            ['Date:', result.exam.schedules.first().exam_date if result.exam.schedules.exists() else 'N/A']
        ]
        
        student_table = Table(student_data, colWidths=[2*inch, 4*inch])
        student_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8eaf6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.grey)
        ]))
        
        elements.append(student_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Marks Information
        marks_data = [
            ['Subject', 'Total Marks', 'Marks Obtained', 'Percentage', 'Grade'],
            [
                result.exam.subject.name,
                str(result.exam.total_marks),
                str(result.marks_obtained) if not result.is_absent else 'ABSENT',
                f"{result.percentage:.2f}%" if result.percentage else 'N/A',
                result.grade or 'N/A'
            ]
        ]
        
        marks_table = Table(marks_data, colWidths=[2*inch, 1.2*inch, 1.5*inch, 1.2*inch, 1*inch])
        marks_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3f51b5')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(marks_table)
        elements.append(Spacer(1, 0.3*inch))
        
        # Result
        result_text = "PASS" if result.is_pass else "FAIL"
        result_color = colors.green if result.is_pass else colors.red
        result_para = Paragraph(
            f"<b>Result: <font color='{result_color.hexval()}'>{result_text}</font></b>",
            styles['Heading2']
        )
        elements.append(result_para)
        
        if result.remarks:
            elements.append(Spacer(1, 0.2*inch))
            elements.append(Paragraph(f"<b>Remarks:</b> {result.remarks}", styles['Normal']))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Return PDF
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="grade_card_{result.student.roll_number}.pdf"'
        
        return response
