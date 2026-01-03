import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AdvancedAnalytics: React.FC = () => {
    const { t } = useTranslation();
    const [studentPerformance, setStudentPerformance] = useState<any>(null);
    const [attendanceTrends, setAttendanceTrends] = useState<any[]>([]);
    const [feeTrends, setFeeTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalyticsData();
    }, []);

    const fetchAnalyticsData = async () => {
        try {
            const [perfResponse, attResponse, feeResponse] = await Promise.all([
                api.get('/reports/analytics/student_performance/'),
                api.get('/reports/analytics/attendance_trends/?days=30'),
                api.get('/reports/analytics/fee_collection_trends/?months=12')
            ]);

            setStudentPerformance(perfResponse.data);
            setAttendanceTrends(attResponse.data);
            setFeeTrends(feeResponse.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    const attendanceChartData = {
        labels: attendanceTrends.map(d => d.date),
        datasets: [
            {
                label: 'Present',
                data: attendanceTrends.map(d => d.present_count),
                backgroundColor: 'rgba(34, 197, 94, 0.5)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 2,
            },
            {
                label: 'Absent',
                data: attendanceTrends.map(d => d.absent_count),
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
            }
        ]
    };

    const feeChartData = {
        labels: feeTrends.map(d => `${d.year}-${String(d.month).padStart(2, '0')}`),
        datasets: [
            {
                label: 'Fee Collection',
                data: feeTrends.map(d => d.total_collected),
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 2,
                tension: 0.3
            }
        ]
    };

    if (loading) {
        return <div className="p-6">Loading analytics...</div>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Advanced Analytics Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat Cards */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Exams</h3>
                    <p className="text-3xl font-bold text-blue-600">{studentPerformance?.total_exams || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Average Score</h3>
                    <p className="text-3xl font-bold text-green-600">{studentPerformance?.average_score?.toFixed(2) || 0}%</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Pass Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">{studentPerformance?.pass_rate || 0}%</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Collection</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {feeTrends.reduce((sum, t) => sum + parseFloat(t.total_collected || 0), 0).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Attendance Trends */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Attendance Trends (Last 30 Days)</h2>
                    <Bar data={attendanceChartData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>

                {/* Fee Collection Trends */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Fee Collection Trends (Last 12 Months)</h2>
                    <Line data={feeChartData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">Top Performers</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average Marks</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {studentPerformance?.top_performers?.map((student: any, index: number) => (
                                <tr key={index}>
                                    <td className="px-6 py-4 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {student.enrollment__student__first_name} {student.enrollment__student__last_name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{student.avg_marks?.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdvancedAnalytics;
