/**
 * My Courses Page
 * 
 * Displays the current user's enrolled courses with progress tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    BookOpen, Clock, CheckCircle, Play, ArrowRight,
    GraduationCap, Award, BarChart
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface Enrollment {
    id: string;
    course: {
        id: string;
        title: string;
        thumbnail: string | null;
        category_name: string;
        instructor_name: string;
        estimated_duration_hours: number;
    };
    status: string;
    progress_percentage: number;
    enrolled_at: string;
    last_accessed_at: string;
    completed_at: string | null;
    final_score: number | null;
}

const MyCourses: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

    const fetchEnrollments = useCallback(async () => {
        try {
            const response = await api.get('/lms/enrollments/my_courses/');
            setEnrollments(response.data.data || response.data);
        } catch (error) {
            console.error('Failed to fetch enrollments:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEnrollments();
    }, [fetchEnrollments]);

    const filteredEnrollments = enrollments.filter(e => {
        if (filter === 'active') return e.status === 'ACTIVE';
        if (filter === 'completed') return e.status === 'COMPLETED';
        return true;
    });

    const getStatusBadge = (status: string, progress: number) => {
        if (status === 'COMPLETED') {
            return <span className="status-badge completed"><CheckCircle size={14} /> Completed</span>;
        }
        if (progress > 0) {
            return <span className="status-badge in-progress"><Play size={14} /> In Progress</span>;
        }
        return <span className="status-badge not-started"><Clock size={14} /> Not Started</span>;
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <div className="loading-spinner" />
                <p>Loading your courses...</p>
            </div>
        );
    }

    return (
        <div className="lms-container">
            {/* Header */}
            <div className="lms-header">
                <div className="lms-header-content">
                    <div className="lms-header-text">
                        <h1>
                            <GraduationCap className="header-icon" />
                            My Learning
                        </h1>
                        <p>Track your progress and continue learning</p>
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="lms-stats-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-icon courses">
                        <BookOpen size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{enrollments.length}</span>
                        <span className="stat-label">Total Courses</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon enrollments">
                        <Play size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {enrollments.filter(e => e.status === 'ACTIVE' && e.progress_percentage > 0).length}
                        </span>
                        <span className="stat-label">In Progress</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon rating">
                        <Award size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">
                            {enrollments.filter(e => e.status === 'COMPLETED').length}
                        </span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="my-courses-filters">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All Courses ({enrollments.length})
                </button>
                <button
                    className={filter === 'active' ? 'active' : ''}
                    onClick={() => setFilter('active')}
                >
                    In Progress ({enrollments.filter(e => e.status === 'ACTIVE').length})
                </button>
                <button
                    className={filter === 'completed' ? 'active' : ''}
                    onClick={() => setFilter('completed')}
                >
                    Completed ({enrollments.filter(e => e.status === 'COMPLETED').length})
                </button>
            </div>

            {/* Course List */}
            <div className="my-courses-list">
                {filteredEnrollments.length === 0 ? (
                    <div className="no-courses">
                        <BookOpen size={48} />
                        <h3>
                            {filter === 'all'
                                ? "You haven't enrolled in any courses yet"
                                : `No ${filter} courses`
                            }
                        </h3>
                        <p>Explore our course catalog to get started</p>
                        <button
                            className="btn-primary"
                            onClick={() => navigate('/lms/courses')}
                        >
                            Browse Courses
                        </button>
                    </div>
                ) : (
                    filteredEnrollments.map(enrollment => (
                        <div key={enrollment.id} className="my-course-card">
                            <div className="my-course-thumbnail">
                                {enrollment.course.thumbnail ? (
                                    <img src={enrollment.course.thumbnail} alt={enrollment.course.title} />
                                ) : (
                                    <div className="thumbnail-placeholder">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                            </div>

                            <div className="my-course-content">
                                <div className="my-course-header">
                                    <span className="category">{enrollment.course.category_name}</span>
                                    {getStatusBadge(enrollment.status, enrollment.progress_percentage)}
                                </div>

                                <h3>{enrollment.course.title}</h3>

                                <p className="instructor">By {enrollment.course.instructor_name || 'Unknown'}</p>

                                <div className="progress-section">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${enrollment.progress_percentage}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">
                                        {Math.round(enrollment.progress_percentage)}% Complete
                                    </span>
                                </div>

                                <div className="my-course-footer">
                                    <span className="last-accessed">
                                        {enrollment.last_accessed_at
                                            ? `Last accessed: ${new Date(enrollment.last_accessed_at).toLocaleDateString()}`
                                            : `Enrolled: ${new Date(enrollment.enrolled_at).toLocaleDateString()}`
                                        }
                                    </span>
                                    <button
                                        className="continue-btn"
                                        onClick={() => navigate(`/lms/courses/${enrollment.course.id}`)}
                                    >
                                        {enrollment.progress_percentage > 0 ? 'Continue' : 'Start'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>

                                {enrollment.status === 'COMPLETED' && enrollment.final_score && (
                                    <div className="completion-info">
                                        <Award size={16} />
                                        <span>Score: {enrollment.final_score.toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyCourses;
