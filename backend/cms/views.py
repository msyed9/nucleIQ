from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import transaction
import json
import uuid

from .models import (
    Website, Page, Section, Media, MenuItem,
    WebsiteTemplate, TenantWebsiteInstance
)
from .serializers import (
    WebsiteSerializer, WebsiteListSerializer, PageSerializer, 
    SectionSerializer, MediaSerializer, MenuItemSerializer,
    WebsiteTemplateListSerializer, WebsiteTemplateDetailSerializer,
    WebsiteTemplateUploadSerializer, TenantWebsiteInstanceSerializer,
    TenantWebsiteInstanceListSerializer, ForkTemplateSerializer,
    UpdateSectionSerializer, ReorderSectionsSerializer,
    AddPageSerializer, AddSectionSerializer
)


# ========================================
# WEBSITE TEMPLATE VIEWSET (System Templates)
# ========================================

class WebsiteTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing website templates.
    System templates are read-only for tenants.
    Tenants can create/upload their own custom templates.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    
    def get_queryset(self):
        user = self.request.user
        # Return system templates + tenant's custom templates
        return WebsiteTemplate.objects.filter(
            is_active=True
        ).filter(
            models.Q(is_system=True) | 
            models.Q(tenant=user.tenant)
        )
    
    def get_serializer_class(self):
        if self.action == 'list':
            return WebsiteTemplateListSerializer
        if self.action == 'upload':
            return WebsiteTemplateUploadSerializer
        return WebsiteTemplateDetailSerializer
    
    def perform_create(self, serializer):
        """Create a custom template for the tenant"""
        serializer.save(
            tenant=self.request.user.tenant,
            uploaded_by=self.request.user,
            is_system=False
        )
    
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """Get all available template categories"""
        categories = [
            {'id': 'modern', 'name': 'Modern', 'icon': '🚀'},
            {'id': 'classic', 'name': 'Classic', 'icon': '🏛️'},
            {'id': 'minimal', 'name': 'Minimal', 'icon': '⚪'},
            {'id': 'vibrant', 'name': 'Vibrant', 'icon': '🎨'},
            {'id': 'professional', 'name': 'Professional', 'icon': '💼'},
        ]
        return Response(categories)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get templates grouped by category"""
        category = request.query_params.get('category')
        queryset = self.get_queryset()
        
        if category:
            queryset = queryset.filter(category=category)
        
        serializer = WebsiteTemplateListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def fork(self, request, pk=None):
        """Fork a template to create a tenant website instance"""
        template = self.get_object()
        
        serializer = ForkTemplateSerializer(data={
            'template_id': template.id,
            'name': request.data.get('name', f"{template.name} - {request.user.tenant.name}"),
            'subdomain': request.data.get('subdomain', '')
        })
        serializer.is_valid(raise_exception=True)
        
        # Create the tenant instance
        instance = TenantWebsiteInstance.objects.create(
            tenant=request.user.tenant,
            name=serializer.validated_data.get('name', template.name),
            source_template=template,
            subdomain=serializer.validated_data.get('subdomain', ''),
            custom_structure=template.structure,  # Copy the structure for customization
            primary_color=template.primary_color,
            secondary_color=template.secondary_color,
            accent_color=template.accent_color,
            font_family=template.font_family,
            created_by=request.user
        )
        
        return Response(
            TenantWebsiteInstanceSerializer(instance).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def clone(self, request, pk=None):
        """Clone a template to create a new custom template"""
        template = self.get_object()
        
        new_template = template.clone_for_tenant(
            request.user.tenant,
            request.user
        )
        
        return Response(
            WebsiteTemplateDetailSerializer(new_template).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a custom template (JSON structure)"""
        serializer = WebsiteTemplateUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        template = WebsiteTemplate.objects.create(
            **serializer.validated_data,
            tenant=request.user.tenant,
            uploaded_by=request.user,
            is_system=False
        )
        
        return Response(
            WebsiteTemplateDetailSerializer(template).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def section_types(self, request):
        """Get all available section types with metadata"""
        section_types = [
            {'type': 'HERO', 'label': 'Hero Banner', 'icon': '🎯', 'description': 'Full-width header with CTA'},
            {'type': 'FEATURES', 'label': 'Features Grid', 'icon': '✨', 'description': '4-column feature cards'},
            {'type': 'STATS', 'label': 'Statistics', 'icon': '📊', 'description': 'Number counters'},
            {'type': 'TESTIMONIALS', 'label': 'Testimonials', 'icon': '💬', 'description': 'Client quotes carousel'},
            {'type': 'GALLERY', 'label': 'Image Gallery', 'icon': '🖼️', 'description': 'Photo grid'},
            {'type': 'CTA', 'label': 'Call to Action', 'icon': '📢', 'description': 'Conversion banner'},
            {'type': 'CONTACT', 'label': 'Contact Form', 'icon': '📧', 'description': 'Form with map'},
            {'type': 'PRINCIPAL_MESSAGE', 'label': 'Principal Message', 'icon': '👤', 'description': 'Leadership message'},
            {'type': 'TIMELINE', 'label': 'Timeline', 'icon': '📅', 'description': 'History/events'},
            {'type': 'TEXT_BLOCK', 'label': 'Text Block', 'icon': '📝', 'description': 'Rich text content'},
            {'type': 'TEXT_WITH_IMAGE', 'label': 'Text with Image', 'icon': '🖼️', 'description': 'Side-by-side layout'},
            {'type': 'MISSION_VISION', 'label': 'Mission & Vision', 'icon': '🎯', 'description': 'Organization values'},
            {'type': 'PAGE_HEADER', 'label': 'Page Header', 'icon': '📄', 'description': 'Page title banner'},
            {'type': 'IMAGE_GRID', 'label': 'Image Grid', 'icon': '🔲', 'description': 'Photo mosaic'},
            {'type': 'PROGRAMS', 'label': 'Programs', 'icon': '📚', 'description': 'Academic programs'},
            {'type': 'MAP', 'label': 'Map Section', 'icon': '🗺️', 'description': 'Location map'},
            {'type': 'VIDEO', 'label': 'Video Section', 'icon': '🎬', 'description': 'YouTube/Vimeo embed'},
            {'type': 'FAQ', 'label': 'FAQ Accordion', 'icon': '❓', 'description': 'Questions & answers'},
            {'type': 'NEWS', 'label': 'News Feed', 'icon': '📰', 'description': 'Latest updates'},
            {'type': 'EVENTS', 'label': 'Events Display', 'icon': '📅', 'description': 'Upcoming events'},
            {'type': 'FACULTY', 'label': 'Faculty Grid', 'icon': '👥', 'description': 'Staff profiles'},
        ]
        return Response(section_types)


# Import models for Q object
from django.db import models


# ========================================
# TENANT WEBSITE INSTANCE VIEWSET
# ========================================

class TenantWebsiteInstanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing tenant's website instances.
    This is where tenants customize their forked templates.
    """
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return TenantWebsiteInstance.objects.filter(tenant=self.request.user.tenant)
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TenantWebsiteInstanceListSerializer
        return TenantWebsiteInstanceSerializer
    
    def perform_create(self, serializer):
        serializer.save(
            tenant=self.request.user.tenant,
            created_by=self.request.user
        )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish the website instance"""
        instance = self.get_object()
        instance.is_published = True
        instance.status = 'published'
        instance.published_at = timezone.now()
        instance.save()
        return Response({'status': 'published', 'published_at': instance.published_at})
    
    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish the website instance"""
        instance = self.get_object()
        instance.is_published = False
        instance.status = 'draft'
        instance.save()
        return Response({'status': 'unpublished'})
    
    @action(detail=True, methods=['patch'])
    def update_theme(self, request, pk=None):
        """Update theme settings"""
        instance = self.get_object()
        
        allowed_fields = ['primary_color', 'secondary_color', 'accent_color', 'font_family']
        for field in allowed_fields:
            if field in request.data:
                setattr(instance, field, request.data[field])
        
        instance.save()
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['patch'])
    def update_seo(self, request, pk=None):
        """Update SEO settings"""
        instance = self.get_object()
        
        allowed_fields = ['meta_title', 'meta_description', 'meta_keywords']
        for field in allowed_fields:
            if field in request.data:
                setattr(instance, field, request.data[field])
        
        instance.save()
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def update_section(self, request, pk=None):
        """Update a specific section in the custom structure"""
        instance = self.get_object()
        serializer = UpdateSectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        page_idx = data['page_index']
        section_idx = data['section_index']
        updates = data['updates']
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        sections = pages[page_idx].get('sections', [])
        if section_idx >= len(sections):
            return Response({'error': 'Section index out of range'}, status=400)
        
        # Apply updates
        for key, value in updates.items():
            sections[section_idx][key] = value
        
        pages[page_idx]['sections'] = sections
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def add_section(self, request, pk=None):
        """Add a new section to a page"""
        instance = self.get_object()
        serializer = AddSectionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        page_idx = data['page_index']
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        sections = pages[page_idx].get('sections', [])
        
        # Generate section ID
        new_section = {
            'id': f"section_{uuid.uuid4().hex[:12]}",
            'component_type': data['section_type'],
            'title': data.get('title', ''),
            'content': data.get('content', {}),
            'order': data.get('order', len(sections)),
            'is_visible': True,
            'background_color': data.get('background_color', ''),
            'text_color': data.get('text_color', '')
        }
        
        sections.append(new_section)
        pages[page_idx]['sections'] = sections
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def delete_section(self, request, pk=None):
        """Delete a section from a page"""
        instance = self.get_object()
        page_idx = request.data.get('page_index')
        section_idx = request.data.get('section_index')
        
        if page_idx is None or section_idx is None:
            return Response({'error': 'page_index and section_index are required'}, status=400)
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        sections = pages[page_idx].get('sections', [])
        if section_idx >= len(sections):
            return Response({'error': 'Section index out of range'}, status=400)
        
        sections.pop(section_idx)
        pages[page_idx]['sections'] = sections
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def reorder_sections(self, request, pk=None):
        """Reorder sections within a page"""
        instance = self.get_object()
        serializer = ReorderSectionsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        page_idx = data['page_index']
        new_order = data['section_order']
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        sections = pages[page_idx].get('sections', [])
        
        if len(new_order) != len(sections):
            return Response({'error': 'Order array must match sections count'}, status=400)
        
        # Reorder sections
        reordered = [sections[i] for i in new_order]
        for idx, section in enumerate(reordered):
            section['order'] = idx
        
        pages[page_idx]['sections'] = reordered
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def add_page(self, request, pk=None):
        """Add a new page to the instance"""
        instance = self.get_object()
        serializer = AddPageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        # Check if slug already exists
        for page in pages:
            if page.get('slug') == data['slug']:
                return Response({'error': 'Page with this slug already exists'}, status=400)
        
        new_page = {
            'title': data['title'],
            'slug': data['slug'],
            'page_type': data['page_type'],
            'sections': data.get('sections', [])
        }
        
        pages.append(new_page)
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def delete_page(self, request, pk=None):
        """Delete a page from the instance"""
        instance = self.get_object()
        page_idx = request.data.get('page_index')
        
        if page_idx is None:
            return Response({'error': 'page_index is required'}, status=400)
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        pages.pop(page_idx)
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['post'])
    def update_page(self, request, pk=None):
        """Update page properties"""
        instance = self.get_object()
        page_idx = request.data.get('page_index')
        updates = request.data.get('updates', {})
        
        if page_idx is None:
            return Response({'error': 'page_index is required'}, status=400)
        
        structure = instance.custom_structure or {}
        pages = structure.get('pages', [])
        
        if page_idx >= len(pages):
            return Response({'error': 'Page index out of range'}, status=400)
        
        allowed_fields = ['title', 'slug', 'page_type', 'meta_title', 'meta_description']
        for key, value in updates.items():
            if key in allowed_fields:
                pages[page_idx][key] = value
        
        structure['pages'] = pages
        instance.custom_structure = structure
        instance.save()
        
        return Response(TenantWebsiteInstanceSerializer(instance).data)
    
    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get full preview data for the website"""
        instance = self.get_object()
        return Response({
            'instance': TenantWebsiteInstanceSerializer(instance).data,
            'structure': instance.get_effective_structure(),
            'theme': instance.get_effective_theme()
        })


# ========================================
# PUBLIC WEBSITE RENDERER VIEWSET (for SSR)
# ========================================

class PublicWebsiteViewSet(viewsets.ViewSet):
    """
    Public viewset for serving websites (used by SSR renderer).
    No authentication required.
    """
    permission_classes = [AllowAny]
    
    @action(detail=False, methods=['get'])
    def by_subdomain(self, request):
        """Get website by subdomain"""
        subdomain = request.query_params.get('subdomain')
        if not subdomain:
            return Response({'error': 'subdomain parameter required'}, status=400)
        
        try:
            instance = TenantWebsiteInstance.objects.get(
                subdomain=subdomain,
                is_published=True
            )
            # Increment visitor count
            instance.visitor_count += 1
            instance.save(update_fields=['visitor_count'])
            
            return Response({
                'name': instance.name,
                'structure': instance.get_effective_structure(),
                'theme': instance.get_effective_theme(),
                'seo': {
                    'title': instance.meta_title or instance.name,
                    'description': instance.meta_description,
                    'keywords': instance.meta_keywords
                }
            })
        except TenantWebsiteInstance.DoesNotExist:
            return Response({'error': 'Website not found'}, status=404)
    
    @action(detail=False, methods=['get'])
    def by_domain(self, request):
        """Get website by custom domain"""
        domain = request.query_params.get('domain')
        if not domain:
            return Response({'error': 'domain parameter required'}, status=400)
        
        try:
            instance = TenantWebsiteInstance.objects.get(
                domain=domain,
                is_published=True
            )
            instance.visitor_count += 1
            instance.save(update_fields=['visitor_count'])
            
            return Response({
                'name': instance.name,
                'structure': instance.get_effective_structure(),
                'theme': instance.get_effective_theme(),
                'seo': {
                    'title': instance.meta_title or instance.name,
                    'description': instance.meta_description,
                    'keywords': instance.meta_keywords
                }
            })
        except TenantWebsiteInstance.DoesNotExist:
            return Response({'error': 'Website not found'}, status=404)


# ========================================
# LEGACY VIEWSETS (kept for backward compatibility)
# ========================================

class WebsiteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing websites (legacy)
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
        page = serializer.validated_data.get('page')
        serializer.save(tenant=self.request.user.tenant, page=page)
    
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
