"""
Search Service for NucleiQ
PostgreSQL Full Text Search implementation with tenant and permission filtering
"""

from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank
from django.db.models import Q, F
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


class SearchService:
    """
    Global search service using PostgreSQL Full Text Search.
    Filters results by tenant and user permissions.
    """
    
    CACHE_TIMEOUT = 60  # 1 minute
    
    def __init__(self, user):
        self.user = user
        self.tenant = user.tenant
    
    def search(self, query, filters=None, limit=20):
        """
        Perform global search across multiple models.
        
        Args:
            query: Search query string
            filters: Optional dict of filters {
                'types': ['students', 'staff', 'pages'],
                'category': 'academic'
            }
            limit: Maximum results per type
        
        Returns:
            {
                'students': [...],
                'staff': [...],
                'pages': [...],
                'settings': [...]
            }
        """
        if not query or len(query) < 2:
            return {}
        
        filters = filters or {}
        search_types = filters.get('types', ['students', 'staff', 'pages', 'settings'])
        
        results = {}
        
        if 'students' in search_types and self.user.has_permission('student_module', 'read'):
            results['students'] = self._search_students(query, limit)
        
        if 'staff' in search_types and self.user.has_permission('staff_module', 'read'):
            results['staff'] = self._search_staff(query, limit)
        
        if 'pages' in search_types:
            results['pages'] = self._search_pages(query, limit)
        
        if 'settings' in search_types:
            results['settings'] = self._search_settings(query, limit)
        
        return results
    
    def _search_students(self, query, limit):
        """
        Search students using Full Text Search.
        
        Returns:
            [
                {
                    'id': str,
                    'type': 'student',
                    'title': str,
                    'subtitle': str,
                    'url': str,
                    'rank': float
                }
            ]
        """
        # This would use actual Student model
        # from students.models import Student
        
        # search_vector = SearchVector('first_name', weight='A') + \
        #                SearchVector('last_name', weight='A') + \
        #                SearchVector('admission_number', weight='B') + \
        #                SearchVector('email', weight='C')
        
        # search_query = SearchQuery(query)
        
        # students = Student.objects.filter(
        #     tenant=self.tenant,
        #     is_active=True
        # ).annotate(
        #     search=search_vector,
        #     rank=SearchRank(search_vector, search_query)
        # ).filter(
        #     search=search_query
        # ).order_by('-rank')[:limit]
        
        # return [
        #     {
        #         'id': str(student.id),
        #         'type': 'student',
        #         'title': student.get_full_name(),
        #         'subtitle': f"{student.admission_number} - {student.class_name}",
        #         'url': f"/students/{student.id}",
        #         'rank': student.rank
        #     }
        #     for student in students
        # ]
        
        # Placeholder
        return []
    
    def _search_staff(self, query, limit):
        """
        Search staff using Full Text Search.
        
        Returns:
            [
                {
                    'id': str,
                    'type': 'staff',
                    'title': str,
                    'subtitle': str,
                    'url': str,
                    'rank': float
                }
            ]
        """
        # This would use actual Staff model
        # from staff.models import Staff
        
        # search_vector = SearchVector('first_name', weight='A') + \
        #                SearchVector('last_name', weight='A') + \
        #                SearchVector('employee_id', weight='B') + \
        #                SearchVector('email', weight='C') + \
        #                SearchVector('department', weight='D')
        
        # search_query = SearchQuery(query)
        
        # staff = Staff.objects.filter(
        #     tenant=self.tenant,
        #     is_active=True
        #     ).annotate(
        #     search=search_vector,
        #     rank=SearchRank(search_vector, search_query)
        # ).filter(
        #     search=search_query
        # ).order_by('-rank')[:limit]
        
        # return [
        #     {
        #         'id': str(s.id),
        #         'type': 'staff',
        #         'title': s.get_full_name(),
        #         'subtitle': f"{s.employee_id} - {s.designation}",
        #         'url': f"/staff/{s.id}",
        #         'rank': s.rank
        #     }
        #     for s in staff
        # ]
        
        # Placeholder
        return []
    
    def _search_pages(self, query, limit):
        """
        Search application pages and navigation items.
        
        Returns:
            [
                {
                    'id': str,
                    'type': 'page',
                    'title': str,
                    'subtitle': str,
                    'url': str,
                    'icon': str
                }
            ]
        """
        # Define searchable pages
        pages = [
            {
                'id': 'students',
                'title': 'Students',
                'subtitle': 'Manage student records',
                'url': '/students',
                'icon': 'users',
                'keywords': ['student', 'admission', 'enrollment']
            },
            {
                'id': 'staff',
                'title': 'Staff',
                'subtitle': 'Manage staff members',
                'url': '/staff',
                'icon': 'briefcase',
                'keywords': ['staff', 'teacher', 'employee']
            },
            {
                'id': 'fees',
                'title': 'Fee Management',
                'subtitle': 'Manage fee collection',
                'url': '/fees',
                'icon': 'dollar-sign',
                'keywords': ['fee', 'payment', 'collection', 'finance']
            },
            {
                'id': 'attendance',
                'title': 'Attendance',
                'subtitle': 'Track attendance',
                'url': '/attendance',
                'icon': 'calendar-check',
                'keywords': ['attendance', 'present', 'absent']
            },
            {
                'id': 'exams',
                'title': 'Examinations',
                'subtitle': 'Manage exams and results',
                'url': '/exams',
                'icon': 'file-text',
                'keywords': ['exam', 'test', 'result', 'grade']
            },
            {
                'id': 'billing',
                'title': 'Billing & Subscription',
                'subtitle': 'Manage subscription',
                'url': '/billing',
                'icon': 'credit-card',
                'keywords': ['billing', 'subscription', 'plan', 'payment']
            },
        ]
        
        # Filter pages based on query
        query_lower = query.lower()
        results = []
        
        for page in pages:
            # Check if query matches title, subtitle, or keywords
            if (query_lower in page['title'].lower() or
                query_lower in page['subtitle'].lower() or
                any(query_lower in keyword for keyword in page['keywords'])):
                
                # Check permissions
                page_id = page['id']
                if page_id == 'billing' or self.user.has_permission(f"{page_id}_module", 'read'):
                    results.append({
                        'id': page['id'],
                        'type': 'page',
                        'title': page['title'],
                        'subtitle': page['subtitle'],
                        'url': page['url'],
                        'icon': page.get('icon', 'file')
                    })
        
        return results[:limit]
    
    def _search_settings(self, query, limit):
        """
        Search settings and configuration options.
        
        Returns:
            [
                {
                    'id': str,
                    'type': 'setting',
                    'title': str,
                    'subtitle': str,
                    'url': str
                }
            ]
        """
        settings = [
            {
                'id': 'profile',
                'title': 'Profile Settings',
                'subtitle': 'Update your profile',
                'url': '/settings/profile',
                'keywords': ['profile', 'account', 'user']
            },
            {
                'id': 'preferences',
                'title': 'Preferences',
                'subtitle': 'Customize your experience',
                'url': '/settings/preferences',
                'keywords': ['preferences', 'theme', 'language']
            },
            {
                'id': 'security',
                'title': 'Security',
                'subtitle': 'Password and security settings',
                'url': '/settings/security',
                'keywords': ['security', 'password', '2fa']
            },
        ]
        
        query_lower = query.lower()
        results = []
        
        for setting in settings:
            if (query_lower in setting['title'].lower() or
                query_lower in setting['subtitle'].lower() or
                any(query_lower in keyword for keyword in setting['keywords'])):
                
                results.append({
                    'id': setting['id'],
                    'type': 'setting',
                    'title': setting['title'],
                    'subtitle': setting['subtitle'],
                    'url': setting['url']
                })
        
        return results[:limit]
    
    def get_recent_searches(self):
        """Get user's recent searches from cache."""
        cache_key = f"recent_searches_{self.user.id}"
        return cache.get(cache_key, [])
    
    def save_recent_search(self, query):
        """Save search query to recent searches."""
        cache_key = f"recent_searches_{self.user.id}"
        recent = self.get_recent_searches()
        
        # Add to beginning, remove duplicates
        if query in recent:
            recent.remove(query)
        recent.insert(0, query)
        
        # Keep only last 10
        recent = recent[:10]
        
        cache.set(cache_key, recent, timeout=86400 * 30)  # 30 days
