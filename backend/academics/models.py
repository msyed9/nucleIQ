"""
Academics Models - Assignments and Submissions
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel


class Assignment(TenantAwareModel):
    """
    Assignment model for class-wide homework/assignments.
    Created by teachers for specific sections.
    """
    
    ASSIGNMENT_TYPE_CHOICES = [
        ('HOMEWORK', 'Homework'),
        ('PROJECT', 'Project'),
        ('QUIZ', 'Quiz'),
        ('EXAM', 'Exam'),
        ('LAB', 'Lab Work'),
        ('PRESENTATION', 'Presentation'),
        ('OTHER', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('CLOSED', 'Closed'),
    ]
    
    # Basic Information
    title = models.CharField(
        max_length=200,
        help_text=_('Assignment title')
    )
    
    description = models.TextField(
        help_text=_('Detailed assignment description and instructions')
    )
    
    assignment_type = models.CharField(
        max_length=20,
        choices=ASSIGNMENT_TYPE_CHOICES,
        default='HOMEWORK',
        help_text=_('Type of assignment')
    )
    
    # Academic Context
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text=_('Academic year for this assignment')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text=_('Subject this assignment belongs to')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='assignments',
        help_text=_('Section/Class this assignment is for')
    )
    
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_assignments',
        help_text=_('Teacher who created this assignment')
    )
    
    # Dates and Deadlines
    assigned_date = models.DateTimeField(
        default=timezone.now,
        help_text=_('Date when assignment was assigned')
    )
    
    due_date = models.DateTimeField(
        help_text=_('Submission deadline')
    )
    
    # Grading
    max_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100.00,
        help_text=_('Maximum marks for this assignment')
    )
    
    # Attachments
    attachment = models.FileField(
        upload_to='assignments/attachments/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Assignment file (PDF, DOC, etc.)')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Assignment status')
    )
    
    # Settings
    allow_late_submission = models.BooleanField(
        default=False,
        help_text=_('Allow submissions after due date')
    )
    
    late_penalty_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text=_('Penalty percentage for late submissions')
    )
    
    instructions = models.TextField(
        blank=True,
        help_text=_('Additional instructions for students')
    )
    
    class Meta:
        db_table = 'assignments'
        verbose_name = _('Assignment')
        verbose_name_plural = _('Assignments')
        ordering = ['-assigned_date']
        indexes = [
            models.Index(fields=['tenant', 'academic_year', 'section']),
            models.Index(fields=['tenant', 'subject']),
            models.Index(fields=['tenant', 'status', 'due_date']),
            models.Index(fields=['teacher', 'status']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.section} ({self.subject.name})"
    
    def clean(self):
        """Validate assignment data."""
        super().clean()
        
        if self.due_date and self.assigned_date:
            if self.due_date <= self.assigned_date:
                raise ValidationError({
                    'due_date': _('Due date must be after assigned date')
                })
    
    def is_overdue(self):
        """Check if assignment is past due date."""
        return timezone.now() > self.due_date
    
    def get_submission_count(self):
        """Get total number of submissions."""
        return self.submissions.filter(is_deleted=False).count()
    
    def get_graded_count(self):
        """Get number of graded submissions."""
        return self.submissions.filter(
            is_deleted=False,
            status='GRADED'
        ).count()
    
    def get_pending_count(self):
        """Get number of pending submissions."""
        return self.submissions.filter(
            is_deleted=False,
            status='SUBMITTED'
        ).count()
    
    def get_submission_percentage(self):
        """Calculate submission percentage."""
        from students.models import StudentEnrollment
        
        total_students = StudentEnrollment.objects.filter(
            tenant=self.tenant,
            section=self.section,
            academic_year=self.academic_year,
            status='ACTIVE',
            is_deleted=False
        ).count()
        
        if total_students == 0:
            return 0.0
        
        submitted = self.get_submission_count()
        return round((submitted / total_students) * 100, 2)


class Submission(TenantAwareModel):
    """
    Student submission for an assignment.
    Tracks submission status, files, and grading.
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('GRADED', 'Graded'),
        ('RETURNED', 'Returned'),
    ]
    
    # Relationships
    assignment = models.ForeignKey(
        Assignment,
        on_delete=models.CASCADE,
        related_name='submissions',
        help_text=_('Assignment this submission is for')
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='submissions',
        help_text=_('Student who submitted')
    )
    
    # Submission Details
    submission_file = models.FileField(
        upload_to='assignments/submissions/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Submitted file (PDF, DOC, images, etc.)')
    )
    
    submission_text = models.TextField(
        blank=True,
        help_text=_('Text submission (if applicable)')
    )
    
    submitted_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Timestamp when submitted')
    )
    
    # Status
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Submission status')
    )
    
    is_late = models.BooleanField(
        default=False,
        help_text=_('Whether submission was late')
    )
    
    # Grading
    marks_obtained = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Marks awarded')
    )
    
    graded_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='graded_submissions',
        help_text=_('Teacher who graded this submission')
    )
    
    graded_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Timestamp when graded')
    )
    
    # Feedback
    remarks = models.TextField(
        blank=True,
        help_text=_('Teacher feedback and remarks')
    )
    
    feedback_file = models.FileField(
        upload_to='assignments/feedback/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Feedback file with annotations')
    )
    
    # Student Notes
    student_notes = models.TextField(
        blank=True,
        help_text=_('Student notes or comments')
    )
    
    class Meta:
        db_table = 'submissions'
        verbose_name = _('Submission')
        verbose_name_plural = _('Submissions')
        ordering = ['-submitted_at']
        constraints = [
            models.UniqueConstraint(
                fields=['assignment', 'student'],
                name='unique_submission_per_student'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'assignment', 'status']),
            models.Index(fields=['tenant', 'student', 'status']),
            models.Index(fields=['status', 'submitted_at']),
        ]
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.assignment.title}"
    
    def clean(self):
        """Validate submission data."""
        super().clean()
        
        # Validate marks
        if self.marks_obtained is not None:
            if self.marks_obtained < 0:
                raise ValidationError({
                    'marks_obtained': _('Marks cannot be negative')
                })
            if self.marks_obtained > self.assignment.max_marks:
                raise ValidationError({
                    'marks_obtained': _(
                        f'Marks cannot exceed maximum marks ({self.assignment.max_marks})'
                    )
                })
    
    def submit(self):
        """Mark submission as submitted."""
        if self.status == 'DRAFT':
            self.status = 'SUBMITTED'
            self.submitted_at = timezone.now()
            
            # Check if late
            if self.submitted_at > self.assignment.due_date:
                self.is_late = True
            
            self.save()
    
    def grade(self, marks, remarks, graded_by):
        """Grade the submission."""
        self.marks_obtained = marks
        self.remarks = remarks
        self.graded_by = graded_by
        self.graded_at = timezone.now()
        self.status = 'GRADED'
        self.save()
    
    def get_percentage(self):
        """Calculate percentage score."""
        if self.marks_obtained is None:
            return None
        return round((self.marks_obtained / self.assignment.max_marks) * 100, 2)
    
    def get_grade_letter(self):
        """Get letter grade based on percentage."""
        percentage = self.get_percentage()
        if percentage is None:
            return None
        
        if percentage >= 90:
            return 'A+'
        elif percentage >= 80:
            return 'A'
        elif percentage >= 70:
            return 'B+'
        elif percentage >= 60:
            return 'B'
        elif percentage >= 50:
            return 'C'
        elif percentage >= 40:
            return 'D'
        else:
            return 'F'
