import React, { useEffect, useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatNumber, formatCurrency } from '../../utils/helpers';
import api from '../../services/api';
import './Dashboard.css';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
    total_students: number;
    total_staff: number;
    pending_fees: number;
    today_attendance: number;
}

interface PendingEnrollmentData {
    pending_count: number;
    academic_year?: {
        id: string;
        name: string;
    };
}

const Dashboard: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingEnrollments, setPendingEnrollments] = useState<PendingEnrollmentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState('');

    useEffect(() => {
        fetchDashboardStats();
        fetchPendingEnrollments();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await api.get('/dashboard/analytics/stats/');
            setStats(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load dashboard');
            // Mock data for development
            setStats({
                total_students: 1234,
                total_staff: 56,
                pending_fees: 125000,
                today_attendance: 95,
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingEnrollments = async () => {
        try {
            const response = await api.get('/students/enrollments/pending/');
            setPendingEnrollments({
                pending_count: response.data.pending_count || 0,
                academic_year: response.data.academic_year
            });
        } catch (err) {
            console.error('Failed to fetch pending enrollments', err);
            setPendingEnrollments({ pending_count: 0 });
        }
    };

    if (loading) {
        return <Loading fullScreen text={t('loading.dashboard')} />;
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1 className="dashboard-title">{t('dashboard.title')}</h1>
                <p className="dashboard-subtitle">{t('dashboard.subtitle')}</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <Card className="stat-card stat-students">
                    <div className="stat-icon">👨‍🎓</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{formatNumber(stats?.total_students || 0)}</h3>
                        <p className="stat-label">{t('dashboard.stat.students')}</p>
                    </div>
                </Card>

                <Card className="stat-card stat-staff">
                    <div className="stat-icon">👨‍🏫</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{formatNumber(stats?.total_staff || 0)}</h3>
                        <p className="stat-label">{t('dashboard.stat.staff')}</p>
                    </div>
                </Card>

                <Card className="stat-card stat-fees">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{formatCurrency(stats?.pending_fees || 0)}</h3>
                        <p className="stat-label">{t('dashboard.stat.pending_fees')}</p>
                    </div>
                </Card>

                <Card className="stat-card stat-attendance">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats?.today_attendance || 0}%</h3>
                        <p className="stat-label">{t('dashboard.stat.attendance_today')}</p>
                    </div>
                </Card>
            </div>

            {/* Pending Enrollments Alert */}
            {pendingEnrollments && pendingEnrollments.pending_count > 0 && (
                <div
                    className="pending-enrollments-card"
                    style={{
                        backgroundColor: '#fff3cd',
                        borderLeft: '4px solid #ffc107',
                        marginBottom: '1.5rem',
                        padding: '1rem 1.5rem',
                        borderRadius: '8px'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ margin: 0, color: '#856404', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⚠️ Pending Enrollments
                            </h3>
                            <p style={{ margin: '0.5rem 0 0', color: '#856404' }}>
                                <strong>{pendingEnrollments.pending_count}</strong> student(s) are not enrolled for {pendingEnrollments.academic_year?.name || 'the current academic year'}.
                            </p>
                        </div>
                        <Button
                            variant="primary"
                            onClick={() => navigate('/students/enrollments')}
                        >
                            Enroll Now
                        </Button>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <Card title={t('dashboard.quick_actions')} className="quick-actions-card">
                <div className="quick-actions">
                    <Button variant="primary" onClick={() => window.location.href = '/students'}>
                        {t('actions.add_student')}
                    </Button>
                    <Button variant="secondary" onClick={() => window.location.href = '/staff'}>
                        {t('actions.add_staff')}
                    </Button>
                    <Button variant="success" onClick={() => window.location.href = '/attendance'}>
                        {t('actions.mark_attendance')}
                    </Button>
                    <Button variant="primary" onClick={() => window.location.href = '/fees/collect'}>
                        {t('actions.collect_fees')}
                    </Button>
                </div>
            </Card>

            {/* Recent Activities */}
            <Card title={t('dashboard.recent_activities')} subtitle={t('dashboard.recent_subtitle')}>
                <div className="activities-list">
                    <div className="activity-item">
                        <div className="activity-icon">👨‍🎓</div>
                        <div className="activity-content">
                            <p className="activity-text">{t('activity.new_admission', { name: 'John Doe' })}</p>
                            <span className="activity-time">2 hours ago</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">💰</div>
                        <div className="activity-content">
                            <p className="activity-text">{t('activity.fee_payment', { amount: '₹5,000' })}</p>
                            <span className="activity-time">3 hours ago</span>
                        </div>
                    </div>
                    <div className="activity-item">
                        <div className="activity-icon">📅</div>
                        <div className="activity-content">
                            <p className="activity-text">{t('activity.attendance_marked', { class: 'Class 10-A' })}</p>
                            <span className="activity-time">5 hours ago</span>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default Dashboard;

