"""Staffwork URL configuration."""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    LessonPlanViewSet, AdminTaskTemplateViewSet, AdminTaskInstanceViewSet,
    DailyStatusUpdateViewSet, ReportViewSet,
)

router = DefaultRouter()
router.register(r'lesson-plans', LessonPlanViewSet, basename='lesson-plan')
router.register(r'admin-task-templates', AdminTaskTemplateViewSet, basename='admin-task-template')
router.register(r'admin-tasks', AdminTaskInstanceViewSet, basename='admin-task')
router.register(r'daily-updates', DailyStatusUpdateViewSet, basename='daily-update')
router.register(r'reports', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
