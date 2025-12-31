from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LiveClass
from .video_services import VideoService
from core.middleware import get_current_tenant

class LiveClassSerializer(serializers.ModelSerializer):
    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    class Meta:
        model = LiveClass
        fields = '__all__'

class LiveClassViewSet(viewsets.ModelViewSet):
    queryset = LiveClass.objects.all()
    serializer_class = LiveClassSerializer
    def get_queryset(self): return LiveClass.objects.filter(tenant=get_current_tenant())

    @action(detail=True, methods=['post'])
    def join(self, request, pk=None):
        """
        Record attendance when student joins.
        Return the link.
        """
        live_class = self.get_object()
        # Log attendance here (e.g., LiveClassAttendance model)
        
        return Response({
            'url': live_class.meeting_link,
            'provider': live_class.provider
        })

    def perform_create(self, serializer):
        # Auto-generate link on creation
        data = serializer.validated_data
        if data.get('provider') == 'ZOOM':
            details = VideoService.create_zoom_meeting(data['title'], data['start_time'], data.get('duration_minutes', 45))
            serializer.save(
                meeting_link=details['join_url'],
                meeting_id=details['meeting_id'],
                passcode=details.get('password', '')
            )
        elif data.get('provider') == 'JITSI':
            import uuid
            room_name = f"Class_{uuid.uuid4().hex[:8]}"
            link = VideoService.create_jitsi_link(room_name)
            serializer.save(meeting_link=link)
        else:
            serializer.save()
