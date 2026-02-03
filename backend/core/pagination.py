from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination used across the API.
    Allows client to pass `page_size` query param and caps via `max_page_size`.
    """
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 1000
