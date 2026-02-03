/**
 * Enrollment Management Page
 * View and manage course enrollments
 */

import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Download,
    UserPlus,
    UserMinus,
    Eye,
    RefreshCw,
    Calendar,
    BookOpen,
    CheckCircle,
    Clock,
    AlertCircle,
    BarChart3,
    X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './LMS.css';

interface Enrollment {
    id: string;
    student: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        photo?: string;
    };
    course: {
        id: string;
        title: string;
    };
    enrolled_at: string;
    completed_at: string | null;
    progress_percentage: number;
    status: 'active' | 'completed' | 'dropped';
}

interface Course {
    id: string;
    title: string;
    enrollment_count?: number;
}

const EnrollmentManagement: React.FC = () => {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string>('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [enrollForm, setEnrollForm] = useState({ student_id: '', course_id: '' });
    const [saving, setSaving] = useState(false);

    // Stats
    const [stats, setStats] = useState({
        totalEnrollments: 0,
        activeEnrollments: 0,
        completedEnrollments: 0,
        averageProgress: 0
    });

    useEffect(() => {
        fetchData();
    }, [selectedCourse, statusFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [enrollmentsRes, coursesRes] = await Promise.all([
                api.get('/lms/enrollments/', {
                    params: {
                        course: selectedCourse || undefined,
                        status: statusFilter !== 'all' ? statusFilter : undefined
                    }
                }),
                api.get('/lms/courses/')
            ]);

            const enrollmentsData = Array.isArray(enrollmentsRes.data)
                ? enrollmentsRes.data
                : enrollmentsRes.data?.results || [];

            const coursesData = Array.isArray(coursesRes.data)
                ? coursesRes.data
                : coursesRes.data?.results || [];

            setEnrollments(enrollmentsData);
            setCourses(coursesData);

            // Calculate stats
            const active = enrollmentsData.filter((e: Enrollment) => e.status === 'active').length;
            const completed = enrollmentsData.filter((e: Enrollment) => e.status === 'completed').length;
            const avgProgress = enrollmentsData.length > 0
                ? enrollmentsData.reduce((sum: number, e: Enrollment) => sum + e.progress_percentage, 0) / enrollmentsData.length
                : 0;

            setStats({
                totalEnrollments: enrollmentsData.length,
                activeEnrollments: active,
                completedEnrollments: completed,
                averageProgress: Math.round(avgProgress)
            });
        } catch (error) {
            console.error('Error fetching enrollments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async () => {
        if (!enrollForm.student_id || !enrollForm.course_id) {
            alert('Please select both student and course');
            return;
        }
        setSaving(true);
        try {
            await api.post('/lms/enrollments/', {
                student: enrollForm.student_id,
                course: enrollForm.course_id
            });
            fetchData();
            setShowEnrollModal(false);
            setEnrollForm({ student_id: '', course_id: '' });
        } catch (error) {
            console.error('Error enrolling student:', error);
            alert('Failed to enroll student');
        } finally {
            setSaving(false);
        }
    };

    const handleUnenroll = async (enrollmentId: string) => {
        if (!confirm('Are you sure you want to remove this enrollment?')) return;
        try {
            await api.delete(`/lms/enrollments/${enrollmentId}/`);
            fetchData();
        } catch (error) {
            console.error('Error unenrolling student:', error);
            alert('Failed to unenroll student');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="status-badge active"><Clock size={12} /> Active</span>;
            case 'completed':
                return <span className="status-badge completed"><CheckCircle size={12} /> Completed</span>;
            case 'dropped':
                return <span className="status-badge dropped"><AlertCircle size={12} /> Dropped</span>;
            default:
                return <span className="status-badge">{status}</span>;
        }
    };

    const filteredEnrollments = enrollments.filter(enrollment => {
        const searchLower = searchQuery.toLowerCase();
        const studentName = `${enrollment.student.first_name} ${enrollment.student.last_name}`.toLowerCase();
        const courseName = enrollment.course.title.toLowerCase();
        return studentName.includes(searchLower) || courseName.includes(searchLower);
    });

    if (loading) {
        return (
            <div className="lms-loading">
                <RefreshCw className="spin" size={32} />
                <p>Loading enrollments...</p>
            </div>
        );
    }

    return (
        <div className="enrollment-management">
            <div className="page-header">
                <div>
                    <h1>📚 Enrollment Management</h1>
                    <p>Manage student course enrollments</p>
                </div>
                <div className="header-actions">
                    <button className="btn-secondary">
                        <Download size={16} />
                        Export
                    </button>
                    <button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
                        <UserPlus size={16} />
                        Enroll Student
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon total">
                        <Users size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.totalEnrollments}</span>
                        <span className="stat-label">Total Enrollments</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon active">
                        <Clock size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.activeEnrollments}</span>
                        <span className="stat-label">Active</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon completed">
                        <CheckCircle size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.completedEnrollments}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon progress">
                        <BarChart3 size={24} />
                    </div>
                    <div className="stat-content">
                        <span className="stat-value">{stats.averageProgress}%</span>
                        <span className="stat-label">Avg. Progress</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search by student or course..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedCourse}
                        onChange={e => setSelectedCourse(e.target.value)}
                    >
                        <option value="">All Courses</option>
                        {courses.map(course => (
                            <option key={course.id} value={course.id}>{course.title}</option>
                        ))}
                    </select>
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                </div>
            </div>

            {/* Enrollments Table */}
            <div className="table-container">
                <table className="enrollments-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Course</th>
                            <th>Enrolled On</th>
                            <th>Progress</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEnrollments.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="empty-row">
                                    <Users size={32} />
                                    <span>No enrollments found</span>
                                </td>
                            </tr>
                        ) : (
                            filteredEnrollments.map(enrollment => (
                                <tr key={enrollment.id}>
                                    <td>
                                        <div className="student-cell">
                                            <div className="student-avatar">
                                                {enrollment.student.photo ? (
                                                    <img src={enrollment.student.photo} alt="" />
                                                ) : (
                                                    <span>{enrollment.student.first_name[0]}{enrollment.student.last_name[0]}</span>
                                                )}
                                            </div>
                                            <div className="student-info">
                                                <strong>{enrollment.student.first_name} {enrollment.student.last_name}</strong>
                                                <small>{enrollment.student.email}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <Link to={`/lms/courses/${enrollment.course.id}`} className="course-link">
                                            <BookOpen size={14} />
                                            {enrollment.course.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <div className="date-cell">
                                            <Calendar size={14} />
                                            {new Date(enrollment.enrolled_at).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="progress-cell">
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${enrollment.progress_percentage}%` }}
                                                />
                                            </div>
                                            <span>{enrollment.progress_percentage}%</span>
                                        </div>
                                    </td>
                                    <td>{getStatusBadge(enrollment.status)}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link
                                                to={`/lms/enrollments/${enrollment.id}/progress`}
                                                className="btn-icon"
                                                title="View Progress"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <button
                                                className="btn-icon danger"
                                                onClick={() => handleUnenroll(enrollment.id)}
                                                title="Remove Enrollment"
                                            >
                                                <UserMinus size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Enroll Student</h2>
                            <button className="btn-close" onClick={() => setShowEnrollModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Student ID *</label>
                                <input
                                    type="text"
                                    value={enrollForm.student_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, student_id: e.target.value })}
                                    placeholder="Enter student ID"
                                />
                            </div>
                            <div className="form-group">
                                <label>Course *</label>
                                <select
                                    value={enrollForm.course_id}
                                    onChange={e => setEnrollForm({ ...enrollForm, course_id: e.target.value })}
                                >
                                    <option value="">Select Course</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowEnrollModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-primary" onClick={handleEnroll} disabled={saving}>
                                {saving ? <RefreshCw size={16} className="spin" /> : <UserPlus size={16} />}
                                Enroll
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EnrollmentManagement;
