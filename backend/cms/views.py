"""
CMS Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.utils import timezone

from .models import Theme, Website, Page, Section, Asset, Navigation
from .serializers import (
    ThemeSerializer, WebsiteSerializer, PageSerializer,
    SectionSerializer, AssetSerializer, NavigationSerializer,
    PageDetailSerializer
)
from core.middleware import get_current_tenant


class ThemeViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for Theme (read-only for tenants)."""
    
    serializer_class = ThemeSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_premium']
    search_fields = ['name', 'description']
    ordering = ['category', 'name']
    
    def get_queryset(self):
        # Themes are global, not tenant-specific
        return Theme.objects.filter(is_deleted=False, is_active=True)


class WebsiteViewSet(viewsets.ModelViewSet):
    """ViewSet for Website management."""
    
    serializer_class = WebsiteSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Website.objects.filter(tenant=tenant, is_deleted=False)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish the website."""
        website = self.get_object()
        website.publish()
        return Response(self.get_serializer(website).data)
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish the website."""
        website = self.get_object()
        website.is_published = False
        website.save()
        return Response(self.get_serializer(website).data)
    
    @action(detail=True, methods=['post'])
    def apply_theme(self, request, pk=None):
        """Apply a theme to the website."""
        website = self.get_object()
        theme_id = request.data.get('theme_id')
        
        try:
            theme = Theme.objects.get(id=theme_id, is_active=True)
            website.theme = theme
            website.save()
            
            # Update theme usage count
            theme.usage_count += 1
            theme.save()
            
            return Response(self.get_serializer(website).data)
        except Theme.DoesNotExist:
            return Response(
                {'error': 'Theme not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class PageViewSet(viewsets.ModelViewSet):
    """ViewSet for Page management."""
    
    serializer_class = PageSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['website', 'page_type', 'is_published']
    search_fields = ['title', 'slug']
    ordering = ['order']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Page.objects.filter(
            tenant=tenant,
            is_deleted=False
        ).prefetch_related('sections')
    
    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """Duplicate a page."""
        page = self.get_object()
        
        # Create duplicate
        new_page = Page.objects.create(
            tenant=page.tenant,
            website=page.website,
            page_type='CUSTOM',
            title=f"{page.title} (Copy)",
            slug=f"{page.slug}-copy",
            meta_title=page.meta_title,
            meta_description=page.meta_description,
            order=page.order + 1,
            is_published=False
        )
        
        # Duplicate sections
        for section in page.sections.filter(is_deleted=False):
            Section.objects.create(
                tenant=section.tenant,
                page=new_page,
                component_type=section.component_type,
                title=section.title,
                content=section.content,
                background_color=section.background_color,
                text_color=section.text_color,
                padding=section.padding,
                custom_css=section.custom_css,
                order=section.order,
                is_visible=section.is_visible
            )
        
        return Response(self.get_serializer(new_page).data)


class SectionViewSet(viewsets.ModelViewSet):
    """ViewSet for Section management."""
    
    serializer_class = SectionSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['page', 'component_type', 'is_visible']
    ordering = ['order']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Section.objects.filter(tenant=tenant, is_deleted=False)
    
    @action(detail=True, methods=['post'])
    def reorder(self, request, pk=None):
        """Reorder sections."""
        section = self.get_object()
        new_order = request.data.get('order')
        
        if new_order is not None:
            section.order = new_order
            section.save()
            return Response(self.get_serializer(section).data)
        
        return Response(
            {'error': 'Order is required'},
            status=status.HTTP_400_BAD_REQUEST
        )


class AssetViewSet(viewsets.ModelViewSet):
    """ViewSet for Asset management."""
    
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['website', 'asset_type']
    search_fields = ['title', 'alt_text']
    ordering = ['-created_at']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Asset.objects.filter(tenant=tenant, is_deleted=False)
    
    def perform_create(self, serializer):
        # Get file info
        file = self.request.FILES.get('file')
        if file:
            serializer.save(
                file_size=file.size,
                mime_type=file.content_type
            )
        else:
            serializer.save()


class NavigationViewSet(viewsets.ModelViewSet):
    """ViewSet for Navigation management."""
    
    serializer_class = NavigationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['website', 'parent']
    ordering = ['order']
    
    def get_queryset(self):
        tenant = get_current_tenant()
        return Navigation.objects.filter(tenant=tenant, is_deleted=False)


class PublicWebsiteViewSet(viewsets.ReadOnlyModelViewSet):
    """Public endpoint for rendering websites."""
    
    permission_classes = [AllowAny]
    
    def retrieve(self, request, *args, **kwargs):
        """Get website by subdomain or custom domain."""
        domain = kwargs.get('pk')
        
        try:
            # Try subdomain first
            website = Website.objects.get(
                subdomain=domain,
                is_published=True,
                is_deleted=False
            )
        except Website.DoesNotExist:
            # Try custom domain
            try:
                website = Website.objects.get(
                    custom_domain=domain,
                    custom_domain_verified=True,
                    is_published=True,
                    is_deleted=False
                )
            except Website.DoesNotExist:
                return Response(
                    {'error': 'Website not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Get pages
        pages = website.pages.filter(is_published=True, is_deleted=False)
        
        # Get navigation
        navigation = website.navigations.filter(
            is_visible=True,
            is_deleted=False,
            parent__isnull=True
        )
        
        data = {
            'website': WebsiteSerializer(website).data,
            'pages': PageSerializer(pages, many=True).data,
            'navigation': NavigationSerializer(navigation, many=True).data
        }
        
        return Response(data)
    
    @action(detail=True, methods=['get'])
    def page(self, request, pk=None, page_slug=None):
        """Get specific page by slug."""
        domain = pk
        page_slug = request.query_params.get('slug', 'home')
        
        try:
            website = Website.objects.get(
                subdomain=domain,
                is_published=True,
                is_deleted=False
            )
        except Website.DoesNotExist:
            return Response(
                {'error': 'Website not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            page = website.pages.get(
                slug=page_slug,
                is_published=True,
                is_deleted=False
            )
        except Page.DoesNotExist:
            return Response(
                {'error': 'Page not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get navigation
        navigation = website.navigations.filter(
            is_visible=True,
            is_deleted=False,
            parent__isnull=True
        )
        
        data = {
            'page': PageSerializer(page).data,
            'website': WebsiteSerializer(website).data,
            'navigation': NavigationSerializer(navigation, many=True).data
        }
        
        return Response(data)
