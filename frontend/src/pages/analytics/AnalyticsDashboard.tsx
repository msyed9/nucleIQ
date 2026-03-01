/**
 * Enhanced Analytics Dashboard
 * Comprehensive analytics and reporting with charts and metrics
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import ExportButton from '@/components/common/ExportButton';
import { ExportColumn } from '@/utils/exportUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Calendar,
    BookOpen,
    Filter,
    RefreshCw,
    ChevronDown,
    BarChart2,
    PieChart,
    Activity,
    Target,
    Award,
    Clock
} from 'lucide-react';
import { Button, Card, Badge, Select } from '@/design-system';
import './AnalyticsDashboard.css';

interface MetricCard {
    label: string;
    value: string | number;
    change: number;
    changeLabel: string;
    icon: React.ReactNode;
    color: string;
}

interface ChartData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        color?: string;
    }[];
}

interface AnalyticsData {
    overview: {
        total_students: number;
        total_staff: number;
        attendance_rate: number;
        fee_collection_rate: number;
        student_change: number;
        attendance_change: number;
        collection_change: number;
    };
    enrollment_trend: ChartData;
    fee_trend: ChartData;
    attendance_trend: ChartData;
    grade_distribution: ChartData;
    subject_performance: {
        subject: string;
        avg_score: number;
        pass_rate: number;
    }[];
    class_performance: {
        class_name: string;
        avg_attendance: number;
        avg_score: number;
        fee_collection: number;
    }[];
    recent_metrics: {
        date: string;
        students: number;
        attendance: number;
        collection: number;
    }[];
}

type Period = 'week' | 'month' | 'quarter' | 'year';

const AnalyticsDashboard: React.FC = () => {
    const { t } = useTranslation();
    const { isRole, user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState<Period>('month');
    const [refreshing, setRefreshing] = useState(false);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [alertRules, setAlertRules] = useState<any[]>([]);
    const [alertEvents, setAlertEvents] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [alertForm, setAlertForm] = useState({
        name: '',
        metric: 'ATTENDANCE_RATE',
        comparator: 'LT',
        threshold_value: '80',
        window_days: '30',
        severity: 'MEDIUM',
        scope: 'ALL',
        grade_level: '',
        section: '',
        gender: ''
    });
    const [alertsRefreshing, setAlertsRefreshing] = useState(false);
    const [autoRefreshAlerts, setAutoRefreshAlerts] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, [period, startDate, endDate]);

    useEffect(() => {
        fetchAlertData();
        fetchAlertFilters();
    }, []);

    useEffect(() => {
        if (!autoRefreshAlerts) return undefined;
        const interval = setInterval(() => {
            fetchAlertData();
        }, 60000);
        return () => clearInterval(interval);
    }, [autoRefreshAlerts]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const params: Record<string, string> = { period };
            if (startDate) params.start_date = startDate;
            if (endDate) params.end_date = endDate;

            const response = await api.get('/dashboard/analytics/stats/', { params });

            const mock = getMockData();
            const payload = response.data || {};
            const overview = payload.overview || {
                total_students: payload.total_students ?? mock.overview.total_students,
                total_staff: payload.total_staff ?? mock.overview.total_staff,
                attendance_rate: payload.attendance_rate ?? payload.today_attendance_rate ?? mock.overview.attendance_rate,
                fee_collection_rate: payload.fee_collection_rate ?? mock.overview.fee_collection_rate,
                student_change: payload.student_change ?? mock.overview.student_change,
                attendance_change: payload.attendance_change ?? mock.overview.attendance_change,
                collection_change: payload.collection_change ?? mock.overview.collection_change
            };

            setData({
                ...mock,
                ...payload,
                overview
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            // Use mock data for demo
            setData(getMockData());
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await api.post('/dashboard/analytics/invalidate_cache/');
            await fetchAnalytics();
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchAlertFilters = async () => {
        try {
            const [gradesRes, sectionsRes] = await Promise.all([
                api.get('/tenants/grades/'),
                api.get('/tenants/sections/')
            ]);
            setGrades(gradesRes.data.results || gradesRes.data);
            setSections(sectionsRes.data.results || sectionsRes.data);
        } catch (error) {
            console.error('Failed to load alert filters:', error);
        }
    };

    const fetchAlertData = async () => {
        try {
            setAlertsRefreshing(true);

            // Fetch alert rules and events independently so one failure doesn't break both
            let rules: any[] = [];
            let events: any[] = [];

            try {
                const rulesResponse = await api.get('/analytics/alert-rules/');
                rules = rulesResponse.data.results || rulesResponse.data;
            } catch (err: any) {
                if (err.response?.status !== 403) {
                    console.error('Failed to load alert rules:', err);
                }
                // Non-admin users may not have access; degrade gracefully
            }

            try {
                const eventsResponse = await api.get('/analytics/alert-events/', { params: { status: 'OPEN' } });
                events = eventsResponse.data.results || eventsResponse.data;
            } catch (err: any) {
                console.error('Failed to load alert events:', err);
            }

            setAlertRules(rules);
            setAlertEvents(events);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        } finally {
            setAlertsRefreshing(false);
        }
    };

    const handleCreateRule = async () => {
        try {
            const payload = {
                ...alertForm,
                threshold_value: Number(alertForm.threshold_value),
                window_days: Number(alertForm.window_days)
            };
            await api.post('/analytics/alert-rules/', payload);
            setAlertForm({
                name: '',
                metric: 'ATTENDANCE_RATE',
                comparator: 'LT',
                threshold_value: '80',
                window_days: '30',
                severity: 'MEDIUM',
                scope: 'ALL',
                grade_level: '',
                section: '',
                gender: ''
            });
            fetchAlertData();
        } catch (error) {
            console.error('Failed to create alert rule:', error);
        }
    };

    const handleEvaluateRules = async () => {
        try {
            await api.post('/analytics/alert-rules/evaluate/');
            fetchAlertData();
        } catch (error) {
            console.error('Failed to evaluate alert rules:', error);
        }
    };

    const handleResolveEvent = async (eventId: string | number) => {
        try {
            await api.post(`/analytics/alert-events/${eventId}/resolve/`);
            fetchAlertData();
        } catch (error) {
            console.error('Failed to resolve alert event:', error);
        }
    };

    const getMockData = (): AnalyticsData => ({
        overview: {
            total_students: 1234,
            total_staff: 87,
            attendance_rate: 92.5,
            fee_collection_rate: 78.3,
            student_change: 5.2,
            attendance_change: 2.1,
            collection_change: -3.4
        },
        enrollment_trend: {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Students',
                data: [1150, 1180, 1195, 1200, 1210, 1220, 1228, 1230, 1234]
            }]
        },
        fee_trend: {
            labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [{
                label: 'Collection',
                data: [850000, 920000, 780000, 1100000, 950000, 880000, 920000, 870000, 950000]
            }]
        },
        attendance_trend: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            datasets: [{
                label: 'Attendance %',
                data: [94, 92, 93, 91, 88]
            }]
        },
        grade_distribution: {
            labels: ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'],
            datasets: [{
                label: 'Students',
                data: [120, 280, 320, 280, 150, 60, 24]
            }]
        },
        subject_performance: [
            { subject: 'Mathematics', avg_score: 72.5, pass_rate: 85 },
            { subject: 'Science', avg_score: 78.3, pass_rate: 89 },
            { subject: 'English', avg_score: 81.2, pass_rate: 92 },
            { subject: 'History', avg_score: 76.8, pass_rate: 88 },
            { subject: 'Geography', avg_score: 74.1, pass_rate: 86 },
        ],
        class_performance: [
            { class_name: 'Class 10A', avg_attendance: 95, avg_score: 82, fee_collection: 98 },
            { class_name: 'Class 10B', avg_attendance: 92, avg_score: 78, fee_collection: 95 },
            { class_name: 'Class 9A', avg_attendance: 94, avg_score: 80, fee_collection: 92 },
            { class_name: 'Class 9B', avg_attendance: 91, avg_score: 75, fee_collection: 88 },
        ],
        recent_metrics: []
    });

    if (loading) {
        return (
            <div className="analytics-dashboard loading">
                <div className="loading-container">
                    <BarChart2 size={48} className="loading-icon" />
                    <p>Loading analytics...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const canViewFinance = Boolean(user?.is_platform_admin) || isRole('accountant') || isRole('finance') || isRole('admin');

    const exportSummaryData = [
        { metric: 'Total Students', value: data.overview.total_students, change: data.overview.student_change },
        { metric: 'Total Staff', value: data.overview.total_staff, change: 0 },
        { metric: 'Attendance Rate', value: data.overview.attendance_rate, change: data.overview.attendance_change },
        ...(canViewFinance ? [{
            metric: 'Fee Collection Rate',
            value: data.overview.fee_collection_rate,
            change: data.overview.collection_change
        }] : [])
    ];

    const exportColumns: ExportColumn[] = [
        { key: 'metric', label: 'Metric' },
        { key: 'value', label: 'Value' },
        { key: 'change', label: 'Change (%)' }
    ];

    const metrics: MetricCard[] = [
        {
            label: 'Total Students',
            value: data.overview.total_students.toLocaleString(),
            change: data.overview.student_change,
            changeLabel: 'vs last period',
            icon: <Users size={24} />,
            color: '#3b82f6'
        },
        {
            label: 'Attendance Rate',
            value: `${data.overview.attendance_rate}%`,
            change: data.overview.attendance_change,
            changeLabel: 'vs last period',
            icon: <Calendar size={24} />,
            color: '#22c55e'
        },
        ...(canViewFinance ? [
            {
                label: 'Fee Collection',
                value: `${data.overview.fee_collection_rate}%`,
                change: data.overview.collection_change,
                changeLabel: 'vs last period',
                icon: <DollarSign size={24} />,
                color: '#f59e0b'
            }
        ] : []),
        {
            label: 'Total Staff',
            value: data.overview.total_staff,
            change: 0,
            changeLabel: 'no change',
            icon: <Users size={24} />,
            color: '#8b5cf6'
        }
    ];

    return (
        <div className="analytics-dashboard">
            {/* Header */}
            <div className="page-header">
                <div className="header-content">
                    <h1>
                        <BarChart2 size={28} />
                        {t('analytics.title', { defaultValue: 'Analytics & Reports' })}
                    </h1>
                    <p>{t('analytics.subtitle', { defaultValue: 'Comprehensive insights and performance metrics' })}</p>
                </div>
                <div className="header-actions">
                    <Select
                        value={period}
                        onChange={(value: string) => setPeriod(value as Period)}
                        options={[
                            { value: 'week', label: 'This Week' },
                            { value: 'month', label: 'This Month' },
                            { value: 'quarter', label: 'This Quarter' },
                            { value: 'year', label: 'This Year' },
                        ]}


                    />
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                        />
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>to</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded px-2 py-1 text-xs"
                        />
                        {(startDate || endDate) && (
                            <Button variant="ghost" size="small" onClick={() => { setStartDate(''); setEndDate(''); }}>
                                Clear
                            </Button>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        iconLeft={RefreshCw}
                        onClick={handleRefresh}
                        loading={refreshing}
                    >
                        Refresh
                    </Button>
                    <ExportButton
                        data={exportSummaryData}
                        filename={`analytics_summary_${period}`}
                        title="Analytics Summary"
                        columns={exportColumns}
                        variant="secondary"
                        size="small"
                    />
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="metrics-grid">
                {metrics.map((metric, index) => (
                    <Card key={index} className="metric-card">
                        <div className="metric-icon" style={{ backgroundColor: `${metric.color}15`, color: metric.color }}>
                            {metric.icon}
                        </div>
                        <div className="metric-content">
                            <div className="metric-value">{metric.value}</div>
                            <div className="metric-label">{metric.label}</div>
                        </div>
                        <div className={`metric-change ${metric.change >= 0 ? 'positive' : 'negative'}`}>
                            {metric.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            <span>{Math.abs(metric.change)}%</span>
                            <small>{metric.changeLabel}</small>
                        </div>
                    </Card>
                ))}
            </div>

            {/* Charts Row */}
            <div className="charts-row">
                {/* Enrollment Trend */}
                <Card className="chart-card">
                    <div className="chart-header">
                        <h3>
                            <Users size={18} />
                            Student Enrollment Trend
                        </h3>
                    </div>
                    <div className="chart-body">
                        <SimpleBarChart data={data.enrollment_trend} color="#3b82f6" />
                    </div>
                </Card>

                {/* Fee Collection Trend */}
                {canViewFinance && (
                    <Card className="chart-card">
                        <div className="chart-header">
                            <h3>
                                <DollarSign size={18} />
                                Fee Collection Trend
                            </h3>
                        </div>
                        <div className="chart-body">
                            <SimpleBarChart data={data.fee_trend} color="#22c55e" formatValue={formatCurrency} />
                        </div>
                    </Card>
                )}
            </div>

            {/* Performance Tables */}
            <div className="tables-row">
                {/* Subject Performance */}
                <Card className="table-card">
                    <div className="table-header">
                        <h3>
                            <BookOpen size={18} />
                            Subject Performance
                        </h3>
                    </div>
                    <div className="table-body">
                        <table>
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Avg Score</th>
                                    <th>Pass Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.subject_performance.map((subject, index) => (
                                    <tr key={index}>
                                        <td>{subject.subject}</td>
                                        <td>
                                            <div className="score-bar">
                                                <div
                                                    className="bar"
                                                    style={{
                                                        width: `${subject.avg_score}%`,
                                                        backgroundColor: getScoreColor(subject.avg_score)
                                                    }}
                                                />
                                                <span>{subject.avg_score}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            <Badge
                                                variant={subject.pass_rate >= 85 ? 'success' : 'warning'}
                                            >
                                                {subject.pass_rate}%
                                            </Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Class Performance */}
                <Card className="table-card">
                    <div className="table-header">
                        <h3>
                            <Target size={18} />
                            Class Performance
                        </h3>
                    </div>
                    <div className="table-body">
                        <table>
                            <thead>
                                <tr>
                                    <th>Class</th>
                                    <th>Attendance</th>
                                    <th>Avg Score</th>
                                    {canViewFinance && <th>Fee %</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {data.class_performance.map((cls, index) => (
                                    <tr key={index}>
                                        <td>{cls.class_name}</td>
                                        <td>
                                            <Badge variant={cls.avg_attendance >= 90 ? 'success' : 'warning'}>
                                                {cls.avg_attendance}%
                                            </Badge>
                                        </td>
                                        <td>{cls.avg_score}%</td>
                                        {canViewFinance && (
                                            <td>
                                                <Badge variant={cls.fee_collection >= 90 ? 'success' : cls.fee_collection >= 80 ? 'warning' : 'error'}>
                                                    {cls.fee_collection}%
                                                </Badge>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Grade Distribution */}
            <Card className="chart-card full-width">
                <div className="chart-header">
                    <h3>
                        <Award size={18} />
                        Grade Distribution
                    </h3>
                </div>
                <div className="chart-body">
                    <div className="grade-distribution">
                        {data.grade_distribution.labels.map((grade, index) => {
                            const value = data.grade_distribution.datasets[0].data[index];
                            const total = data.grade_distribution.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = (value / total) * 100;

                            return (
                                <div key={grade} className="grade-bar-container">
                                    <div className="grade-label">{grade}</div>
                                    <div className="grade-bar-wrapper">
                                        <div
                                            className="grade-bar"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: getGradeColor(grade)
                                            }}
                                        />
                                    </div>
                                    <div className="grade-value">{value} ({percentage.toFixed(1)}%)</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Alerts Dashboard */}
            <Card className="chart-card full-width" style={{ marginTop: '2rem' }}>
                <div className="chart-header" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>
                        <Activity size={18} />
                        Alerts Dashboard
                    </h3>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem' }}>
                            <input
                                type="checkbox"
                                checked={autoRefreshAlerts}
                                onChange={(e) => setAutoRefreshAlerts(e.target.checked)}
                            />
                            Auto refresh
                        </label>
                        <Button variant="outline" iconLeft={RefreshCw} onClick={fetchAlertData} loading={alertsRefreshing}>
                            Refresh Alerts
                        </Button>
                        <Button variant="primary" iconLeft={Target} onClick={handleEvaluateRules}>
                            Evaluate Rules
                        </Button>
                    </div>
                </div>
                <div className="chart-body">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Active Alerts</h4>
                            <div className="overflow-x-auto">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Rule</th>
                                            <th>Value</th>
                                            <th>Triggered</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {alertEvents.length === 0 && (
                                            <tr>
                                                <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                                                    No active alerts
                                                </td>
                                            </tr>
                                        )}
                                        {alertEvents.map((event) => (
                                            <tr key={event.id}>
                                                <td>{event.rule_name}</td>
                                                <td>{event.current_value}</td>
                                                <td>{new Date(event.triggered_at).toLocaleDateString()}</td>
                                                <td>
                                                    <Button variant="ghost" size="small" onClick={() => handleResolveEvent(event.id)}>
                                                        Resolve
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Create Alert Rule</h4>
                            <div className="grid grid-cols-1 gap-3">
                                <input
                                    type="text"
                                    placeholder="Rule name"
                                    value={alertForm.name}
                                    onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                                    className="border rounded px-3 py-2 text-sm"
                                />
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={alertForm.metric}
                                        onChange={(e) => setAlertForm({ ...alertForm, metric: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="ATTENDANCE_RATE">Attendance Rate</option>
                                        <option value="FEE_DELINQUENCY">Fee Delinquency</option>
                                        <option value="FEE_COLLECTION_RATE">Fee Collection Rate</option>
                                    </select>
                                    <select
                                        value={alertForm.comparator}
                                        onChange={(e) => setAlertForm({ ...alertForm, comparator: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="LT">Less Than</option>
                                        <option value="LTE">Less Than or Equal</option>
                                        <option value="GT">Greater Than</option>
                                        <option value="GTE">Greater Than or Equal</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        type="number"
                                        placeholder="Threshold"
                                        value={alertForm.threshold_value}
                                        onChange={(e) => setAlertForm({ ...alertForm, threshold_value: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Window days"
                                        value={alertForm.window_days}
                                        onChange={(e) => setAlertForm({ ...alertForm, window_days: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={alertForm.severity}
                                        onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="LOW">Low</option>
                                        <option value="MEDIUM">Medium</option>
                                        <option value="HIGH">High</option>
                                        <option value="CRITICAL">Critical</option>
                                    </select>
                                    <select
                                        value={alertForm.scope}
                                        onChange={(e) => setAlertForm({ ...alertForm, scope: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="GRADE">Grade</option>
                                        <option value="SECTION">Section</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select
                                        value={alertForm.grade_level}
                                        onChange={(e) => setAlertForm({ ...alertForm, grade_level: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="">All Grades</option>
                                        {grades.map((grade) => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={alertForm.section}
                                        onChange={(e) => setAlertForm({ ...alertForm, section: e.target.value })}
                                        className="border rounded px-3 py-2 text-sm"
                                    >
                                        <option value="">All Sections</option>
                                        {sections.map((section) => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <select
                                    value={alertForm.gender}
                                    onChange={(e) => setAlertForm({ ...alertForm, gender: e.target.value })}
                                    className="border rounded px-3 py-2 text-sm"
                                >
                                    <option value="">All Genders</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other</option>
                                </select>
                                <Button variant="primary" iconLeft={Target} onClick={handleCreateRule}>
                                    Create Rule
                                </Button>
                            </div>
                            <div style={{ marginTop: '1.25rem' }}>
                                <h4 className="text-sm font-semibold text-gray-600 mb-3">Existing Rules</h4>
                                <div className="overflow-x-auto">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Metric</th>
                                                <th>Threshold</th>
                                                <th>Severity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {alertRules.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '12px', textAlign: 'center', color: '#6b7280' }}>
                                                        No alert rules configured
                                                    </td>
                                                </tr>
                                            )}
                                            {alertRules.map((rule) => (
                                                <tr key={rule.id}>
                                                    <td>{rule.name}</td>
                                                    <td>{rule.metric}</td>
                                                    <td>{rule.comparator} {rule.threshold_value}</td>
                                                    <td>{rule.severity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

// Simple Bar Chart Component
interface SimpleBarChartProps {
    data: ChartData;
    color: string;
    formatValue?: (value: number) => string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, color, formatValue }) => {
    const maxValue = Math.max(...data.datasets[0].data);

    return (
        <div className="simple-bar-chart">
            <div className="bars">
                {data.datasets[0].data.map((value, index) => (
                    <div key={index} className="bar-column">
                        <div
                            className="bar"
                            style={{
                                height: `${(value / maxValue) * 100}%`,
                                backgroundColor: color
                            }}
                        >
                            <div className="bar-tooltip">
                                {formatValue ? formatValue(value) : value}
                            </div>
                        </div>
                        <div className="bar-label">{data.labels[index]}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Helper functions
const formatCurrency = (value: number): string => {
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
    return `₹${value}`;
};

const getScoreColor = (score: number): string => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
};

const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
        'A+': '#22c55e',
        'A': '#4ade80',
        'B+': '#84cc16',
        'B': '#eab308',
        'C': '#f97316',
        'D': '#ef4444',
        'F': '#dc2626',
    };
    return colors[grade] || '#6366f1';
};

export default AnalyticsDashboard;
