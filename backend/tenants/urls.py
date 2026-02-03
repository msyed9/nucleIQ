from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet,
    DepartmentViewSet,
    GradeLevelViewSet,
    SectionViewSet,
    SubjectViewSet,
    ClassSubjectViewSet,
    HolidayViewSet,
    TenantSettingsViewSet,
    TenantBrandingViewSet
)
from .group_views import HeadquartersViewSet
from .session_timeout_views import TenantSessionTimeoutViewSet

router = DefaultRouter()
router.register(r'years', AcademicYearViewSet, basename='academic-year')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'grades', GradeLevelViewSet, basename='grade-level')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'class-subjects', ClassSubjectViewSet, basename='class-subject')
router.register(r'holidays', HolidayViewSet, basename='holiday')
router.register(r'settings', TenantSettingsViewSet, basename='tenant-settings')
router.register(r'branding', TenantBrandingViewSet, basename='tenant-branding')
router.register(r'session-timeout', TenantSessionTimeoutViewSet, basename='session-timeout')
router.register(r'hq', HeadquartersViewSet, basename='headquarters')

urlpatterns = [
    path('', include(router.urls)),
]


