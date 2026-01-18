/**
 * Assignment List - View and manage assignments
 * For both teachers (create/grade) and students (view/submit)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignmentList.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface Assignment {
    id: string;
    title: string;
    description: string;
    assignment_type: string;
    subject_name: string;
    section_name: string;
    teacher_name: string;
    assigned_date: string;
    due_date: string;
    max_marks: number;
    status: string;
    attachment?: string;
    submission_count: number;
    graded_count: number;
    pending_count: number;
    submission_percentage: number;
    is_overdue: boolean;
}

interface Submission {
    id: string;
    assignment_title: string;
    assignment_due_date: string;
    assignment_max_marks: number;
    submission_file?: string;
    submission_text: string;
    submitted_at?: string;
    status: string;
    is_late: boolean;
    marks_obtained?: number;
    remarks: string;
    percentage?: number;
    grade_letter?: string;
}

const AssignmentList: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'assignments' | 'submissions'>('assignments');
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showSubmitModal, setShowSubmitModal] = useState(false);

    // Form state for creating assignment
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignment_type: 'HOMEWORK',
        subject: '',
        section: '',
        due_date: '',
        max_marks: 100,
        instructions: ''
    });

    // Submission form state
    const [submissionData, setSubmissionData] = useState({
        submission_text: '',
        student_notes: ''
    });
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);

    useEffect(() => {
        if (view === 'assignments') {
            fetchAssignments();
        } else {
            fetchSubmissions();
        }
    }, [view]);

    const getAuthHeaders = () => {
        const token = localStorage.getItem('access_token');
        const tenantId = localStorage.getItem('tenant_id');
        return {
            'Authorization': `Bearer ${token}`,
            'X-Tenant-ID': tenantId || '',
        };
    };

    const fetchAssignments = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/academics/assignments/`, {
                headers: getAuthHeaders(),
            });
            setAssignments(response.data.results || response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching assignments');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await axios.get(`${API_BASE_URL}/academics/submissions/my_submissions/`, {
                headers: getAuthHeaders(),
            });
            setSubmissions(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error fetching submissions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(
                `${API_BASE_URL}/academics/assignments/`,
                formData,
                { headers: getAuthHeaders() }
            );
            setShowCreateModal(false);
            fetchAssignments();
            // Reset form
            setFormData({
                title: '',
                description: '',
                assignment_type: 'HOMEWORK',
                subject: '',
                section: '',
                due_date: '',
                max_marks: 100,
                instructions: ''
            });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error creating assignment');
        }
    };

    const handleSubmitAssignment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignment) return;

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('assignment', selectedAssignment.id);
            formDataToSend.append('submission_text', submissionData.submission_text);
            formDataToSend.append('student_notes', submissionData.student_notes);

            if (submissionFile) {
                formDataToSend.append('submission_file', submissionFile);
            }

            // Note: You'll need to add student ID from current user
            // formDataToSend.append('student', currentUser.student.id);

            await axios.post(
                `${API_BASE_URL}/academics/submissions/`,
                formDataToSend,
                {
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            setShowSubmitModal(false);
            setSelectedAssignment(null);
            fetchSubmissions();

            // Reset form
            setSubmissionData({ submission_text: '', student_notes: '' });
            setSubmissionFile(null);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error submitting assignment');
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: { [key: string]: string } = {
            'DRAFT': 'status-draft',
            'PUBLISHED': 'status-published',
            'CLOSED': 'status-closed',
            'SUBMITTED': 'status-submitted',
            'GRADED': 'status-graded'
        };
        return badges[status] || 'status-default';
    };

    const getTypeBadge = (type: string) => {
        const icons: { [key: string]: string } = {
            'HOMEWORK': '📝',
            'PROJECT': '📊',
            'QUIZ': '❓',
            'EXAM': '📋',
            'LAB': '🔬',
            'PRESENTATION': '🎤',
            'OTHER': '📄'
        };
        return icons[type] || '📄';
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="assignment-list">
            <div className="assignment-header">
                <h1>📚 Assignments & Homework</h1>
                <p>Manage assignments and submissions</p>
            </div>

            {/* View Toggle */}
            <div className="view-toggle">
                <button
                    className={`toggle-btn ${view === 'assignments' ? 'active' : ''}`}
                    onClick={() => setView('assignments')}
                >
                    📋 All Assignments
                </button>
                <button
                    className={`toggle-btn ${view === 'submissions' ? 'active' : ''}`}
                    onClick={() => setView('submissions')}
                >
                    ✍️ My Submissions
                </button>
            </div>

            {/* Action Buttons */}
            <div className="action-bar">
                {view === 'assignments' && (
                    <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                        ➕ Create Assignment
                    </button>
                )}
            </div>

            {loading && <div className="loading">Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            {/* Assignments View */}
            {view === 'assignments' && !loading && (
                <div className="assignments-grid">
                    {assignments.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
                            <h3>No Assignments Yet</h3>
                            <p>Create your first assignment to get started</p>
                        </div>
                    ) : (
                        assignments.map((assignment) => (
                            <div key={assignment.id} className="assignment-card">
                                <div className="card-header">
                                    <div className="assignment-type">
                                        <span className="type-icon">{getTypeBadge(assignment.assignment_type)}</span>
                                        <span className="type-text">{assignment.assignment_type}</span>
                                    </div>
                                    <span className={`status-badge ${getStatusBadge(assignment.status)}`}>
                                        {assignment.status}
                                    </span>
                                </div>

                                <h3 className="assignment-title">{assignment.title}</h3>
                                <p className="assignment-description">{assignment.description}</p>

                                <div className="assignment-meta">
                                    <div className="meta-item">
                                        <span className="meta-label">Subject:</span>
                                        <span className="meta-value">{assignment.subject_name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Section:</span>
                                        <span className="meta-value">{assignment.section_name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="meta-label">Teacher:</span>
                                        <span className="meta-value">{assignment.teacher_name}</span>
                                    </div>
                                </div>

                                <div className="assignment-dates">
                                    <div className="date-item">
                                        <span className="date-label">Assigned:</span>
                                        <span className="date-value">{formatDate(assignment.assigned_date)}</span>
                                    </div>
                                    <div className={`date-item ${assignment.is_overdue ? 'overdue' : ''}`}>
                                        <span className="date-label">Due:</span>
                                        <span className="date-value">{formatDate(assignment.due_date)}</span>
                                        {assignment.is_overdue && <span className="overdue-badge">⚠️ Overdue</span>}
                                    </div>
                                </div>

                                <div className="assignment-stats">
                                    <div className="stat">
                                        <div className="stat-value">{assignment.submission_count}</div>
                                        <div className="stat-label">Submissions</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-value">{assignment.graded_count}</div>
                                        <div className="stat-label">Graded</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-value">{assignment.submission_percentage}%</div>
                                        <div className="stat-label">Submitted</div>
                                    </div>
                                    <div className="stat">
                                        <div className="stat-value">{assignment.max_marks}</div>
                                        <div className="stat-label">Max Marks</div>
                                    </div>
                                </div>

                                <div className="card-actions">
                                    <button className="btn-view" onClick={() => setSelectedAssignment(assignment)}>
                                        View Details
                                    </button>
                                    <button
                                        className="btn-submit"
                                        onClick={() => {
                                            setSelectedAssignment(assignment);
                                            setShowSubmitModal(true);
                                        }}
                                    >
                                        Submit Work
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Submissions View */}
            {view === 'submissions' && !loading && (
                <div className="submissions-list">
                    {submissions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-icon">✍️</div>
                            <h3>No Submissions Yet</h3>
                            <p>Submit your assignments to see them here</p>
                        </div>
                    ) : (
                        submissions.map((submission) => (
                            <div key={submission.id} className="submission-card">
                                <div className="submission-header">
                                    <h3>{submission.assignment_title}</h3>
                                    <span className={`status-badge ${getStatusBadge(submission.status)}`}>
                                        {submission.status}
                                    </span>
                                </div>

                                <div className="submission-info">
                                    <div className="info-row">
                                        <span className="info-label">Due Date:</span>
                                        <span className="info-value">{formatDateTime(submission.assignment_due_date)}</span>
                                    </div>
                                    {submission.submitted_at && (
                                        <div className="info-row">
                                            <span className="info-label">Submitted:</span>
                                            <span className="info-value">
                                                {formatDateTime(submission.submitted_at)}
                                                {submission.is_late && <span className="late-badge">⚠️ Late</span>}
                                            </span>
                                        </div>
                                    )}
                                    <div className="info-row">
                                        <span className="info-label">Max Marks:</span>
                                        <span className="info-value">{submission.assignment_max_marks}</span>
                                    </div>
                                </div>

                                {submission.status === 'GRADED' && submission.marks_obtained !== undefined && (
                                    <div className="grading-info">
                                        <div className="marks-display">
                                            <div className="marks-value">
                                                {submission.marks_obtained} / {submission.assignment_max_marks}
                                            </div>
                                            <div className="marks-percentage">
                                                {submission.percentage}% - Grade: {submission.grade_letter}
                                            </div>
                                        </div>
                                        {submission.remarks && (
                                            <div className="remarks">
                                                <strong>Teacher Feedback:</strong>
                                                <p>{submission.remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {submission.submission_text && (
                                    <div className="submission-content">
                                        <strong>Your Submission:</strong>
                                        <p>{submission.submission_text}</p>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Create Assignment Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Create New Assignment</h2>
                        <form onSubmit={handleCreateAssignment}>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={formData.assignment_type}
                                        onChange={(e) => setFormData({ ...formData, assignment_type: e.target.value })}
                                    >
                                        <option value="HOMEWORK">Homework</option>
                                        <option value="PROJECT">Project</option>
                                        <option value="QUIZ">Quiz</option>
                                        <option value="EXAM">Exam</option>
                                        <option value="LAB">Lab Work</option>
                                        <option value="PRESENTATION">Presentation</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Max Marks</label>
                                    <input
                                        type="number"
                                        value={formData.max_marks}
                                        onChange={(e) => setFormData({ ...formData, max_marks: parseInt(e.target.value) })}
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Due Date *</label>
                                <input
                                    type="datetime-local"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Instructions</label>
                                <textarea
                                    value={formData.instructions}
                                    onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    Create Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Assignment Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Submit Assignment</h2>
                        <h3>{selectedAssignment.title}</h3>

                        <form onSubmit={handleSubmitAssignment}>
                            <div className="form-group">
                                <label>Upload File</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                />
                                <small>Accepted formats: PDF, DOC, DOCX, JPG, PNG</small>
                            </div>

                            <div className="form-group">
                                <label>Text Submission</label>
                                <textarea
                                    value={submissionData.submission_text}
                                    onChange={(e) => setSubmissionData({ ...submissionData, submission_text: e.target.value })}
                                    rows={6}
                                    placeholder="Type your answer here..."
                                />
                            </div>

                            <div className="form-group">
                                <label>Notes (Optional)</label>
                                <textarea
                                    value={submissionData.student_notes}
                                    onChange={(e) => setSubmissionData({ ...submissionData, student_notes: e.target.value })}
                                    rows={3}
                                    placeholder="Any additional notes..."
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn-cancel">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-save">
                                    Submit Assignment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentList;
