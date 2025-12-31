"""
Serializers for Search app
"""

from rest_framework import serializers


class SearchResultSerializer(serializers.Serializer):
    """Serializer for individual search result."""
    
    id = serializers.CharField()
    type = serializers.ChoiceField(
        choices=['student', 'staff', 'page', 'setting']
    )
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    url = serializers.CharField()
    icon = serializers.CharField(required=False, allow_blank=True)
    rank = serializers.FloatField(required=False)


class SearchResponseSerializer(serializers.Serializer):
    """Serializer for search response."""
    
    students = SearchResultSerializer(many=True, required=False)
    staff = SearchResultSerializer(many=True, required=False)
    pages = SearchResultSerializer(many=True, required=False)
    settings = SearchResultSerializer(many=True, required=False)
    query = serializers.CharField()
    total_results = serializers.IntegerField()


class SearchQuerySerializer(serializers.Serializer):
    """Serializer for search query parameters."""
    
    q = serializers.CharField(
        required=True,
        min_length=2,
        max_length=100,
        help_text="Search query (minimum 2 characters)"
    )
    
    types = serializers.ListField(
        child=serializers.ChoiceField(
            choices=['students', 'staff', 'pages', 'settings']
        ),
        required=False,
        help_text="Filter by result types"
    )
    
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=50,
        default=20,
        help_text="Maximum results per type"
    )
    
    def validate_q(self, value):
        """Validate search query."""
        # Remove extra whitespace
        value = ' '.join(value.split())
        
        if len(value) < 2:
            raise serializers.ValidationError(
                "Search query must be at least 2 characters"
            )
        
        return value


class RecentSearchSerializer(serializers.Serializer):
    """Serializer for recent searches."""
    
    query = serializers.CharField()
    timestamp = serializers.DateTimeField(required=False)
