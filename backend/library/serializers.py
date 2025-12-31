"""
Library Serializers
"""

from rest_framework import serializers
from .models import Book, BookCopy, BookIssue, LibraryMember, DigitalResource
from students.serializers import StudentBasicSerializer
from staff.serializers import StaffSerializer

class BookSerializer(serializers.ModelSerializer):
    """Serializer for Book Title"""
    available_copies_calc = serializers.SerializerMethodField()
    
    class Meta:
        model = Book
        fields = '__all__'
        read_only_fields = ['total_copies', 'available_copies']

    def get_available_copies_calc(self, obj):
        return obj.copies.filter(status='AVAILABLE').count()

class BookCopySerializer(serializers.ModelSerializer):
    """Serializer for physical copies"""
    book_title = serializers.CharField(source='book.title', read_only=True)
    
    class Meta:
        model = BookCopy
        fields = '__all__'

class LibraryMemberSerializer(serializers.ModelSerializer):
    """Serializer for Library Members"""
    name = serializers.SerializerMethodField()
    role = serializers.CharField(source='member_type', read_only=True)
    
    class Meta:
        model = LibraryMember
        fields = ['id', 'name', 'role', 'books_issued_count', 'total_fines_due', 'max_books_allowed']
        
    def get_name(self, obj):
        if obj.student: 
            return f"{obj.student.first_name} {obj.student.last_name}"
        if obj.staff:
            return f"{obj.staff.first_name} {obj.staff.last_name}"
        return "Unknown"

class BookIssueSerializer(serializers.ModelSerializer):
    """Serializer for issuing books"""
    book_title = serializers.CharField(source='copy.book.title', read_only=True)
    member_name = serializers.SerializerMethodField()
    
    class Meta:
        model = BookIssue
        fields = '__all__'
        read_only_fields = ['issued_date', 'fine_amount']
        
    def get_member_name(self, obj):
        return LibraryMemberSerializer(obj.member).data['name']

class DigitalResourceSerializer(serializers.ModelSerializer):
    """Serializer for LMS Resources"""
    class Meta:
        model = DigitalResource
        fields = '__all__'
