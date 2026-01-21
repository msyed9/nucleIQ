#!/usr/bin/env python
"""Check URL patterns"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.urls import get_resolver

resolver = get_resolver()

# Find data-management URLs
for pattern in resolver.url_patterns:
    pattern_str = str(pattern.pattern)
    if 'data' in pattern_str.lower():
        print(f"Found: {pattern_str}")
        if hasattr(pattern, 'url_patterns'):
            for sub in pattern.url_patterns:
                print(f"  - {sub.pattern}")
