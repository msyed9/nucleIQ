"""
Serializers for Search app
Defines schemas for search queries, results, and responses.
"""

from rest_framework import serializers


class SearchResultMetadataSerializer(serializers.Serializer):
    """Serializer for search result metadata."""
    
    # Generic metadata fields - not all will be present for every result
    admission_number = serializers.CharField(required=False)
    employee_id = serializers.CharField(required=False)
    email = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    designation = serializers.CharField(required=False)
    department = serializers.CharField(required=False)
    invoice_number = serializers.CharField(required=False)
    student = serializers.CharField(required=False)
    amount = serializers.CharField(required=False)
    status = serializers.CharField(required=False)
    date = serializers.CharField(required=False)
    author = serializers.CharField(required=False)
    isbn = serializers.CharField(required=False)
    available = serializers.IntegerField(required=False)
    total = serializers.IntegerField(required=False)
    category = serializers.CharField(required=False)
    subject = serializers.CharField(required=False)
    term = serializers.CharField(required=False)
    max_marks = serializers.CharField(required=False)
    action = serializers.CharField(required=False)
    highlight = serializers.CharField(required=False)


class SearchResultSerializer(serializers.Serializer):
    """Serializer for individual search result."""
    
    id = serializers.CharField()
    type = serializers.ChoiceField(
        choices=['student', 'staff', 'fee', 'book', 'exam', 'page', 'setting']
    )
    title = serializers.CharField()
    subtitle = serializers.CharField(required=False, allow_blank=True)
    url = serializers.CharField()
    icon = serializers.CharField(required=False, allow_blank=True)
    rank = serializers.FloatField(required=False)
    metadata = SearchResultMetadataSerializer(required=False)


class GroupedResultsSerializer(serializers.Serializer):
    """Serializer for grouped results by type."""
    
    count = serializers.IntegerField()
    items = SearchResultSerializer(many=True)


class SearchResponseSerializer(serializers.Serializer):
    """Serializer for complete search response."""
    
    # Grouped results by type
    students = GroupedResultsSerializer(required=False)
    staff = GroupedResultsSerializer(required=False)
    fees = GroupedResultsSerializer(required=False)
    books = GroupedResultsSerializer(required=False)
    exams = GroupedResultsSerializer(required=False)
    pages = GroupedResultsSerializer(required=False)
    settings = GroupedResultsSerializer(required=False)
    
    # Flat results list (all types combined)
    results = SearchResultSerializer(many=True, required=False)
    
    # Metadata
    query = serializers.CharField()
    total_results = serializers.IntegerField()
    search_time_ms = serializers.IntegerField(required=False)


class SearchQuerySerializer(serializers.Serializer):
    """Serializer for search query parameters."""
    
    q = serializers.CharField(
        required=True,
        min_length=2,
        max_length=100,
        help_text="Search query (minimum 2 characters)"
    )
    
    types = serializers.CharField(
        required=False,
        help_text="Comma-separated list of types to search (students,staff,fees,books,exams,pages,settings)"
    )
    
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=50,
        default=20,
        help_text="Maximum results per type (default: 20, max: 50)"
    )
    
    # Optional filters
    class_id = serializers.UUIDField(
        required=False,
        help_text="Filter by class/grade level ID"
    )
    
    section_id = serializers.UUIDField(
        required=False,
        help_text="Filter by section ID"
    )
    
    date_from = serializers.DateField(
        required=False,
        help_text="Filter from date (YYYY-MM-DD)"
    )
    
    date_to = serializers.DateField(
        required=False,
        help_text="Filter to date (YYYY-MM-DD)"
    )
    
    # Response format
    grouped = serializers.BooleanField(
        required=False,
        default=True,
        help_text="Return grouped results by type (default: true)"
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
    
    def validate_types(self, value):
        """Parse and validate types parameter."""
        if not value:
            return None
        
        valid_types = {'students', 'staff', 'fees', 'books', 'exams', 'pages', 'settings'}
        types = [t.strip().lower() for t in value.split(',')]
        
        invalid_types = set(types) - valid_types
        if invalid_types:
            raise serializers.ValidationError(
                f"Invalid types: {', '.join(invalid_types)}. "
                f"Valid types: {', '.join(valid_types)}"
            )
        
        return types


class SuggestionQuerySerializer(serializers.Serializer):
    """Serializer for suggestion query parameters."""
    
    q = serializers.CharField(
        required=True,
        min_length=2,
        max_length=100,
        help_text="Partial search query for suggestions"
    )
    
    limit = serializers.IntegerField(
        required=False,
        min_value=1,
        max_value=20,
        default=10,
        help_text="Maximum suggestions (default: 10, max: 20)"
    )


class SuggestionResponseSerializer(serializers.Serializer):
    """Serializer for suggestion response."""
    
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of suggested search terms"
    )


class RecentSearchSerializer(serializers.Serializer):
    """Serializer for recent searches."""
    
    searches = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of recent search queries"
    )


class SearchLogSerializer(serializers.Serializer):
    """Serializer for search audit log entry."""
    
    query = serializers.CharField()
    timestamp = serializers.DateTimeField(required=False)
    results_count = serializers.IntegerField(required=False)
    search_time_ms = serializers.IntegerField(required=False)
