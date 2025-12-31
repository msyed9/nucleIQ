"""
Search API Views
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.permissions import IsTenantUser
from .search_service import SearchService
from .serializers import SearchQuerySerializer, SearchResponseSerializer


class GlobalSearchView(APIView):
    """
    Global search endpoint.
    Searches across students, staff, pages, and settings.
    
    Query Parameters:
        q (required): Search query (min 2 characters)
        types (optional): Comma-separated list of types to search
                         (students,staff,pages,settings)
        limit (optional): Maximum results per type (default: 20, max: 50)
    
    Example:
        GET /api/search/?q=john&types=students,staff&limit=10
    
    Response:
        {
            "students": [
                {
                    "id": "uuid",
                    "type": "student",
                    "title": "John Doe",
                    "subtitle": "12345 - Class 10A",
                    "url": "/students/uuid",
                    "rank": 0.95
                }
            ],
            "staff": [...],
            "pages": [...],
            "settings": [...],
            "query": "john",
            "total_results": 15
        }
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get(self, request):
        """Perform global search."""
        # Validate query parameters
        serializer = SearchQuerySerializer(data=request.query_params)
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )
        
        query = serializer.validated_data['q']
        types = serializer.validated_data.get('types')
        limit = serializer.validated_data.get('limit', 20)
        
        # Perform search
        search_service = SearchService(request.user)
        
        filters = {}
        if types:
            filters['types'] = types
        
        results = search_service.search(query, filters=filters, limit=limit)
        
        # Save to recent searches
        search_service.save_recent_search(query)
        
        # Calculate total results
        total_results = sum(len(v) for v in results.values())
        
        # Prepare response
        response_data = {
            **results,
            'query': query,
            'total_results': total_results
        }
        
        return Response(response_data)


class RecentSearchesView(APIView):
    """
    Get user's recent searches.
    
    Response:
        [
            "john doe",
            "fee payment",
            "attendance"
        ]
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get recent searches."""
        search_service = SearchService(request.user)
        recent = search_service.get_recent_searches()
        return Response(recent)
    
    def delete(self, request):
        """Clear recent searches."""
        from django.core.cache import cache
        cache_key = f"recent_searches_{request.user.id}"
        cache.delete(cache_key)
        return Response({'message': 'Recent searches cleared'})


class SearchSuggestionsView(APIView):
    """
    Get search suggestions based on query.
    
    Query Parameters:
        q (required): Partial search query
    
    Response:
        {
            "suggestions": [
                "john doe",
                "john smith"
            ]
        }
    """
    
    permission_classes = [IsAuthenticated, IsTenantUser]
    
    def get(self, request):
        """Get search suggestions."""
        query = request.query_params.get('q', '')
        
        if len(query) < 2:
            return Response({'suggestions': []})
        
        # Get recent searches that match
        search_service = SearchService(request.user)
        recent = search_service.get_recent_searches()
        
        # Filter recent searches by query
        suggestions = [
            search for search in recent
            if query.lower() in search.lower()
        ]
        
        # Limit to 5 suggestions
        suggestions = suggestions[:5]
        
        return Response({'suggestions': suggestions})
