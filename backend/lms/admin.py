from django.contrib import admin
from .models import LiveClass

@admin.register(LiveClass)
class LiveClassAdmin(admin.ModelAdmin):
    list_display = ['title', 'start_time', 'grade_level', 'teacher', 'provider', 'is_completed']
    list_filter = ['start_time', 'grade_level', 'provider']
