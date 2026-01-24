"""
Custom template tags for data management admin views
"""
from django import template

register = template.Library()


@register.filter
def get_item(dictionary, key):
    """Get an item from a dictionary by key in templates"""
    if isinstance(dictionary, dict):
        return dictionary.get(key, '')
    return ''


@register.filter
def stringformat(value, arg):
    """Format a value as a string"""
    return (f"%{arg}") % value
