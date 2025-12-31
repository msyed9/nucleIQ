from rest_framework import viewsets, decorators, response
from .models import CertificateTemplate, CertificateRequest, GeneratedCertificate
from .generator import generate_certificate
from rest_framework import serializers
from core.middleware import get_current_tenant
from django.utils import timezone

class CertificateTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CertificateTemplate
        fields = '__all__'

class CertificateRequestSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    template_name = serializers.CharField(source='template.name', read_only=True)
    class Meta:
        model = CertificateRequest
        fields = '__all__'

class CertificateRequestViewSet(viewsets.ModelViewSet):
    queryset = CertificateRequest.objects.all()
    serializer_class = CertificateRequestSerializer
    def get_queryset(self): return CertificateRequest.objects.filter(tenant=get_current_tenant())

    @decorators.action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        cert_request = self.get_object()
        cert_request.status = 'APPROVED'
        # cert_request.approved_by = request.user.staff_profile # Assuming Staff user
        cert_request.approved_at = timezone.now()
        cert_request.save()
        
        # Auto-generate
        generate_certificate(cert_request)
        cert_request.status = 'GENERATED'
        cert_request.save()
        
        return response.Response({'status': 'generated'})

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    def get_queryset(self): return CertificateTemplate.objects.filter(tenant=get_current_tenant())
