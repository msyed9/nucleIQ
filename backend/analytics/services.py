"""
Analytics Services for Platform Intelligence
"""

from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta, date
from decimal import Decimal
from .models import (
    TenantMetric,
    UsageLog,
    TenantHealthAlert,
    ChurnPrediction,
    UpsellOpportunity
)


class PlatformAnalyticsService:
    """
    Main service for platform-wide analytics.
    """
    
    def get_platform_overview(self):
        """
        Get high-level platform metrics.
        """
        from tenants.models import Tenant
        from billing.models import Subscription
        
        today = date.today()
        latest_metrics = TenantMetric.objects.filter(date=today)
        
        return {
            'total_tenants': Tenant.objects.count(),
            'active_tenants': Tenant.objects.filter(is_active=True).count(),
            'total_users': latest_metrics.aggregate(Sum('total_users'))['total_users__sum'] or 0,
            'total_revenue_mrr': self._calculate_mrr(),
            'avg_health_score': latest_metrics.aggregate(Avg('health_score'))['health_score__avg'] or 0,
            'churn_risk_count': ChurnPrediction.objects.filter(
                prediction_date=today,
                risk_level__in=['HIGH', 'MEDIUM']
            ).count(),
            'active_alerts': TenantHealthAlert.objects.filter(is_resolved=False).count(),
            'upsell_opportunities': UpsellOpportunity.objects.filter(
                is_contacted=False
            ).count(),
        }
    
    def get_tenant_health_distribution(self):
        """Get distribution of tenant health scores."""
        today = date.today()
        metrics = TenantMetric.objects.filter(date=today)
        
        return {
            'excellent': metrics.filter(health_score__gte=80).count(),
            'good': metrics.filter(health_score__gte=60, health_score__lt=80).count(),
            'fair': metrics.filter(health_score__gte=40, health_score__lt=60).count(),
            'poor': metrics.filter(health_score__lt=40).count(),
        }
    
    def get_module_popularity(self):
        """Get module usage statistics across all tenants."""
        from tenants.models import Tenant
        
        total_tenants = Tenant.objects.filter(is_active=True).count()
        if total_tenants == 0:
            return []
        
        module_usage = {}
        today = date.today()
        
        metrics = TenantMetric.objects.filter(date=today)
        for metric in metrics:
            for module in metric.modules_used:
                module_usage[module] = module_usage.get(module, 0) + 1
        
        result = []
        for module, count in module_usage.items():
            result.append({
                'module': module,
                'usage_count': count,
                'percentage': round((count / total_tenants) * 100, 2)
            })
        
        return sorted(result, key=lambda x: x['usage_count'], reverse=True)
    
    def _calculate_mrr(self):
        """Calculate Monthly Recurring Revenue."""
        from billing.models import Subscription
        
        active_subs = Subscription.objects.filter(status='active')
        mrr = sum(sub.plan.price_monthly for sub in active_subs)
        return Decimal(str(mrr))


class TenantHealthService:
    """Service for calculating and monitoring tenant health."""
    
    def __init__(self, tenant):
        self.tenant = tenant
    
    def calculate_health_score(self, for_date=None):
        """Calculate health score for a specific date."""
        if not for_date:
            for_date = date.today()
        
        metric, created = TenantMetric.objects.get_or_create(
            tenant=self.tenant,
            date=for_date
        )
        
        self._update_metrics(metric)
        metric.calculate_health_score()
        metric.save()
        
        self._check_health_alerts(metric)
        
        return metric.health_score
    
    def _update_metrics(self, metric):
        """Update metric values."""
        from users.models import User
        
        metric.total_users = User.objects.filter(tenant=self.tenant).count()
        metric.active_users = self._get_active_users_count(metric.date)
        metric.dau = metric.active_users
        
        metric.modules_used = self._get_modules_used(metric.date)
        metric.module_count = len(metric.modules_used)
        
        metric.error_count = self._get_error_count(metric.date)
        total_requests = self._get_total_requests(metric.date)
        if total_requests > 0:
            metric.error_rate = (metric.error_count / total_requests) * 100

        metric.api_calls = total_requests
        metric.avg_response_time_ms = self._get_avg_response_time(metric.date)
        
        metric.save()
    
    def _get_active_users_count(self, for_date):
        """Get count of users who logged in on this date."""
        return UsageLog.objects.filter(
            tenant=self.tenant,
            action_type='LOGIN',
            created_at__date=for_date
        ).values('user').distinct().count()
    
    def _get_modules_used(self, for_date):
        """Get list of modules used on this date."""
        modules = UsageLog.objects.filter(
            tenant=self.tenant,
            action_type='MODULE_ACCESS',
            created_at__date=for_date
        ).values_list('module', flat=True).distinct()
        
        return list(modules)
    
    def _get_error_count(self, for_date):
        """Get error count for date."""
        return UsageLog.objects.filter(
            tenant=self.tenant,
            is_error=True,
            created_at__date=for_date
        ).count()
    
    def _get_total_requests(self, for_date):
        """Get total API requests for date."""
        return UsageLog.objects.filter(
            tenant=self.tenant,
            action_type='API_CALL',
            created_at__date=for_date
        ).count()

    def _get_avg_response_time(self, for_date):
        """Get average API response time for date."""
        return UsageLog.objects.filter(
            tenant=self.tenant,
            action_type='API_CALL',
            created_at__date=for_date,
            response_time_ms__isnull=False
        ).aggregate(avg=Avg('response_time_ms'))['avg'] or 0
    
    def _check_health_alerts(self, metric):
        """Check if alerts should be created."""
        if metric.health_score < 40:
            TenantHealthAlert.objects.get_or_create(
                tenant=self.tenant,
                alert_type='LOW_HEALTH',
                is_resolved=False,
                defaults={
                    'severity': 'HIGH',
                    'title': f'Low Health Score: {metric.health_score}%',
                    'description': f'Tenant health score dropped to {metric.health_score}%',
                    'current_value': metric.health_score,
                    'threshold_value': Decimal('40'),
                }
            )
        
        if metric.error_rate > 10:
            TenantHealthAlert.objects.get_or_create(
                tenant=self.tenant,
                alert_type='HIGH_ERRORS',
                is_resolved=False,
                defaults={
                    'severity': 'MEDIUM',
                    'title': f'High Error Rate: {metric.error_rate}%',
                    'description': f'Error rate is {metric.error_rate}%',
                    'current_value': metric.error_rate,
                    'threshold_value': Decimal('10'),
                }
            )


class ChurnPredictionService:
    """Service for predicting tenant churn."""
    
    def predict_churn(self, tenant):
        """Predict churn probability for a tenant."""
        thirty_days_ago = date.today() - timedelta(days=30)
        metrics = TenantMetric.objects.filter(
            tenant=tenant,
            date__gte=thirty_days_ago
        ).order_by('date')
        
        if metrics.count() < 7:
            return None
        
        health_trend = self._calculate_trend([m.health_score for m in metrics])
        usage_trend = self._calculate_trend([m.dau for m in metrics])
        
        churn_prob = Decimal('0')
        
        if health_trend < 0:
            churn_prob += abs(health_trend) * Decimal('2')
        
        if usage_trend < 0:
            churn_prob += abs(usage_trend) * Decimal('1.5')
        
        latest_health = metrics.last().health_score
        if latest_health < 50:
            churn_prob += (Decimal('50') - latest_health)
        
        churn_prob = min(churn_prob, Decimal('100'))
        
        if churn_prob >= 70:
            risk_level = 'HIGH'
        elif churn_prob >= 40:
            risk_level = 'MEDIUM'
        else:
            risk_level = 'LOW'
        
        prediction, created = ChurnPrediction.objects.update_or_create(
            tenant=tenant,
            prediction_date=date.today(),
            defaults={
                'churn_probability': churn_prob,
                'risk_level': risk_level,
                'factors': {
                    'health_trend': float(health_trend),
                    'usage_trend': float(usage_trend),
                    'current_health': float(latest_health),
                },
                'recommendations': self._get_recommendations(risk_level)
            }
        )
        
        return prediction
    
    def _calculate_trend(self, values):
        """Calculate trend (positive or negative)."""
        if len(values) < 2:
            return Decimal('0')
        
        n = len(values)
        x_mean = sum(range(n)) / n
        y_mean = sum(float(v) for v in values) / n
        
        numerator = sum((i - x_mean) * (float(values[i]) - y_mean) for i in range(n))
        denominator = sum((i - x_mean) ** 2 for i in range(n))
        
        if denominator == 0:
            return Decimal('0')
        
        slope = numerator / denominator
        return Decimal(str(slope))
    
    def _get_recommendations(self, risk_level):
        """Get recommendations based on risk level."""
        if risk_level == 'HIGH':
            return [
                'Schedule immediate check-in call',
                'Offer personalized training session',
                'Review and address support tickets',
                'Consider offering discount or incentive'
            ]
        elif risk_level == 'MEDIUM':
            return [
                'Send engagement survey',
                'Share success stories and best practices',
                'Offer feature demonstration',
                'Check for technical issues'
            ]
        else:
            return [
                'Continue monitoring',
                'Share product updates',
                'Encourage feature adoption'
            ]
