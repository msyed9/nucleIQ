"""
URL Configuration for Search app

Endpoints:
- GET  /api/search/                  - Global search with filters
- GET  /api/search/quick/            - Quick search for autocomplete
- GET  /api/search/suggestions/      - Search suggestions
- GET  /api/search/recent/           - Get recent searches
- DELETE /api/search/recent/         - Clear recent searches
"""

from django.urls import path
from .views import (
    GlobalSearchView, 
    RecentSearchesView, 
    SearchSuggestionsView,
    QuickSearchView
)

app_name = 'search'

urlpatterns = [
    # Global search (main endpoint)
    path('', GlobalSearchView.as_view(), name='global-search'),
    
    # Quick search (optimized for autocomplete)
    path('quick/', QuickSearchView.as_view(), name='quick-search'),
    
    # Search suggestions
    path('suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
    
    # Recent searches
    path('recent/', RecentSearchesView.as_view(), name='recent-searches'),
]
