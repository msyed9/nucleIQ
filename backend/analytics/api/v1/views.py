"""Analytics API v1 views."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from core.permissions import IsTenantUser, IsTenantAdmin
from analytics.models import AlertRule, AlertEvent
from analytics.serializers import AlertRuleSerializer, AlertEventSerializer
from analytics.services import AlertingService


class AlertRuleViewSet(viewsets.ModelViewSet):
	"""CRUD for tenant analytics alert rules."""

	serializer_class = AlertRuleSerializer

	def get_permissions(self):
		"""Allow read operations for all tenant users, write operations for admins only."""
		if self.action in ['list', 'retrieve']:
			return [IsAuthenticated(), IsTenantUser()]
		return [IsAuthenticated(), IsTenantAdmin()]

	def get_queryset(self):
		return AlertRule.objects.filter(tenant=self.request.user.tenant)

	def perform_create(self, serializer):
		serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

	@action(detail=False, methods=['post'])
	def evaluate(self, request):
		"""Evaluate alert rules for current tenant."""
		service = AlertingService()
		results = service.evaluate_rules(request.user.tenant)
		return Response({'results': results}, status=status.HTTP_200_OK)


class AlertEventViewSet(viewsets.ReadOnlyModelViewSet):
	"""Read-only view for alert events."""

	serializer_class = AlertEventSerializer
	permission_classes = [IsAuthenticated, IsTenantUser]

	def get_queryset(self):
		queryset = AlertEvent.objects.filter(tenant=self.request.user.tenant)

		status_param = self.request.query_params.get('status')
		if status_param:
			queryset = queryset.filter(status=status_param)

		rule_id = self.request.query_params.get('rule_id')
		if rule_id:
			queryset = queryset.filter(rule_id=rule_id)

		return queryset.order_by('-triggered_at')

	@action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsTenantAdmin])
	def resolve(self, request, pk=None):
		"""Resolve an alert event."""
		event = self.get_object()
		event.status = 'RESOLVED'
		event.resolved_at = timezone.now()
		event.save(update_fields=['status', 'resolved_at', 'updated_at'])
		serializer = self.get_serializer(event)
		return Response(serializer.data)
