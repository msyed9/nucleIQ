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


class Homework(TenantAwareModel):
    """
    Daily homework model for simple tasks.
    Lighter than assignments, for quick daily tasks.
    """
    
    PRIORITY_CHOICES = [
        ('LOW', 'Low'),
        ('MEDIUM', 'Medium'),
        ('HIGH', 'High'),
    ]
    
    title = models.CharField(
        max_length=300,
        help_text=_('Homework title')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Homework description')
    )
    
    # Academic Context
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='homework',
        help_text=_('Academic year')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='homework',
        help_text=_('Subject')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='homework',
        help_text=_('Section/Class')
    )
    
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='assigned_homework',
        help_text=_('Teacher who assigned this')
    )
    
    # Dates
    assigned_date = models.DateField(
        default=timezone.now,
        help_text=_('Date when assigned')
    )
    
    due_date = models.DateField(
        help_text=_('Due date')
    )
    
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='MEDIUM',
        help_text=_('Priority level')
    )
    
    attachment = models.FileField(
        upload_to='homework/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Attachment file')
    )
    
    class Meta:
        db_table = 'homework'
        verbose_name = _('Homework')
        verbose_name_plural = _('Homework')
        ordering = ['-assigned_date', '-due_date']
        indexes = [
            models.Index(fields=['tenant', 'section', 'due_date']),
            models.Index(fields=['tenant', 'subject', 'assigned_date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.section} ({self.due_date})"
    
    def is_overdue(self):
        """Check if homework is past due date."""
        return timezone.now().date() > self.due_date


class HomeworkCompletion(TenantAwareModel):
    """Track student homework completion."""
    
    homework = models.ForeignKey(
        Homework,
        on_delete=models.CASCADE,
        related_name='completions',
        help_text=_('The homework')
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='homework_completions',
        help_text=_('Student')
    )
    
    is_completed = models.BooleanField(
        default=False,
        help_text=_('Whether completed')
    )
    
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('Completion timestamp')
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_('Student notes')
    )
    
    class Meta:
        db_table = 'homework_completions'
        verbose_name = _('Homework Completion')
        verbose_name_plural = _('Homework Completions')
        constraints = [
            models.UniqueConstraint(
                fields=['homework', 'student'],
                name='unique_homework_completion_per_student'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'student', 'is_completed']),
        ]
    
    def __str__(self):
        status = "✓" if self.is_completed else "✗"
        return f"{self.student} - {self.homework.title} [{status}]"
    
    def mark_complete(self):
        """Mark homework as completed."""
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save()


class Syllabus(TenantAwareModel):
    """
    Subject syllabus structure.
    Defines chapters and topics for a subject in a grade level.
    """
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='syllabi',
        help_text=_('Subject')
    )
    
    grade_level = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.CASCADE,
        related_name='syllabi',
        help_text=_('Grade level')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='syllabi',
        help_text=_('Academic year')
    )
    
    name = models.CharField(
        max_length=200,
        help_text=_('Syllabus name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Syllabus description')
    )
    
    total_hours = models.IntegerField(
        default=0,
        help_text=_('Total teaching hours')
    )
    
    class Meta:
        db_table = 'syllabus'
        verbose_name = _('Syllabus')
        verbose_name_plural = _('Syllabi')
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'subject', 'grade_level', 'academic_year'],
                name='unique_syllabus_per_subject_grade_year'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'subject', 'grade_level']),
        ]
    
    def __str__(self):
        return f"{self.subject.name} - {self.grade_level.name} ({self.academic_year})"
    
    def get_completion_percentage(self, section=None):
        """Calculate completion percentage for syllabus."""
        total_chapters = self.chapters.filter(is_deleted=False).count()
        if total_chapters == 0:
            return 0
        
        completed = self.chapters.filter(is_deleted=False, is_completed=True).count()
        return round((completed / total_chapters) * 100, 2)


class Chapter(TenantAwareModel):
    """
    Chapter in a syllabus.
    """
    
    syllabus = models.ForeignKey(
        Syllabus,
        on_delete=models.CASCADE,
        related_name='chapters',
        help_text=_('Parent syllabus')
    )
    
    name = models.CharField(
        max_length=300,
        help_text=_('Chapter name')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Chapter description')
    )
    
    order = models.IntegerField(
        default=0,
        help_text=_('Display order')
    )
    
    estimated_hours = models.IntegerField(
        default=1,
        help_text=_('Estimated teaching hours')
    )
    
    topics = models.JSONField(
        default=list,
        blank=True,
        help_text=_('List of topics in this chapter')
    )
    
    is_completed = models.BooleanField(
        default=False,
        help_text=_('Whether chapter is completed')
    )
    
    completed_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Date when completed')
    )
    
    completed_by = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='completed_chapters',
        help_text=_('Teacher who marked this complete')
    )
    
    class Meta:
        db_table = 'syllabus_chapters'
        verbose_name = _('Chapter')
        verbose_name_plural = _('Chapters')
        ordering = ['syllabus', 'order', 'name']
        indexes = [
            models.Index(fields=['tenant', 'syllabus', 'is_completed']),
        ]
    
    def __str__(self):
        return f"{self.order}. {self.name}"
    
    def mark_complete(self, teacher=None):
        """Mark chapter as completed."""
        self.is_completed = True
        self.completed_date = timezone.now().date()
        self.completed_by = teacher
        self.save()


class SyllabusProgress(TenantAwareModel):
    """
    Track syllabus progress per section.
    Teachers update this as they cover material.
    """
    
    syllabus = models.ForeignKey(
        Syllabus,
        on_delete=models.CASCADE,
        related_name='progress_records',
        help_text=_('Syllabus')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='syllabus_progress',
        help_text=_('Section')
    )
    
    chapter = models.ForeignKey(
        Chapter,
        on_delete=models.CASCADE,
        related_name='progress_records',
        help_text=_('Chapter')
    )
    
    is_completed = models.BooleanField(
        default=False,
        help_text=_('Whether completed for this section')
    )
    
    completed_date = models.DateField(
        null=True,
        blank=True,
        help_text=_('Date when completed')
    )
    
    teacher = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        related_name='syllabus_progress_updates',
        help_text=_('Teacher who updated')
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_('Teaching notes')
    )
    
    class Meta:
        db_table = 'syllabus_progress'
        verbose_name = _('Syllabus Progress')
        verbose_name_plural = _('Syllabus Progress Records')
        constraints = [
            models.UniqueConstraint(
                fields=['syllabus', 'section', 'chapter'],
                name='unique_progress_per_section_chapter'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'section', 'is_completed']),
        ]
    
    def __str__(self):
        status = "✓" if self.is_completed else "✗"
        return f"{self.section} - {self.chapter.name} [{status}]"

