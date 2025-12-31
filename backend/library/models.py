"""
Library & Digital LMS Models
"""

from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel
from datetime import timedelta

class Book(TenantAwareModel):
    """
    Physical Book Title/Master Record
    """
    title = models.CharField(max_length=500, help_text=_("Book Title"))
    author = models.CharField(max_length=255, help_text=_("Author Name"))
    isbn = models.CharField(max_length=20, blank=True, help_text=_("ISBN Number"))
    publisher = models.CharField(max_length=255, blank=True)
    edition = models.CharField(max_length=50, blank=True)
    year_published = models.IntegerField(null=True, blank=True)
    
    # Classification
    category = models.CharField(max_length=100, help_text=_("Category/Genre (e.g. Fiction, Science)"))
    shelf_location = models.CharField(max_length=50, help_text=_("Physical Shelf Location"))
    
    # Text Search
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='library/covers/', null=True, blank=True)
    
    # Counts
    total_copies = models.IntegerField(default=0)
    available_copies = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'library_books'
        verbose_name = _('Book')
        verbose_name_plural = _('Books')
        ordering = ['title']

    def __str__(self):
        return f"{self.title} by {self.author}"


class BookCopy(TenantAwareModel):
    """
    Specific physical copy of a book
    """
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ISSUED', 'Issued'),
        ('RESERVED', 'Reserved'),
        ('LOST', 'Lost'),
        ('DAMAGED', 'Damaged/Maintenance'),
    ]

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='copies')
    barcode = models.CharField(max_length=50, help_text=_("Unique Barcode ID for this copy"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE')
    
    # Acquisition info
    acquired_date = models.DateField(default=timezone.now)
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    class Meta:
        db_table = 'library_book_copies'
        unique_together = [['tenant', 'barcode']] 

    def __str__(self):
        return f"{self.book.title} ({self.barcode})"


class LibraryMember(TenantAwareModel):
    """
    Proxy profile for library users (Students/Staff) to track limits and fines
    """
    MEMBER_TYPE_CHOICES = [
        ('STUDENT', 'Student'),
        ('STAFF', 'Staff'),
    ]
    
    member_type = models.CharField(max_length=20, choices=MEMBER_TYPE_CHOICES)
    
    # Links to actual user profiles
    student = models.OneToOneField('students.Student', on_delete=models.CASCADE, null=True, blank=True, related_name='library_member')
    staff = models.OneToOneField('staff.Staff', on_delete=models.CASCADE, null=True, blank=True, related_name='library_member')
    
    # Rules
    max_books_allowed = models.IntegerField(default=2)
    
    # Status
    books_issued_count = models.IntegerField(default=0)
    total_fines_due = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    
    def __str__(self):
        if self.student:
            return f"{self.student.first_name} (Student)"
        if self.staff:
            return f"{self.staff.first_name} (Staff)"
        return "Unknown Member"


class BookIssue(TenantAwareModel):
    """
    Circulation Record
    """
    STATUS_CHOICES = [
        ('ISSUED', 'Issued'),
        ('RETURNED', 'Returned'),
        ('OVERDUE', 'Overdue'), # Generally a calculated status, but useful for caching
    ]

    copy = models.ForeignKey(BookCopy, on_delete=models.CASCADE, related_name='issue_history')
    member = models.ForeignKey(LibraryMember, on_delete=models.CASCADE, related_name='issues')
    
    issued_date = models.DateTimeField(default=timezone.now)
    due_date = models.DateTimeField()
    returned_date = models.DateTimeField(null=True, blank=True)
    
    # Fines
    fine_amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    fine_paid = models.BooleanField(default=False)
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ISSUED')

    class Meta:
        db_table = 'library_book_issues'

    def save(self, *args, **kwargs):
        if not self.id and not self.due_date:
            # Default 14 days
            self.due_date = timezone.now() + timedelta(days=14)
        super().save(*args, **kwargs)


class DigitalResource(TenantAwareModel):
    """
    E-Learning Resources (LMS)
    """
    RESOURCE_TYPE_CHOICES = [
        ('PDF', 'PDF Document'),
        ('VIDEO', 'Video Link'),
        ('AUDIO', 'Audio File'),
        ('LINK', 'External Link'),
    ]
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPE_CHOICES)
    
    # Content
    file = models.FileField(upload_to='lms/resources/', null=True, blank=True)
    external_url = models.URLField(blank=True, help_text=_("YouTube link or external URL"))
    
    # Access Control
    target_classes = models.ManyToManyField('tenants.GradeLevel', blank=True, related_name='digital_resources')
    subject = models.ForeignKey('tenants.Subject', on_delete=models.SET_NULL, null=True, blank=True)
    
    # Tracking
    download_count = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'lms_digital_resources'
        ordering = ['-created_at']

    def __str__(self):
        return self.title
