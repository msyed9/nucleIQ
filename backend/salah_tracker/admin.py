from django.contrib import admin
from .models import SalahRecord

@admin.register(SalahRecord)
class SalahRecordAdmin(admin.ModelAdmin):
    list_display = ['student', 'date', 'salah_name', 'status']
    list_filter = ['date', 'salah_name', 'status']
