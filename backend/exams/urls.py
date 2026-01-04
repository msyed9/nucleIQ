"""
Exams URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamTermViewSet, ExamViewSet, ExamScheduleViewSet,
    TopicViewSet, LearningOutcomeViewSet, QuestionBankViewSet
)
from .result_views import (
    GradeConfigurationViewSet, GradeScaleViewSet, ExamResultViewSet
)
from .online_exam_views import (
    OnlineExamViewSet, OnlineExamSessionViewSet, QuestionBankImportViewSet
)

router = DefaultRouter()
router.register(r'terms', ExamTermViewSet, basename='examterm')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'schedules', ExamScheduleViewSet, basename='examschedule')
router.register(r'topics', TopicViewSet, basename='topic')
router.register(r'learning-outcomes', LearningOutcomeViewSet, basename='learningoutcome')
router.register(r'questions', QuestionBankViewSet, basename='questionbank')
router.register(r'grade-configurations', GradeConfigurationViewSet, basename='gradeconfiguration')
router.register(r'grade-scales', GradeScaleViewSet, basename='gradescale')
router.register(r'results', ExamResultViewSet, basename='examresult')

# Online Exam endpoints
router.register(r'online-exams', OnlineExamViewSet, basename='onlineexam')
router.register(r'online-sessions', OnlineExamSessionViewSet, basename='onlineexamsession')
router.register(r'question-import', QuestionBankImportViewSet, basename='questionimport')

urlpatterns = [
    path('', include(router.urls)),
]
