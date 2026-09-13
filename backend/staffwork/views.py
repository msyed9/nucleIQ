"""
Views for the staffwork module.

Every viewset is tenant-scoped in get_queryset (filter by request.user.tenant).
Row visibility and write access follow the tiers in permissions.py.
"""

import django_filters
from django.db.models import Q, Count
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response

from complaints.permissions import is_full_access

from .models import (
    LessonPlan, AdminTaskTemplate, AdminTaskInstance, DailyStatusUpdate, Report,
)
from .permissions import (
    LessonPlanPermission, AdminTaskPermission, DailyUpdatePermission, ReportPermission,
    IsStaffworkUser,
)
from .serializers import (
    LessonPlanSerializer, LessonPlanListSerializer, LessonPlanWriteSerializer,
    AdminTaskTemplateSerializer, AdminTaskInstanceSerializer, AdminTaskCreateSerializer,
    CompleteAdminTaskSerializer, DailyStatusUpdateSerializer,
    DailyStatusUpdateListSerializer, DailyStatusUpdateWriteSerializer,
    ReviewDailyUpdateSerializer, ReportSerializer,
)
from .services import TaskGenerationService, ConsolidationService
from . import notifications


def _tenant(request):
    return getattr(request.user, 'tenant', None)


# ---------------------------------------------------------------------------
# Lesson plans
# ---------------------------------------------------------------------------
class LessonPlanFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = LessonPlan
        fields = ['status', 'section', 'subject', 'teacher', 'date']


class LessonPlanViewSet(viewsets.ModelViewSet):
    """CRUD for lesson plans. Teachers manage their own; full-access see all."""

    permission_classes = [LessonPlanPermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = LessonPlanFilter
    search_fields = ['topic', 'objectives']
    ordering_fields = ['date', 'created_at', 'status']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return LessonPlanListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return LessonPlanWriteSerializer
        return LessonPlanSerializer

    def get_queryset(self):
        user = self.request.user
        qs = (
            LessonPlan.objects.filter(tenant=_tenant(self.request), is_deleted=False)
            .select_related('teacher', 'section', 'subject')
            .prefetch_related('attachments')
        )
        if is_full_access(user):
            return qs
        # Teachers/others: their own plans, or plans explicitly shared with them.
        return qs.filter(Q(teacher=user) | Q(shared_with=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(tenant=_tenant(self.request), teacher=self.request.user)

    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        """
        Share a lesson plan with additional users.

        POST /api/v1/staffwork/lesson-plans/{id}/share/
        { "user_ids": ["<uuid>", ...] }
        """
        plan = self.get_object()
        self.check_object_permissions(request, plan)  # owner / full access

        user_ids = request.data.get('user_ids', [])
        if not isinstance(user_ids, list) or not user_ids:
            return Response({'detail': 'user_ids (list) is required.'},
                            status=status.HTTP_400_BAD_REQUEST)

        from users.models import User
        users = User.objects.filter(pk__in=user_ids, tenant=_tenant(request))
        plan.shared_with.add(*users)
        return Response(LessonPlanSerializer(plan).data)


# ---------------------------------------------------------------------------
# Admin task templates (full-access management)
# ---------------------------------------------------------------------------
class AdminTaskTemplateViewSet(viewsets.ModelViewSet):
    """Manage recurring task templates. Full-access users only."""

    serializer_class = AdminTaskTemplateSerializer
    permission_classes = [IsStaffworkUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['frequency', 'is_active', 'role_scope']
    ordering = ['title']

    def get_queryset(self):
        return AdminTaskTemplate.objects.filter(
            tenant=_tenant(self.request), is_deleted=False
        ).select_related('role_scope')

    def _require_full_access(self, request):
        if not is_full_access(request.user):
            self.permission_denied(request, message='Only principals/supervisors manage templates.')

    def create(self, request, *args, **kwargs):
        self._require_full_access(request)
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        self._require_full_access(request)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_full_access(request)
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(tenant=_tenant(self.request))


# ---------------------------------------------------------------------------
# Admin task instances
# ---------------------------------------------------------------------------
class AdminTaskInstanceFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = AdminTaskInstance
        fields = ['status', 'assigned_to', 'date', 'template']


class AdminTaskInstanceViewSet(viewsets.ModelViewSet):
    """
    Admin task instances. Assignees manage their own; full-access see the whole
    tenant and may create ad-hoc tasks and generate from templates.
    """

    permission_classes = [AdminTaskPermission]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = AdminTaskInstanceFilter
    ordering_fields = ['date', 'due_time', 'status']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'create':
            return AdminTaskCreateSerializer
        return AdminTaskInstanceSerializer

    def _base_queryset(self):
        return AdminTaskInstance.objects.filter(
            tenant=_tenant(self.request), is_deleted=False
        ).select_related('assigned_to', 'template')

    def get_queryset(self):
        user = self.request.user
        qs = self._base_queryset()
        if is_full_access(user):
            return qs
        return qs.filter(assigned_to=user)

    def create(self, request, *args, **kwargs):
        # Ad-hoc task creation is a full-access action.
        if not is_full_access(request.user):
            return Response({'detail': 'Only principals/supervisors create tasks.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        instance = serializer.save(tenant=_tenant(self.request))
        notifications.notify_task_assigned(instance.assigned_to, instance.title)

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Generate today's (or a given date's) task instances from active templates.
        Full-access only.

        POST /api/v1/staffwork/admin-tasks/generate/   { "date": "2026-09-13" }
        """
        if not is_full_access(request.user):
            return Response({'detail': 'Only principals/supervisors may generate tasks.'},
                            status=status.HTTP_403_FORBIDDEN)
        target = request.data.get('date')
        target_date = None
        if target:
            from django.utils.dateparse import parse_date
            target_date = parse_date(target)
        count = TaskGenerationService.generate(_tenant(request), target_date)
        return Response({'created': count})

    @action(detail=False, methods=['get'])
    def my(self, request):
        """
        The current user's own tasks.

        GET /api/v1/staffwork/admin-tasks/my/?date_from=&date_to=
        """
        qs = self.filter_queryset(self._base_queryset().filter(assigned_to=request.user))
        page = self.paginate_queryset(qs)
        ser = AdminTaskInstanceSerializer(page if page is not None else qs, many=True)
        if page is not None:
            return self.get_paginated_response(ser.data)
        return Response(ser.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """
        Mark a task complete / in-progress / skipped.

        POST /api/v1/staffwork/admin-tasks/{id}/complete/
        { "status": "COMPLETED", "update_notes": "..." }
        """
        task = self.get_object()
        self.check_object_permissions(request, task)  # assignee or full access

        ser = CompleteAdminTaskSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        new_status = ser.validated_data['status']
        notes = ser.validated_data.get('update_notes', '')

        if new_status == 'COMPLETED':
            task.mark_completed(notes=notes)
        else:
            task.status = new_status
            if notes:
                task.update_notes = notes
            task.save(update_fields=['status', 'update_notes', 'updated_at'])
        return Response(AdminTaskInstanceSerializer(task).data)

    @action(detail=False, methods=['get'], url_path='team-status')
    def team_status(self, request):
        """
        Completion board for supervisors/principals: per-status counts for a
        date (default today). Full-access only.

        GET /api/v1/staffwork/admin-tasks/team-status/?date=2026-09-13
        """
        if not is_full_access(request.user):
            return Response({'detail': 'Only principals/supervisors may view team status.'},
                            status=status.HTTP_403_FORBIDDEN)
        target = request.query_params.get('date')
        qs = self._base_queryset()
        if target:
            qs = qs.filter(date=target)
        else:
            qs = qs.filter(date=timezone.localdate())

        counts = dict(qs.values_list('status').annotate(n=Count('id')))
        rows = AdminTaskInstanceSerializer(qs, many=True).data
        return Response({'counts': counts, 'tasks': rows})


# ---------------------------------------------------------------------------
# Daily status updates
# ---------------------------------------------------------------------------
class DailyStatusUpdateFilter(django_filters.FilterSet):
    date_from = django_filters.DateFilter(field_name='date', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='date', lookup_expr='lte')

    class Meta:
        model = DailyStatusUpdate
        fields = ['role', 'status', 'user', 'date', 'related_class']


class DailyStatusUpdateViewSet(viewsets.ModelViewSet):
    """
    Daily status updates with writable nested per-student remarks. Users manage
    their own; full-access users see all, review, and get the consolidated view.
    """

    permission_classes = [DailyUpdatePermission]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = DailyStatusUpdateFilter
    search_fields = ['summary', 'details']
    ordering_fields = ['date', 'created_at', 'status']
    ordering = ['-date']

    def get_serializer_class(self):
        if self.action == 'list':
            return DailyStatusUpdateListSerializer
        if self.action in ('create', 'update', 'partial_update'):
            return DailyStatusUpdateWriteSerializer
        return DailyStatusUpdateSerializer

    def _base_queryset(self):
        return (
            DailyStatusUpdate.objects.filter(tenant=_tenant(self.request), is_deleted=False)
            .select_related('user', 'reviewed_by', 'related_class')
            .prefetch_related('student_remarks__student')
        )

    def get_queryset(self):
        user = self.request.user
        qs = self._base_queryset()
        if is_full_access(user):
            return qs
        return qs.filter(user=user)

    # tenant/user set inside the write serializer's create().

    @action(detail=False, methods=['get'])
    def consolidated(self, request):
        """
        Consolidated view grouped date -> role -> user with student remarks.
        Full-access only. Honours the standard filters (date range, role, user).

        GET /api/v1/staffwork/daily-updates/consolidated/?date_from=&date_to=&role=
        """
        if not is_full_access(request.user):
            return Response({'detail': 'Only principals/supervisors may view the consolidated dashboard.'},
                            status=status.HTTP_403_FORBIDDEN)
        qs = self.filter_queryset(self._base_queryset())
        return Response(ConsolidationService.build(qs))

    @action(detail=True, methods=['post'])
    def review(self, request, pk=None):
        """
        Review a submitted daily update. Full-access only.

        POST /api/v1/staffwork/daily-updates/{id}/review/
        { "review_notes": "..." }
        """
        if not is_full_access(request.user):
            return Response({'detail': 'Only principals/supervisors may review updates.'},
                            status=status.HTTP_403_FORBIDDEN)
        update = self.get_object()
        ser = ReviewDailyUpdateSerializer(data=request.data)
        ser.is_valid(raise_exception=True)

        update.status = 'REVIEWED'
        update.reviewed_by = request.user
        update.reviewed_at = timezone.now()
        update.review_notes = ser.validated_data.get('review_notes', '')
        update.save(update_fields=['status', 'reviewed_by', 'reviewed_at',
                                   'review_notes', 'updated_at'])

        try:
            notifications.notify_update_reviewed(update.user, request.user.get_full_name())
        except Exception:
            pass
        return Response(DailyStatusUpdateSerializer(update).data)


# ---------------------------------------------------------------------------
# Reports
# ---------------------------------------------------------------------------
class ReportViewSet(viewsets.ModelViewSet):
    """Shareable report files. Generators manage their own; full-access see all."""

    serializer_class = ReportSerializer
    permission_classes = [ReportPermission]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['title', 'description']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = Report.objects.filter(tenant=_tenant(self.request), is_deleted=False) \
            .select_related('generated_by')
        if is_full_access(user):
            return qs
        return qs.filter(Q(generated_by=user) | Q(shared_with=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(tenant=_tenant(self.request), generated_by=self.request.user)
