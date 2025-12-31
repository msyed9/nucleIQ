from rest_framework import serializers, viewsets
from .models import SalahRecord
from core.middleware import get_current_tenant

class SalahRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalahRecord
        fields = '__all__'

class SalahRecordViewSet(viewsets.ModelViewSet):
    queryset = SalahRecord.objects.all()
    serializer_class = SalahRecordSerializer
    def get_queryset(self): return SalahRecord.objects.filter(tenant=get_current_tenant())
