/**
 * Example Dashboard using NucleIQ Design System
 * Demonstrates usage of KPI cards, buttons, and cards
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Users,
    GraduationCap,
    DollarSign,
    CheckCircle,
    RefreshCw,
    Plus,
    Settings
} from 'lucide-react';
import { Button, Card, KPICard, Badge } from '@/design-system';
import api from '@/services/api';

interface DashboardStats {
    total_students: number;
    total_staff: number;
    today_attendance_rate: number;
    pending_fees: number;
    student_trend?: number;
    staff_trend?: number;
    attendance_trend?: number;
    fees_trend?: number;
}

export const DashboardExample: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            const response = await api.get<DashboardStats>('/api/dashboard/analytics/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchDashboardStats();
        api.post('/api/dashboard/analytics/invalidate_cache/').catch(console.error);
    };

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px'
            }}>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: '#1A237E',
                        margin: '0 0 0.5rem 0'
                    }}>
                        {t('dashboard.title', { defaultValue: 'Dashboard' })}
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: '#546E7A',
                        margin: 0
                    }}>
                        {t('dashboard.subtitle', { defaultValue: "Welcome back! Here's what's happening today." })}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                    <Button
                        variant="outline"
                        iconLeft={RefreshCw}
                        onClick={handleRefresh}
                    >
                        {t('common.refresh', { defaultValue: 'Refresh' })}
                    </Button>
                    <Button
                        variant="ghost"
                        iconOnly={Settings}
                        onClick={() => navigate('/settings')}
                        aria-label="Settings"
                    />
                </div>
            </div>

            {/* KPI Cards */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                }}>
                    <KPICard
                        icon={Users}
                        label={t('dashboard.total_students', { defaultValue: 'Total Students' })}
                        value={stats.total_students.toLocaleString()}
                        trend={stats.student_trend ? {
                            value: stats.student_trend,
                            direction: stats.student_trend > 0 ? 'up' : 'down',
                            label: 'vs last month'
                        } : undefined}
                        colorScheme="blue"
                        onClick={() => navigate('/students')}
                    />

                    <KPICard
                        icon={GraduationCap}
                        label={t('dashboard.total_staff', { defaultValue: 'Total Staff' })}
                        value={stats.total_staff}
                        trend={stats.staff_trend ? {
                            value: stats.staff_trend,
                            direction: stats.staff_trend > 0 ? 'up' : 'down'
                        } : undefined}
                        colorScheme="green"
                        onClick={() => navigate('/staff')}
                    />

                    <KPICard
                        icon={CheckCircle}
                        label={t('dashboard.today_attendance', { defaultValue: "Today's Attendance" })}
                        value={`${stats.today_attendance_rate.toFixed(1)}%`}
                        trend={stats.attendance_trend ? {
                            value: Math.abs(stats.attendance_trend),
                            direction: stats.attendance_trend > 0 ? 'up' : 'down'
                        } : undefined}
                        colorScheme="purple"
                        onClick={() => navigate('/attendance')}
                    />

                    <KPICard
                        icon={DollarSign}
                        label={t('dashboard.pending_fees', { defaultValue: 'Pending Fees' })}
                        value={`₹${(stats.pending_fees / 100000).toFixed(1)}L`}
                        trend={stats.fees_trend ? {
                            value: stats.fees_trend,
                            direction: stats.fees_trend > 0 ? 'up' : 'down'
                        } : undefined}
                        colorScheme="orange"
                        onClick={() => navigate('/fees')}
                    />
                </div>
            )}

            {/* Quick Actions */}
            <Card
                header={<h2 style={{ margin: 0 }}>Quick Actions</h2>}
                padding="lg"
                style={{ marginBottom: '2rem' }}
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    <Button
                        variant="primary"
                        iconLeft={Plus}
                        onClick={() => navigate('/students/add')}
                        fullWidth
                    >
                        Add Student
                    </Button>
                    <Button
                        variant="secondary"
                        iconLeft={CheckCircle}
                        onClick={() => navigate('/attendance')}
                        fullWidth
                    >
                        Mark Attendance
                    </Button>
                    <Button
                        variant="outline"
                        iconLeft={DollarSign}
                        onClick={() => navigate('/fees/collect')}
                        fullWidth
                    >
                        Collect Fees
                    </Button>
                </div>
            </Card>

            {/* Recent Activity */}
            <Card
                header={<h2 style={{ margin: 0 }}>Recent Activity</h2>}
                padding="lg"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <ActivityItem
                        title="Fee payment received"
                        description="Ravi Kumar paid ₹10,000 for Q4 fees"
                        time="2 hours ago"
                        badge={<Badge variant="success">Payment</Badge>}
                    />
                    <ActivityItem
                        title="New student admission"
                        description="Priya Sharma admitted to Class 5A"
                        time="5 hours ago"
                        badge={<Badge variant="primary">Admission</Badge>}
                    />
                    <ActivityItem
                        title="Exam results published"
                        description="Mid-term exam results for Class 10 are now available"
                        time="1 day ago"
                        badge={<Badge variant="info">Exam</Badge>}
                    />
                </div>
            </Card>
        </div>
    );
};

// Activity Item Component
interface ActivityItemProps {
    title: string;
    description: string;
    time: string;
    badge: React.ReactNode;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ title, description, time, badge }) => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '1rem',
        padding: '1rem',
        background: '#FAFAFA',
        borderRadius: '0.75rem',
        transition: 'background 200ms ease'
    }}>
        <div style={{ flex: 1 }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.25rem'
            }}>
                <h4 style={{
                    margin: 0,
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: '#1A237E'
                }}>
                    {title}
                </h4>
                {badge}
            </div>
            <p style={{
                margin: '0 0 0.25rem 0',
                fontSize: '0.875rem',
                color: '#546E7A'
            }}>
                {description}
            </p>
            <p style={{
                margin: 0,
                fontSize: '0.75rem',
                color: '#90A4AE'
            }}>
                {time}
            </p>
        </div>
    </div>
);

export default DashboardExample;
