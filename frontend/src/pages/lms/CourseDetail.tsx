/**
 * LMS Course Detail Page
 * 
 * Displays detailed information about a course including:
 * - Course overview and description
 * - Curriculum (modules and lessons)
 * - Instructor information
 * - Enrollment options
 * - Reviews and ratings
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BookOpen, Clock, Users, Star, ChevronDown, ChevronUp,
    Play, FileText, Video, CheckCircle, Lock, ArrowLeft,
    GraduationCap, Award, BarChart, User, Calendar, Layers
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface Lesson {
    id: string;
    title: string;
    description: string;
    lesson_type: string;
    order: number;
    duration_minutes: number;
    is_preview: boolean;
    is_published: boolean;
}

interface Module {
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: Lesson[];
    is_published: boolean;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    description: string;
    thumbnail: string | null;
    category_name: string;
    instructor_name: string;
    instructor_bio: string;
    difficulty: string;
    course_type: string;
    status: string;
    enrolled_count: number;
    estimated_duration_hours: number;
    average_rating: number;
    is_featured: boolean;
    modules: Module[];
    learning_outcomes: string;
    prerequisites: string;
    passing_percentage: number;
    published_at: string;
    created_at: string;
}

interface Enrollment {
    id: string;
    status: string;
    progress_percentage: number;
    enrolled_at: string;
    last_accessed_at: string;
}

const CourseDetail: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [course, setCourse] = useState<Course | null>(null);
    const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'instructor' | 'reviews'>('overview');

    const fetchCourse = useCallback(async () => {
        if (!courseId) return;
        try {
            const response = await api.get(`/lms/courses/${courseId}/with_curriculum/`);
            setCourse(response.data.data || response.data);

            // Expand first module by default
            const courseData = response.data.data || response.data;
            if (courseData.modules && courseData.modules.length > 0) {
                setExpandedModules(new Set([courseData.modules[0].id]));
            }
        } catch (error) {
            console.error('Failed to fetch course:', error);
        }
    }, [courseId]);

    const checkEnrollment = useCallback(async () => {
        try {
            const response = await api.get('/lms/enrollments/my_courses/');
            const enrollments = response.data.data || response.data;
            const found = enrollments.find((e: any) => e.course?.id === courseId || e.course_id === courseId);
            if (found) {
                setEnrollment(found);
            }
        } catch (error) {
            console.error('Failed to check enrollment:', error);
        }
    }, [courseId]);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchCourse(), checkEnrollment()]);
            setLoading(false);
        };
        loadData();
    }, [fetchCourse, checkEnrollment]);

    const handleEnroll = async () => {
        if (!courseId) return;
        setEnrolling(true);
        try {
            const response = await api.post('/lms/enrollments/enroll/', { course_id: courseId });
            setEnrollment(response.data.data || response.data);
        } catch (error: any) {
            const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to enroll';
            alert(message);
        } finally {
            setEnrolling(false);
        }
    };

    const toggleModule = (moduleId: string) => {
        const newExpanded = new Set(expandedModules);
        if (newExpanded.has(moduleId)) {
            newExpanded.delete(moduleId);
        } else {
            newExpanded.add(moduleId);
        }
        setExpandedModules(newExpanded);
    };

    const getLessonIcon = (type: string) => {
        switch (type) {
            case 'VIDEO': return <Video size={16} />;
            case 'TEXT': return <FileText size={16} />;
            case 'QUIZ': return <CheckCircle size={16} />;
            default: return <Play size={16} />;
        }
    };

    const getDifficultyLabel = (difficulty: string) => {
        const labels: Record<string, string> = {
            'BEGINNER': 'Beginner',
            'INTERMEDIATE': 'Intermediate',
            'ADVANCED': 'Advanced',
            'EXPERT': 'Expert'
        };
        return labels[difficulty] || difficulty;
    };

    const getTotalLessons = () => {
        if (!course) return 0;
        return course.modules.reduce((total, mod) => total + mod.lessons.length, 0);
    };

    const getTotalDuration = () => {
        if (!course) return 0;
        return course.modules.reduce(
            (total, mod) => total + mod.lessons.reduce((t, l) => t + l.duration_minutes, 0),
            0
        );
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <div className="loading-spinner" />
                <p>Loading course...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="lms-error">
                <h2>Course Not Found</h2>
                <button onClick={() => navigate('/lms/courses')}>Back to Courses</button>
            </div>
        );
    }

    return (
        <div className="course-detail-container">
            {/* Hero Section */}
            <div className="course-hero">
                <button className="back-btn" onClick={() => navigate('/lms/courses')}>
                    <ArrowLeft size={18} />
                    Back to Courses
                </button>

                <div className="hero-content">
                    <div className="hero-text">
                        <span className="course-category-badge">{course.category_name}</span>
                        <h1>{course.title}</h1>
                        <p className="course-short-desc">{course.short_description}</p>

                        <div className="course-meta-row">
                            <span className="meta-item">
                                <User size={16} />
                                {course.instructor_name || 'Unknown'}
                            </span>
                            <span className="meta-item">
                                <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                                {course.average_rating?.toFixed(1) || 'N/A'}
                            </span>
                            <span className="meta-item">
                                <Users size={16} />
                                {course.enrolled_count} students
                            </span>
                            <span className="meta-item">
                                <Calendar size={16} />
                                Updated {new Date(course.published_at || course.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="course-badges">
                            <span className="badge difficulty">{getDifficultyLabel(course.difficulty)}</span>
                            <span className="badge type">{course.course_type.replace('_', ' ')}</span>
                        </div>
                    </div>

                    <div className="hero-card">
                        {course.thumbnail && (
                            <img src={course.thumbnail} alt={course.title} className="hero-thumbnail" />
                        )}

                        <div className="hero-card-content">
                            <div className="course-stats">
                                <div className="stat">
                                    <Layers size={18} />
                                    <span>{course.modules.length} Modules</span>
                                </div>
                                <div className="stat">
                                    <Play size={18} />
                                    <span>{getTotalLessons()} Lessons</span>
                                </div>
                                <div className="stat">
                                    <Clock size={18} />
                                    <span>{Math.round(getTotalDuration() / 60)}h {getTotalDuration() % 60}m</span>
                                </div>
                                <div className="stat">
                                    <Award size={18} />
                                    <span>Certificate</span>
                                </div>
                            </div>

                            {enrollment ? (
                                <div className="enrollment-status">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${enrollment.progress_percentage}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {Math.round(enrollment.progress_percentage)}% Complete
                                    </span>
                                    <button
                                        className="btn-continue"
                                        onClick={() => navigate(`/lms/courses/${courseId}/learn`)}
                                    >
                                        Continue Learning
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="btn-enroll"
                                    onClick={handleEnroll}
                                    disabled={enrolling}
                                >
                                    {enrolling ? 'Enrolling...' : 'Enroll Now - Free'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="course-tabs">
                <button
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'curriculum' ? 'active' : ''}
                    onClick={() => setActiveTab('curriculum')}
                >
                    Curriculum
                </button>
                <button
                    className={activeTab === 'instructor' ? 'active' : ''}
                    onClick={() => setActiveTab('instructor')}
                >
                    Instructor
                </button>
                <button
                    className={activeTab === 'reviews' ? 'active' : ''}
                    onClick={() => setActiveTab('reviews')}
                >
                    Reviews
                </button>
            </div>

            {/* Tab Content */}
            <div className="course-tab-content">
                {activeTab === 'overview' && (
                    <div className="tab-overview">
                        <div className="overview-section">
                            <h2>About This Course</h2>
                            <div
                                className="course-description"
                                dangerouslySetInnerHTML={{ __html: course.description || course.short_description }}
                            />
                        </div>

                        {course.learning_outcomes && (
                            <div className="overview-section">
                                <h2>What You'll Learn</h2>
                                <div
                                    className="learning-outcomes"
                                    dangerouslySetInnerHTML={{ __html: course.learning_outcomes }}
                                />
                            </div>
                        )}

                        {course.prerequisites && (
                            <div className="overview-section">
                                <h2>Prerequisites</h2>
                                <div
                                    className="prerequisites"
                                    dangerouslySetInnerHTML={{ __html: course.prerequisites }}
                                />
                            </div>
                        )}

                        <div className="overview-section">
                            <h2>Course Information</h2>
                            <div className="info-grid">
                                <div className="info-item">
                                    <BarChart size={20} />
                                    <div>
                                        <span className="label">Skill Level</span>
                                        <span className="value">{getDifficultyLabel(course.difficulty)}</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Clock size={20} />
                                    <div>
                                        <span className="label">Duration</span>
                                        <span className="value">{course.estimated_duration_hours} hours</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <GraduationCap size={20} />
                                    <div>
                                        <span className="label">Passing Score</span>
                                        <span className="value">{course.passing_percentage}%</span>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <Award size={20} />
                                    <div>
                                        <span className="label">Certificate</span>
                                        <span className="value">Yes, upon completion</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div className="tab-curriculum">
                        <div className="curriculum-header">
                            <h2>Course Content</h2>
                            <span className="curriculum-summary">
                                {course.modules.length} modules • {getTotalLessons()} lessons • {Math.round(getTotalDuration() / 60)}h {getTotalDuration() % 60}m total
                            </span>
                        </div>

                        <div className="curriculum-list">
                            {course.modules.map((module, index) => (
                                <div key={module.id} className="curriculum-module">
                                    <div
                                        className="module-header"
                                        onClick={() => toggleModule(module.id)}
                                    >
                                        <div className="module-info">
                                            <span className="module-number">Module {index + 1}</span>
                                            <h3>{module.title}</h3>
                                            <span className="module-meta">
                                                {module.lessons.length} lessons •
                                                {module.lessons.reduce((t, l) => t + l.duration_minutes, 0)} min
                                            </span>
                                        </div>
                                        {expandedModules.has(module.id) ? (
                                            <ChevronUp size={20} />
                                        ) : (
                                            <ChevronDown size={20} />
                                        )}
                                    </div>

                                    {expandedModules.has(module.id) && (
                                        <div className="module-lessons">
                                            {module.lessons.map((lesson) => (
                                                <div key={lesson.id} className="lesson-item">
                                                    <div className="lesson-icon">
                                                        {getLessonIcon(lesson.lesson_type)}
                                                    </div>
                                                    <div className="lesson-info">
                                                        <span className="lesson-title">{lesson.title}</span>
                                                        <span className="lesson-duration">{lesson.duration_minutes} min</span>
                                                    </div>
                                                    {lesson.is_preview ? (
                                                        <span className="preview-badge">Preview</span>
                                                    ) : !enrollment ? (
                                                        <Lock size={14} className="lock-icon" />
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'instructor' && (
                    <div className="tab-instructor">
                        <div className="instructor-card">
                            <div className="instructor-avatar">
                                <User size={48} />
                            </div>
                            <div className="instructor-info">
                                <h2>{course.instructor_name || 'Unknown Instructor'}</h2>
                                <p className="instructor-title">Course Instructor</p>
                                {course.instructor_bio && (
                                    <p className="instructor-bio">{course.instructor_bio}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="tab-reviews">
                        <div className="reviews-summary">
                            <div className="rating-big">
                                <span className="rating-value">{course.average_rating?.toFixed(1) || 'N/A'}</span>
                                <div className="rating-stars">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={20}
                                            fill={star <= (course.average_rating || 0) ? '#f59e0b' : 'transparent'}
                                            stroke="#f59e0b"
                                        />
                                    ))}
                                </div>
                                <span className="rating-count">Course Rating</span>
                            </div>
                        </div>
                        <p className="reviews-placeholder">
                            Reviews feature coming soon...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseDetail;
