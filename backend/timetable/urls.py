"""
Timetable URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TimetableSlotViewSet, TimetableTemplateViewSet

router = DefaultRouter()
router.register(r'slots', TimetableSlotViewSet, basename='timetable-slot')
router.register(r'templates', TimetableTemplateViewSet, basename='timetable-template')

urlpatterns = [
    path('', include(router.urls)),
]
