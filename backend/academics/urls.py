"""
Academics URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AssignmentViewSet, SubmissionViewSet,
    HomeworkViewSet, HomeworkCompletionViewSet,
    SyllabusViewSet, ChapterViewSet, SyllabusProgressViewSet
)

router = DefaultRouter()
router.register(r'assignments', AssignmentViewSet, basename='assignment')
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'homework', HomeworkViewSet, basename='homework')
router.register(r'homework-completions', HomeworkCompletionViewSet, basename='homework-completion')
router.register(r'syllabus', SyllabusViewSet, basename='syllabus')
router.register(r'chapters', ChapterViewSet, basename='chapter')
router.register(r'syllabus-progress', SyllabusProgressViewSet, basename='syllabus-progress')

urlpatterns = [
    path('', include(router.urls)),
]
