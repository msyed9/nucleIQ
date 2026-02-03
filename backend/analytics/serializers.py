"""
Serializers for Analytics API
"""

from rest_framework import serializers
from .models import (
    TenantMetric,
    UsageLog,
    TenantHealthAlert,
    ChurnPrediction,
    UpsellOpportunity,
    AlertRule,
    AlertEvent
)


class TenantMetricSerializer(serializers.ModelSerializer):
    """Serializer for tenant metrics."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantMetric
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class UsageLogSerializer(serializers.ModelSerializer):
    """Serializer for usage logs."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = UsageLog
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class TenantHealthAlertSerializer(serializers.ModelSerializer):
    """Serializer for health alerts."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = TenantHealthAlert
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ChurnPredictionSerializer(serializers.ModelSerializer):
    """Serializer for churn predictions."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = ChurnPrediction
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class UpsellOpportunitySerializer(serializers.ModelSerializer):
    """Serializer for upsell opportunities."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    
    class Meta:
        model = UpsellOpportunity
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AlertRuleSerializer(serializers.ModelSerializer):
    """Serializer for analytics alert rules."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = AlertRule
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant', 'created_by']


class AlertEventSerializer(serializers.ModelSerializer):
    """Serializer for analytics alert events."""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    rule_name = serializers.CharField(source='rule.name', read_only=True)

    class Meta:
        model = AlertEvent
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlatformOverviewSerializer(serializers.Serializer):
    """Serializer for platform overview data."""
    total_tenants = serializers.IntegerField()
    active_tenants = serializers.IntegerField()
    total_users = serializers.IntegerField()
    total_revenue_mrr = serializers.DecimalField(max_digits=10, decimal_places=2)
    avg_health_score = serializers.DecimalField(max_digits=5, decimal_places=2)
    churn_risk_count = serializers.IntegerField()
    active_alerts = serializers.IntegerField()
    upsell_opportunities = serializers.IntegerField()


class HealthDistributionSerializer(serializers.Serializer):
    """Serializer for health score distribution."""
    excellent = serializers.IntegerField()
    good = serializers.IntegerField()
    fair = serializers.IntegerField()
    poor = serializers.IntegerField()


class ModulePopularitySerializer(serializers.Serializer):
    """Serializer for module popularity data."""
    module = serializers.CharField()
    usage_count = serializers.IntegerField()
    percentage = serializers.DecimalField(max_digits=5, decimal_places=2)
