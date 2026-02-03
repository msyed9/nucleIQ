"""
Tests for Search app
Tests for SearchService, views, and API endpoints.
"""

from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from unittest.mock import patch, MagicMock
import json


class SearchServiceTests(TestCase):
    """Tests for SearchService class."""
    
    def setUp(self):
        """Set up test fixtures."""
        # Create mock user and tenant
        self.mock_tenant = MagicMock()
        self.mock_tenant.id = 'test-tenant-id'
        self.mock_tenant.get_all_enabled_modules.return_value = [
            'student_module',
            'staff_module',
            'fee_module',
            'library_module',
            'exam_module'
        ]
        
        self.mock_user = MagicMock()
        self.mock_user.id = 'test-user-id'
        self.mock_user.tenant = self.mock_tenant
        self.mock_user.is_platform_admin = False
        self.mock_user.is_superuser = False
        self.mock_user.has_permission = MagicMock(return_value=True)
    
    def test_search_requires_minimum_query_length(self):
        """Search should return empty results for queries < 2 chars."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        # Single character
        results = service.search('a')
        self.assertEqual(results, {})
        
        # Empty string
        results = service.search('')
        self.assertEqual(results, {})
        
        # None
        results = service.search(None)
        self.assertEqual(results, {})
    
    def test_search_respects_type_filter(self):
        """Search should only search specified types."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        # Search only pages and settings (these are hardcoded)
        results = service.search('dashboard', filters={'types': ['pages', 'settings']})
        
        # Should not have students, staff, etc.
        self.assertNotIn('students', results)
        self.assertNotIn('staff', results)
    
    def test_search_pages_returns_results(self):
        """Page search should return matching navigation items."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        results = service.search('dashboard', filters={'types': ['pages']})
        
        # Should find dashboard page
        self.assertIn('pages', results)
        page_results = results['pages']
        self.assertGreater(len(page_results), 0)
        
        # Check result structure
        page = page_results[0]
        self.assertIn('id', page)
        self.assertIn('type', page)
        self.assertIn('title', page)
        self.assertIn('url', page)
    
    def test_search_settings_returns_results(self):
        """Settings search should return matching settings pages."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        results = service.search('profile', filters={'types': ['settings']})
        
        # Should find profile settings
        self.assertIn('settings', results)
        settings_results = results['settings']
        self.assertGreater(len(settings_results), 0)
    
    def test_search_limit_is_respected(self):
        """Search should respect the limit parameter."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        # Search with limit of 2
        results = service.search('student', filters={'types': ['pages']}, limit=2)
        
        if 'pages' in results:
            self.assertLessEqual(len(results['pages']), 2)
    
    def test_recent_searches_operations(self):
        """Test saving and retrieving recent searches."""
        from search.search_service import SearchService
        from django.core.cache import cache
        
        service = SearchService(self.mock_user)
        
        # Clear any existing
        service.clear_recent_searches()
        
        # Save some searches
        service.save_recent_search('test search 1')
        service.save_recent_search('test search 2')
        service.save_recent_search('test search 3')
        
        # Retrieve
        recent = service.get_recent_searches()
        
        self.assertEqual(len(recent), 3)
        self.assertEqual(recent[0], 'test search 3')  # Most recent first
        self.assertEqual(recent[1], 'test search 2')
        self.assertEqual(recent[2], 'test search 1')
    
    def test_recent_searches_no_duplicates(self):
        """Recent searches should not contain duplicates."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        service.clear_recent_searches()
        
        # Save same search multiple times
        service.save_recent_search('duplicate search')
        service.save_recent_search('other search')
        service.save_recent_search('duplicate search')  # Should move to top
        
        recent = service.get_recent_searches()
        
        # Should only have 2 unique entries
        self.assertEqual(len(recent), 2)
        self.assertEqual(recent[0], 'duplicate search')  # Most recent
    
    def test_suggestions_returns_matching_recent(self):
        """Suggestions should include matching recent searches."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        service.clear_recent_searches()
        
        # Save a recent search
        service.save_recent_search('john smith')
        service.save_recent_search('jane doe')
        
        # Get suggestions for 'jo'
        suggestions = service.get_suggestions('jo')
        
        # Should include 'john smith'
        self.assertIn('john smith', suggestions)
    
    def test_highlight_match(self):
        """Test match highlighting function."""
        from search.search_service import SearchService
        
        service = SearchService(self.mock_user)
        
        # Test basic highlighting
        result = service._highlight_match('John Doe', 'john')
        self.assertIn('<mark>', result)
        self.assertIn('John', result)
    
    def test_permission_check(self):
        """Search should respect user permissions."""
        from search.search_service import SearchService
        
        # User without student permission
        self.mock_user.has_permission = MagicMock(
            side_effect=lambda r, a: r != 'student_module'
        )
        
        service = SearchService(self.mock_user)
        results = service.search('test', filters={'types': ['students', 'pages']})
        
        # Should not include students
        self.assertNotIn('students', results)
        # Should include pages (no permission required)
        self.assertIn('pages', results)


class SearchAPITests(APITestCase):
    """Tests for Search API endpoints."""
    
    def setUp(self):
        """Set up test client."""
        self.client = APIClient()
    
    def test_search_requires_authentication(self):
        """Search endpoint should require authentication."""
        response = self.client.get('/api/search/?q=test')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_search_requires_query_parameter(self):
        """Search should return 400 if no query provided."""
        # This would require a logged-in user
        # Skip if authentication not set up
        pass
    
    def test_suggestions_requires_authentication(self):
        """Suggestions endpoint should require authentication."""
        response = self.client.get('/api/search/suggestions/?q=test')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_recent_requires_authentication(self):
        """Recent searches endpoint should require authentication."""
        response = self.client.get('/api/search/recent/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class SearchSerializerTests(TestCase):
    """Tests for Search serializers."""
    
    def test_search_query_serializer_valid(self):
        """SearchQuerySerializer should accept valid input."""
        from search.serializers import SearchQuerySerializer
        
        data = {'q': 'test query', 'limit': 10}
        serializer = SearchQuerySerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['q'], 'test query')
        self.assertEqual(serializer.validated_data['limit'], 10)
    
    def test_search_query_serializer_min_length(self):
        """SearchQuerySerializer should reject query < 2 chars."""
        from search.serializers import SearchQuerySerializer
        
        data = {'q': 'a'}
        serializer = SearchQuerySerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('q', serializer.errors)
    
    def test_search_query_serializer_types_parsing(self):
        """SearchQuerySerializer should parse types correctly."""
        from search.serializers import SearchQuerySerializer
        
        data = {'q': 'test', 'types': 'students,staff,pages'}
        serializer = SearchQuerySerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['types'], ['students', 'staff', 'pages'])
    
    def test_search_query_serializer_invalid_types(self):
        """SearchQuerySerializer should reject invalid types."""
        from search.serializers import SearchQuerySerializer
        
        data = {'q': 'test', 'types': 'students,invalid_type'}
        serializer = SearchQuerySerializer(data=data)
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('types', serializer.errors)
    
    def test_suggestion_query_serializer_valid(self):
        """SuggestionQuerySerializer should accept valid input."""
        from search.serializers import SuggestionQuerySerializer
        
        data = {'q': 'test', 'limit': 5}
        serializer = SuggestionQuerySerializer(data=data)
        
        self.assertTrue(serializer.is_valid())
    
    def test_search_result_serializer(self):
        """SearchResultSerializer should serialize correctly."""
        from search.serializers import SearchResultSerializer
        
        result_data = {
            'id': 'test-id',
            'type': 'student',
            'title': 'John Doe',
            'subtitle': '2024001 - Grade 10',
            'url': '/students/test-id',
            'icon': 'person',
            'rank': 0.95,
            'metadata': {
                'admission_number': '2024001',
                'highlight': '<mark>John</mark> Doe'
            }
        }
        
        serializer = SearchResultSerializer(data=result_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
