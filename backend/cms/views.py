from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Website, Page, Section, Media, MenuItem
from .serializers import (
    WebsiteSerializer, WebsiteListSerializer, PageSerializer, 
    SectionSerializer, MediaSerializer, MenuItemSerializer
)


class WebsiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing websites
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Website.objects.filter(tenant=self.request.user.tenant)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WebsiteListSerializer
        return WebsiteSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a website"""
        website = self.get_object()
        website.is_published = True
        website.save()
        return Response({'status': 'Website published'})
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a website"""
        website = self.get_object()
        website.is_published = False
        website.save()
        return Response({'status': 'Website unpublished'})
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get website preview data"""
        website = self.get_object()
        serializer = WebsiteSerializer(website, context={'request': request})
        return Response(serializer.data)


class PageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing pages
    """
    permission_classes = [IsAuthenticated]
    serializer_class = PageSerializer
    
    def get_queryset(self):
        website_id = self.request.query_params.get('website')
        queryset = Page.objects.filter(tenant=self.request.user.tenant)
        if website_id:
            queryset = queryset.filter(website_id=website_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a page"""
        page = self.get_object()
        page.is_published = True
        page.save()
        return Response({'status': 'Page published'})
    
    @action(detail=True, methods=['post'])
    def set_homepage(self, request, pk=None):
        """Set page as homepage"""
        page = self.get_object()
        # Unset other homepages for this website
        Page.objects.filter(website=page.website, is_homepage=True).update(is_homepage=False)
        page.is_homepage = True
        page.save()
        return Response({'status': 'Homepage set'})


class SectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing page sections
    """
    permission_classes = [IsAuthenticated]
    serializer_class = SectionSerializer
    
    def get_queryset(self):
        page_id = self.request.query_params.get('page')
        queryset = Section.objects.filter(tenant=self.request.user.tenant)
        if page_id:
            queryset = queryset.filter(page_id=page_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder sections"""
        section_orders = request.data.get('sections', [])
        for item in section_orders:
            Section.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'status': 'Sections reordered'})


class MediaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing media library
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MediaSerializer
    
    def get_queryset(self):
        media_type = self.request.query_params.get('type')
        queryset = Media.objects.filter(tenant=self.request.user.tenant)
        if media_type:
            queryset = queryset.filter(media_type=media_type)
        return queryset
    
    def perform_create(self, serializer):
        file_obj = self.request.FILES.get('file')
        file_size = file_obj.size if file_obj else 0
        mime_type = file_obj.content_type if file_obj else ''
        
        serializer.save(
            tenant=self.request.user.tenant,
            uploaded_by=self.request.user,
            file_size=file_size,
            mime_type=mime_type
        )


class MenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing menu items
    """
    permission_classes = [IsAuthenticated]
    serializer_class = MenuItemSerializer
    
    def get_queryset(self):
        website_id = self.request.query_params.get('website')
        queryset = MenuItem.objects.filter(tenant=self.request.user.tenant, parent__isnull=True)
        if website_id:
            queryset = queryset.filter(website_id=website_id)
        return queryset
    
    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
    
    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """Reorder menu items"""
        menu_orders = request.data.get('items', [])
        for item in menu_orders:
            MenuItem.objects.filter(id=item['id']).update(order=item['order'])
        return Response({'status': 'Menu items reordered'})
