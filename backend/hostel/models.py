"""
Hostel Management Models
"""

from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from core.models import TenantAwareModel

class HostelBuilding(TenantAwareModel):
    name = models.CharField(max_length=100, help_text=_("Building Name (e.g., Block A)"))
    building_type = models.CharField(
        max_length=20, 
        choices=[('BOYS', 'Boys Hostel'), ('GIRLS', 'Girls Hostel'), ('STAFF', 'Staff Quarters'), ('GUEST', 'Guest House')]
    )
    address = models.TextField(blank=True)
    warden = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, blank=True, related_name='managed_hostels')

    class Meta:
        db_table = 'hostel_buildings'

    def __str__(self):
        return f"{self.name} ({self.building_type})"

class Room(TenantAwareModel):
    building = models.ForeignKey(HostelBuilding, on_delete=models.CASCADE, related_name='rooms')
    room_number = models.CharField(max_length=20)
    floor = models.IntegerField(default=1)
    capacity = models.IntegerField(default=4, help_text=_("Number of beds"))
    
    # Room Features
    is_ac = models.BooleanField(default=False, verbose_name="AC Room")
    has_attached_bathroom = models.BooleanField(default=False)
    
    monthly_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    class Meta:
        db_table = 'hostel_rooms'
        ordering = ['building', 'floor', 'room_number']

    def __str__(self):
        return f"{self.room_number} - {self.building.name}"

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
    Allocating a student to a bed.
    """
    student = models.OneToOneField(
        'students.Student', 
        on_delete=models.CASCADE, 
        related_name='hostel_allocation'
    )
    bed = models.OneToOneField(Bed, on_delete=models.PROTECT, related_name='allocation')
    
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(null=True, blank=True)
    
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'hostel_allocations'

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
