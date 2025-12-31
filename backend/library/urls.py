"""
Library URLS
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookViewSet, BookCopyViewSet, LibraryMemberViewSet, BookIssueViewSet, DigitalResourceViewSet

router = DefaultRouter()
router.register(r'books', BookViewSet)
router.register(r'copies', BookCopyViewSet)
router.register(r'members', LibraryMemberViewSet)
router.register(r'issues', BookIssueViewSet)
router.register(r'digital', DigitalResourceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
