import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js/auto';
import { Bar, Pie } from 'react-chartjs-2';
import './ResultAnalytics.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

interface Exam {
    id: string;
    name: string;
    subject_name: string;
    grade_level_name: string;
}

interface Section {
    id: string;
    name: string;
}

interface Analytics {
    total_students: number;
    passed: number;
    failed: number;
    average_marks: number;
    average_percentage: number;
    pass_percentage: number;
    grade_distribution: Record<string, number>;
}

const ResultAnalytics: React.FC = () => {
    const [selectedExam, setSelectedExam] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');

    // Fetch exams
    const { data: exams } = useQuery({
        queryKey: ['exams'],
        queryFn: async () => {
            const response = await axios.get('/api/exams/exams/');
            return response.data;
        }
    });

    // Fetch sections
    const { data: sections } = useQuery({
        queryKey: ['sections'],
        queryFn: async () => {
            const response = await axios.get('/api/tenants/sections/');
            return response.data;
        }
    });

    // Fetch analytics
    const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
        queryKey: ['analytics', selectedExam, selectedSection],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append('exam_id', selectedExam);
            if (selectedSection) {
                params.append('section_id', selectedSection);
            }
            const response = await axios.get(`/api/exams/results/analytics/?${params.toString()}`);
            return response.data;
        },
        enabled: !!selectedExam
    });

    const selectedExamData = exams?.find((e: Exam) => e.id === selectedExam);

    // Prepare chart data
    const gradeDistributionData = analytics?.grade_distribution ? {
        labels: Object.keys(analytics.grade_distribution),
        datasets: [
            {
                label: 'Number of Students',
                data: Object.values(analytics.grade_distribution),
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(244, 67, 54, 0.8)',
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(244, 67, 54, 1)',
                ],
                borderWidth: 2,
            },
        ],
    } : null;

    const passFailData = analytics ? {
        labels: ['Passed', 'Failed'],
        datasets: [
            {
                data: [analytics.passed, analytics.failed],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(244, 67, 54, 0.8)',
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(244, 67, 54, 1)',
                ],
                borderWidth: 2,
            },
        ],
    } : null;

    return (
        <div className="analytics-container">
            <div className="page-header">
                <h1>📊 Result Analytics</h1>
                <p>Comprehensive exam performance analysis</p>
            </div>

            {/* Selection Section */}
            <div className="analytics-card selection-card">
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="exam">Select Exam *</label>
                        <select
                            id="exam"
                            value={selectedExam}
                            onChange={(e) => setSelectedExam(e.target.value)}
                        >
                            <option value="">-- Select Exam --</option>
                            {exams?.map((exam: Exam) => (
                                <option key={exam.id} value={exam.id}>
                                    {exam.name} - {exam.subject_name} ({exam.grade_level_name})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="section">Select Section (Optional)</label>
                        <select
                            id="section"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">-- All Sections --</option>
                            {sections?.map((section: Section) => (
                                <option key={section.id} value={section.id}>
                                    {section.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Analytics Display */}
            {selectedExam && analytics && !analyticsLoading && (
                <>
                    {/* Summary Cards */}
                    <div className="stats-grid">
                        <div className="stat-card total">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <div className="stat-value">{analytics.total_students}</div>
                                <div className="stat-label">Total Students</div>
                            </div>
                        </div>

                        <div className="stat-card pass">
                            <div className="stat-icon">✅</div>
                            <div className="stat-content">
                                <div className="stat-value">{analytics.passed}</div>
                                <div className="stat-label">Passed</div>
                                <div className="stat-percentage">{analytics.pass_percentage.toFixed(2)}%</div>
                            </div>
                        </div>

                        <div className="stat-card fail">
                            <div className="stat-icon">❌</div>
                            <div className="stat-content">
                                <div className="stat-value">{analytics.failed}</div>
                                <div className="stat-label">Failed</div>
                                <div className="stat-percentage">
                                    {(100 - analytics.pass_percentage).toFixed(2)}%
                                </div>
                            </div>
                        </div>

                        <div className="stat-card average">
                            <div className="stat-icon">📈</div>
                            <div className="stat-content">
                                <div className="stat-value">{analytics.average_percentage.toFixed(2)}%</div>
                                <div className="stat-label">Average Percentage</div>
                                <div className="stat-subtext">
                                    {analytics.average_marks.toFixed(2)} marks
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="charts-grid">
                        {/* Pass/Fail Chart */}
                        <div className="analytics-card chart-card">
                            <h3>Pass/Fail Distribution</h3>
                            {passFailData && (
                                <div className="chart-container">
                                    <Pie
                                        data={passFailData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    position: 'bottom',
                                                },
                                                tooltip: {
                                                    callbacks: {
                                                        label: function (context) {
                                                            const label = context.label || '';
                                                            const value = context.parsed || 0;
                                                            const total = analytics.total_students;
                                                            const percentage = ((value / total) * 100).toFixed(2);
                                                            return `${label}: ${value} (${percentage}%)`;
                                                        }
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Grade Distribution Chart */}
                        <div className="analytics-card chart-card">
                            <h3>Grade Distribution</h3>
                            {gradeDistributionData && (
                                <div className="chart-container">
                                    <Bar
                                        data={gradeDistributionData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: {
                                                    display: false,
                                                },
                                            },
                                            scales: {
                                                y: {
                                                    beginAtZero: true,
                                                    ticks: {
                                                        stepSize: 1,
                                                    }
                                                }
                                            }
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Grade Distribution Table */}
                    <div className="analytics-card">
                        <h3>Detailed Grade Distribution</h3>
                        <div className="grade-table-container">
                            <table className="grade-table">
                                <thead>
                                    <tr>
                                        <th>Grade</th>
                                        <th>Number of Students</th>
                                        <th>Percentage</th>
                                        <th>Visual</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Object.entries(analytics.grade_distribution).map(([grade, count]) => {
                                        const percentage = ((count / analytics.total_students) * 100).toFixed(2);
                                        return (
                                            <tr key={grade}>
                                                <td className="grade-cell">{grade}</td>
                                                <td>{count}</td>
                                                <td>{percentage}%</td>
                                                <td>
                                                    <div className="progress-bar">
                                                        <div
                                                            className="progress-fill"
                                                            style={{ width: `${percentage}%` }}
                                                        ></div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {analyticsLoading && (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading analytics...</p>
                </div>
            )}

            {!selectedExam && (
                <div className="empty-state">
                    <div className="empty-icon">📊</div>
                    <h3>No Exam Selected</h3>
                    <p>Please select an exam to view analytics</p>
                </div>
            )}
        </div>
    );
};

export default ResultAnalytics;
