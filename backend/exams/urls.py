"""
Exams URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamTermViewSet, ExamViewSet, ExamScheduleViewSet,
    TopicViewSet, LearningOutcomeViewSet, QuestionBankViewSet
)

router = DefaultRouter()
router.register(r'terms', ExamTermViewSet, basename='examterm')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'schedules', ExamScheduleViewSet, basename='examschedule')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'learning-outcomes', LearningOutcomeViewSet, basename='learningoutcome')
router.register(r'questions', QuestionBankViewSet, basename='questionbank')

urlpatterns = [
    path('', include(router.urls)),
]
