/**
 * Academic Progress Widget
 * Displays exam results and academic performance
 */

import React from 'react';
import { BookOpen, TrendingUp, TrendingDown, Minus, Award } from 'lucide-react';
import './widgets.css';

interface ExamResult {
    exam: string;
    subject: string;
    percentage: number;
    grade: string;
}

interface StudentProgress {
    student_id: string;
    student_name: string;
    results: ExamResult[];
}

interface AcademicProgressData {
    progress?: StudentProgress[];
    results?: ExamResult[];
}

interface AcademicProgressWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: AcademicProgressData;
    onRefresh?: () => void;
}

const getGradeColor = (grade: string): string => {
    const gradeColors: Record<string, string> = {
        'A+': '#22c55e',
        'A': '#22c55e',
        'A-': '#84cc16',
        'B+': '#84cc16',
        'B': '#eab308',
        'B-': '#eab308',
        'C+': '#f97316',
        'C': '#f97316',
        'D': '#ef4444',
        'F': '#ef4444',
    };
    return gradeColors[grade] || '#6366f1';
};

export const AcademicProgressWidget: React.FC<AcademicProgressWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { progress = [], results = [] } = data;

    // Single student view
    if (results.length > 0) {
        return (
            <div className="academic-progress-widget">
                <div className="widget-header">
                    <BookOpen size={18} />
                    <h3>Recent Results</h3>
                </div>

                <div className="results-list">
                    {results.slice(0, 5).map((result, index) => (
                        <div key={index} className="result-item">
                            <div className="result-info">
                                <div className="exam-name">{result.exam}</div>
                                <div className="subject-name">{result.subject}</div>
                            </div>
                            <div className="result-score">
                                <div className="percentage">{result.percentage.toFixed(1)}%</div>
                                <div
                                    className="grade"
                                    style={{ backgroundColor: `${getGradeColor(result.grade)}20`, color: getGradeColor(result.grade) }}
                                >
                                    {result.grade}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Multiple children view
    if (progress.length === 0) {
        return (
            <div className="academic-progress-widget empty">
                <div className="empty-state">
                    <Award size={32} />
                    <p>No exam results available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="academic-progress-widget">
            <div className="widget-header">
                <BookOpen size={18} />
                <h3>Academic Progress</h3>
            </div>

            <div className="students-progress">
                {progress.map((student, index) => (
                    <div key={student.student_id || index} className="student-section">
                        <div className="student-name">{student.student_name}</div>
                        <div className="results-list compact">
                            {student.results.slice(0, 3).map((result, rIndex) => (
                                <div key={rIndex} className="result-item compact">
                                    <span className="subject">{result.subject}</span>
                                    <span className="score">{result.percentage.toFixed(0)}%</span>
                                    <span
                                        className="grade"
                                        style={{ backgroundColor: `${getGradeColor(result.grade)}20`, color: getGradeColor(result.grade) }}
                                    >
                                        {result.grade}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AcademicProgressWidget;
