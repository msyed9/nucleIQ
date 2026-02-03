"""
LMS Module URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CourseCategoryViewSet, CourseViewSet,
    CourseModuleViewSet, LessonViewSet, LessonResourceViewSet,
    CourseEnrollmentViewSet, LessonProgressViewSet,
    LMSQuizViewSet, LMSQuizQuestionViewSet, LMSQuizAttemptViewSet,
    CourseDiscussionViewSet, DiscussionReplyViewSet,
    LiveClassViewSet,
    VideoLibraryViewSet,
    CourseReviewViewSet, CourseCertificateViewSet
)

router = DefaultRouter()

# Course Management
router.register('categories', CourseCategoryViewSet, basename='course-category')
router.register('courses', CourseViewSet, basename='course')
router.register('modules', CourseModuleViewSet, basename='course-module')
router.register('lessons', LessonViewSet, basename='lesson')
router.register('resources', LessonResourceViewSet, basename='lesson-resource')

# Enrollment & Progress
router.register('enrollments', CourseEnrollmentViewSet, basename='enrollment')
router.register('progress', LessonProgressViewSet, basename='lesson-progress')

# Quizzes
router.register('quizzes', LMSQuizViewSet, basename='quiz')
router.register('quiz-questions', LMSQuizQuestionViewSet, basename='quiz-question')
router.register('quiz-attempts', LMSQuizAttemptViewSet, basename='quiz-attempt')

# Discussions
router.register('discussions', CourseDiscussionViewSet, basename='discussion')
router.register('replies', DiscussionReplyViewSet, basename='discussion-reply')

# Live Classes
router.register('live-classes', LiveClassViewSet, basename='live-class')

# Video Library
router.register('videos', VideoLibraryViewSet, basename='video')

# Reviews & Certificates
router.register('reviews', CourseReviewViewSet, basename='review')
router.register('certificates', CourseCertificateViewSet, basename='certificate')

urlpatterns = [
    path('', include(router.urls)),
]
