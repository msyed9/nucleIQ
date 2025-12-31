"""
Library Views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Book, BookCopy, BookIssue, LibraryMember, DigitalResource
from .serializers import (
    BookSerializer, BookCopySerializer, BookIssueSerializer, 
    LibraryMemberSerializer, DigitalResourceSerializer
)
from core.middleware import get_current_tenant

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    
    def get_queryset(self):
        return Book.objects.filter(tenant=get_current_tenant())

class BookCopyViewSet(viewsets.ModelViewSet):
    queryset = BookCopy.objects.all()
    serializer_class = BookCopySerializer

    def get_queryset(self):
        return BookCopy.objects.filter(tenant=get_current_tenant())

class LibraryMemberViewSet(viewsets.ModelViewSet):
    queryset = LibraryMember.objects.all()
    serializer_class = LibraryMemberSerializer
    
    def get_queryset(self):
        return LibraryMember.objects.filter(tenant=get_current_tenant())

class BookIssueViewSet(viewsets.ModelViewSet):
    queryset = BookIssue.objects.all()
    serializer_class = BookIssueSerializer

    def get_queryset(self):
        return BookIssue.objects.filter(tenant=get_current_tenant())

    @action(detail=False, methods=['post'])
    def issue(self, request):
        """
        Issue a book to a member
        """
        barcode = request.data.get('barcode')
        member_id = request.data.get('member_id')
        tenant = get_current_tenant()
        
        try:
            copy = BookCopy.objects.get(barcode=barcode, tenant=tenant)
            member = LibraryMember.objects.get(id=member_id, tenant=tenant)
        except (BookCopy.DoesNotExist, LibraryMember.DoesNotExist):
            return Response({'error': 'Invalid barcode or member ID'}, status=400)
            
        if copy.status != 'AVAILABLE':
            return Response({'error': 'Book is not available'}, status=400)
            
        if member.books_issued_count >= member.max_books_allowed:
            return Response({'error': 'Member has reached max book limit'}, status=400)
            
        # Create Issue Record
        issue = BookIssue.objects.create(
            tenant=tenant,
            copy=copy,
            member=member,
            due_date=timezone.now() + timezone.timedelta(days=14)
        )
        
        # Update Copy Status
        copy.status = 'ISSUED'
        copy.save()
        
        # Update Member Stats
        member.books_issued_count += 1
        member.save()
        
        return Response(BookIssueSerializer(issue).data)

    @action(detail=True, methods=['post'])
    def return_book(self, request, pk=None):
        """
        Return a book
        """
        issue = self.get_object()
        if issue.status == 'RETURNED':
            return Response({'error': 'Book already returned'}, status=400)
            
        issue.returned_date = timezone.now()
        issue.status = 'RETURNED'
        
        # Calculate Fine (Simple Logic: 5 per day overdue)
        overdue_days = (issue.returned_date - issue.due_date).days
        if overdue_days > 0:
            issue.fine_amount = overdue_days * 5
        
        issue.save()
        
        # Update Copy
        issue.copy.status = 'AVAILABLE'
        issue.copy.save()
        
        # Update Member
        issue.member.books_issued_count -= 1
        issue.member.total_fines_due += issue.fine_amount
        issue.member.save()
        
        return Response(BookIssueSerializer(issue).data)

class DigitalResourceViewSet(viewsets.ModelViewSet):
    queryset = DigitalResource.objects.all()
    serializer_class = DigitalResourceSerializer

    def get_queryset(self):
        return DigitalResource.objects.filter(tenant=get_current_tenant())
        
    @action(detail=True, methods=['post'])
    def download(self, request, pk=None):
        resource = self.get_object()
        resource.download_count += 1
        resource.save()
        return Response({'status': 'tracked'})
