/**
 * Grades / Report Card Page
 * View exam results, grades, and academic performance
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import './Grades.css';

interface SubjectResult {
    subject_name: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    grade: string;
}

interface ExamResult {
    id: number;
    exam_name: string;
    exam_type: string;
    exam_date: string;
    total_marks: number;
    marks_obtained: number;
    percentage: number;
    grade: string;
    rank?: number;
    subjects: SubjectResult[];
}

interface PerformanceOverview {
    current_percentage: number;
    previous_percentage: number;
    trend: 'up' | 'down' | 'stable';
    class_rank: number;
    total_students: number;
    best_subject: string;
    needs_improvement: string;
}

const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
        'A+': '#059669', 'A': '#10B981', 'B+': '#22C55E', 'B': '#84CC16',
        'C+': '#EAB308', 'C': '#F59E0B', 'D': '#F97316', 'F': '#EF4444'
    };
    return colors[grade] || '#6B7280';
};

const getMockResults = (): ExamResult[] => [
    {
        id: 1, exam_name: 'Mid-Term Examination', exam_type: 'MID_TERM', exam_date: '2025-11-15',
        total_marks: 500, marks_obtained: 432, percentage: 86.4, grade: 'A', rank: 5,
        subjects: [
            { subject_name: 'Mathematics', marks_obtained: 92, max_marks: 100, percentage: 92, grade: 'A+' },
            { subject_name: 'English', marks_obtained: 85, max_marks: 100, percentage: 85, grade: 'A' },
            { subject_name: 'Physics', marks_obtained: 88, max_marks: 100, percentage: 88, grade: 'A' },
            { subject_name: 'Chemistry', marks_obtained: 82, max_marks: 100, percentage: 82, grade: 'A' },
            { subject_name: 'Biology', marks_obtained: 85, max_marks: 100, percentage: 85, grade: 'A' },
        ]
    },
    {
        id: 2, exam_name: 'Unit Test 2', exam_type: 'UNIT_TEST', exam_date: '2025-10-05',
        total_marks: 250, marks_obtained: 215, percentage: 86, grade: 'A', rank: 7,
        subjects: [
            { subject_name: 'Mathematics', marks_obtained: 45, max_marks: 50, percentage: 90, grade: 'A+' },
            { subject_name: 'English', marks_obtained: 42, max_marks: 50, percentage: 84, grade: 'A' },
            { subject_name: 'Physics', marks_obtained: 44, max_marks: 50, percentage: 88, grade: 'A' },
            { subject_name: 'Chemistry', marks_obtained: 41, max_marks: 50, percentage: 82, grade: 'A' },
            { subject_name: 'Biology', marks_obtained: 43, max_marks: 50, percentage: 86, grade: 'A' },
        ]
    },
    {
        id: 3, exam_name: 'Unit Test 1', exam_type: 'UNIT_TEST', exam_date: '2025-08-20',
        total_marks: 250, marks_obtained: 198, percentage: 79.2, grade: 'B+', rank: 12,
        subjects: [
            { subject_name: 'Mathematics', marks_obtained: 40, max_marks: 50, percentage: 80, grade: 'A' },
            { subject_name: 'English', marks_obtained: 38, max_marks: 50, percentage: 76, grade: 'B+' },
            { subject_name: 'Physics', marks_obtained: 42, max_marks: 50, percentage: 84, grade: 'A' },
            { subject_name: 'Chemistry', marks_obtained: 36, max_marks: 50, percentage: 72, grade: 'B+' },
            { subject_name: 'Biology', marks_obtained: 42, max_marks: 50, percentage: 84, grade: 'A' },
        ]
    },
];

const getMockOverview = (): PerformanceOverview => ({
    current_percentage: 86.4,
    previous_percentage: 79.2,
    trend: 'up',
    class_rank: 5,
    total_students: 45,
    best_subject: 'Mathematics',
    needs_improvement: 'Chemistry'
});

const Grades: React.FC = () => {
    const [selectedResult, setSelectedResult] = useState<ExamResult | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [filterType, setFilterType] = useState<string>('all');

    const { data: results = getMockResults(), isLoading } = useQuery({
        queryKey: ['grades'],
        queryFn: async () => {
            try {
                const response = await api.get('/exams/results/');
                return response.data.results || response.data || getMockResults();
            } catch {
                return getMockResults();
            }
        },
    });

    const overview = getMockOverview();

    const filteredResults = filterType === 'all'
        ? results
        : results.filter((r: ExamResult) => r.exam_type === filterType);

    const openResultDetail = (result: ExamResult) => {
        setSelectedResult(result);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="grades-loading">
                <div className="loading-spinner"></div>
                <p>Loading grades...</p>
            </div>
        );
    }

    return (
        <div className="grades-container">
            <div className="grades-header">
                <div className="header-content">
                    <h1>Grades & Report Card</h1>
                    <p className="header-subtitle">View exam results and academic performance</p>
                </div>
                <button className="btn-download">
                    <span className="icon">📥</span>
                    Download Report Card
                </button>
            </div>

            {/* Performance Overview */}
            <div className="performance-overview">
                <div className="overview-main">
                    <div className="current-score">
                        <div className="score-circle" style={{ borderColor: getGradeColor('A') }}>
                            <span className="score-value">{overview.current_percentage}%</span>
                            <span className="score-grade" style={{ color: getGradeColor('A') }}>Grade A</span>
                        </div>
                    </div>
                    <div className="trend-indicator">
                        {overview.trend === 'up' && (
                            <>
                                <span className="trend-icon up">↗</span>
                                <span className="trend-text">+{(overview.current_percentage - overview.previous_percentage).toFixed(1)}% from last exam</span>
                            </>
                        )}
                        {overview.trend === 'down' && (
                            <>
                                <span className="trend-icon down">↘</span>
                                <span className="trend-text">{(overview.current_percentage - overview.previous_percentage).toFixed(1)}% from last exam</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="overview-stats">
                    <div className="overview-stat">
                        <span className="stat-icon">🏆</span>
                        <div className="stat-content">
                            <span className="stat-value">{overview.class_rank}/{overview.total_students}</span>
                            <span className="stat-label">Class Rank</span>
                        </div>
                    </div>
                    <div className="overview-stat">
                        <span className="stat-icon">⭐</span>
                        <div className="stat-content">
                            <span className="stat-value">{overview.best_subject}</span>
                            <span className="stat-label">Best Subject</span>
                        </div>
                    </div>
                    <div className="overview-stat">
                        <span className="stat-icon">📈</span>
                        <div className="stat-content">
                            <span className="stat-value">{overview.needs_improvement}</span>
                            <span className="stat-label">Needs Focus</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter */}
            <div className="grades-filters">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterType === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterType('all')}
                    >
                        All Exams
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'UNIT_TEST' ? 'active' : ''}`}
                        onClick={() => setFilterType('UNIT_TEST')}
                    >
                        Unit Tests
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'MID_TERM' ? 'active' : ''}`}
                        onClick={() => setFilterType('MID_TERM')}
                    >
                        Mid-Term
                    </button>
                    <button
                        className={`filter-tab ${filterType === 'FINAL' ? 'active' : ''}`}
                        onClick={() => setFilterType('FINAL')}
                    >
                        Final
                    </button>
                </div>
            </div>

            {/* Results List */}
            <div className="results-list">
                {filteredResults.map((result: ExamResult) => (
                    <div
                        key={result.id}
                        className="result-card"
                        onClick={() => openResultDetail(result)}
                    >
                        <div className="result-left">
                            <div
                                className="grade-badge"
                                style={{ backgroundColor: `${getGradeColor(result.grade)}15`, color: getGradeColor(result.grade) }}
                            >
                                {result.grade}
                            </div>
                            <div className="result-info">
                                <h3>{result.exam_name}</h3>
                                <span className="exam-date">{new Date(result.exam_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                            </div>
                        </div>
                        <div className="result-scores">
                            <div className="score-item">
                                <span className="score-label">Marks</span>
                                <span className="score-value">{result.marks_obtained}/{result.total_marks}</span>
                            </div>
                            <div className="score-item">
                                <span className="score-label">Percentage</span>
                                <span className="score-value" style={{ color: getGradeColor(result.grade) }}>{result.percentage}%</span>
                            </div>
                            {result.rank && (
                                <div className="score-item">
                                    <span className="score-label">Rank</span>
                                    <span className="score-value">#{result.rank}</span>
                                </div>
                            )}
                        </div>
                        <div className="result-arrow">→</div>
                    </div>
                ))}
            </div>

            {/* Result Detail Modal */}
            {showModal && selectedResult && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content grades-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div className="modal-title-row">
                                <div
                                    className="modal-grade-badge"
                                    style={{ backgroundColor: getGradeColor(selectedResult.grade) }}
                                >
                                    {selectedResult.grade}
                                </div>
                                <div className="modal-title-area">
                                    <h2>{selectedResult.exam_name}</h2>
                                    <span className="modal-subtitle">{new Date(selectedResult.exam_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-summary">
                                <div className="summary-item">
                                    <span className="summary-value">{selectedResult.marks_obtained}/{selectedResult.total_marks}</span>
                                    <span className="summary-label">Total Marks</span>
                                </div>
                                <div className="summary-item">
                                    <span className="summary-value" style={{ color: getGradeColor(selectedResult.grade) }}>{selectedResult.percentage}%</span>
                                    <span className="summary-label">Percentage</span>
                                </div>
                                {selectedResult.rank && (
                                    <div className="summary-item">
                                        <span className="summary-value">#{selectedResult.rank}</span>
                                        <span className="summary-label">Class Rank</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-body">
                            <h4>Subject-wise Results</h4>
                            <div className="subjects-table">
                                <div className="table-header">
                                    <span>Subject</span>
                                    <span>Marks</span>
                                    <span>Percentage</span>
                                    <span>Grade</span>
                                </div>
                                {selectedResult.subjects.map((subject, idx) => (
                                    <div key={idx} className="table-row">
                                        <span className="subject-name">{subject.subject_name}</span>
                                        <span>{subject.marks_obtained}/{subject.max_marks}</span>
                                        <span style={{ color: getGradeColor(subject.grade) }}>{subject.percentage}%</span>
                                        <span>
                                            <span
                                                className="subject-grade"
                                                style={{ backgroundColor: `${getGradeColor(subject.grade)}20`, color: getGradeColor(subject.grade) }}
                                            >
                                                {subject.grade}
                                            </span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            <button className="btn-primary">Download Report</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Grades;
