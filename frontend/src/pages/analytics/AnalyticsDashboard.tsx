import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Loading from '../../components/common/Loading';
import './Analytics.css';

interface PlatformMetrics {
    total_tenants: number;
    active_tenants: number;
    total_students: number;
    total_revenue: number;
    mrr: number;
    churn_rate: number;
    growth_rate: number;
}

interface TenantMetric {
    tenant_name: string;
    student_count: number;
    staff_count: number;
    plan: string;
    health_score: number;
    last_login: string;
}

const AnalyticsDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
    const [tenants, setTenants] = useState<TenantMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'predictions'>('overview');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [metricsRes, tenantsRes] = await Promise.all([
                api.get('/analytics/platform/overview/'),
                api.get('/analytics/metrics/')
            ]);
            setMetrics(metricsRes.data);
            setTenants(tenantsRes.data.results || tenantsRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen text="Loading Analytics..." />;

    return (
        <div className="analytics-dashboard">
            <div className="page-header">
                <h1 className="page-title">📊 Platform Analytics</h1>
                <p className="page-subtitle">Business Intelligence & Insights</p>
            </div>

            <div className="analytics-tabs">
                <button
                    className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={`tab-button ${activeTab === 'tenants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tenants')}
                >
                    Tenant Health
                </button>
                <button
                    className={`tab-button ${activeTab === 'predictions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('predictions')}
                >
                    Predictions
                </button>
            </div>

            {activeTab === 'overview' && metrics && (
                <div className="metrics-grid">
                    <Card className="metric-card">
                        <div className="metric-icon">🏫</div>
                        <div className="metric-value">{metrics.total_tenants}</div>
                        <div className="metric-label">Total Schools</div>
                        <div className="metric-change positive">+{metrics.growth_rate}% growth</div>
                    </Card>

                    <Card className="metric-card">
                        <div className="metric-icon">✅</div>
                        <div className="metric-value">{metrics.active_tenants}</div>
                        <div className="metric-label">Active Tenants</div>
                        <div className="metric-sublabel">{((metrics.active_tenants / metrics.total_tenants) * 100).toFixed(1)}% active</div>
                    </Card>

                    <Card className="metric-card">
                        <div className="metric-icon">👨‍🎓</div>
                        <div className="metric-value">{metrics.total_students.toLocaleString()}</div>
                        <div className="metric-label">Total Students</div>
                    </Card>

                    <Card className="metric-card">
                        <div className="metric-icon">💰</div>
                        <div className="metric-value">₹{(metrics.total_revenue / 100000).toFixed(1)}L</div>
                        <div className="metric-label">Total Revenue</div>
                        <div className="metric-sublabel">MRR: ₹{(metrics.mrr / 1000).toFixed(0)}K</div>
                    </Card>

                    <Card className="metric-card alert">
                        <div className="metric-icon">📉</div>
                        <div className="metric-value">{metrics.churn_rate.toFixed(1)}%</div>
                        <div className="metric-label">Churn Rate</div>
                        <div className="metric-change negative">Needs attention</div>
                    </Card>
                </div>
            )}

            {activeTab === 'tenants' && (
                <Card>
                    <h2 className="section-title">Tenant Health Scores</h2>
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>School Name</th>
                                    <th>Plan</th>
                                    <th>Students</th>
                                    <th>Staff</th>
                                    <th>Health Score</th>
                                    <th>Last Login</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((tenant, idx) => (
                                    <tr key={idx}>
                                        <td className="font-semibold">{tenant.tenant_name}</td>
                                        <td><span className={`badge badge-${tenant.plan.toLowerCase()}`}>{tenant.plan}</span></td>
                                        <td>{tenant.student_count}</td>
                                        <td>{tenant.staff_count}</td>
                                        <td>
                                            <div className="health-score">
                                                <div className={`score-badge score-${tenant.health_score >= 80 ? 'good' : tenant.health_score >= 60 ? 'medium' : 'poor'}`}>
                                                    {tenant.health_score}%
                                                </div>
                                            </div>
                                        </td>
                                        <td className="text-sm text-gray-500">{new Date(tenant.last_login).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {activeTab === 'predictions' && (
                <div className="predictions-section">
                    <Card>
                        <h2 className="section-title">🔮 Churn Predictions</h2>
                        <p className="text-gray-600">AI-powered churn risk analysis coming soon...</p>
                    </Card>

                    <Card>
                        <h2 className="section-title">📈 Upsell Opportunities</h2>
                        <p className="text-gray-600">Intelligent upsell recommendations coming soon...</p>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;
