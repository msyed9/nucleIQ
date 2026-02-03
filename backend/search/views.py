"""
Search API Views
Provides endpoints for global search, suggestions, and recent searches.
"""

import time
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.throttling import UserRateThrottle
from rest_framework import status
from django.core.cache import cache
from core.permissions import IsTenantUser
from .search_service import SearchService
from .serializers import (
    SearchQuerySerializer, 
    SearchResponseSerializer,
    SuggestionQuerySerializer,
    SuggestionResponseSerializer,
    RecentSearchSerializer
)


class SearchSuggestionThrottle(UserRateThrottle):
    """Rate limiting for search suggestions to prevent abuse."""
    rate = '60/minute'


class GlobalSearchView(APIView):
    """
    Global search endpoint.
    Searches across students, staff, fees, books, exams, pages, and settings.
    
    Query Parameters:
        q (required): Search query (min 2 characters)
        types (optional): Comma-separated list of types to search
                         (students,staff,fees,books,exams,pages,settings)
        limit (optional): Maximum results per type (default: 20, max: 50)
        class_id (optional): Filter by class/grade level ID (UUID)
        section_id (optional): Filter by section ID (UUID)
        date_from (optional): Filter from date (YYYY-MM-DD)
        date_to (optional): Filter to date (YYYY-MM-DD)
        grouped (optional): Return grouped results (default: true)
    
    Example:
        GET /api/search/?q=john&types=students,staff&limit=10
    
    Response (grouped=true):
        {
            "students": {
                "count": 5,
                "items": [
                    {
                        "id": "uuid",
                        "type": "student",
                        "title": "John Doe",
                        "subtitle": "12345 - Class 10A",
                        "url": "/students/uuid",
                        "icon": "person",
                        "rank": 0.95,
                        "metadata": {
                            "admission_number": "12345",
                            "highlight": "matched <mark>text</mark>"
                        }
                    }
                ]
            },
            "staff": { "count": 0, "items": [] },
            ...
            "query": "john",
            "total_results": 5,
            "search_time_ms": 45
        }
    
    Response (grouped=false):
        {
            "results": [...],
            "query": "john",
            "total_results": 5,
            "search_time_ms": 45
        }
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get(self, request):
        """Perform global search."""
        start_time = time.time()
        
        # Validate query parameters
        serializer = SearchQuerySerializer(data=request.query_params)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        query = validated_data['q']
        types = validated_data.get('types')
        limit = validated_data.get('limit', 20)
        grouped = validated_data.get('grouped', True)
        
        # Build filters
        filters = {}
        if types:
            filters['types'] = types
        if validated_data.get('class_id'):
            filters['class_id'] = validated_data['class_id']
        if validated_data.get('section_id'):
            filters['section_id'] = validated_data['section_id']
        if validated_data.get('date_from'):
            filters['date_from'] = validated_data['date_from']
        if validated_data.get('date_to'):
            filters['date_to'] = validated_data['date_to']
        
        # Perform search
        search_service = SearchService(request.user)
        results = search_service.search(query, filters=filters, limit=limit)
        
        # Save to recent searches
        search_service.save_recent_search(query)
        
        # Calculate search time
        search_time_ms = int((time.time() - start_time) * 1000)
        
        # Calculate total results
        total_results = sum(len(v) for v in results.values())
        
        # Log search for analytics
        search_service.log_search(query, total_results, search_time_ms)
        
        # Build response
        if grouped:
            # Grouped response format
            response_data = {}
            
            for type_name, items in results.items():
                response_data[type_name] = {
                    'count': len(items),
                    'items': items
                }
            
            response_data['query'] = query
            response_data['total_results'] = total_results
            response_data['search_time_ms'] = search_time_ms
        else:
            # Flat response format - combine all results
            flat_results = []
            for items in results.values():
                flat_results.extend(items)
            
            # Sort by rank
            flat_results.sort(key=lambda x: x.get('rank', 0), reverse=True)
            
            response_data = {
                'results': flat_results,
                'query': query,
                'total_results': total_results,
                'search_time_ms': search_time_ms
            }
        
        return Response(response_data)


class SearchSuggestionsView(APIView):
    """
    Get search suggestions based on query prefix.
    Provides autocomplete functionality.
    
    Query Parameters:
        q (required): Partial search query (min 2 characters)
        limit (optional): Maximum suggestions (default: 10, max: 20)
    
    Response:
        {
            "suggestions": [
                "John Doe",
                "John Smith",
                "john admission"
            ]
        }
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    throttle_classes = [SearchSuggestionThrottle]
    
    def get(self, request):
        """Get search suggestions."""
        serializer = SuggestionQuerySerializer(data=request.query_params)
        
        if not serializer.is_valid():
            return Response(
                {'suggestions': []},
                status=status.HTTP_200_OK
            )
        
        query = serializer.validated_data['q']
        limit = serializer.validated_data.get('limit', 10)
        
        # Get suggestions
        search_service = SearchService(request.user)
        suggestions = search_service.get_suggestions(query, limit=limit)
        
        return Response({'suggestions': suggestions})


class RecentSearchesView(APIView):
    """
    Manage user's recent searches.
    
    GET: Get recent searches
    DELETE: Clear recent searches
    
    Response:
        {
            "searches": [
                "john doe",
                "fee payment",
                "attendance"
            ]
        }
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recent searches."""
        search_service = SearchService(request.user)
        recent = search_service.get_recent_searches()
        return Response({'searches': recent})
    
    def delete(self, request):
        """Clear recent searches."""
        search_service = SearchService(request.user)
        search_service.clear_recent_searches()
        return Response({'message': 'Recent searches cleared'})


class QuickSearchView(APIView):
    """
    Quick search endpoint optimized for autocomplete.
    Returns minimal data for fast response.
    
    Query Parameters:
        q (required): Search query (min 2 characters)
        type (optional): Single type to search
        limit (optional): Maximum results (default: 5)
    
    Response:
        {
            "results": [
                {
                    "id": "uuid",
                    "type": "student",
                    "title": "John Doe",
                    "url": "/students/uuid"
                }
            ]
        }
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    throttle_classes = [SearchSuggestionThrottle]
    
    def get(self, request):
        """Perform quick search."""
        query = request.query_params.get('q', '')
        search_type = request.query_params.get('type')
        limit = min(int(request.query_params.get('limit', 5)), 10)
        
        if len(query) < 2:
            return Response({'results': []})
        
        # Build filters
        filters = {}
        if search_type:
            filters['types'] = [search_type]
        else:
            # Default to entity types only (not pages/settings)
            filters['types'] = ['students', 'staff', 'fees', 'books', 'exams']
        
        # Perform search
        search_service = SearchService(request.user)
        results = search_service.search(query, filters=filters, limit=limit)
        
        # Flatten and simplify results
        flat_results = []
        for items in results.values():
            for item in items:
                flat_results.append({
                    'id': item['id'],
                    'type': item['type'],
                    'title': item['title'],
                    'subtitle': item.get('subtitle', ''),
                    'url': item['url'],
                    'icon': item.get('icon', '')
                })
        
        # Sort by rank and limit
        flat_results.sort(key=lambda x: x.get('rank', 0), reverse=True)
        
        return Response({'results': flat_results[:limit]})
