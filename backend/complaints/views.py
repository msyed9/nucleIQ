"""Complaints views."""

import django_filters
from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Complaint
from .permissions import (
    ComplaintPermission, is_full_access, taught_student_ids, child_student_ids,
    get_staff_profile,
)
from .serializers import (
    ComplaintSerializer, ComplaintListSerializer, ComplaintWriteSerializer,
    AssignComplaintSerializer, ResolveComplaintSerializer,
)
from . import notifications


class ComplaintFilter(django_filters.FilterSet):
    """Equality filters plus a created_at date range."""

    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='date__gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='date__lte')

    class Meta:
        model = Complaint
        fields = ['type', 'category', 'priority', 'status', 'student', 'teacher',
                  'assigned_to', 'created_by']


class ComplaintViewSet(viewsets.ModelViewSet):
    """
    CRUD + workflow for student complaints/issues/queries.

    Row visibility is role-based (see get_queryset); write access is enforced by
    ComplaintPermission. All queries are tenant-scoped via request.user.tenant.
    """

    permission_classes = [ComplaintPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ComplaintFilter
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status', 'updated_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return ComplaintListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return ComplaintWriteSerializer
        return ComplaintSerializer

    def _base_queryset(self):
        """Tenant-scoped, prefetched base queryset (no role filtering yet)."""
        tenant = getattr(self.request.user, 'tenant', None)
        return (
            Complaint.objects.filter(tenant=tenant, is_deleted=False)
            .select_related('student', 'teacher', 'created_by', 'assigned_to')
        )

    def _visible_queryset(self):
        """Apply role-based visibility to the tenant-scoped base queryset."""
        user = self.request.user
        qs = self._base_queryset()

        # Principal / supervisor / tenant admin: everything in the tenant.
        if is_full_access(user):
            return qs

        # Everyone sees what they created or are assigned to.
        visibility = Q(created_by=user) | Q(assigned_to=user)

        # Teacher: entries where they are the tagged teacher, or about students
        # they teach.
        staff = get_staff_profile(user)
        if staff is not None:
            visibility |= Q(teacher=staff)
        taught = taught_student_ids(user)
        if taught:
            visibility |= Q(student_id__in=taught)

        # Parent: entries about their own children.
        children = child_student_ids(user)
        if children:
            visibility |= Q(student_id__in=children)

        return qs.filter(visibility).distinct()

    def get_queryset(self):
        return self._visible_queryset()

    def perform_create(self, serializer):
        complaint = serializer.save(
            tenant=getattr(self.request.user, 'tenant', None),
            created_by=self.request.user,
        )
        notifications.notify_complaint_created(complaint)

    # ----- Extra actions -------------------------------------------------

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        """
        Assign the complaint to a user. Full-access roles only.

        POST /api/v1/complaints/complaints/{id}/assign/
        { "assigned_to": "<user_uuid>" }
        """
        complaint = self.get_object()

        if not is_full_access(request.user):
            return Response(
                {'detail': 'Only principals/supervisors can assign complaints.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = AssignComplaintSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        complaint.assigned_to_id = serializer.validated_data['assigned_to']
        if complaint.status == 'OPEN':
            complaint.status = 'IN_PROGRESS'
        complaint.save(update_fields=['assigned_to', 'status', 'updated_at'])

        notifications.notify_complaint_created(complaint)  # re-notify new assignee
        return Response(ComplaintSerializer(complaint).data)

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Mark the complaint resolved (or closed) with notes.

        POST /api/v1/complaints/complaints/{id}/resolve/
        { "resolution_notes": "...", "status": "RESOLVED" }
        """
        complaint = self.get_object()

        # Object-level write permission (full access / creator / assignee).
        self.check_object_permissions(request, complaint)

        if complaint.status in ('RESOLVED', 'CLOSED'):
            return Response(
                {'detail': 'Complaint is already resolved/closed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ResolveComplaintSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        complaint.status = serializer.validated_data['status']
        complaint.resolution_notes = serializer.validated_data.get('resolution_notes', '')
        complaint.resolved_at = timezone.now()
        complaint.save(update_fields=['status', 'resolution_notes', 'resolved_at', 'updated_at'])

        notifications.notify_complaint_resolved(complaint)
        return Response(ComplaintSerializer(complaint).data)

    @action(detail=False, methods=['get'])
    def my(self, request):
        """Complaints created by or assigned to the current user."""
        qs = self._base_queryset().filter(
            Q(created_by=request.user) | Q(assigned_to=request.user)
        ).distinct()
        qs = self.filter_queryset(qs)
        page = self.paginate_queryset(qs)
        serializer = ComplaintListSerializer(page if page is not None else qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='student/(?P<student_id>[^/.]+)')
    def by_student(self, request, student_id=None):
        """
        Complaints for a specific student, still subject to the caller's
        visibility rules (a parent only sees their own child; a teacher only a
        student they teach; etc.).
        """
        qs = self.filter_queryset(self.get_queryset().filter(student_id=student_id))
        page = self.paginate_queryset(qs)
        serializer = ComplaintListSerializer(page if page is not None else qs, many=True)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)
