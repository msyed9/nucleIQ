"""
Habit & Discipline Tracker Models
"""
from django.db import models
from core.models import TenantAwareModel
from django.utils import timezone

class Habit(TenantAwareModel):
    """
    Master list of habits (Good/Bad)
    """
    name = models.CharField(max_length=100)
    category = models.CharField(max_length=50, choices=[('GOOD', 'Good Habit'), ('BAD', 'Bad Habit')])
    points = models.IntegerField(default=1, help_text="Points added/deducted")
    icon = models.CharField(max_length=50, blank=True, help_text="Icon identifier")

    class Meta:
        db_table = 'habits'

    def __str__(self):
        return f"{self.name} ({self.points})"

class StudentHabitLog(TenantAwareModel):
    """
    Log of student habits
    """
    student = models.ForeignKey('students.Student', on_delete=models.CASCADE, related_name='habit_logs')
    habit = models.ForeignKey(Habit, on_delete=models.CASCADE)
    staff = models.ForeignKey('staff.Staff', on_delete=models.SET_NULL, null=True, help_text="Teacher who awarded points")
    
    date = models.DateTimeField(default=timezone.now)
    points_awarded = models.IntegerField()
    remarks = models.TextField(blank=True)

    class Meta:
        db_table = 'student_habit_logs'
        ordering = ['-date']

    def save(self, *args, **kwargs):
        if not self.pk:
            # Set points from habit master if not overridden
            if self.habit.category == 'BAD':
                self.points_awarded = -abs(self.habit.points)
            else:
                self.points_awarded = abs(self.habit.points)
        super().save(*args, **kwargs)
