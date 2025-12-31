"""
URL Configuration for Search app
"""

from django.urls import path
from .views import GlobalSearchView, RecentSearchesView, SearchSuggestionsView

urlpatterns = [
    # Global search
    path('', GlobalSearchView.as_view(), name='global-search'),
    
    # Recent searches
    path('recent/', RecentSearchesView.as_view(), name='recent-searches'),
    
    # Search suggestions
    path('suggestions/', SearchSuggestionsView.as_view(), name='search-suggestions'),
]
