from rest_framework import viewsets, decorators, response, status
from .models import GatePass, GateLog
from rest_framework import serializers
from core.middleware import get_current_tenant
from django.utils import timezone

class GatePassSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    class Meta:
        model = GatePass
        fields = '__all__'

class GatePassViewSet(viewsets.ModelViewSet):
    queryset = GatePass.objects.all()
    serializer_class = GatePassSerializer
    def get_queryset(self): return GatePass.objects.filter(tenant=get_current_tenant())

    @decorators.action(detail=False, methods=['post'])
    def scan(self, request):
        """
        Guard scans a QR code (token)
        """
        token = request.data.get('token')
        action_type = request.data.get('action', 'OUT') # IN or OUT
        
        try:
            gate_pass = GatePass.objects.get(token=token, tenant=get_current_tenant())
        except GatePass.DoesNotExist:
            return response.Response({'error': 'Invalid Pass'}, status=status.HTTP_404_NOT_FOUND)
            
        # Validation
        now = timezone.now()
        if now < gate_pass.valid_from or now > gate_pass.valid_until:
            return response.Response({'error': 'Pass Expired or Not Yet Valid'}, status=status.HTTP_400_BAD_REQUEST)
        
        if gate_pass.status != 'APPROVED':
             return response.Response({'error': f'Pass is {gate_pass.status}'}, status=status.HTTP_400_BAD_REQUEST)

        # Log
        GateLog.objects.create(
            tenant=get_current_tenant(),
            gate_pass=gate_pass,
            action=action_type
            # guard=request.user.staff_profile
        )
        
        gate_pass.status = 'USED'
        gate_pass.save()
        
        # Trigger SMS here (Mock)
        
        return response.Response({'status': 'allowed', 'student': gate_pass.student.get_full_name() if gate_pass.student else gate_pass.visitor_name})
