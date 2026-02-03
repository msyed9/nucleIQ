/**
 * Student Progress Dashboard
 * Track and display student learning progress across courses
 */

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    Award,
    Clock,
    TrendingUp,
    Play,
    CheckCircle,
    Circle,
    ChevronRight,
    Download,
    Calendar,
    Target,
    Star,
    RefreshCw,
    BarChart2,
    Trophy
} from 'lucide-react';
import api from '../../services/api';
import './LMS.css';

interface CourseProgress {
    id: string;
    course: {
        id: string;
        title: string;
        thumbnail: string | null;
        instructor: { full_name: string } | null;
    };
    progress_percentage: number;
    completed_lessons: number;
    total_lessons: number;
    last_accessed: string;
    enrolled_at: string;
    status: 'in_progress' | 'completed' | 'not_started';
    certificate_id?: string;
}

interface LearningStats {
    total_courses: number;
    completed_courses: number;
    in_progress_courses: number;
    total_hours_spent: number;
    certificates_earned: number;
    quizzes_completed: number;
    average_quiz_score: number;
    current_streak: number;
}

interface RecentActivity {
    id: string;
    activity_type: 'lesson_complete' | 'quiz_complete' | 'course_complete' | 'enrollment';
    title: string;
    course_title: string;
    timestamp: string;
    details?: string;
}

const StudentProgress: React.FC = () => {
    const [coursesProgress, setCoursesProgress] = useState<CourseProgress[]>([]);
    const [stats, setStats] = useState<LearningStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed'>('all');

    useEffect(() => {
        fetchProgressData();
    }, []);

    const fetchProgressData = async () => {
        try {
            setLoading(true);
            const [progressRes, statsRes, activityRes] = await Promise.all([
                api.get('/lms/my-progress/'),
                api.get('/lms/my-stats/'),
                api.get('/lms/my-activity/')
            ]);

            setCoursesProgress(Array.isArray(progressRes.data) ? progressRes.data : progressRes.data?.results || []);
            setStats(statsRes.data);
            setRecentActivity(Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.results || []);
        } catch (error) {
            console.error('Error fetching progress data:', error);
            // Set mock data for demo
            setStats({
                total_courses: 8,
                completed_courses: 3,
                in_progress_courses: 4,
                total_hours_spent: 45,
                certificates_earned: 3,
                quizzes_completed: 12,
                average_quiz_score: 85,
                current_streak: 7
            });
        } finally {
            setLoading(false);
        }
    };

    const getProgressColor = (percentage: number) => {
        if (percentage >= 100) return 'var(--color-success)';
        if (percentage >= 60) return 'var(--color-primary-500)';
        if (percentage >= 30) return 'var(--color-warning)';
        return 'var(--color-text-tertiary)';
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'lesson_complete': return <CheckCircle size={16} className="activity-icon lesson" />;
            case 'quiz_complete': return <Trophy size={16} className="activity-icon quiz" />;
            case 'course_complete': return <Award size={16} className="activity-icon course" />;
            case 'enrollment': return <BookOpen size={16} className="activity-icon enroll" />;
            default: return <Circle size={16} />;
        }
    };

    const filterCourses = (courses: CourseProgress[]) => {
        if (activeTab === 'all') return courses;
        if (activeTab === 'completed') return courses.filter(c => c.status === 'completed');
        return courses.filter(c => c.status === 'in_progress');
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const formatTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        return 'Just now';
    };

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading your progress...</p>
            </div>
        );
    }

    return (
        <div className="student-progress">
            <div className="page-header">
                <div>
                    <h1>📊 My Learning Progress</h1>
                    <p>Track your learning journey and achievements</p>
                </div>
                <button className="btn-secondary">
                    <Download size={16} />
                    Export Report
                </button>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="stats-grid">
                    <div className="stat-card highlight">
                        <div className="stat-icon streak">
                            <TrendingUp size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.current_streak}</span>
                            <span className="stat-label">Day Streak 🔥</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon courses">
                            <BookOpen size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.in_progress_courses}</span>
                            <span className="stat-label">In Progress</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon completed">
                            <CheckCircle size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.completed_courses}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon hours">
                            <Clock size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.total_hours_spent}h</span>
                            <span className="stat-label">Learning Hours</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon certificates">
                            <Award size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.certificates_earned}</span>
                            <span className="stat-label">Certificates</span>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon quizzes">
                            <Target size={24} />
                        </div>
                        <div className="stat-content">
                            <span className="stat-value">{stats.average_quiz_score}%</span>
                            <span className="stat-label">Avg Quiz Score</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="progress-content">
                {/* Course Progress */}
                <div className="progress-main">
                    <div className="section-header">
                        <h2>My Courses</h2>
                        <div className="tab-filters">
                            <button
                                className={activeTab === 'all' ? 'active' : ''}
                                onClick={() => setActiveTab('all')}
                            >
                                All ({coursesProgress.length})
                            </button>
                            <button
                                className={activeTab === 'in_progress' ? 'active' : ''}
                                onClick={() => setActiveTab('in_progress')}
                            >
                                In Progress
                            </button>
                            <button
                                className={activeTab === 'completed' ? 'active' : ''}
                                onClick={() => setActiveTab('completed')}
                            >
                                Completed
                            </button>
                        </div>
                    </div>

                    {filterCourses(coursesProgress).length === 0 ? (
                        <div className="empty-state">
                            <BookOpen size={48} />
                            <h3>No courses found</h3>
                            <p>Start learning by enrolling in courses</p>
                        </div>
                    ) : (
                        <div className="courses-progress-list">
                            {filterCourses(coursesProgress).map(cp => (
                                <div key={cp.id} className="course-progress-card">
                                    <div className="course-thumbnail">
                                        {cp.course.thumbnail ? (
                                            <img src={cp.course.thumbnail} alt={cp.course.title} />
                                        ) : (
                                            <BookOpen size={24} />
                                        )}
                                        {cp.status === 'completed' && (
                                            <div className="completed-badge">
                                                <CheckCircle size={16} />
                                            </div>
                                        )}
                                    </div>
                                    <div className="course-info">
                                        <h3>{cp.course.title}</h3>
                                        {cp.course.instructor && (
                                            <span className="instructor">by {cp.course.instructor.full_name}</span>
                                        )}
                                        <div className="progress-bar-container">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{
                                                        width: `${cp.progress_percentage}%`,
                                                        backgroundColor: getProgressColor(cp.progress_percentage)
                                                    }}
                                                />
                                            </div>
                                            <span className="progress-text">
                                                {cp.progress_percentage}% • {cp.completed_lessons}/{cp.total_lessons} lessons
                                            </span>
                                        </div>
                                        <div className="course-meta">
                                            <span>
                                                <Calendar size={12} />
                                                Last accessed: {formatTimeAgo(cp.last_accessed)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="course-actions">
                                        {cp.status === 'completed' ? (
                                            cp.certificate_id ? (
                                                <button className="btn-certificate">
                                                    <Award size={16} />
                                                    View Certificate
                                                </button>
                                            ) : (
                                                <button className="btn-review">Review Course</button>
                                            )
                                        ) : (
                                            <button className="btn-continue">
                                                <Play size={16} />
                                                Continue
                                            </button>
                                        )}
                                        <ChevronRight size={20} className="chevron" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity Sidebar */}
                <div className="activity-sidebar">
                    <h3>Recent Activity</h3>
                    {recentActivity.length === 0 ? (
                        <div className="empty-activity">
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {recentActivity.map(activity => (
                                <div key={activity.id} className="activity-item">
                                    {getActivityIcon(activity.activity_type)}
                                    <div className="activity-content">
                                        <span className="activity-title">{activity.title}</span>
                                        <span className="activity-course">{activity.course_title}</span>
                                        <span className="activity-time">{formatTimeAgo(activity.timestamp)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Achievements Preview */}
                    <div className="achievements-preview">
                        <h4>
                            <Trophy size={16} />
                            Recent Achievements
                        </h4>
                        <div className="achievement-badges">
                            <div className="badge earned" title="First Course Completed">
                                <Star size={20} />
                            </div>
                            <div className="badge earned" title="Week Streak">
                                <TrendingUp size={20} />
                            </div>
                            <div className="badge earned" title="Quiz Master">
                                <Target size={20} />
                            </div>
                            <div className="badge locked" title="10 Courses Completed">
                                <Award size={20} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudentProgress;
