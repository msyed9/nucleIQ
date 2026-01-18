from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    WebsiteViewSet, PageViewSet, SectionViewSet, MediaViewSet, MenuItemViewSet,
    WebsiteTemplateViewSet, TenantWebsiteInstanceViewSet, PublicWebsiteViewSet
)
from .ssr_views import SSRWebsiteView

router = DefaultRouter()

# New template system routes
router.register(r'templates', WebsiteTemplateViewSet, basename='website-template')
router.register(r'instances', TenantWebsiteInstanceViewSet, basename='website-instance')
router.register(r'public', PublicWebsiteViewSet, basename='public-website')

# Legacy routes (kept for backward compatibility)
router.register(r'websites', WebsiteViewSet, basename='website')
router.register(r'pages', PageViewSet, basename='page')
router.register(r'sections', SectionViewSet, basename='section')
router.register(r'media', MediaViewSet, basename='media')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')

urlpatterns = [
    path('', include(router.urls)),
    # SSR routes for SEO
    path('render/<str:subdomain>/', SSRWebsiteView.as_view(), name='ssr-website-home'),
    path('render/<str:subdomain>/<str:page_slug>/', SSRWebsiteView.as_view(), name='ssr-website-page'),
]
