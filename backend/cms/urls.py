from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WebsiteViewSet, PageViewSet, SectionViewSet, MediaViewSet, MenuItemViewSet

router = DefaultRouter()
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')

urlpatterns = [
    path('', include(router.urls)),
]
