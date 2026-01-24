"""
Analytics Dashboard Views for Platform Admin
"""

from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

from tenants.models import Tenant
from .models import TenantMetric, UsageLog, TenantHealthAlert, ChurnPrediction
from .services import TenantHealthService
from users.models import User


@staff_member_required
def platform_analytics_dashboard(request):
    """
    Comprehensive analytics dashboard for platform administrators.
    Shows tenant usage, API metrics, health scores, and trends.
    """
    
    # Date ranges
    today = timezone.now().date()
    last_7_days = today - timedelta(days=7)
    last_30_days = today - timedelta(days=30)
    
    # Ensure today's metrics exist for active tenants (on-demand fallback)
    for tenant in Tenant.objects.filter(is_active=True):
        if not TenantMetric.objects.filter(tenant=tenant, date=today).exists():
            try:
                TenantHealthService(tenant).calculate_health_score(today)
            except Exception:
                # Non-fatal; continue
                pass

    # ============================================
    # OVERVIEW METRICS
    # ============================================
    total_tenants = Tenant.objects.count()
    active_tenants = Tenant.objects.filter(is_active=True).count()
    trial_tenants = Tenant.objects.filter(plan='TRIAL').count()
    paid_tenants = Tenant.objects.filter(plan__in=['BASIC', 'STANDARD', 'PREMIUM', 'ENTERPRISE']).count()
    
    # Recent signups
    new_tenants_7d = Tenant.objects.filter(created_at__gte=timezone.now() - timedelta(days=7)).count()
    new_tenants_30d = Tenant.objects.filter(created_at__gte=timezone.now() - timedelta(days=30)).count()
    
    # Total users across all tenants
    total_users = User.objects.exclude(is_platform_admin=True).count()
    active_users_today = User.objects.filter(
        last_login__gte=timezone.now() - timedelta(days=1)
    ).exclude(is_platform_admin=True).count()
    
    # ============================================
    # API USAGE METRICS
    # ============================================
    api_usage_today = UsageLog.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=1),
        action_type='API_CALL'
    ).count()
    
    api_usage_7d = UsageLog.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=7),
        action_type='API_CALL'
    ).count()
    
    # API errors
    api_errors_today = UsageLog.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=1),
        is_error=True
    ).count()
    
    error_rate = (api_errors_today / api_usage_today * 100) if api_usage_today > 0 else 0
    
    # Average response time
    avg_response_time = UsageLog.objects.filter(
        created_at__gte=timezone.now() - timedelta(days=1),
        response_time_ms__isnull=False
    ).aggregate(avg_time=Avg('response_time_ms'))['avg_time'] or 0
    
    # ============================================
    # TENANT HEALTH METRICS
    # ============================================
    latest_metrics = TenantMetric.objects.filter(
        date__gte=last_7_days
    ).values('tenant').annotate(
        avg_health=Avg('health_score'),
        total_api_calls=Sum('api_calls'),
        total_errors=Sum('error_count')
    )
    
    avg_health_score = TenantMetric.objects.filter(
        date=today
    ).aggregate(avg=Avg('health_score'))['avg'] or 0
    
    # Unhealthy tenants (health score < 50)
    unhealthy_tenants = TenantMetric.objects.filter(
        date=today,
        health_score__lt=50
    ).count()
    
    # ============================================
    # CHURN RISK
    # ============================================
    high_risk_tenants = ChurnPrediction.objects.filter(
        prediction_date=today,
        risk_level='HIGH'
    ).count()
    
    # ============================================
    # ALERTS
    # ============================================
    unresolved_alerts = TenantHealthAlert.objects.filter(
        is_resolved=False
    ).count()
    
    critical_alerts = TenantHealthAlert.objects.filter(
        is_resolved=False,
        severity='CRITICAL'
    ).count()
    
    # ============================================
    # CHART DATA - API Usage by Day (Last 7 days)
    # ============================================
    api_usage_by_day = []
    for i in range(7):
        date = today - timedelta(days=6-i)
        count = UsageLog.objects.filter(
            created_at__date=date,
            action_type='API_CALL'
        ).count()
        api_usage_by_day.append({
            'date': date.strftime('%m/%d'),
            'count': count
        })
    
    # ============================================
    # CHART DATA - Tenant Growth (Last 30 days)
    # ============================================
    tenant_growth = []
    for i in range(30):
        date = today - timedelta(days=29-i)
        count = Tenant.objects.filter(created_at__date__lte=date).count()
        tenant_growth.append({
            'date': date.strftime('%m/%d'),
            'count': count
        })
    
    # ============================================
    # CHART DATA - API Usage by Tenant (Top 10)
    # ============================================
    top_api_users = UsageLog.objects.filter(
        created_at__gte=last_7_days,
        action_type='API_CALL'
    ).values('tenant__name').annotate(
        api_calls=Count('id')
    ).order_by('-api_calls')[:10]
    
    # ============================================
    # CHART DATA - Health Score Distribution
    # ============================================
    health_distribution = [
        {
            'range': 'Excellent (80-100)',
            'count': TenantMetric.objects.filter(date=today, health_score__gte=80).count()
        },
        {
            'range': 'Good (60-79)',
            'count': TenantMetric.objects.filter(date=today, health_score__gte=60, health_score__lt=80).count()
        },
        {
            'range': 'Fair (40-59)',
            'count': TenantMetric.objects.filter(date=today, health_score__gte=40, health_score__lt=60).count()
        },
        {
            'range': 'Poor (<40)',
            'count': TenantMetric.objects.filter(date=today, health_score__lt=40).count()
        }
    ]
    
    # ============================================
    # CHART DATA - Module Usage
    # ============================================
    module_usage = UsageLog.objects.filter(
        created_at__gte=last_7_days,
        action_type='API_CALL'
    ).exclude(module='').values('module').annotate(
        access_count=Count('id')
    ).order_by('-access_count')[:10]
    
    # ============================================
    # RECENT ACTIVITY
    # ============================================
    recent_errors = UsageLog.objects.filter(
        is_error=True
    ).select_related('tenant', 'user').order_by('-created_at')[:10]
    
    recent_alerts = TenantHealthAlert.objects.filter(
        is_resolved=False
    ).select_related('tenant').order_by('-created_at')[:10]
    
    # ============================================
    # TOP TENANTS BY USAGE
    # ============================================
    top_tenants = TenantMetric.objects.filter(
        date=today
    ).select_related('tenant').order_by('-api_calls')[:10]
    
    context = {
        # Overview
        'total_tenants': total_tenants,
        'active_tenants': active_tenants,
        'trial_tenants': trial_tenants,
        'paid_tenants': paid_tenants,
        'new_tenants_7d': new_tenants_7d,
        'new_tenants_30d': new_tenants_30d,
        'total_users': total_users,
        'active_users_today': active_users_today,
        
        # API Metrics
        'api_usage_today': api_usage_today,
        'api_usage_7d': api_usage_7d,
        'api_errors_today': api_errors_today,
        'error_rate': round(error_rate, 2),
        'avg_response_time': round(avg_response_time, 2),
        
        # Health Metrics
        'avg_health_score': round(avg_health_score, 2),
        'unhealthy_tenants': unhealthy_tenants,
        'high_risk_tenants': high_risk_tenants,
        
        # Alerts
        'unresolved_alerts': unresolved_alerts,
        'critical_alerts': critical_alerts,
        
        # Chart Data
        'api_usage_by_day': api_usage_by_day,
        'tenant_growth': tenant_growth,
        'top_api_users': list(top_api_users),
        'health_distribution': health_distribution,
        'module_usage': list(module_usage),
        
        # Recent Activity
        'recent_errors': recent_errors,
        'recent_alerts': recent_alerts,
        'top_tenants': top_tenants,
    }
    
    return render(request, 'admin/analytics/platform_dashboard.html', context)
