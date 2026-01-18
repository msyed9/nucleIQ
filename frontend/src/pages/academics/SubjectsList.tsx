/**
 * Subjects List Page
 * Display and manage subjects with teacher assignments and syllabus progress
 */

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import './SubjectsList.css';

interface Subject {
    id: number;
    name: string;
    code: string;
    description?: string;
    grade_level_id: number;
    grade_level_name: string;
    teacher_name?: string;
    periods_per_week?: number;
    is_elective?: boolean;
    credits?: number;
    syllabus_progress?: number;
}

const SUBJECT_COLORS: Record<string, string> = {
    'Mathematics': '#3B82F6',
    'English': '#8B5CF6',
    'Science': '#10B981',
    'Physics': '#F59E0B',
    'Chemistry': '#EF4444',
    'Biology': '#22C55E',
    'History': '#A855F7',
    'Geography': '#06B6D4',
    'Computer Science': '#6366F1',
    'Hindi': '#EC4899',
    'Arabic': '#059669',
    'Physical Education': '#F97316',
    'Art': '#D946EF',
    'Music': '#E11D48',
};

const getMockSubjects = (): Subject[] => [
    { id: 1, name: 'Mathematics', code: 'MATH10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Dr. Smith', periods_per_week: 6, is_elective: false, credits: 5, syllabus_progress: 65 },
    { id: 2, name: 'English', code: 'ENG10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Ms. Johnson', periods_per_week: 5, is_elective: false, credits: 5, syllabus_progress: 70 },
    { id: 3, name: 'Physics', code: 'PHY10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Mr. Brown', periods_per_week: 5, is_elective: false, credits: 5, syllabus_progress: 55 },
    { id: 4, name: 'Chemistry', code: 'CHEM10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Dr. Lee', periods_per_week: 5, is_elective: false, credits: 5, syllabus_progress: 60 },
    { id: 5, name: 'Biology', code: 'BIO10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Dr. Wilson', periods_per_week: 4, is_elective: false, credits: 4, syllabus_progress: 50 },
    { id: 6, name: 'History', code: 'HIST10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Mr. White', periods_per_week: 3, is_elective: false, credits: 3, syllabus_progress: 75 },
    { id: 7, name: 'Computer Science', code: 'CS10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Ms. Tech', periods_per_week: 4, is_elective: true, credits: 4, syllabus_progress: 45 },
    { id: 8, name: 'Physical Education', code: 'PE10', grade_level_id: 10, grade_level_name: 'Grade 10', teacher_name: 'Coach Adams', periods_per_week: 2, is_elective: false, credits: 2, syllabus_progress: 80 },
];

const SubjectsList: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGrade, setSelectedGrade] = useState<string>('all');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
    const [showModal, setShowModal] = useState(false);

    // Fetch subjects
    const { data: subjects = getMockSubjects(), isLoading } = useQuery({
        queryKey: ['subjects'],
        queryFn: async () => {
            try {
                const response = await api.get('/tenants/subjects/');
                return response.data.results || response.data || getMockSubjects();
            } catch {
                return getMockSubjects();
            }
        },
    });

    const getSubjectColor = (name: string) => SUBJECT_COLORS[name] || '#6B7280';

    const filteredSubjects = subjects.filter((subject: Subject) => {
        const matchesSearch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (subject.teacher_name?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesGrade = selectedGrade === 'all' || subject.grade_level_name === selectedGrade;
        return matchesSearch && matchesGrade;
    });

    const gradeOptions = [...new Set(subjects.map((s: Subject) => s.grade_level_name))];

    const openSubjectDetail = (subject: Subject) => {
        setSelectedSubject(subject);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="subjects-loading">
                <div className="loading-spinner"></div>
                <p>Loading subjects...</p>
            </div>
        );
    }

    return (
        <div className="subjects-container">
            <div className="subjects-header">
                <div className="header-content">
                    <h1>Subjects</h1>
                    <p className="header-subtitle">Manage subjects, teacher assignments, and syllabus progress</p>
                </div>
                <button className="btn-primary">
                    <i className="icon-plus"></i>
                    Add Subject
                </button>
            </div>

            <div className="subjects-filters">
                <div className="search-box">
                    <i className="icon-search"></i>
                    <input
                        type="text"
                        placeholder="Search subjects, teachers..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="grade-filter"
                >
                    <option value="all">All Grades</option>
                    {gradeOptions.map((grade) => (
                        <option key={grade} value={grade}>{grade}</option>
                    ))}
                </select>
            </div>

            <div className="subjects-grid">
                {filteredSubjects.map((subject: Subject) => {
                    const color = getSubjectColor(subject.name);
                    const progressColor = (subject.syllabus_progress || 0) >= 70 ? '#10B981' :
                        (subject.syllabus_progress || 0) >= 40 ? '#F59E0B' : '#EF4444';

                    return (
                        <div
                            key={subject.id}
                            className="subject-card"
                            onClick={() => openSubjectDetail(subject)}
                        >
                            <div className="subject-color-bar" style={{ backgroundColor: color }}></div>
                            <div className="subject-content">
                                <div className="subject-header">
                                    <div className="subject-icon" style={{ backgroundColor: `${color}20`, color }}>
                                        {subject.name.charAt(0)}
                                    </div>
                                    <div className="subject-info">
                                        <h3>{subject.name}</h3>
                                        <span className="subject-code">{subject.code}</span>
                                    </div>
                                    {subject.is_elective && (
                                        <span className="elective-badge">Elective</span>
                                    )}
                                </div>

                                <div className="subject-meta">
                                    <div className="meta-item">
                                        <i className="icon-user"></i>
                                        <span>{subject.teacher_name || 'Not assigned'}</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="icon-clock"></i>
                                        <span>{subject.periods_per_week} periods/week</span>
                                    </div>
                                    <div className="meta-item">
                                        <i className="icon-award"></i>
                                        <span>{subject.credits} credits</span>
                                    </div>
                                </div>

                                <div className="syllabus-progress">
                                    <div className="progress-header">
                                        <span>Syllabus Progress</span>
                                        <span style={{ color: progressColor, fontWeight: 600 }}>
                                            {subject.syllabus_progress}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{
                                                width: `${subject.syllabus_progress}%`,
                                                backgroundColor: progressColor
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Subject Detail Modal */}
            {showModal && selectedSubject && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content subject-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderLeftColor: getSubjectColor(selectedSubject.name) }}>
                            <div className="modal-icon" style={{
                                backgroundColor: `${getSubjectColor(selectedSubject.name)}20`,
                                color: getSubjectColor(selectedSubject.name)
                            }}>
                                {selectedSubject.name.charAt(0)}
                            </div>
                            <div className="modal-title-area">
                                <h2>{selectedSubject.name}</h2>
                                <span className="modal-subtitle">{selectedSubject.code} • {selectedSubject.grade_level_name}</span>
                            </div>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>Teacher</label>
                                    <span>{selectedSubject.teacher_name || 'Not assigned'}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Periods per Week</label>
                                    <span>{selectedSubject.periods_per_week}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Credits</label>
                                    <span>{selectedSubject.credits}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Type</label>
                                    <span>{selectedSubject.is_elective ? 'Elective' : 'Core'}</span>
                                </div>
                            </div>

                            <div className="syllabus-section">
                                <h4>Syllabus Progress</h4>
                                <div className="full-progress-bar">
                                    <div
                                        className="full-progress-fill"
                                        style={{ width: `${selectedSubject.syllabus_progress}%` }}
                                    ></div>
                                </div>
                                <p className="progress-text">{selectedSubject.syllabus_progress}% Complete</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            <button className="btn-primary">View Syllabus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubjectsList;
