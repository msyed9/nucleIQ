from rest_framework import viewsets, decorators, response
from .models import HelpdeskTicket, TicketComment
from rest_framework import serializers
from core.middleware import get_current_tenant
from django.utils import timezone

class TicketCommentSerializer(serializers.ModelSerializer):
    user = serializers.CharField(source='commented_by.get_full_name', read_only=True)
    class Meta:
        model = TicketComment
        fields = '__all__'

class HelpdeskTicketSerializer(serializers.ModelSerializer):
    raiser = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    assignee = serializers.CharField(source='assigned_to.get_full_name', read_only=True)
    comments = TicketCommentSerializer(many=True, read_only=True)
    class Meta:
        model = HelpdeskTicket
        fields = '__all__'

class HelpdeskTicketViewSet(viewsets.ModelViewSet):
    queryset = HelpdeskTicket.objects.all()
    serializer_class = HelpdeskTicketSerializer
    def get_queryset(self): return HelpdeskTicket.objects.filter(tenant=get_current_tenant())

    @decorators.action(detail=True, methods=['post'])
    def comment(self, request, pk=None):
        ticket = self.get_object()
        TicketComment.objects.create(
            tenant=get_current_tenant(),
            ticket=ticket,
            commented_by=request.user,
            content=request.data.get('content')
        )
        return response.Response({'status': 'commented'})

    @decorators.action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        ticket = self.get_object()
        ticket.status = 'RESOLVED'
        ticket.resolved_at = timezone.now()
        ticket.save()
        return response.Response({'status': 'resolved'})
