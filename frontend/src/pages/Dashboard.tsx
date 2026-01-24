/**
 * Dashboard Page - Redesigned with NucleiQ Design System
 * Main dashboard with analytics and customizable widgets
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import {
    Users,
    GraduationCap,
    DollarSign,
    CheckCircle,
    RefreshCw,
    Settings,
    Plus,
    Calendar
} from 'lucide-react';
import { Button, Card, KPICard, Badge } from '@/design-system';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { WidgetLibrary } from '../components/dashboard/WidgetLibrary';

interface DashboardStats {
    total_students: number;
    total_staff: number;
    active_classes: number;
    pending_fees: number;
    today_attendance_rate: number;
    upcoming_exams: number;
    recent_admissions: number;
    storage_used_gb: number;
}

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    time: string;
    badge: 'success' | 'primary' | 'info' | 'warning';
}

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [layoutVersion, setLayoutVersion] = useState(0);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await api.get<DashboardStats>('/dashboard/analytics/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            // Mock data for demo
            setStats({
                total_students: 1234,
                total_staff: 87,
                active_classes: 45,
                pending_fees: 240000,
                today_attendance_rate: 95.2,
                upcoming_exams: 3,
                recent_admissions: 12,
                storage_used_gb: 2.4
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchDashboardStats();
        api.post('/dashboard/analytics/invalidate_cache/').catch(console.error);
    };

    const handleWidgetAdded = () => {
        setLayoutVersion((prev) => prev + 1);
    };

    const recentActivities: Activity[] = [
        {
            id: '1',
            type: 'payment',
            title: 'Fee payment received',
            description: 'Ravi Kumar paid ₹10,000 for Q4 fees',
            time: '2 hours ago',
            badge: 'success'
        },
        {
            id: '2',
            type: 'admission',
            title: 'New student admission',
            description: 'Priya Sharma admitted to Class 5A',
            time: '5 hours ago',
            badge: 'primary'
        },
        {
            id: '3',
            type: 'exam',
            title: 'Exam results published',
            description: 'Mid-term exam results for Class 10 are now available',
            time: '1 day ago',
            badge: 'info'
        },
        {
            id: '4',
            type: 'attendance',
            title: 'Low attendance alert',
            description: 'Class 8B attendance dropped to 78% today',
            time: '1 day ago',
            badge: 'warning'
        }
    ];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                flexDirection: 'column',
                gap: '1rem'
            }}>
                <div className="loading-spinner" style={{ fontSize: '2rem' }}>⏳</div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    {t('dashboard.loading', { defaultValue: 'Loading dashboard...' })}
                </p>
            </div>
        );
    }

    return (
        <div className="dashboard-container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 0.5rem 0',
                        fontFamily: 'var(--font-family-primary)'
                    }}>
                        {t('dashboard.title', { defaultValue: 'Dashboard' })}
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0,
                        fontFamily: 'var(--font-family-primary)'
                    }}>
                        {t('dashboard.subtitle', { defaultValue: "Welcome back! Here's what's happening today." })}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Button
                        variant="outline"
                        iconLeft={RefreshCw}
                        onClick={handleRefresh}
                        size="md"
                    >
                        {t('common.refresh', { defaultValue: 'Refresh' })}
                    </Button>

                    <Button
                        variant={editMode ? 'primary' : 'ghost'}
                        iconLeft={Settings}
                        onClick={() => setEditMode(!editMode)}
                        size="md"
                    >
                        {editMode ? t('dashboard.done_editing', { defaultValue: 'Done' }) : t('dashboard.customize', { defaultValue: 'Customize' })}
                    </Button>

                    {editMode && (
                        <Button
                            variant="primary"
                            iconLeft={Plus}
                            onClick={() => setShowWidgetLibrary(true)}
                            size="md"
                        >
                            {t('dashboard.add_widget', { defaultValue: 'Add Widget' })}
                        </Button>
                    )}
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
                        value={(stats.total_students || 0).toLocaleString()}
                        trend={{ value: 5, direction: 'up', label: 'vs last month' }}
                        colorScheme="blue"
                        onClick={() => navigate('/students')}
                    />

                    <KPICard
                        icon={GraduationCap}
                        label={t('dashboard.total_staff', { defaultValue: 'Total Staff' })}
                        value={(stats.total_staff || 0).toString()}
                        trend={{ value: 2, direction: 'up' }}
                        colorScheme="green"
                        onClick={() => navigate('/staff')}
                    />

                    <KPICard
                        icon={CheckCircle}
                        label={t('dashboard.today_attendance', { defaultValue: "Today's Attendance" })}
                        value={`${(stats.today_attendance_rate || 0).toFixed(1)}%`}
                        trend={{ value: 1.2, direction: 'down' }}
                        colorScheme="purple"
                        onClick={() => navigate('/attendance')}
                    />

                    <KPICard
                        icon={DollarSign}
                        label={t('dashboard.pending_fees', { defaultValue: 'Pending Fees' })}
                        value={`₹${((stats.pending_fees || 0) / 100000).toFixed(1)}L`}
                        trend={{ value: 15, direction: 'up' }}
                        colorScheme="orange"
                        onClick={() => navigate('/fees')}
                    />
                </div>
            )}

            {/* Quick Actions */}
            <Card
                header={
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)'
                    }}>
                        {t('dashboard.quick_actions', { defaultValue: 'Quick Actions' })}
                    </h2>
                }
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
                        size="lg"
                    >
                        {t('dashboard.add_student', { defaultValue: 'Add Student' })}
                    </Button>

                    <Button
                        variant="secondary"
                        iconLeft={CheckCircle}
                        onClick={() => navigate('/attendance')}
                        fullWidth
                        size="lg"
                    >
                        {t('dashboard.mark_attendance', { defaultValue: 'Mark Attendance' })}
                    </Button>

                    <Button
                        variant="outline"
                        iconLeft={DollarSign}
                        onClick={() => navigate('/fees/collect')}
                        fullWidth
                        size="lg"
                    >
                        {t('dashboard.collect_fees', { defaultValue: 'Collect Fees' })}
                    </Button>

                    <Button
                        variant="outline"
                        iconLeft={Calendar}
                        onClick={() => navigate('/timetable/builder')}
                        fullWidth
                        size="lg"
                    >
                        {t('dashboard.timetable', { defaultValue: 'Timetable' })}
                    </Button>
                </div>
            </Card>

            {/* Recent Activity */}
            <Card
                header={
                    <h2 style={{
                        margin: 0,
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--color-text-primary)'
                    }}>
                        {t('dashboard.recent_activity', { defaultValue: 'Recent Activity' })}
                    </h2>
                }
                padding="lg"
                style={{ marginBottom: '2rem' }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {recentActivities.map((activity) => (
                        <div
                            key={activity.id}
                            style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '1rem',
                                padding: '1rem',
                                background: 'var(--color-bg-secondary)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'background var(--transition-fast)',
                                cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                        >
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
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        {activity.title}
                                    </h4>
                                    <Badge variant={activity.badge} size="sm">
                                        {activity.type}
                                    </Badge>
                                </div>
                                <p style={{
                                    margin: '0 0 0.25rem 0',
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)'
                                }}>
                                    {activity.description}
                                </p>
                                <p style={{
                                    margin: 0,
                                    fontSize: '0.75rem',
                                    color: 'var(--color-text-tertiary)'
                                }}>
                                    {activity.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Dashboard Grid (Existing Widgets) */}
            {editMode && <DashboardGrid editMode={editMode} refreshKey={layoutVersion} />}

            {/* Widget Library Modal */}
            {showWidgetLibrary && (
                <WidgetLibrary
                    onClose={() => setShowWidgetLibrary(false)}
                    onWidgetAdded={handleWidgetAdded}
                />
            )}
        </div>
    );
};

export default Dashboard;
