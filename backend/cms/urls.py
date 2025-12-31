"""
CMS URL Configuration
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ThemeViewSet, WebsiteViewSet, PageViewSet,
    SectionViewSet, AssetViewSet, NavigationViewSet,
    PublicWebsiteViewSet
)

router = DefaultRouter()
router.register(r'themes', ThemeViewSet, basename='theme')
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'assets', AssetViewSet, basename='asset')
router.register(r'navigation', NavigationViewSet, basename='navigation')

urlpatterns = [
    path('', include(router.urls)),
    path('public/<str:pk>/', PublicWebsiteViewSet.as_view({'get': 'retrieve'}), name='public-website'),
    path('public/<str:pk>/page/', PublicWebsiteViewSet.as_view({'get': 'page'}), name='public-page'),
]
