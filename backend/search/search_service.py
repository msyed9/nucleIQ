"""
Search Service for NucleiQ
PostgreSQL Full Text Search implementation with tenant and permission filtering.

Features:
- Full-text search across Students, Staff, Fees, Books, Exams
- Navigation/Pages search with dynamic module filtering
- Settings search
- Fuzzy matching using PostgreSQL trigrams
- Match highlighting
- Relevance ranking
- Audit logging
"""

from django.contrib.postgres.search import (
    SearchVector, SearchQuery, SearchRank, TrigramSimilarity
)
from django.db.models import Q, F, Value, CharField
from django.db.models.functions import Concat, Coalesce
from django.core.cache import cache
from django.utils import timezone
import logging
import re

logger = logging.getLogger(__name__)


class SearchService:
    """
    Global search service using PostgreSQL Full Text Search.
    Filters results by tenant and user permissions.
    
    Supported search types:
    - students: Student records (requires student_module read permission)
    - staff: Staff/Employee records (requires staff_module read permission)
    - fees: Fee invoices (requires fee_module read permission)
    - books: Library books (requires library_module read permission)
    - exams: Examinations (requires exam_module read permission)
    - pages: Navigation pages (filtered by tenant modules)
    - settings: Settings pages
    """
    
    CACHE_TIMEOUT = 60  # 1 minute for suggestions
    RECENT_SEARCH_TIMEOUT = 86400 * 30  # 30 days for recent searches
    
    # Search configuration for each entity type
    SEARCHABLE_ENTITIES = {
        'students': {
            'permission': 'student_module',
            'icon': 'person',
            'color': 'primary',
        },
        'staff': {
            'permission': 'staff_module',
            'icon': 'work',
            'color': 'secondary',
        },
        'fees': {
            'permission': 'fee_module',
            'icon': 'attach_money',
            'color': 'success',
        },
        'books': {
            'permission': 'library_module',
            'icon': 'book',
            'color': 'info',
        },
        'exams': {
            'permission': 'exam_module',
            'icon': 'assignment',
            'color': 'warning',
        },
    }
    
    def __init__(self, user):
        self.user = user
        self.tenant = user.tenant
    
    def search(self, query, filters=None, limit=20):
        """
        Perform global search across multiple models.
        
        Args:
            query: Search query string (min 2 characters)
            filters: Optional dict of filters {
                'types': ['students', 'staff', 'pages'],
                'class_id': uuid,
                'date_from': datetime,
                'date_to': datetime
            }
            limit: Maximum results per type (default 20, max 50)
        
        Returns:
            {
                'students': [...],
                'staff': [...],
                'fees': [...],
                'books': [...],
                'exams': [...],
                'pages': [...],
                'settings': [...]
            }
        """
        if not query or len(query) < 2:
            return {}
        
        filters = filters or {}
        limit = min(limit, 50)  # Cap at 50
        
        # Determine which types to search
        all_types = ['students', 'staff', 'fees', 'books', 'exams', 'pages', 'settings']
        search_types = filters.get('types', all_types)
        
        # Additional filters
        class_id = filters.get('class_id')
        section_id = filters.get('section_id')
        date_from = filters.get('date_from')
        date_to = filters.get('date_to')
        
        results = {}
        
        # Search each entity type
        if 'students' in search_types and self._has_permission('student_module'):
            results['students'] = self._search_students(query, limit, class_id, section_id)
        
        if 'staff' in search_types and self._has_permission('staff_module'):
            results['staff'] = self._search_staff(query, limit)
        
        if 'fees' in search_types and self._has_permission('fee_module'):
            results['fees'] = self._search_fees(query, limit, date_from, date_to)
        
        if 'books' in search_types and self._has_permission('library_module'):
            results['books'] = self._search_books(query, limit)
        
        if 'exams' in search_types and self._has_permission('exam_module'):
            results['exams'] = self._search_exams(query, limit)
        
        if 'pages' in search_types:
            results['pages'] = self._search_pages(query, limit)
        
        if 'settings' in search_types:
            results['settings'] = self._search_settings(query, limit)
        
        return results
    
    def _has_permission(self, module):
        """Check if user has read permission for a module."""
        if self.user.is_platform_admin or self.user.is_superuser:
            return True
        return self.user.has_permission(module, 'read')
    
    def _highlight_match(self, text, query):
        """
        Highlight matching text with <mark> tags.
        
        Args:
            text: Original text
            query: Search query
        
        Returns:
            Text with matched portions wrapped in <mark> tags
        """
        if not text or not query:
            return text
        
        # Case-insensitive highlighting
        pattern = re.compile(re.escape(query), re.IGNORECASE)
        return pattern.sub(lambda m: f'<mark>{m.group()}</mark>', str(text))
    
    def _search_students(self, query, limit, class_id=None, section_id=None):
        """
        Search students using Full Text Search with trigram similarity.
        
        Returns list of normalized search results.
        """
        try:
            from students.models import Student
            
            # Build search vector with weights
            search_vector = (
                SearchVector('first_name', weight='A') +
                SearchVector('last_name', weight='A') +
                SearchVector('admission_number', weight='B') +
                SearchVector('email', weight='C') +
                SearchVector('phone', weight='C')
            )
            
            search_query = SearchQuery(query, search_type='plain')
            
            # Base queryset with tenant isolation
            queryset = Student.objects.filter(
                tenant=self.tenant,
                is_active=True
            ).select_related('parent_name')
            
            # Apply class/section filters
            if class_id or section_id:
                from students.models import StudentEnrollment
                enrollment_filter = Q(student__tenant=self.tenant, status='ACTIVE')
                if class_id:
                    enrollment_filter &= Q(section__grade_level_id=class_id)
                if section_id:
                    enrollment_filter &= Q(section_id=section_id)
                
                student_ids = StudentEnrollment.objects.filter(
                    enrollment_filter
                ).values_list('student_id', flat=True)
                queryset = queryset.filter(id__in=student_ids)
            
            # Full-text search with ranking
            fts_results = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                Q(search=search_query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(admission_number__icontains=query)
            ).order_by('-rank')[:limit]
            
            # If no FTS results, try trigram similarity for fuzzy matching
            if not fts_results.exists():
                fts_results = queryset.annotate(
                    similarity=TrigramSimilarity(
                        Concat('first_name', Value(' '), 'last_name'),
                        query
                    )
                ).filter(similarity__gt=0.3).order_by('-similarity')[:limit]
            
            results = []
            for student in fts_results:
                full_name = student.get_full_name()
                # Get current enrollment info
                enrollment = student.get_current_enrollment()
                section_info = ""
                if enrollment and hasattr(enrollment, 'section') and enrollment.section:
                    section_info = f" - {enrollment.section}"
                
                results.append({
                    'id': str(student.id),
                    'type': 'student',
                    'title': full_name,
                    'subtitle': f"{student.admission_number}{section_info}",
                    'url': f'/students/{student.id}',
                    'icon': 'person',
                    'rank': getattr(student, 'rank', 0.5),
                    'metadata': {
                        'admission_number': student.admission_number,
                        'email': student.email or '',
                        'phone': student.phone or '',
                        'highlight': self._highlight_match(full_name, query)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching students: {e}")
            return []
    
    def _search_staff(self, query, limit):
        """
        Search staff using Full Text Search with trigram similarity.
        """
        try:
            from staff.models import Staff
            
            search_vector = (
                SearchVector('first_name', weight='A') +
                SearchVector('last_name', weight='A') +
                SearchVector('employee_id', weight='B') +
                SearchVector('email', weight='C') +
                SearchVector('phone', weight='C')
            )
            
            search_query = SearchQuery(query, search_type='plain')
            
            queryset = Staff.objects.filter(
                tenant=self.tenant,
                is_active=True
            )
            
            # Full-text search with ranking
            fts_results = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                Q(search=search_query) |
                Q(first_name__icontains=query) |
                Q(last_name__icontains=query) |
                Q(employee_id__icontains=query)
            ).order_by('-rank')[:limit]
            
            # Fallback to trigram similarity
            if not fts_results.exists():
                fts_results = queryset.annotate(
                    similarity=TrigramSimilarity(
                        Concat('first_name', Value(' '), 'last_name'),
                        query
                    )
                ).filter(similarity__gt=0.3).order_by('-similarity')[:limit]
            
            results = []
            for staff in fts_results:
                full_name = staff.get_full_name()
                designation = staff.get_designation_display() if hasattr(staff, 'get_designation_display') else staff.designation
                
                results.append({
                    'id': str(staff.id),
                    'type': 'staff',
                    'title': full_name,
                    'subtitle': f"{staff.employee_id} - {designation}",
                    'url': f'/staff/{staff.id}',
                    'icon': 'work',
                    'rank': getattr(staff, 'rank', 0.5),
                    'metadata': {
                        'employee_id': staff.employee_id,
                        'designation': designation,
                        'department': getattr(staff, 'department', ''),
                        'highlight': self._highlight_match(full_name, query)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching staff: {e}")
            return []
    
    def _search_fees(self, query, limit, date_from=None, date_to=None):
        """
        Search fee invoices by invoice number or student name.
        """
        try:
            from fees.models import FeeInvoice
            
            queryset = FeeInvoice.objects.filter(
                tenant=self.tenant
            ).select_related('student')
            
            # Apply date filters
            if date_from:
                queryset = queryset.filter(invoice_date__gte=date_from)
            if date_to:
                queryset = queryset.filter(invoice_date__lte=date_to)
            
            # Search by invoice number or student name
            queryset = queryset.filter(
                Q(invoice_number__icontains=query) |
                Q(student__first_name__icontains=query) |
                Q(student__last_name__icontains=query) |
                Q(student__admission_number__icontains=query)
            ).order_by('-invoice_date')[:limit]
            
            results = []
            for invoice in queryset:
                student_name = invoice.student.get_full_name() if invoice.student else 'Unknown'
                status_display = invoice.get_status_display() if hasattr(invoice, 'get_status_display') else invoice.status
                
                results.append({
                    'id': str(invoice.id),
                    'type': 'fee',
                    'title': f"Invoice #{invoice.invoice_number}",
                    'subtitle': f"{student_name} - ₹{invoice.total_amount} ({status_display})",
                    'url': f'/fees/invoices/{invoice.id}',
                    'icon': 'attach_money',
                    'rank': 0.5,
                    'metadata': {
                        'invoice_number': invoice.invoice_number,
                        'student': student_name,
                        'amount': str(invoice.total_amount),
                        'status': invoice.status,
                        'date': invoice.invoice_date.isoformat() if invoice.invoice_date else '',
                        'highlight': self._highlight_match(invoice.invoice_number, query)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching fees: {e}")
            return []
    
    def _search_books(self, query, limit):
        """
        Search library books by title, author, or ISBN.
        """
        try:
            from library.models import Book
            
            search_vector = (
                SearchVector('title', weight='A') +
                SearchVector('author', weight='B') +
                SearchVector('isbn', weight='C') +
                SearchVector('description', weight='D')
            )
            
            search_query = SearchQuery(query, search_type='plain')
            
            queryset = Book.objects.filter(tenant=self.tenant)
            
            # Full-text search
            fts_results = queryset.annotate(
                search=search_vector,
                rank=SearchRank(search_vector, search_query)
            ).filter(
                Q(search=search_query) |
                Q(title__icontains=query) |
                Q(author__icontains=query) |
                Q(isbn__icontains=query)
            ).order_by('-rank')[:limit]
            
            results = []
            for book in fts_results:
                results.append({
                    'id': str(book.id),
                    'type': 'book',
                    'title': book.title,
                    'subtitle': f"by {book.author} ({book.available_copies} available)",
                    'url': f'/library/books/{book.id}',
                    'icon': 'book',
                    'rank': getattr(book, 'rank', 0.5),
                    'metadata': {
                        'author': book.author,
                        'isbn': book.isbn or '',
                        'available': book.available_copies,
                        'total': book.total_copies,
                        'category': book.category or '',
                        'highlight': self._highlight_match(book.title, query)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching books: {e}")
            return []
    
    def _search_exams(self, query, limit):
        """
        Search examinations by name or subject.
        """
        try:
            from exams.models import Exam
            
            queryset = Exam.objects.filter(
                tenant=self.tenant
            ).select_related('subject', 'exam_term')
            
            # Search by exam name or subject
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(subject__name__icontains=query)
            ).order_by('-created_at')[:limit]
            
            results = []
            for exam in queryset:
                subject_name = exam.subject.name if exam.subject else 'General'
                term_name = exam.exam_term.name if exam.exam_term else ''
                status_display = exam.get_status_display() if hasattr(exam, 'get_status_display') else exam.status
                
                results.append({
                    'id': str(exam.id),
                    'type': 'exam',
                    'title': exam.name,
                    'subtitle': f"{subject_name} - {term_name} ({status_display})",
                    'url': f'/exams/{exam.id}',
                    'icon': 'assignment',
                    'rank': 0.5,
                    'metadata': {
                        'subject': subject_name,
                        'term': term_name,
                        'status': exam.status,
                        'max_marks': str(exam.max_marks) if hasattr(exam, 'max_marks') else '',
                        'highlight': self._highlight_match(exam.name, query)
                    }
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching exams: {e}")
            return []
    
    def _search_pages(self, query, limit):
        """
        Search application pages and navigation items.
        Results are filtered by tenant's enabled modules.
        """
        # Define all searchable pages with their module keys
        all_pages = [
            {
                'id': 'dashboard',
                'title': 'Dashboard',
                'subtitle': 'Overview and analytics',
                'url': '/dashboard',
                'icon': 'dashboard',
                'module': None,  # Always available
                'keywords': ['dashboard', 'home', 'overview', 'analytics']
            },
            {
                'id': 'students',
                'title': 'Students',
                'subtitle': 'Manage student records and profiles',
                'url': '/students',
                'icon': 'people',
                'module': 'student_module',
                'keywords': ['student', 'admission', 'enrollment', 'pupil']
            },
            {
                'id': 'students-add',
                'title': 'Add Student',
                'subtitle': 'Create new student admission',
                'url': '/students/add',
                'icon': 'person_add',
                'module': 'student_module',
                'keywords': ['add student', 'new student', 'admission', 'enroll'],
                'action': 'add_student'
            },
            {
                'id': 'staff',
                'title': 'Staff',
                'subtitle': 'Manage staff members and employees',
                'url': '/staff',
                'icon': 'badge',
                'module': 'staff_module',
                'keywords': ['staff', 'teacher', 'employee', 'faculty']
            },
            {
                'id': 'staff-add',
                'title': 'Add Staff',
                'subtitle': 'Create new staff member',
                'url': '/staff/add',
                'icon': 'person_add',
                'module': 'staff_module',
                'keywords': ['add staff', 'new employee', 'hire'],
                'action': 'add_staff'
            },
            {
                'id': 'fees',
                'title': 'Fee Management',
                'subtitle': 'Manage fee collection and invoices',
                'url': '/fees',
                'icon': 'payments',
                'module': 'fee_module',
                'keywords': ['fee', 'payment', 'collection', 'invoice', 'finance', 'money']
            },
            {
                'id': 'fees-collect',
                'title': 'Collect Fee',
                'subtitle': 'Record fee payment',
                'url': '/fees/collect',
                'icon': 'point_of_sale',
                'module': 'fee_module',
                'keywords': ['collect fee', 'payment', 'receipt'],
                'action': 'collect_fee'
            },
            {
                'id': 'attendance',
                'title': 'Attendance',
                'subtitle': 'Track student and staff attendance',
                'url': '/attendance',
                'icon': 'fact_check',
                'module': 'attendance_module',
                'keywords': ['attendance', 'present', 'absent', 'leave']
            },
            {
                'id': 'exams',
                'title': 'Examinations',
                'subtitle': 'Manage exams, results, and report cards',
                'url': '/exams',
                'icon': 'quiz',
                'module': 'exam_module',
                'keywords': ['exam', 'test', 'result', 'grade', 'marks', 'report card']
            },
            {
                'id': 'timetable',
                'title': 'Timetable',
                'subtitle': 'Class and exam schedules',
                'url': '/timetable',
                'icon': 'calendar_month',
                'module': 'timetable_module',
                'keywords': ['timetable', 'schedule', 'period', 'class time']
            },
            {
                'id': 'library',
                'title': 'Library',
                'subtitle': 'Book management and circulation',
                'url': '/library',
                'icon': 'local_library',
                'module': 'library_module',
                'keywords': ['library', 'book', 'issue', 'return', 'circulation']
            },
            {
                'id': 'transport',
                'title': 'Transport',
                'subtitle': 'Manage routes, vehicles, and tracking',
                'url': '/transport',
                'icon': 'directions_bus',
                'module': 'transport_module',
                'keywords': ['transport', 'bus', 'route', 'vehicle', 'driver']
            },
            {
                'id': 'hostel',
                'title': 'Hostel',
                'subtitle': 'Hostel room and bed management',
                'url': '/hostel',
                'icon': 'hotel',
                'module': 'hostel_module',
                'keywords': ['hostel', 'room', 'bed', 'boarding', 'dormitory']
            },
            {
                'id': 'inventory',
                'title': 'Inventory',
                'subtitle': 'Stock and asset management',
                'url': '/inventory',
                'icon': 'inventory_2',
                'module': 'inventory_module',
                'keywords': ['inventory', 'stock', 'asset', 'uniform', 'stationery']
            },
            {
                'id': 'hr',
                'title': 'Human Resources',
                'subtitle': 'HR management and policies',
                'url': '/hr',
                'icon': 'groups',
                'module': 'hr_module',
                'keywords': ['hr', 'human resources', 'leave', 'policy']
            },
            {
                'id': 'payroll',
                'title': 'Payroll',
                'subtitle': 'Salary and payslip management',
                'url': '/payroll',
                'icon': 'account_balance_wallet',
                'module': 'payroll_module',
                'keywords': ['payroll', 'salary', 'payslip', 'deduction']
            },
            {
                'id': 'crm',
                'title': 'CRM / Admissions',
                'subtitle': 'Lead management and admissions',
                'url': '/crm',
                'icon': 'support_agent',
                'module': 'crm_module',
                'keywords': ['crm', 'lead', 'admission', 'enquiry', 'prospect']
            },
            {
                'id': 'lms',
                'title': 'Learning Management',
                'subtitle': 'Online courses and assignments',
                'url': '/lms',
                'icon': 'school',
                'module': 'lms_module',
                'keywords': ['lms', 'course', 'lesson', 'assignment', 'online learning']
            },
            {
                'id': 'communication',
                'title': 'Communication',
                'subtitle': 'Announcements, SMS, and notifications',
                'url': '/communication',
                'icon': 'campaign',
                'module': 'communication_module',
                'keywords': ['communication', 'announcement', 'sms', 'notification', 'message']
            },
            {
                'id': 'reports',
                'title': 'Reports',
                'subtitle': 'Generate and export reports',
                'url': '/reports',
                'icon': 'assessment',
                'module': 'reports_module',
                'keywords': ['report', 'export', 'analytics', 'statistics']
            },
            {
                'id': 'billing',
                'title': 'Billing & Subscription',
                'subtitle': 'Manage your subscription plan',
                'url': '/billing',
                'icon': 'credit_card',
                'module': None,  # Always available for admins
                'keywords': ['billing', 'subscription', 'plan', 'payment', 'invoice']
            },
        ]
        
        # Get tenant's enabled modules
        try:
            tenant_modules = []
            if self.tenant and hasattr(self.tenant, 'get_all_enabled_modules'):
                tenant_modules = self.tenant.get_all_enabled_modules()
        except Exception:
            tenant_modules = []
        
        query_lower = query.lower()
        results = []
        
        for page in all_pages:
            # Check if module is enabled for tenant
            if page['module'] and tenant_modules:
                if page['module'] not in tenant_modules:
                    continue
            
            # Check permission for the module
            if page['module'] and not self._has_permission(page['module']):
                continue
            
            # Match against title, subtitle, or keywords
            if (query_lower in page['title'].lower() or
                query_lower in page['subtitle'].lower() or
                any(query_lower in keyword.lower() for keyword in page['keywords'])):
                
                results.append({
                    'id': page['id'],
                    'type': 'page',
                    'title': page['title'],
                    'subtitle': page['subtitle'],
                    'url': page['url'],
                    'icon': page.get('icon', 'web'),
                    'rank': 0.8 if query_lower in page['title'].lower() else 0.5,
                    'metadata': {
                        'action': page.get('action'),
                        'highlight': self._highlight_match(page['title'], query)
                    }
                })
        
        return results[:limit]
    
    def _search_settings(self, query, limit):
        """
        Search settings and configuration options.
        """
        settings = [
            {
                'id': 'profile',
                'title': 'Profile Settings',
                'subtitle': 'Update your personal information',
                'url': '/settings/profile',
                'icon': 'account_circle',
                'keywords': ['profile', 'account', 'user', 'personal', 'name', 'email']
            },
            {
                'id': 'preferences',
                'title': 'Preferences',
                'subtitle': 'Theme, language, and display settings',
                'url': '/settings/preferences',
                'icon': 'tune',
                'keywords': ['preferences', 'theme', 'language', 'dark mode', 'light mode', 'display']
            },
            {
                'id': 'security',
                'title': 'Security',
                'subtitle': 'Password and login settings',
                'url': '/settings/security',
                'icon': 'security',
                'keywords': ['security', 'password', '2fa', 'two factor', 'login', 'authentication']
            },
            {
                'id': 'notifications',
                'title': 'Notifications',
                'subtitle': 'Configure notification preferences',
                'url': '/settings/notifications',
                'icon': 'notifications',
                'keywords': ['notifications', 'email', 'push', 'alerts', 'sms']
            },
            {
                'id': 'branding',
                'title': 'School Branding',
                'subtitle': 'Logo, colors, and theme customization',
                'url': '/settings/branding',
                'icon': 'palette',
                'keywords': ['branding', 'logo', 'colors', 'theme', 'school name']
            },
            {
                'id': 'academic-setup',
                'title': 'Academic Setup',
                'subtitle': 'Classes, sections, and subjects',
                'url': '/settings/academic',
                'icon': 'school',
                'keywords': ['academic', 'class', 'section', 'subject', 'grade', 'curriculum']
            },
            {
                'id': 'users-roles',
                'title': 'Users & Roles',
                'subtitle': 'Manage users and permissions',
                'url': '/settings/users',
                'icon': 'manage_accounts',
                'keywords': ['users', 'roles', 'permissions', 'access', 'admin']
            },
            {
                'id': 'fee-config',
                'title': 'Fee Configuration',
                'subtitle': 'Fee categories and structure',
                'url': '/settings/fees',
                'icon': 'monetization_on',
                'keywords': ['fee', 'configuration', 'category', 'structure', 'pricing']
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
                    'url': setting['url'],
                    'icon': setting.get('icon', 'settings'),
                    'rank': 0.7,
                    'metadata': {
                        'highlight': self._highlight_match(setting['title'], query)
                    }
                })
        
        return results[:limit]
    
    def get_suggestions(self, query, limit=10):
        """
        Get smart search suggestions based on query prefix.
        
        Combines:
        - Recent searches matching the query
        - Popular search terms
        - Entity name suggestions (students/staff names)
        
        Returns list of suggestion strings.
        """
        if not query or len(query) < 2:
            return []
        
        cache_key = f"search_suggestions_{self.tenant.id if self.tenant else 'global'}_{query[:10]}"
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        suggestions = []
        query_lower = query.lower()
        
        # Add matching recent searches
        recent = self.get_recent_searches()
        for search in recent:
            if query_lower in search.lower() and search not in suggestions:
                suggestions.append(search)
        
        # Add student name suggestions
        if self._has_permission('student_module'):
            try:
                from students.models import Student
                student_names = Student.objects.filter(
                    tenant=self.tenant,
                    is_active=True
                ).filter(
                    Q(first_name__istartswith=query) |
                    Q(last_name__istartswith=query)
                ).annotate(
                    full_name=Concat('first_name', Value(' '), 'last_name')
                ).values_list('full_name', flat=True)[:5]
                
                for name in student_names:
                    if name not in suggestions:
                        suggestions.append(name)
            except Exception:
                pass
        
        # Add staff name suggestions
        if self._has_permission('staff_module'):
            try:
                from staff.models import Staff
                staff_names = Staff.objects.filter(
                    tenant=self.tenant,
                    is_active=True
                ).filter(
                    Q(first_name__istartswith=query) |
                    Q(last_name__istartswith=query)
                ).annotate(
                    full_name=Concat('first_name', Value(' '), 'last_name')
                ).values_list('full_name', flat=True)[:5]
                
                for name in staff_names:
                    if name not in suggestions:
                        suggestions.append(name)
            except Exception:
                pass
        
        # Cache suggestions
        result = suggestions[:limit]
        cache.set(cache_key, result, timeout=self.CACHE_TIMEOUT)
        
        return result
    
    def get_recent_searches(self):
        """Get user's recent searches from cache."""
        cache_key = f"recent_searches_{self.user.id}"
        return cache.get(cache_key, [])
    
    def save_recent_search(self, query):
        """Save search query to recent searches."""
        if not query or len(query) < 2:
            return
        
        cache_key = f"recent_searches_{self.user.id}"
        recent = self.get_recent_searches()
        
        # Add to beginning, remove duplicates
        query = query.strip()
        if query in recent:
            recent.remove(query)
        recent.insert(0, query)
        
        # Keep only last 10
        recent = recent[:10]
        
        cache.set(cache_key, recent, timeout=self.RECENT_SEARCH_TIMEOUT)
    
    def clear_recent_searches(self):
        """Clear user's recent searches."""
        cache_key = f"recent_searches_{self.user.id}"
        cache.delete(cache_key)
    
    def log_search(self, query, results_count, search_time_ms):
        """
        Log search query for analytics.
        
        Args:
            query: Search query string
            results_count: Total number of results
            search_time_ms: Time taken in milliseconds
        """
        try:
            from django.utils import timezone
            
            # Log to database or analytics service
            logger.info(
                f"Search: user={self.user.id}, tenant={self.tenant.id if self.tenant else None}, "
                f"query='{query}', results={results_count}, time={search_time_ms}ms"
            )
        except Exception as e:
            logger.error(f"Error logging search: {e}")
