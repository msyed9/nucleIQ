from django import template

register = template.Library()

@register.filter(name='split')
def split(value, arg):
    """Split a string by separator"""
    return value.split(arg)

@register.filter(name='get_nested')
def get_nested(obj, key):
    """Get nested attribute from object or dictionary"""
    if isinstance(obj, dict):
        return obj.get(key, '')
    return getattr(obj, key, '')

@register.filter(name='div')
def div(value, arg):
    """Divide value by arg - for converting to mm"""
    try:
        return float(value) / float(arg)
    except (ValueError, ZeroDivisionError, TypeError):
        return value