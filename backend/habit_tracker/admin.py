from django.contrib import admin
from .models import Habit, StudentHabitLog

@admin.register(Habit)
class HabitAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'points']

@admin.register(StudentHabitLog)
class HabitLogAdmin(admin.ModelAdmin):
    list_display = ['student', 'habit', 'points_awarded', 'date', 'staff']
    list_filter = ['habit', 'date']
