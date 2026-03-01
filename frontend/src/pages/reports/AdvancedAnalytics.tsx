import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
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
    const [classDrilldown, setClassDrilldown] = useState<any[]>([]);
    const [attendanceAnomalies, setAttendanceAnomalies] = useState<any[]>([]);
    const [feeAgeingBuckets, setFeeAgeingBuckets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [gradeId, setGradeId] = useState<string>('');
    const [sectionId, setSectionId] = useState<string>('');
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [segmentBy, setSegmentBy] = useState<'grade' | 'section' | 'gender'>('grade');
    const [compareEnabled, setCompareEnabled] = useState<boolean>(false);
    const [comparison, setComparison] = useState<any | null>(null);
    const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
    const [anomalyThreshold, setAnomalyThreshold] = useState<string>('80');

    const toList = (payload: any): any[] => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.results)) return payload.results;
        return [];
    };

    useEffect(() => {
        fetchFilters();
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
    }, [startDate, endDate, gradeId, sectionId, segmentBy, compareEnabled, anomalyThreshold]);

    useEffect(() => {
        if (!gradeId) {
            setSectionId('');
        }
    }, [gradeId]);

    const fetchFilters = async () => {
        try {
            const [gradesRes, sectionsRes] = await Promise.all([
                api.get('/tenants/grades/'),
                api.get('/tenants/sections/')
            ]);
            setGrades(toList(gradesRes.data));
            setSections(toList(sectionsRes.data));
        } catch (error) {
            console.error('Failed to load filters:', error);
        }
    };

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);
            if (gradeId) params.append('grade_id', gradeId);
            if (sectionId) params.append('section_id', sectionId);
            params.append('segment_by', segmentBy);

            const anomalyParams = new URLSearchParams(params.toString());
            if (anomalyThreshold) anomalyParams.append('threshold', anomalyThreshold);

            const [perfResponse, attResponse, feeResponse, drillResponse, ageingResponse, anomalyResponse] = await Promise.allSettled([
                api.get(`/reports/analytics/student_performance/?${params.toString()}`),
                api.get(`/reports/analytics/attendance_trends/?${params.toString()}`),
                api.get(`/reports/analytics/fee_collection_trends/?${params.toString()}`),
                api.get(`/reports/analytics/class_section_drilldown/?${params.toString()}`),
                api.get(`/reports/analytics/fee_ageing_buckets/?${params.toString()}`),
                api.get(`/reports/analytics/attendance_anomalies/?${anomalyParams.toString()}`)
            ]);

            const perfData = perfResponse.status === 'fulfilled' ? perfResponse.value.data : null;
            const attendanceData = attResponse.status === 'fulfilled' ? toList(attResponse.value.data) : [];
            const feeData = feeResponse.status === 'fulfilled' ? toList(feeResponse.value.data) : [];
            const drillData = drillResponse.status === 'fulfilled' ? toList(drillResponse.value.data) : [];
            const ageingData = ageingResponse.status === 'fulfilled' ? toList(ageingResponse.value.data) : [];
            const anomalyData = anomalyResponse.status === 'fulfilled' ? toList(anomalyResponse.value.data) : [];

            setStudentPerformance(perfData);
            setAttendanceTrends(attendanceData);
            setFeeTrends(feeData);
            setClassDrilldown(drillData);
            setFeeAgeingBuckets(ageingData);
            setAttendanceAnomalies(anomalyData);

            if (compareEnabled && startDate && endDate) {
                const previousRange = getPreviousRange(startDate, endDate);
                const compareParams = new URLSearchParams();
                compareParams.append('start_date', previousRange.start);
                compareParams.append('end_date', previousRange.end);
                if (gradeId) compareParams.append('grade_id', gradeId);
                if (sectionId) compareParams.append('section_id', sectionId);
                compareParams.append('segment_by', segmentBy);

                const [prevPerf, prevAtt, prevFee] = await Promise.allSettled([
                    api.get(`/reports/analytics/student_performance/?${compareParams.toString()}`),
                    api.get(`/reports/analytics/attendance_trends/?${compareParams.toString()}`),
                    api.get(`/reports/analytics/fee_collection_trends/?${compareParams.toString()}`)
                ]);

                const prevPerfData = prevPerf.status === 'fulfilled' ? prevPerf.value.data : null;
                const previousAttendance = prevAtt.status === 'fulfilled' ? toList(prevAtt.value.data) : [];
                const previousFee = prevFee.status === 'fulfilled' ? toList(prevFee.value.data) : [];

                const prevFeeTotal = previousFee.reduce((sum: number, row: any) => sum + parseFloat(row.total_collected || 0), 0);
                const currFeeTotal = feeData.reduce((sum: number, row: any) => sum + parseFloat(row.total_collected || 0), 0);

                setComparison({
                    average_score_change: calculateDelta(perfData?.average_score || 0, prevPerfData?.average_score || 0),
                    pass_rate_change: calculateDelta(perfData?.pass_rate || 0, prevPerfData?.pass_rate || 0),
                    attendance_rate_change: calculateTrendDelta(attendanceData, previousAttendance),
                    fee_collection_change: calculateDelta(currFeeTotal, prevFeeTotal)
                });
            } else {
                setComparison(null);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!autoRefresh) return undefined;

        const interval = setInterval(() => {
            fetchAnalyticsData();
        }, 60000);

        return () => clearInterval(interval);
    }, [autoRefresh, startDate, endDate, gradeId, sectionId, segmentBy, compareEnabled, anomalyThreshold]);

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

    const subjectPerformance = studentPerformance?.subject_wise_performance || [];
    const topPerformers = studentPerformance?.top_performers || [];

    const filteredTopPerformers = useMemo(() => {
        if (!selectedSubject) return topPerformers;
        return topPerformers.filter((student: any) => student.subject === selectedSubject || student.exam__subject__name === selectedSubject);
    }, [topPerformers, selectedSubject]);

    const classDrilldownRows = useMemo(() => {
        return classDrilldown || [];
    }, [classDrilldown]);

    if (loading) {
        return <div className="p-6">Loading analytics...</div>;
    }

    const exportData = filteredTopPerformers.map((student: any, index: number) => ({
        rank: index + 1,
        student_name: `${student.enrollment__student__first_name || ''} ${student.enrollment__student__last_name || ''}`.trim(),
        avg_marks: student.avg_marks?.toFixed(2)
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'rank', label: 'Rank' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'avg_marks', label: 'Average Marks' }
    ];

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Advanced Analytics Dashboard</h1>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-wrap gap-4 items-end">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Start Date</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Grade</label>
                        <select
                            value={gradeId}
                            onChange={(e) => setGradeId(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Grades</option>
                            {grades.map((g) => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
                        <select
                            value={sectionId}
                            onChange={(e) => setSectionId(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Sections</option>
                            {sections
                                .filter((s) => !gradeId || s.grade_level === gradeId || s.grade_level_id === gradeId)
                                .map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Segment By</label>
                        <select
                            value={segmentBy}
                            onChange={(e) => setSegmentBy(e.target.value as 'grade' | 'section' | 'gender')}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="grade">Grade</option>
                            <option value="section">Section</option>
                            <option value="gender">Gender</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Anomaly Threshold (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={anomalyThreshold}
                            onChange={(e) => setAnomalyThreshold(e.target.value)}
                            className="border rounded px-3 py-2 text-sm w-28"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={compareEnabled}
                            onChange={(e) => setCompareEnabled(e.target.checked)}
                        />
                        <span className="text-xs text-gray-600">Compare to previous period</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                        />
                        <span className="text-xs text-gray-600">Auto refresh</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat Cards */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Exams</h3>
                    <p className="text-3xl font-bold text-blue-600">{studentPerformance?.total_exams || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Average Score</h3>
                    <p className="text-3xl font-bold text-green-600">{studentPerformance?.average_score?.toFixed(2) || 0}%</p>
                    {comparison && (
                        <p className="text-xs text-gray-500 mt-2">Δ {comparison.average_score_change}% vs previous</p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Pass Rate</h3>
                    <p className="text-3xl font-bold text-purple-600">{studentPerformance?.pass_rate || 0}%</p>
                    {comparison && (
                        <p className="text-xs text-gray-500 mt-2">Δ {comparison.pass_rate_change}% vs previous</p>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Total Collection</h3>
                    <p className="text-3xl font-bold text-orange-600">
                        {feeTrends.reduce((sum, t) => sum + parseFloat(t.total_collected || 0), 0).toLocaleString()}
                    </p>
                    {comparison && (
                        <p className="text-xs text-gray-500 mt-2">Δ {comparison.fee_collection_change}% vs previous</p>
                    )}
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
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <h2 className="text-lg font-semibold">Top Performers</h2>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedSubject}
                            onChange={(e) => setSelectedSubject(e.target.value)}
                            className="border rounded px-3 py-2 text-sm"
                        >
                            <option value="">All Subjects</option>
                            {subjectPerformance.map((subject: any) => (
                                <option key={subject.exam__subject__name} value={subject.exam__subject__name}>
                                    {subject.exam__subject__name}
                                </option>
                            ))}
                        </select>
                        <ExportButton
                            data={exportData}
                            filename="top_performers"
                            title="Top Performers"
                            columns={exportColumns}
                            variant="secondary"
                            size="small"
                        />
                    </div>
                </div>
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
                            {filteredTopPerformers.map((student: any, index: number) => (
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

            {/* Drilldown Table */}
            {classDrilldownRows.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                    <h2 className="text-lg font-semibold mb-4">Class & Section Drilldown</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Marks</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee %</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classDrilldownRows.map((row: any, index: number) => (
                                    <tr
                                        key={index}
                                        className="cursor-pointer hover:bg-gray-50"
                                        onClick={() => setSectionId(row.section_id)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">{row.section_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.grade_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.attendance_rate}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.average_score?.toFixed(2) || 0}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.fee_collection_rate}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Fee Ageing Buckets */}
            {feeAgeingBuckets.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                    <h2 className="text-lg font-semibold mb-4">Fee Ageing Buckets</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {feeAgeingBuckets.map((bucket: any) => (
                            <div key={bucket.label} className="border rounded p-4">
                                <p className="text-sm font-semibold text-gray-600">{bucket.label}</p>
                                <p className="text-2xl font-bold text-gray-800">₹{Number(bucket.total || 0).toLocaleString()}</p>
                                <p className="text-xs text-gray-500">{bucket.count || 0} invoices</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attendance Anomalies */}
            {attendanceAnomalies.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
                    <h2 className="text-lg font-semibold mb-4">Attendance Anomalies</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attendance %</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threshold</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {attendanceAnomalies.map((row: any) => (
                                    <tr key={row.section_id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.section_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.grade_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-red-600 font-semibold">{row.attendance_rate}%</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{row.threshold}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

const formatDate = (date: Date): string => date.toISOString().split('T')[0];

const getPreviousRange = (start: string, end: string) => {
    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);
    const diffDays = Math.floor((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
    const prevEnd = new Date(startDate.getTime() - 86400000);
    const prevStart = new Date(prevEnd.getTime() - (diffDays - 1) * 86400000);
    return { start: formatDate(prevStart), end: formatDate(prevEnd) };
};

const calculateDelta = (current: number, previous: number) => {
    if (!previous) return 0;
    return Number((((current - previous) / previous) * 100).toFixed(1));
};

const calculateTrendDelta = (current: any[], previous: any[]) => {
    const currentTotal = current.reduce((sum, row) => sum + (row.present_count || 0), 0);
    const currentAll = current.reduce((sum, row) => sum + (row.total || 0), 0);
    const prevTotal = previous.reduce((sum, row) => sum + (row.present_count || 0), 0);
    const prevAll = previous.reduce((sum, row) => sum + (row.total || 0), 0);

    const currentRate = currentAll > 0 ? (currentTotal / currentAll) * 100 : 0;
    const previousRate = prevAll > 0 ? (prevTotal / prevAll) * 100 : 0;
    return calculateDelta(currentRate, previousRate);
};

export default AdvancedAnalytics;
