"""
Exams Models - Comprehensive Examination Management
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from decimal import Decimal
from core.models import TenantAwareModel
import random


class ExamTerm(TenantAwareModel):
    """
    Exam Term/Period (e.g., Mid-Term, Final, Unit Test)
    """
    
    TERM_TYPE_CHOICES = [
        ('UNIT_TEST', 'Unit Test'),
        ('MID_TERM', 'Mid-Term'),
        ('FINAL', 'Final'),
        ('QUARTERLY', 'Quarterly'),
        ('HALF_YEARLY', 'Half-Yearly'),
        ('ANNUAL', 'Annual'),
        ('ENTRANCE', 'Entrance'),
        ('OTHER', 'Other'),
    ]
    
    name = models.CharField(
        max_length=100,
        help_text=_('Term name (e.g., "Mid-Term 2024")')
    )
    
    term_type = models.CharField(
        max_length=20,
        choices=TERM_TYPE_CHOICES,
        help_text=_('Type of exam term')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='exam_terms',
        help_text=_('Academic year for this term')
    )
    
    start_date = models.DateField(
        help_text=_('Term start date')
    )
    
    end_date = models.DateField(
        help_text=_('Term end date')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Term description')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this term is active')
    )
    
    class Meta:
        db_table = 'exam_terms'
        verbose_name = _('Exam Term')
        verbose_name_plural = _('Exam Terms')
        ordering = ['-start_date']
        indexes = [
            models.Index(fields=['tenant', 'academic_year', 'is_active']),
            models.Index(fields=['term_type', 'start_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_term_type_display()})"
    
    def clean(self):
        """Validate term dates."""
        super().clean()
        
        if self.end_date and self.start_date:
            if self.end_date <= self.start_date:
                raise ValidationError({
                    'end_date': _('End date must be after start date')
                })


class Exam(TenantAwareModel):
    """
    Individual Exam (e.g., "Math Mid-Term Class 1")
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('SCHEDULED', 'Scheduled'),
        ('IN_PROGRESS', 'In Progress'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    ]
    
    name = models.CharField(
        max_length=200,
        help_text=_('Exam name')
    )
    
    exam_term = models.ForeignKey(
        ExamTerm,
        on_delete=models.CASCADE,
        related_name='exams',
        help_text=_('Exam term this belongs to')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='exams',
        help_text=_('Subject for this exam')
    )
    
    grade_level = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.CASCADE,
        related_name='exams',
        help_text=_('Grade level for this exam')
    )
    
    sections = models.ManyToManyField(
        'tenants.Section',
        related_name='exams',
        help_text=_('Sections taking this exam')
    )
    
    total_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=100.00,
        help_text=_('Total marks for this exam')
    )
    
    passing_marks = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=40.00,
        help_text=_('Minimum passing marks')
    )
    
    duration_minutes = models.IntegerField(
        help_text=_('Exam duration in minutes')
    )
    
    instructions = models.TextField(
        blank=True,
        help_text=_('Exam instructions for students')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Exam status')
    )
    
    syllabus = models.TextField(
        blank=True,
        help_text=_('Syllabus/topics covered')
    )
    
    question_paper = models.FileField(
        upload_to='exams/question_papers/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Question paper file')
    )
    
    answer_key = models.FileField(
        upload_to='exams/answer_keys/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Answer key file')
    )
    
    class Meta:
        db_table = 'exams'
        verbose_name = _('Exam')
        verbose_name_plural = _('Exams')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'exam_term', 'status']),
            models.Index(fields=['subject', 'grade_level']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.subject.name}"
    
    def clean(self):
        """Validate exam data."""
        super().clean()
        
        if self.passing_marks and self.total_marks:
            if self.passing_marks > self.total_marks:
                raise ValidationError({
                    'passing_marks': _('Passing marks cannot exceed total marks')
                })


class ExamSchedule(TenantAwareModel):
    """
    Exam Schedule - Date, Time, Room for specific sections
    """
    
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='schedules',
        help_text=_('Exam being scheduled')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='exam_schedules',
        help_text=_('Section taking this exam')
    )
    
    exam_date = models.DateField(
        help_text=_('Date of exam')
    )
    
    start_time = models.TimeField(
        help_text=_('Exam start time')
    )
    
    end_time = models.TimeField(
        help_text=_('Exam end time')
    )
    
    room = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Exam room/venue')
    )
    
    invigilator = models.ForeignKey(
        'staff.Staff',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invigilated_exams',
        help_text=_('Invigilator for this exam')
    )
    
    notes = models.TextField(
        blank=True,
        help_text=_('Additional notes')
    )
    
    class Meta:
        db_table = 'exam_schedules'
        verbose_name = _('Exam Schedule')
        verbose_name_plural = _('Exam Schedules')
        ordering = ['exam_date', 'start_time']
        constraints = [
            models.UniqueConstraint(
                fields=['exam', 'section'],
                name='unique_exam_section_schedule'
            ),
            models.CheckConstraint(
                check=models.Q(end_time__gt=models.F('start_time')),
                name='end_time_after_start_time_exam'
            )
        ]
        indexes = [
            models.Index(fields=['tenant', 'exam_date', 'start_time']),
            models.Index(fields=['section', 'exam_date']),
            models.Index(fields=['room', 'exam_date', 'start_time']),
        ]
    
    def __str__(self):
        return f"{self.exam.name} - {self.section} on {self.exam_date}"
    
    def clean(self):
        """Validate schedule for conflicts."""
        super().clean()
        
        if self.end_time and self.start_time:
            if self.end_time <= self.start_time:
                raise ValidationError({
                    'end_time': _('End time must be after start time')
                })
        
        # Check for section conflicts (section can't have two exams at same time)
        if self.section and self.exam_date and self.start_time and self.end_time:
            conflicts = ExamSchedule.objects.filter(
                tenant=self.tenant,
                section=self.section,
                exam_date=self.exam_date,
                is_deleted=False
            ).exclude(pk=self.pk)
            
            for schedule in conflicts:
                # Check for time overlap
                if (self.start_time < schedule.end_time and 
                    self.end_time > schedule.start_time):
                    raise ValidationError({
                        'start_time': _(
                            f'Section {self.section} already has an exam scheduled '
                            f'from {schedule.start_time} to {schedule.end_time}'
                        )
                    })
        
        # Check for room conflicts
        if self.room and self.exam_date and self.start_time and self.end_time:
            room_conflicts = ExamSchedule.objects.filter(
                tenant=self.tenant,
                room=self.room,
                exam_date=self.exam_date,
                is_deleted=False
            ).exclude(pk=self.pk)
            
            for schedule in room_conflicts:
                if (self.start_time < schedule.end_time and 
                    self.end_time > schedule.start_time):
                    raise ValidationError({
                        'room': _(
                            f'Room {self.room} is already booked '
                            f'from {schedule.start_time} to {schedule.end_time}'
                        )
                    })


class Topic(TenantAwareModel):
    """
    Topic/Chapter for organizing questions
    """
    
    name = models.CharField(
        max_length=200,
        help_text=_('Topic name')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='topics',
        help_text=_('Subject this topic belongs to')
    )
    
    grade_level = models.ForeignKey(
        'tenants.GradeLevel',
        on_delete=models.CASCADE,
        related_name='topics',
        help_text=_('Grade level for this topic')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Topic description')
    )
    
    order = models.IntegerField(
        default=0,
        help_text=_('Display order')
    )
    
    class Meta:
        db_table = 'topics'
        verbose_name = _('Topic')
        verbose_name_plural = _('Topics')
        ordering = ['subject', 'order', 'name']
        indexes = [
            models.Index(fields=['tenant', 'subject', 'grade_level']),
        ]
    
    def __str__(self):
        return f"{self.subject.name} - {self.name}"


class LearningOutcome(TenantAwareModel):
    """
    Learning Outcome for OBE (Outcome-Based Education)
    """
    
    BLOOM_TAXONOMY_CHOICES = [
        ('REMEMBER', 'Remember'),
        ('UNDERSTAND', 'Understand'),
        ('APPLY', 'Apply'),
        ('ANALYZE', 'Analyze'),
        ('EVALUATE', 'Evaluate'),
        ('CREATE', 'Create'),
    ]
    
    code = models.CharField(
        max_length=50,
        help_text=_('Outcome code (e.g., LO1, CO1)')
    )
    
    description = models.TextField(
        help_text=_('Learning outcome description')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='learning_outcomes',
        help_text=_('Subject for this outcome')
    )
    
    topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='learning_outcomes',
        help_text=_('Related topic')
    )
    
    bloom_level = models.CharField(
        max_length=20,
        choices=BLOOM_TAXONOMY_CHOICES,
        blank=True,
        help_text=_("Bloom's taxonomy level")
    )
    
    class Meta:
        db_table = 'learning_outcomes'
        verbose_name = _('Learning Outcome')
        verbose_name_plural = _('Learning Outcomes')
        ordering = ['subject', 'code']
        indexes = [
            models.Index(fields=['tenant', 'subject']),
        ]
    
    def __str__(self):
        return f"{self.code} - {self.description[:50]}"


class QuestionBank(TenantAwareModel):
    """
    Question Bank for generating exam papers
    """
    
    QUESTION_TYPE_CHOICES = [
        ('MCQ', 'Multiple Choice'),
        ('TRUE_FALSE', 'True/False'),
        ('SHORT_ANSWER', 'Short Answer'),
        ('LONG_ANSWER', 'Long Answer'),
        ('FILL_BLANK', 'Fill in the Blank'),
        ('MATCH', 'Matching'),
        ('NUMERICAL', 'Numerical'),
        ('ESSAY', 'Essay'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('EASY', 'Easy'),
        ('MEDIUM', 'Medium'),
        ('HARD', 'Hard'),
    ]
    
    question_text = models.TextField(
        help_text=_('Question text')
    )
    
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPE_CHOICES,
        help_text=_('Type of question')
    )
    
    subject = models.ForeignKey(
        'tenants.Subject',
        on_delete=models.CASCADE,
        related_name='questions',
        help_text=_('Subject for this question')
    )
    
    topic = models.ForeignKey(
        Topic,
        on_delete=models.CASCADE,
        related_name='questions',
        help_text=_('Topic for this question')
    )
    
    difficulty = models.CharField(
        max_length=10,
        choices=DIFFICULTY_CHOICES,
        help_text=_('Question difficulty level')
    )
    
    marks = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=1.00,
        help_text=_('Marks for this question')
    )
    
    learning_outcome = models.ForeignKey(
        LearningOutcome,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='questions',
        help_text=_('Associated learning outcome (for OBE)')
    )
    
    # MCQ specific fields
    option_a = models.TextField(
        blank=True,
        help_text=_('Option A (for MCQ)')
    )
    
    option_b = models.TextField(
        blank=True,
        help_text=_('Option B (for MCQ)')
    )
    
    option_c = models.TextField(
        blank=True,
        help_text=_('Option C (for MCQ)')
    )
    
    option_d = models.TextField(
        blank=True,
        help_text=_('Option D (for MCQ)')
    )
    
    correct_answer = models.TextField(
        blank=True,
        help_text=_('Correct answer or answer key')
    )
    
    explanation = models.TextField(
        blank=True,
        help_text=_('Explanation for the answer')
    )
    
    image = models.ImageField(
        upload_to='questions/images/%Y/%m/',
        blank=True,
        null=True,
        help_text=_('Question image (if any)')
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text=_('Whether this question is active')
    )
    
    usage_count = models.IntegerField(
        default=0,
        help_text=_('Number of times this question has been used')
    )
    
    class Meta:
        db_table = 'question_bank'
        verbose_name = _('Question')
        verbose_name_plural = _('Question Bank')
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tenant', 'subject', 'topic']),
            models.Index(fields=['difficulty', 'question_type']),
            models.Index(fields=['is_active', 'subject']),
        ]
    
    def __str__(self):
        return f"{self.question_type} - {self.question_text[:50]}"
    
    @classmethod
    def generate_paper(cls, subject, total_marks, difficulty_distribution, topic_ids=None):
        """
        Generate a question paper based on criteria.
        
        Args:
            subject: Subject instance
            total_marks: Total marks for the paper
            difficulty_distribution: Dict like {'EASY': 10, 'MEDIUM': 10, 'HARD': 5}
            topic_ids: Optional list of topic IDs to filter
        
        Returns:
            List of selected questions
        """
        selected_questions = []
        current_marks = Decimal('0.00')
        
        for difficulty, count in difficulty_distribution.items():
            # Get questions for this difficulty
            questions = cls.objects.filter(
                subject=subject,
                difficulty=difficulty,
                is_active=True,
                is_deleted=False
            )
            
            if topic_ids:
                questions = questions.filter(topic_id__in=topic_ids)
            
            # Order by usage count (prefer less used questions)
            questions = list(questions.order_by('usage_count'))
            
            # Randomly select questions
            if len(questions) >= count:
                selected = random.sample(questions, count)
                selected_questions.extend(selected)
                current_marks += sum(q.marks for q in selected)
        
        return selected_questions


class GradeConfiguration(TenantAwareModel):
    """
    Grade Configuration - Define grading scale (A+, A, B+, etc.)
    """
    
    name = models.CharField(
        max_length=100,
        help_text=_('Configuration name (e.g., "Standard Grading")')
    )
    
    academic_year = models.ForeignKey(
        'tenants.AcademicYear',
        on_delete=models.CASCADE,
        related_name='grade_configurations',
        help_text=_('Academic year for this configuration')
    )
    
    is_default = models.BooleanField(
        default=False,
        help_text=_('Whether this is the default configuration')
    )
    
    description = models.TextField(
        blank=True,
        help_text=_('Configuration description')
    )
    
    class Meta:
        db_table = 'grade_configurations'
        verbose_name = _('Grade Configuration')
        verbose_name_plural = _('Grade Configurations')
        ordering = ['-is_default', 'name']
        indexes = [
            models.Index(fields=['tenant', 'academic_year', 'is_default']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.academic_year})"


class GradeScale(TenantAwareModel):
    """
    Individual grade scale entry (e.g., A+ = 90-100)
    """
    
    configuration = models.ForeignKey(
        GradeConfiguration,
        on_delete=models.CASCADE,
        related_name='scales',
        help_text=_('Grade configuration this belongs to')
    )
    
    grade = models.CharField(
        max_length=10,
        help_text=_('Grade (e.g., A+, A, B+)')
    )
    
    min_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text=_('Minimum percentage for this grade')
    )
    
    max_percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text=_('Maximum percentage for this grade')
    )
    
    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        help_text=_('Grade point (e.g., 4.0 for A+)')
    )
    
    remarks = models.CharField(
        max_length=100,
        blank=True,
        help_text=_('Remarks (e.g., "Excellent", "Good")')
    )
    
    class Meta:
        db_table = 'grade_scales'
        verbose_name = _('Grade Scale')
        verbose_name_plural = _('Grade Scales')
        ordering = ['-min_percentage']
        indexes = [
            models.Index(fields=['tenant', 'configuration']),
        ]
    
    def __str__(self):
        return f"{self.grade} ({self.min_percentage}% - {self.max_percentage}%)"
    
    def clean(self):
        """Validate grade scale."""
        super().clean()
        
        if self.max_percentage and self.min_percentage:
            if self.max_percentage <= self.min_percentage:
                raise ValidationError({
                    'max_percentage': _('Max percentage must be greater than min percentage')
                })


class ExamResult(TenantAwareModel):
    """
    Student Exam Result
    """
    
    STATUS_CHOICES = [
        ('DRAFT', 'Draft'),
        ('PUBLISHED', 'Published'),
        ('WITHHELD', 'Withheld'),
    ]
    
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='results',
        help_text=_('Exam for this result')
    )
    
    student = models.ForeignKey(
        'students.Student',
        on_delete=models.CASCADE,
        related_name='exam_results',
        help_text=_('Student')
    )
    
    section = models.ForeignKey(
        'tenants.Section',
        on_delete=models.CASCADE,
        related_name='exam_results',
        help_text=_('Section')
    )
    
    marks_obtained = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text=_('Marks obtained by student')
    )
    
    grade = models.CharField(
        max_length=10,
        blank=True,
        help_text=_('Grade (auto-calculated)')
    )
    
    grade_point = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Grade point (auto-calculated)')
    )
    
    percentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text=_('Percentage (auto-calculated)')
    )
    
    is_pass = models.BooleanField(
        default=False,
        help_text=_('Whether student passed')
    )
    
    is_absent = models.BooleanField(
        default=False,
        help_text=_('Whether student was absent')
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='DRAFT',
        help_text=_('Result status')
    )
    
    remarks = models.TextField(
        blank=True,
        help_text=_('Remarks/comments')
    )
    
    entered_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='entered_results',
        help_text=_('User who entered this result')
    )
    
    published_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=_('When result was published')
    )
    
    class Meta:
        db_table = 'exam_results'
        verbose_name = _('Exam Result')
        verbose_name_plural = _('Exam Results')
        ordering = ['exam', 'section', 'student']
        constraints = [
            models.UniqueConstraint(
                fields=['exam', 'student'],
                name='unique_exam_student_result'
            ),
        ]
        indexes = [
            models.Index(fields=['tenant', 'exam', 'section']),
            models.Index(fields=['student', 'exam']),
            models.Index(fields=['status', 'is_pass']),
        ]
    
    def __str__(self):
        return f"{self.student} - {self.exam.name}: {self.marks_obtained}/{self.exam.total_marks}"
    
    def save(self, *args, **kwargs):
        """Auto-calculate percentage, grade, and pass/fail."""
        # Calculate percentage
        if self.exam.total_marks and not self.is_absent:
            self.percentage = (self.marks_obtained / self.exam.total_marks) * 100
            
            # Determine pass/fail
            self.is_pass = self.marks_obtained >= self.exam.passing_marks
            
            # Calculate grade
            try:
                grade_config = GradeConfiguration.objects.filter(
                    tenant=self.tenant,
                    academic_year=self.exam.exam_term.academic_year,
                    is_default=True
                ).first()
                
                if grade_config:
                    grade_scale = GradeScale.objects.filter(
                        configuration=grade_config,
                        min_percentage__lte=self.percentage,
                        max_percentage__gte=self.percentage
                    ).first()
                    
                    if grade_scale:
                        self.grade = grade_scale.grade
                        self.grade_point = grade_scale.grade_point
            except Exception:
                pass  # Silently fail if grade calculation fails
        
        super().save(*args, **kwargs)
    
    def clean(self):
        """Validate result data."""
        super().clean()
        
        if not self.is_absent and self.marks_obtained is not None:
            if self.marks_obtained > self.exam.total_marks:
                raise ValidationError({
                    'marks_obtained': _('Marks obtained cannot exceed total marks')
                })
            
            if self.marks_obtained < 0:
                raise ValidationError({
                    'marks_obtained': _('Marks obtained cannot be negative')
                })
