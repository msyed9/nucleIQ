import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Clock, CheckCircle, AlertTriangle, Calendar, Download } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Complaint {
    id: number;
    complaint_type: string;
    priority: string;
    status: string;
    reported_date: string;
    resolution_date?: string;
    student_rating?: number;
}

interface AnalyticsData {
    totalComplaints: number;
    resolvedComplaints: number;
    pendingComplaints: number;
    avgResolutionTime: number;
    satisfactionRate: number;
    complaintsByType: { name: string; value: number }[];
    complaintsByPriority: { name: string; value: number }[];
    complaintsByStatus: { name: string; value: number }[];
    monthlyTrend: { month: string; complaints: number; resolved: number }[];
    resolutionTrend: { day: string; avgTime: number }[];
}

const COLORS = {
    primary: '#3B82F6',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6',
    teal: '#14B8A6',
    orange: '#F97316',
    pink: '#EC4899',
};

const ComplaintAnalytics: React.FC = () => {
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/hostel/complaints/');
            const data: Complaint[] = response.data.results || response.data;

            // Filter by date range
            const filteredData = filterByDateRange(data, dateRange);
            setComplaints(filteredData);

            // Calculate analytics
            const analyticsData = calculateAnalytics(filteredData);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            toast.error('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const filterByDateRange = (data: Complaint[], range: string): Complaint[] => {
        if (range === 'all') return data;

        const now = new Date();
        const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        return data.filter(c => new Date(c.reported_date) >= cutoffDate);
    };

    const calculateAnalytics = (data: Complaint[]): AnalyticsData => {
        const totalComplaints = data.length;
        const resolvedComplaints = data.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
        const pendingComplaints = data.filter(c => c.status === 'PENDING').length;

        // Average resolution time (in hours)
        const resolvedWithTime = data.filter(c => c.resolution_date);
        const avgResolutionTime = resolvedWithTime.length > 0
            ? resolvedWithTime.reduce((sum, c) => {
                const reported = new Date(c.reported_date).getTime();
                const resolved = new Date(c.resolution_date!).getTime();
                return sum + (resolved - reported) / (1000 * 60 * 60);
            }, 0) / resolvedWithTime.length
            : 0;

        // Satisfaction rate
        const ratedComplaints = data.filter(c => c.student_rating);
        const satisfactionRate = ratedComplaints.length > 0
            ? (ratedComplaints.reduce((sum, c) => sum + (c.student_rating || 0), 0) / ratedComplaints.length / 5) * 100
            : 0;

        // Complaints by type
        const typeCount: Record<string, number> = {};
        data.forEach(c => {
            typeCount[c.complaint_type] = (typeCount[c.complaint_type] || 0) + 1;
        });
        const complaintsByType = Object.entries(typeCount).map(([name, value]) => ({ name, value }));

        // Complaints by priority
        const priorityCount: Record<string, number> = {};
        data.forEach(c => {
            priorityCount[c.priority] = (priorityCount[c.priority] || 0) + 1;
        });
        const complaintsByPriority = Object.entries(priorityCount).map(([name, value]) => ({ name, value }));

        // Complaints by status
        const statusCount: Record<string, number> = {};
        data.forEach(c => {
            statusCount[c.status] = (statusCount[c.status] || 0) + 1;
        });
        const complaintsByStatus = Object.entries(statusCount).map(([name, value]) => ({ name, value }));

        // Monthly trend (last 6 months)
        const monthlyTrend = calculateMonthlyTrend(data);

        // Resolution time trend (last 7 days)
        const resolutionTrend = calculateResolutionTrend(data);

        return {
            totalComplaints,
            resolvedComplaints,
            pendingComplaints,
            avgResolutionTime,
            satisfactionRate,
            complaintsByType,
            complaintsByPriority,
            complaintsByStatus,
            monthlyTrend,
            resolutionTrend,
        };
    };

    const calculateMonthlyTrend = (data: Complaint[]) => {
        const months: Record<string, { complaints: number; resolved: number }> = {};

        data.forEach(c => {
            const month = new Date(c.reported_date).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            if (!months[month]) {
                months[month] = { complaints: 0, resolved: 0 };
            }
            months[month].complaints++;
            if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
                months[month].resolved++;
            }
        });

        return Object.entries(months)
            .map(([month, data]) => ({ month, ...data }))
            .slice(-6);
    };

    const calculateResolutionTrend = (data: Complaint[]) => {
        const days: Record<string, { total: number; totalTime: number }> = {};

        data.filter(c => c.resolution_date).forEach(c => {
            const day = new Date(c.resolution_date!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const reported = new Date(c.reported_date).getTime();
            const resolved = new Date(c.resolution_date!).getTime();
            const hours = (resolved - reported) / (1000 * 60 * 60);

            if (!days[day]) {
                days[day] = { total: 0, totalTime: 0 };
            }
            days[day].total++;
            days[day].totalTime += hours;
        });

        return Object.entries(days)
            .map(([day, data]) => ({ day, avgTime: data.totalTime / data.total }))
            .slice(-7);
    };

    const exportReport = () => {
        if (!analytics) return;

        const reportData = {
            generatedAt: new Date().toISOString(),
            dateRange,
            summary: {
                totalComplaints: analytics.totalComplaints,
                resolvedComplaints: analytics.resolvedComplaints,
                pendingComplaints: analytics.pendingComplaints,
                avgResolutionTime: analytics.avgResolutionTime.toFixed(2) + ' hours',
                satisfactionRate: analytics.satisfactionRate.toFixed(1) + '%',
            },
            complaintsByType: analytics.complaintsByType,
            complaintsByPriority: analytics.complaintsByPriority,
            complaintsByStatus: analytics.complaintsByStatus,
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `complaint-analytics-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported successfully');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!analytics) return null;

    const resolutionRate = analytics.totalComplaints > 0
        ? (analytics.resolvedComplaints / analytics.totalComplaints) * 100
        : 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Complaint Analytics Dashboard</h1>
                    <p className="text-gray-600 mt-1">Comprehensive insights into hostel complaint management</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                    <button
                        onClick={exportReport}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export Report
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Complaints</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{analytics.totalComplaints}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <AlertTriangle className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Resolved</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{analytics.resolvedComplaints}</p>
                            <p className="text-xs text-gray-500 mt-1">{resolutionRate.toFixed(1)}% rate</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{analytics.pendingComplaints}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Avg Resolution Time</p>
                            <p className="text-2xl font-bold text-purple-600 mt-1">{analytics.avgResolutionTime.toFixed(1)}h</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <TrendingDown className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Satisfaction Rate</p>
                            <p className="text-2xl font-bold text-teal-600 mt-1">{analytics.satisfactionRate.toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-teal-100 rounded-lg">
                            <TrendingUp className="text-teal-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Complaints by Type */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Complaints by Type</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.complaintsByType}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.primary} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Complaints by Priority */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Priority Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.complaintsByPriority}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analytics.complaintsByPriority.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Trend */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trend</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={analytics.monthlyTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="complaints" stroke={COLORS.primary} strokeWidth={2} name="Total Complaints" />
                            <Line type="monotone" dataKey="resolved" stroke={COLORS.success} strokeWidth={2} name="Resolved" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Status Distribution */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={analytics.complaintsByStatus}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {analytics.complaintsByStatus.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Resolution Time Trend */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Average Resolution Time Trend (Last 7 Days)</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.resolutionTrend}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="avgTime" stroke={COLORS.purple} strokeWidth={2} name="Avg Time (hours)" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Insights */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    Key Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Most Common Issue</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {analytics.complaintsByType.length > 0
                                ? analytics.complaintsByType.reduce((max, item) => item.value > max.value ? item : max).name
                                : 'N/A'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Resolution Efficiency</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {resolutionRate >= 80 ? '🟢 Excellent' : resolutionRate >= 60 ? '🟡 Good' : '🔴 Needs Improvement'}
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Student Satisfaction</p>
                        <p className="text-lg font-semibold text-gray-800">
                            {analytics.satisfactionRate >= 80 ? '😊 High' : analytics.satisfactionRate >= 60 ? '😐 Moderate' : '😞 Low'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplaintAnalytics;
