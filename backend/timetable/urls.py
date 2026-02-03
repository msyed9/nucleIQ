"""
Timetable URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TimetableSlotViewSet,
    TimetableTemplateViewSet,
    TimetablePeriodConfigViewSet,
    SubjectSectionLoadViewSet,
    TimetableGenerationViewSet
)

router = DefaultRouter()
router.register(r'slots', TimetableSlotViewSet, basename='timetable-slot')
router.register(r'templates', TimetableTemplateViewSet, basename='timetable-template')
router.register(r'configs', TimetablePeriodConfigViewSet, basename='timetable-config')
router.register(r'loads', SubjectSectionLoadViewSet, basename='subject-load')
router.register(r'generation', TimetableGenerationViewSet, basename='timetable-generation')

urlpatterns = [
    path('', include(router.urls)),
]

