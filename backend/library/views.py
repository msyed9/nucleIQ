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
        queryset = BookCopy.objects.filter(tenant=get_current_tenant())
        book_id = self.request.query_params.get('book', None)
        if book_id:
            queryset = queryset.filter(book_id=book_id)
        return queryset

    def perform_create(self, serializer):
        copy = serializer.save(tenant=get_current_tenant())
        # Update book counts
        book = copy.book
        book.total_copies = book.copies.count()
        book.available_copies = book.copies.filter(status='AVAILABLE').count()
        book.save()

    def perform_update(self, serializer):
        copy = serializer.save()
        # Update book counts
        book = copy.book
        book.available_copies = book.copies.filter(status='AVAILABLE').count()
        book.save()

    def perform_destroy(self, instance):
        book = instance.book
        instance.delete()
        # Update book counts
        book.total_copies = book.copies.count()
        book.available_copies = book.copies.filter(status='AVAILABLE').count()
        book.save()

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        """Create multiple copies at once"""
        copies_data = request.data.get('copies', [])
        tenant = get_current_tenant()
        created_copies = []
        
        for copy_data in copies_data:
            copy_data['tenant'] = tenant.id
            serializer = self.get_serializer(data=copy_data)
            if serializer.is_valid():
                copy = serializer.save(tenant=tenant)
                created_copies.append(copy)
        
        # Update book counts
        if created_copies:
            book = created_copies[0].book
            book.total_copies = book.copies.count()
            book.available_copies = book.copies.filter(status='AVAILABLE').count()
            book.save()
        
        return Response({
            'message': f'Successfully created {len(created_copies)} copies',
            'copies': BookCopySerializer(created_copies, many=True).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def generate_label(self, request, pk=None):
        """Generate barcode label data for printing"""
        copy = self.get_object()
        return Response({
            'barcode': copy.barcode,
            'book_title': copy.book.title,
            'author': copy.book.author,
            'isbn': copy.book.isbn
        })

class LibraryMemberViewSet(viewsets.ModelViewSet):
    queryset = LibraryMember.objects.all()
    serializer_class = LibraryMemberSerializer
    
    def get_queryset(self):
        queryset = LibraryMember.objects.filter(tenant=get_current_tenant())
        
        # Filter by member type if provided
        member_type = self.request.query_params.get('member_type', None)
        if member_type:
            queryset = queryset.filter(member_type=member_type)
        
        return queryset.select_related('student', 'staff')

    @action(detail=False, methods=['post'])
    def bulk_enroll(self, request):
        """Bulk enroll all students from a grade/class as library members"""
        grade_id = request.data.get('grade_id')
        max_books = request.data.get('max_books_allowed', 5)
        tenant = get_current_tenant()
        
        if not grade_id:
            return Response({'error': 'grade_id is required'}, status=400)
        
        try:
            from students.models import Student
            students = Student.objects.filter(
                tenant=tenant,
                grade_level_id=grade_id
            )
            
            enrolled_count = 0
            for student in students:
                # Check if already enrolled
                if not LibraryMember.objects.filter(
                    tenant=tenant,
                    student=student
                ).exists():
                    LibraryMember.objects.create(
                        tenant=tenant,
                        member_type='STUDENT',
                        student=student,
                        max_books_allowed=max_books
                    )
                    enrolled_count += 1
            
            return Response({
                'message': f'Successfully enrolled {enrolled_count} students',
                'count': enrolled_count
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a library member"""
        member = self.get_object()
        # Add a status field to the model or handle suspension logic
        # For now, we can set max_books_allowed to 0
        member.max_books_allowed = 0
        member.save()
        return Response({'message': 'Member suspended successfully'})

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a suspended member"""
        member = self.get_object()
        max_books = request.data.get('max_books_allowed', 5)
        member.max_books_allowed = max_books
        member.save()
        return Response({'message': 'Member activated successfully'})

    @action(detail=True, methods=['get'])
    def issue_history(self, request, pk=None):
        """Get issue history for a member"""
        member = self.get_object()
        issues = BookIssue.objects.filter(member=member).order_by('-issued_date')
        from .serializers import BookIssueSerializer
        return Response(BookIssueSerializer(issues, many=True).data)

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
