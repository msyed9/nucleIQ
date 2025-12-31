"""
Library Admin
"""
from django.contrib import admin
from .models import Book, BookCopy, LibraryMember, BookIssue, DigitalResource

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ['title', 'author', 'category', 'total_copies', 'available_copies']
    search_fields = ['title', 'author', 'isbn']

@admin.register(BookCopy)
class BookCopyAdmin(admin.ModelAdmin):
    list_display = ['book', 'barcode', 'status']
    search_fields = ['barcode', 'book__title']

@admin.register(LibraryMember)
class LibraryMemberAdmin(admin.ModelAdmin):
    list_display = ['__str__', 'member_type', 'books_issued_count', 'total_fines_due']

@admin.register(BookIssue)
class BookIssueAdmin(admin.ModelAdmin):
    list_display = ['copy', 'member', 'issued_date', 'due_date', 'status']
    list_filter = ['status']
    
@admin.register(DigitalResource)
class DigitalResourceAdmin(admin.ModelAdmin):
    list_display = ['title', 'resource_type', 'download_count']
