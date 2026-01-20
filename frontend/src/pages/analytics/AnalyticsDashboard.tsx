/**
 * Enhanced Analytics Dashboard
 * Comprehensive analytics and reporting with charts and metrics
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    TrendingUp,
    TrendingDown,
    Users,
    DollarSign,
    Calendar,
    BookOpen,
    Download,
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
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [period, setPeriod] = useState<Period>('month');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/dashboard/analytics/stats/', {
                params: { period }
            });
            setData(response.data);
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
            await axios.post('/api/dashboard/invalidate_cache/');
            await fetchAnalytics();
        } catch (error) {
            console.error('Failed to refresh:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const handleExport = () => {
        // Export analytics data
        const exportData = JSON.stringify(data, null, 2);
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${period}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
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
        {
            label: 'Fee Collection',
            value: `${data.overview.fee_collection_rate}%`,
            change: data.overview.collection_change,
            changeLabel: 'vs last period',
            icon: <DollarSign size={24} />,
            color: '#f59e0b'
        },
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
                    <Button
                        variant="ghost"
                        iconLeft={RefreshCw}
                        onClick={handleRefresh}
                        loading={refreshing}
                    >
                        Refresh
                    </Button>
                    <Button
                        variant="ghost"
                        iconLeft={Download}
                        onClick={handleExport}
                    >
                        Export
                    </Button>
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
                                    <th>Fee %</th>
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
                                        <td>
                                            <Badge variant={cls.fee_collection >= 90 ? 'success' : cls.fee_collection >= 80 ? 'warning' : 'error'}>
                                                {cls.fee_collection}%
                                            </Badge>
                                        </td>
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
