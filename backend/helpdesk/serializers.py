"""
Helpdesk & Ticketing Serializers
"""

from rest_framework import serializers
from .models import HelpdeskTicket, TicketComment


class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer for TicketComment."""
    
    user_name = serializers.CharField(source='commented_by.get_full_name', read_only=True)
    user_email = serializers.EmailField(source='commented_by.email', read_only=True)
    
    class Meta:
        model = TicketComment
        fields = [
            'id', 'ticket', 'commented_by', 'user_name', 'user_email',
            'content', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class HelpdeskTicketSerializer(serializers.ModelSerializer):
    """Serializer for HelpdeskTicket."""
    
    raised_by_name = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    raised_by_email = serializers.EmailField(source='raised_by.email', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    comments = TicketCommentSerializer(many=True, read_only=True)
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = HelpdeskTicket
        fields = [
            'id', 'raised_by', 'raised_by_name', 'raised_by_email',
            'category', 'subject', 'description', 'assigned_to',
            'assigned_to_name', 'status', 'priority', 'created_at',
            'resolved_at', 'comments', 'comment_count', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'resolved_at', 'updated_at']
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
    
    def get_comment_count(self, obj):
        return obj.comments.count()


class HelpdeskTicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing tickets."""
    
    raised_by_name = serializers.CharField(source='raised_by.get_full_name', read_only=True)
    assigned_to_name = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = HelpdeskTicket
        fields = [
            'id', 'raised_by_name', 'category', 'subject', 'assigned_to_name',
            'status', 'priority', 'created_at', 'comment_count'
        ]
    
    def get_assigned_to_name(self, obj):
        return obj.assigned_to.get_full_name() if obj.assigned_to else None
    
    def get_comment_count(self, obj):
        return obj.comments.count()


class CreateTicketSerializer(serializers.Serializer):
    """Serializer for creating a ticket."""
    
    category = serializers.ChoiceField(choices=HelpdeskTicket.CATEGORY_CHOICES)
    subject = serializers.CharField(max_length=200)
    description = serializers.CharField()
    priority = serializers.ChoiceField(
        choices=HelpdeskTicket.PRIORITY_CHOICES,
        default='MEDIUM'
    )


class UpdateTicketStatusSerializer(serializers.Serializer):
    """Serializer for updating ticket status."""
    
    status = serializers.ChoiceField(choices=HelpdeskTicket.STATUS_CHOICES)
    resolution_notes = serializers.CharField(required=False, allow_blank=True)


class AssignTicketSerializer(serializers.Serializer):
    """Serializer for assigning ticket to staff."""
    
    assigned_to = serializers.UUIDField()


class AddCommentSerializer(serializers.Serializer):
    """Serializer for adding comment to ticket."""
    
    content = serializers.CharField()
