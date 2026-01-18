/**
 * Syllabus Progress Page
 * Track syllabus coverage and chapter completion across subjects
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import './SyllabusProgress.css';

interface Chapter {
    id: number;
    name: string;
    description?: string;
    order: number;
    estimated_hours: number;
    topics: string[];
    is_completed: boolean;
    completed_date?: string;
}

interface Syllabus {
    id: number;
    name: string;
    subject_id: number;
    subject_name: string;
    grade_level_id: number;
    grade_level_name: string;
    total_hours: number;
    chapters: Chapter[];
    completion_percentage: number;
    completed_chapters: number;
    total_chapters: number;
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
};

const getMockSyllabi = (): Syllabus[] => [
    {
        id: 1, name: 'Mathematics Syllabus', subject_id: 1, subject_name: 'Mathematics', grade_level_id: 10, grade_level_name: 'Grade 10', total_hours: 120,
        completion_percentage: 65, completed_chapters: 8, total_chapters: 12,
        chapters: [
            { id: 1, name: 'Real Numbers', order: 1, estimated_hours: 10, topics: ['Euclid\'s Division Lemma', 'Fundamental Theorem of Arithmetic', 'Irrational Numbers'], is_completed: true, completed_date: '2025-08-15' },
            { id: 2, name: 'Polynomials', order: 2, estimated_hours: 12, topics: ['Zeros of a Polynomial', 'Division Algorithm', 'Quadratic Polynomials'], is_completed: true, completed_date: '2025-09-01' },
            { id: 3, name: 'Linear Equations', order: 3, estimated_hours: 10, topics: ['Pair of Linear Equations', 'Graphical Method', 'Substitution Method'], is_completed: true, completed_date: '2025-09-20' },
            { id: 4, name: 'Quadratic Equations', order: 4, estimated_hours: 12, topics: ['Standard Form', 'Factorization', 'Quadratic Formula'], is_completed: true, completed_date: '2025-10-10' },
            { id: 5, name: 'Arithmetic Progressions', order: 5, estimated_hours: 10, topics: ['nth Term', 'Sum of n Terms', 'Applications'], is_completed: true, completed_date: '2025-10-30' },
            { id: 6, name: 'Triangles', order: 6, estimated_hours: 10, topics: ['Similarity', 'Criteria for Similarity', 'Areas of Similar Triangles'], is_completed: true, completed_date: '2025-11-15' },
            { id: 7, name: 'Coordinate Geometry', order: 7, estimated_hours: 10, topics: ['Distance Formula', 'Section Formula', 'Area of Triangle'], is_completed: true, completed_date: '2025-12-01' },
            { id: 8, name: 'Trigonometry', order: 8, estimated_hours: 12, topics: ['Trigonometric Ratios', 'Trigonometric Identities', 'Heights and Distances'], is_completed: true, completed_date: '2025-12-20' },
            { id: 9, name: 'Circles', order: 9, estimated_hours: 8, topics: ['Tangent to a Circle', 'Number of Tangents'], is_completed: false },
            { id: 10, name: 'Constructions', order: 10, estimated_hours: 6, topics: ['Division of Line Segment', 'Tangents to a Circle'], is_completed: false },
            { id: 11, name: 'Areas Related to Circles', order: 11, estimated_hours: 10, topics: ['Circumference', 'Area of Circle', 'Sector and Segment'], is_completed: false },
            { id: 12, name: 'Surface Areas and Volumes', order: 12, estimated_hours: 10, topics: ['Cube', 'Cylinder', 'Cone', 'Sphere'], is_completed: false },
        ]
    },
    {
        id: 2, name: 'Physics Syllabus', subject_id: 3, subject_name: 'Physics', grade_level_id: 10, grade_level_name: 'Grade 10', total_hours: 100,
        completion_percentage: 55, completed_chapters: 5, total_chapters: 9,
        chapters: [
            { id: 13, name: 'Light - Reflection and Refraction', order: 1, estimated_hours: 12, topics: ['Laws of Reflection', 'Spherical Mirrors', 'Refraction'], is_completed: true },
            { id: 14, name: 'Human Eye', order: 2, estimated_hours: 8, topics: ['Anatomy of Eye', 'Defects of Vision', 'Atmospheric Refraction'], is_completed: true },
            { id: 15, name: 'Electricity', order: 3, estimated_hours: 14, topics: ['Electric Current', 'Ohm\'s Law', 'Resistance'], is_completed: true },
            { id: 16, name: 'Magnetic Effects of Current', order: 4, estimated_hours: 10, topics: ['Magnetic Field', 'Flemings Rules', 'Electric Motor'], is_completed: true },
            { id: 17, name: 'Sources of Energy', order: 5, estimated_hours: 8, topics: ['Fossil Fuels', 'Renewable Energy', 'Nuclear Energy'], is_completed: true },
            { id: 18, name: 'Chemical Reactions', order: 6, estimated_hours: 12, topics: ['Types of Reactions', 'Balancing Equations'], is_completed: false },
            { id: 19, name: 'Acids, Bases and Salts', order: 7, estimated_hours: 10, topics: ['Properties', 'Indicators', 'pH Scale'], is_completed: false },
            { id: 20, name: 'Metals and Non-metals', order: 8, estimated_hours: 12, topics: ['Properties', 'Reactivity Series', 'Extraction'], is_completed: false },
            { id: 21, name: 'Carbon Compounds', order: 9, estimated_hours: 14, topics: ['Bonding', 'Organic Compounds', 'Polymers'], is_completed: false },
        ]
    },
    {
        id: 3, name: 'English Syllabus', subject_id: 2, subject_name: 'English', grade_level_id: 10, grade_level_name: 'Grade 10', total_hours: 90,
        completion_percentage: 70, completed_chapters: 7, total_chapters: 10,
        chapters: [
            { id: 22, name: 'A Letter to God', order: 1, estimated_hours: 6, topics: ['Comprehension', 'Vocabulary', 'Writing'], is_completed: true },
            { id: 23, name: 'Nelson Mandela', order: 2, estimated_hours: 8, topics: ['Biography', 'Comprehension', 'Values'], is_completed: true },
            { id: 24, name: 'Two Stories about Flying', order: 3, estimated_hours: 6, topics: ['First Flight', 'Black Aeroplane'], is_completed: true },
            { id: 25, name: 'From the Diary of Anne Frank', order: 4, estimated_hours: 8, topics: ['Diary Writing', 'Historical Context'], is_completed: true },
            { id: 26, name: 'The Hundred Dresses', order: 5, estimated_hours: 10, topics: ['Part I', 'Part II', 'Theme Analysis'], is_completed: true },
            { id: 27, name: 'Glimpses of India', order: 6, estimated_hours: 10, topics: ['A Baker from Goa', 'Coorg', 'Tea from Assam'], is_completed: true },
            { id: 28, name: 'Mijbil the Otter', order: 7, estimated_hours: 8, topics: ['Animal Story', 'Comprehension'], is_completed: true },
            { id: 29, name: 'Madam Rides the Bus', order: 8, estimated_hours: 8, topics: ['Character Study', 'Theme'], is_completed: false },
            { id: 30, name: 'The Sermon at Benares', order: 9, estimated_hours: 8, topics: ['Buddha\'s Teaching', 'Values'], is_completed: false },
            { id: 31, name: 'The Proposal', order: 10, estimated_hours: 8, topics: ['Drama', 'Play Analysis'], is_completed: false },
        ]
    },
];

const SyllabusProgress: React.FC = () => {
    const [selectedSyllabus, setSelectedSyllabus] = useState<Syllabus | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [expandedChapters, setExpandedChapters] = useState<number[]>([]);

    const { data: syllabi = getMockSyllabi(), isLoading } = useQuery({
        queryKey: ['syllabus'],
        queryFn: async () => {
            try {
                const response = await api.get('/academics/syllabus/');
                return response.data.results || response.data || getMockSyllabi();
            } catch {
                return getMockSyllabi();
            }
        },
    });

    const getSubjectColor = (name: string) => SUBJECT_COLORS[name] || '#6B7280';

    const getProgressColor = (percentage: number) => {
        if (percentage >= 75) return '#10B981';
        if (percentage >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const overallProgress = syllabi.length > 0
        ? Math.round(syllabi.reduce((acc: number, s: Syllabus) => acc + s.completion_percentage, 0) / syllabi.length)
        : 0;

    const totalChapters = syllabi.reduce((acc: number, s: Syllabus) => acc + s.total_chapters, 0);
    const completedChapters = syllabi.reduce((acc: number, s: Syllabus) => acc + s.completed_chapters, 0);

    const openSyllabusDetail = (syllabus: Syllabus) => {
        setSelectedSyllabus(syllabus);
        setExpandedChapters([]);
        setShowModal(true);
    };

    const toggleChapter = (chapterId: number) => {
        setExpandedChapters(prev =>
            prev.includes(chapterId)
                ? prev.filter(id => id !== chapterId)
                : [...prev, chapterId]
        );
    };

    if (isLoading) {
        return (
            <div className="syllabus-loading">
                <div className="loading-spinner"></div>
                <p>Loading syllabus...</p>
            </div>
        );
    }

    return (
        <div className="syllabus-container">
            <div className="syllabus-header">
                <div className="header-content">
                    <h1>Syllabus Progress</h1>
                    <p className="header-subtitle">Track chapter completion and syllabus coverage</p>
                </div>
            </div>

            {/* Overall Progress Card */}
            <div className="overall-progress-card">
                <div className="progress-circle">
                    <svg viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" className="progress-bg" />
                        <circle
                            cx="50" cy="50" r="45"
                            className="progress-fill"
                            style={{
                                strokeDasharray: `${overallProgress * 2.83} 283`,
                                stroke: getProgressColor(overallProgress)
                            }}
                        />
                    </svg>
                    <div className="progress-text">
                        <span className="progress-value">{overallProgress}%</span>
                        <span className="progress-label">Complete</span>
                    </div>
                </div>
                <div className="progress-stats">
                    <div className="stat-item">
                        <span className="stat-number">{syllabi.length}</span>
                        <span className="stat-label">Subjects</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{completedChapters}</span>
                        <span className="stat-label">Chapters Done</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-number">{totalChapters - completedChapters}</span>
                        <span className="stat-label">Remaining</span>
                    </div>
                </div>
            </div>

            {/* Subject Syllabus List */}
            <div className="syllabus-grid">
                {syllabi.map((syllabus: Syllabus) => {
                    const color = getSubjectColor(syllabus.subject_name);
                    const progressColor = getProgressColor(syllabus.completion_percentage);

                    return (
                        <div
                            key={syllabus.id}
                            className="syllabus-card"
                            onClick={() => openSyllabusDetail(syllabus)}
                        >
                            <div className="card-header" style={{ borderLeftColor: color }}>
                                <div className="subject-icon" style={{ backgroundColor: `${color}20`, color }}>
                                    {syllabus.subject_name.charAt(0)}
                                </div>
                                <div className="subject-info">
                                    <h3>{syllabus.subject_name}</h3>
                                    <span className="grade-label">{syllabus.grade_level_name}</span>
                                </div>
                            </div>

                            <div className="card-body">
                                <div className="progress-overview">
                                    <div className="progress-header">
                                        <span>Progress</span>
                                        <span style={{ color: progressColor, fontWeight: 700 }}>
                                            {syllabus.completion_percentage}%
                                        </span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-bar-fill"
                                            style={{
                                                width: `${syllabus.completion_percentage}%`,
                                                backgroundColor: progressColor
                                            }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="chapter-stats">
                                    <div className="chapter-stat">
                                        <span className="stat-value">{syllabus.completed_chapters}</span>
                                        <span className="stat-label">Completed</span>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="chapter-stat">
                                        <span className="stat-value">{syllabus.total_chapters - syllabus.completed_chapters}</span>
                                        <span className="stat-label">Remaining</span>
                                    </div>
                                    <div className="stat-divider"></div>
                                    <div className="chapter-stat">
                                        <span className="stat-value">{syllabus.total_hours}h</span>
                                        <span className="stat-label">Total Hours</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Syllabus Detail Modal */}
            {showModal && selectedSyllabus && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content syllabus-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header" style={{ borderLeftColor: getSubjectColor(selectedSyllabus.subject_name) }}>
                            <div className="modal-title-row">
                                <div
                                    className="modal-icon"
                                    style={{
                                        backgroundColor: `${getSubjectColor(selectedSyllabus.subject_name)}20`,
                                        color: getSubjectColor(selectedSyllabus.subject_name)
                                    }}
                                >
                                    {selectedSyllabus.subject_name.charAt(0)}
                                </div>
                                <div className="modal-title-area">
                                    <h2>{selectedSyllabus.subject_name}</h2>
                                    <span className="modal-subtitle">{selectedSyllabus.grade_level_name} • {selectedSyllabus.total_hours} hours</span>
                                </div>
                                <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                            </div>
                            <div className="modal-progress">
                                <div className="mp-bar">
                                    <div
                                        className="mp-fill"
                                        style={{
                                            width: `${selectedSyllabus.completion_percentage}%`,
                                            backgroundColor: getProgressColor(selectedSyllabus.completion_percentage)
                                        }}
                                    ></div>
                                </div>
                                <span className="mp-text">{selectedSyllabus.completion_percentage}% Complete</span>
                            </div>
                        </div>

                        <div className="modal-body chapters-list">
                            <h4>Chapters ({selectedSyllabus.chapters.length})</h4>
                            {selectedSyllabus.chapters.map((chapter) => (
                                <div key={chapter.id} className="chapter-item">
                                    <div
                                        className="chapter-header"
                                        onClick={() => toggleChapter(chapter.id)}
                                    >
                                        <div className={`chapter-status ${chapter.is_completed ? 'completed' : 'pending'}`}>
                                            {chapter.is_completed ? '✓' : chapter.order}
                                        </div>
                                        <div className="chapter-info">
                                            <span className="chapter-name">{chapter.name}</span>
                                            <span className="chapter-meta">{chapter.estimated_hours}h • {chapter.topics.length} topics</span>
                                        </div>
                                        <span className={`expand-icon ${expandedChapters.includes(chapter.id) ? 'expanded' : ''}`}>
                                            ▼
                                        </span>
                                    </div>

                                    {expandedChapters.includes(chapter.id) && (
                                        <div className="chapter-topics">
                                            {chapter.topics.map((topic, idx) => (
                                                <div key={idx} className="topic-item">
                                                    <span className="topic-bullet">•</span>
                                                    <span>{topic}</span>
                                                </div>
                                            ))}
                                            {chapter.is_completed && chapter.completed_date && (
                                                <div className="completed-date">
                                                    Completed on {new Date(chapter.completed_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SyllabusProgress;
