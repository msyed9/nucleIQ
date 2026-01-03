"""
Hostel Management Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.core.validators import MinValueValidator
from decimal import Decimal
from core.models import TenantAwareModel

class HostelBuilding(TenantAwareModel):
    name = models.CharField(max_length=100, help_text=_("Building Name (e.g., Block A)"))
    building_type = models.CharField(
        max_length=20, 
        choices=[('BOYS', 'Boys Hostel'), ('GIRLS', 'Girls Hostel'), ('STAFF', 'Staff Quarters'), ('GUEST', 'Guest House')]
    )
    address = models.TextField(blank=True)
    warden = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_hostels')
    
    # Additional fields for Phase 5.1
    total_floors = models.IntegerField(default=1)
    total_capacity = models.IntegerField(default=0)
    description = models.TextField(blank=True)
    facilities = models.TextField(blank=True, help_text=_("Comma-separated facilities (e.g., WiFi, Gym, Common Room)"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'hostel_buildings'

    def __str__(self):
        return f"{self.name} ({self.building_type})"
    
    @property
    def total_rooms(self):
        return self.rooms.count()
    
    @property
    def occupied_rooms(self):
        return self.rooms.filter(beds__is_occupied=True).distinct().count()
    
    @property
    def total_beds(self):
        return sum(room.capacity for room in self.rooms.all())
    
    @property
    def occupied_beds(self):
        return self.rooms.aggregate(
            occupied=models.Count('beds', filter=models.Q(beds__is_occupied=True))
        )['occupied'] or 0

class Room(TenantAwareModel):
    building = models.ForeignKey(HostelBuilding, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    floor = models.IntegerField(default=1)
    capacity = models.IntegerField(default=4, help_text=_("Number of beds"))
    
    # Room Features
    is_ac = models.BooleanField(default=False, verbose_name="AC Room")
    has_attached_bathroom = models.BooleanField(default=False)
    has_balcony = models.BooleanField(default=False)
    has_study_table = models.BooleanField(default=True)
    
    # Fee Structure - Phase 5.3
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Room Status
    is_available = models.BooleanField(default=True)
    maintenance_status = models.CharField(
        max_length=20,
        choices=[
            ('GOOD', 'Good Condition'),
            ('FAIR', 'Fair Condition'),
            ('NEEDS_REPAIR', 'Needs Repair'),
            ('UNDER_MAINTENANCE', 'Under Maintenance')
        ],
        default='GOOD'
    )

    class Meta:
        db_table = 'hostel_rooms'
        ordering = ['building', 'floor', 'room_number']
        unique_together = ['building', 'room_number']

    def __str__(self):
        return f"{self.room_number} - {self.building.name}"
    
    @property
    def available_beds(self):
        return self.beds.filter(is_occupied=False).count()
    
    @property
    def occupancy_rate(self):
        if self.capacity == 0:
            return 0
        occupied = self.beds.filter(is_occupied=True).count()
        return (occupied / self.capacity) * 100

class Bed(TenantAwareModel):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='beds')
    bed_number = models.CharField(max_length=10, help_text=_("Bed Label (e.g., A, B, 1, 2)"))
    is_occupied = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'hostel_beds'
        unique_together = ['room', 'bed_number']

    def __str__(self):
        return f"{self.room.room_number}-{self.bed_number}"

class HostelAllocation(TenantAwareModel):
    """
    Allocating a student to a bed - Phase 5.2
    """
    student = models.OneToOneField(
        'students.Student', 
        on_delete=models.CASCADE, 
        related_name='hostel_allocation'
    )
    bed = models.OneToOneField(Bed, on_delete=models.PROTECT, related_name='allocation')
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    # Fee Management - Phase 5.3
    security_deposit_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    security_deposit_refunded = models.BooleanField(default=False)
    
    # Transfer Management - Phase 5.2
    previous_bed = models.ForeignKey(Bed, on_delete=models.SET_NULL, null=True, blank=True, related_name='previous_allocations')
    transfer_date = models.DateField(null=True, blank=True)
    transfer_reason = models.TextField(blank=True)
    
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_allocations'

    def __str__(self):
        return f"{self.student.get_full_name()} - {self.bed}"

    def save(self, *args, **kwargs):
        if self.pk is None and self.is_active:
            # Mark bed as occupied
            self.bed.is_occupied = True
            self.bed.save()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        # Free up bed on delete
        if self.bed:
            self.bed.is_occupied = False
            self.bed.save()
        super().delete(*args, **kwargs)


# Phase 5.3: Hostel Fee Structure
class HostelFeeStructure(TenantAwareModel):
    """Fee structure for different room types and periods"""
    name = models.CharField(max_length=100)
    academic_year = models.ForeignKey('tenants.AcademicYear', on_delete=models.CASCADE, related_name='hostel_fee_structures')
    room_type = models.CharField(
        max_length=20,
        choices=[
            ('AC_SINGLE', 'AC Single'),
            ('AC_DOUBLE', 'AC Double'),
            ('AC_TRIPLE', 'AC Triple'),
            ('AC_QUAD', 'AC Quad'),
            ('NON_AC_SINGLE', 'Non-AC Single'),
            ('NON_AC_DOUBLE', 'Non-AC Double'),
            ('NON_AC_TRIPLE', 'Non-AC Triple'),
            ('NON_AC_QUAD', 'Non-AC Quad'),
        ]
    )
    
    # Fees
    admission_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    security_deposit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    electricity_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text=_("Per month"))
    water_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text=_("Per month"))
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'hostel_fee_structures'
        unique_together = ['academic_year', 'room_type']
    
    def __str__(self):
        return f"{self.name} - {self.room_type}"
    
    @property
    def total_monthly_fee(self):
        return (
            self.monthly_rent + 
            self.maintenance_fee + 
            self.electricity_charges + 
            self.water_charges
        )


class HostelFeePayment(TenantAwareModel):
    """Track hostel fee payments - Phase 5.3"""
    allocation = models.ForeignKey(HostelAllocation, on_delete=models.CASCADE, related_name='fee_payments')
    fee_structure = models.ForeignKey(HostelFeeStructure, on_delete=models.PROTECT, related_name='payments')
    
    payment_date = models.DateField(default=timezone.now)
    payment_month = models.DateField(help_text=_("Month for which payment is made"))
    
    # Payment Details
    monthly_rent = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    maintenance_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    electricity_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    water_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    payment_method = models.CharField(
        max_length=20,
        choices=[
            ('CASH', 'Cash'),
            ('CARD', 'Card'),
            ('UPI', 'UPI'),
            ('BANK_TRANSFER', 'Bank Transfer'),
            ('CHEQUE', 'Cheque'),
        ],
        default='CASH'
    )
    
    transaction_id = models.CharField(max_length=100, blank=True)
    receipt_number = models.CharField(max_length=50, blank=True)
    
    notes = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_fee_payments'
        ordering = ['-payment_date']
    
    def __str__(self):
        return f"{self.allocation.student.get_full_name()} - {self.payment_month.strftime('%b %Y')}"
    
    def save(self, *args, **kwargs):
        # Auto-calculate total if not provided
        if not self.total_amount:
            self.total_amount = (
                self.monthly_rent + 
                self.maintenance_fee + 
                self.electricity_charges + 
                self.water_charges + 
                self.other_charges + 
                self.late_fee
            )
        super().save(*args, **kwargs)


# Phase 5.4: Attendance & Gate Pass
class HostelAttendance(TenantAwareModel):
    """Daily hostel attendance tracking"""
    allocation = models.ForeignKey(HostelAllocation, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    
    STATUS_CHOICES = [
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
        ('ON_LEAVE', 'On Leave'),
        ('LATE', 'Late Check-in'),
    ]
    
    morning_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    evening_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    night_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PRESENT')
    
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_attendance'
        unique_together = ['allocation', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.allocation.student.get_full_name()} - {self.date}"


class HostelGatePass(TenantAwareModel):
    """Gate pass system for students leaving hostel - Phase 5.4"""
    allocation = models.ForeignKey(HostelAllocation, on_delete=models.CASCADE, related_name='hostel_gate_passes')
    
    # Pass Details
    pass_type = models.CharField(
        max_length=20,
        choices=[
            ('DAY_PASS', 'Day Pass'),
            ('OVERNIGHT', 'Overnight'),
            ('WEEKEND', 'Weekend'),
            ('LONG_LEAVE', 'Long Leave'),
        ]
    )
    
    from_date = models.DateTimeField()
    to_date = models.DateTimeField()
    
    reason = models.TextField()
    destination = models.CharField(max_length=200)
    
    # Contact Details
    contact_person = models.CharField(max_length=100, blank=True)
    contact_number = models.CharField(max_length=20, blank=True)
    
    # Approval Workflow
    requested_date = models.DateTimeField(default=timezone.now)
    approved_by = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_hostel_gate_passes')
    approval_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('APPROVED', 'Approved'),
            ('REJECTED', 'Rejected'),
            ('CANCELLED', 'Cancelled'),
        ],
        default='PENDING'
    )
    
    # Exit/Entry Tracking
    exit_time = models.DateTimeField(null=True, blank=True)
    entry_time = models.DateTimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_gate_passes'
        ordering = ['-requested_date']
    
    def __str__(self):
        return f"{self.allocation.student.get_full_name()} - {self.pass_type}"


# Phase 5.5: Complaint & Maintenance
class HostelComplaint(TenantAwareModel):
    """Hostel complaint registration system"""
    allocation = models.ForeignKey(HostelAllocation, on_delete=models.CASCADE, related_name='complaints')
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='complaints', null=True, blank=True)
    
    complaint_type = models.CharField(
        max_length=30,
        choices=[
            ('ELECTRICAL', 'Electrical'),
            ('PLUMBING', 'Plumbing'),
            ('FURNITURE', 'Furniture'),
            ('CLEANLINESS', 'Cleanliness'),
            ('PEST_CONTROL', 'Pest Control'),
            ('AC_REPAIR', 'AC Repair'),
            ('INTERNET', 'Internet/WiFi'),
            ('SECURITY', 'Security'),
            ('OTHER', 'Other'),
        ]
    )
    
    subject = models.CharField(max_length=200)
    description = models.TextField()
    
    priority = models.CharField(
        max_length=20,
        choices=[
            ('LOW', 'Low'),
            ('MEDIUM', 'Medium'),
            ('HIGH', 'High'),
            ('URGENT', 'Urgent'),
        ],
        default='MEDIUM'
    )
    
    # Tracking
    reported_date = models.DateTimeField(default=timezone.now)
    assigned_to = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_complaints')
    assigned_date = models.DateTimeField(null=True, blank=True)
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pending'),
            ('ASSIGNED', 'Assigned'),
            ('IN_PROGRESS', 'In Progress'),
            ('RESOLVED', 'Resolved'),
            ('CLOSED', 'Closed'),
            ('REJECTED', 'Rejected'),
        ],
        default='PENDING'
    )
    
    resolution_date = models.DateTimeField(null=True, blank=True)
    resolution_notes = models.TextField(blank=True)
    
    # Feedback
    student_rating = models.IntegerField(null=True, blank=True, validators=[MinValueValidator(1)])
    student_feedback = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_complaints'
        ordering = ['-reported_date']
    
    def __str__(self):
        return f"{self.complaint_type} - {self.allocation.student.get_full_name()}"


class MaintenanceSchedule(TenantAwareModel):
    """Regular maintenance scheduling - Phase 5.5"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='maintenance_schedules', null=True, blank=True)
    building = models.ForeignKey(HostelBuilding, on_delete=models.CASCADE, related_name='maintenance_schedules', null=True, blank=True)
    
    maintenance_type = models.CharField(
        max_length=30,
        choices=[
            ('DAILY_CLEANING', 'Daily Cleaning'),
            ('WEEKLY_CLEANING', 'Weekly Cleaning'),
            ('MONTHLY_INSPECTION', 'Monthly Inspection'),
            ('QUARTERLY_MAINTENANCE', 'Quarterly Maintenance'),
            ('ANNUAL_MAINTENANCE', 'Annual Maintenance'),
            ('PEST_CONTROL', 'Pest Control'),
            ('DEEP_CLEANING', 'Deep Cleaning'),
        ]
    )
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    scheduled_date = models.DateField()
    scheduled_time = models.TimeField(null=True, blank=True)
    
    assigned_to = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='maintenance_tasks')
    
    status = models.CharField(
        max_length=20,
        choices=[
            ('SCHEDULED', 'Scheduled'),
            ('IN_PROGRESS', 'In Progress'),
            ('COMPLETED', 'Completed'),
            ('CANCELLED', 'Cancelled'),
            ('RESCHEDULED', 'Rescheduled'),
        ],
        default='SCHEDULED'
    )
    
    completion_date = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True)
    
    # Recurring
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(
        max_length=20,
        choices=[
            ('DAILY', 'Daily'),
            ('WEEKLY', 'Weekly'),
            ('MONTHLY', 'Monthly'),
            ('QUARTERLY', 'Quarterly'),
            ('YEARLY', 'Yearly'),
        ],
        blank=True
    )
    
    class Meta:
        db_table = 'hostel_maintenance_schedules'
        ordering = ['scheduled_date', 'scheduled_time']
    
    def __str__(self):
        return f"{self.maintenance_type} - {self.scheduled_date}"


# Phase 5.6: Mess Management
class MessRegistration(TenantAwareModel):
    """Mess registration for hostel students"""
    allocation = models.OneToOneField(HostelAllocation, on_delete=models.CASCADE, related_name='mess_registration')
    
    meal_plan = models.CharField(
        max_length=20,
        choices=[
            ('FULL', 'Full Board (Breakfast, Lunch, Dinner)'),
            ('TWO_MEALS', 'Two Meals (Lunch, Dinner)'),
            ('BREAKFAST_ONLY', 'Breakfast Only'),
            ('LUNCH_ONLY', 'Lunch Only'),
            ('DINNER_ONLY', 'Dinner Only'),
        ],
        default='FULL'
    )
    
    dietary_preference = models.CharField(
        max_length=20,
        choices=[
            ('VEG', 'Vegetarian'),
            ('NON_VEG', 'Non-Vegetarian'),
            ('JAIN', 'Jain'),
            ('VEGAN', 'Vegan'),
        ],
        default='VEG'
    )
    
    allergies = models.TextField(blank=True, help_text=_("Food allergies or restrictions"))
    
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'hostel_mess_registrations'
    
    def __str__(self):
        return f"{self.allocation.student.get_full_name()} - {self.meal_plan}"


class MessMenu(TenantAwareModel):
    """Weekly mess menu - Phase 5.6"""
    building = models.ForeignKey(HostelBuilding, on_delete=models.CASCADE, related_name='mess_menus')
    
    week_start_date = models.DateField()
    day_of_week = models.CharField(
        max_length=10,
        choices=[
            ('MONDAY', 'Monday'),
            ('TUESDAY', 'Tuesday'),
            ('WEDNESDAY', 'Wednesday'),
            ('THURSDAY', 'Thursday'),
            ('FRIDAY', 'Friday'),
            ('SATURDAY', 'Saturday'),
            ('SUNDAY', 'Sunday'),
        ]
    )
    
    meal_type = models.CharField(
        max_length=15,
        choices=[
            ('BREAKFAST', 'Breakfast'),
            ('LUNCH', 'Lunch'),
            ('SNACKS', 'Snacks'),
            ('DINNER', 'Dinner'),
        ]
    )
    
    # Menu Items
    items = models.TextField(help_text=_("Comma-separated menu items"))
    
    # Nutritional Info (optional)
    calories = models.IntegerField(null=True, blank=True)
    protein_grams = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'hostel_mess_menus'
        unique_together = ['building', 'week_start_date', 'day_of_week', 'meal_type']
        ordering = ['week_start_date', 'day_of_week']
    
    def __str__(self):
        return f"{self.day_of_week} - {self.meal_type}"


class MessAttendance(TenantAwareModel):
    """Track mess attendance for billing - Phase 5.6"""
    registration = models.ForeignKey(MessRegistration, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    
    breakfast_taken = models.BooleanField(default=False)
    lunch_taken = models.BooleanField(default=False)
    snacks_taken = models.BooleanField(default=False)
    dinner_taken = models.BooleanField(default=False)
    
    breakfast_time = models.TimeField(null=True, blank=True)
    lunch_time = models.TimeField(null=True, blank=True)
    snacks_time = models.TimeField(null=True, blank=True)
    dinner_time = models.TimeField(null=True, blank=True)
    
    remarks = models.TextField(blank=True)
    
    class Meta:
        db_table = 'hostel_mess_attendance'
        unique_together = ['registration', 'date']
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.registration.allocation.student.get_full_name()} - {self.date}"
    
    @property
    def total_meals(self):
        count = 0
        if self.breakfast_taken:
            count += 1
        if self.lunch_taken:
            count += 1
        if self.snacks_taken:
            count += 1
        if self.dinner_taken:
            count += 1
        return count
