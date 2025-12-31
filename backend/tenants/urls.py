from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet,
    DepartmentViewSet,
    GradeLevelViewSet,
    SectionViewSet
)
from .group_views import HeadquartersViewSet

router = DefaultRouter()
router.register(r'years', AcademicYearViewSet, basename='academic-year')
router.register(r'departments', DepartmentViewSet, basename='department')
router.register(r'grades', GradeLevelViewSet, basename='grade-level')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'hq', HeadquartersViewSet, basename='headquarters')

urlpatterns = [
    path('', include(router.urls)),
]
