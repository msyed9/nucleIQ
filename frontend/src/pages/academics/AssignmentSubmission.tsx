import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AssignmentSubmission.css';

interface Assignment {
    id: number;
    title: string;
    description: string;
    subject_name: string;
    teacher_name: string;
    assigned_date: string;
    due_date: string;
    max_marks: number;
    assignment_type: string;
    status: string;
    attachment?: string;
    submission?: Submission;
}

interface Submission {
    id: number;
    status: 'DRAFT' | 'SUBMITTED' | 'GRADED' | 'LATE';
    submitted_at?: string;
    submission_file?: string;
    submission_text?: string;
    marks_obtained?: number;
    remarks?: string;
    graded_at?: string;
}

const AssignmentSubmission: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [submissionText, setSubmissionText] = useState('');
    const [submissionFile, setSubmissionFile] = useState<File | null>(null);

    useEffect(() => {
        fetchAssignments();
    }, []);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/academics/assignments/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching assignments:', err);
        }
    };

    const handleSubmit = async () => {
        if (!selectedAssignment) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('assignment', selectedAssignment.id.toString());
            if (submissionText) formData.append('submission_text', submissionText);
            if (submissionFile) formData.append('submission_file', submissionFile);

            if (selectedAssignment.submission?.id) {
                // Update existing submission
                await axios.patch(`/api/academics/submissions/${selectedAssignment.submission.id}/`, formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            } else {
                // Create new submission
                await axios.post('/api/academics/submissions/', formData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }

            setSuccess('Assignment submitted successfully!');
            setShowSubmitModal(false);
            setSubmissionText('');
            setSubmissionFile(null);
            fetchAssignments();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit assignment');
        } finally {
            setLoading(false);
        }
    };

    const getFilteredAssignments = () => {
        return assignments.filter(assignment => {
            if (filter === 'all') return true;
            if (filter === 'pending') return !assignment.submission || assignment.submission.status === 'DRAFT';
            if (filter === 'submitted') return assignment.submission?.status === 'SUBMITTED';
            if (filter === 'graded') return assignment.submission?.status === 'GRADED';
            return true;
        });
    };

    const isOverdue = (dueDate: string): boolean => {
        return new Date(dueDate) < new Date();
    };

    const getDaysRemaining = (dueDate: string): number => {
        const diff = new Date(dueDate).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const getStatusColor = (assignment: Assignment): string => {
        if (assignment.submission?.status === 'GRADED') return '#22c55e';
        if (assignment.submission?.status === 'SUBMITTED') return '#3b82f6';
        if (isOverdue(assignment.due_date)) return '#ef4444';
        return '#f59e0b';
    };

    const filteredAssignments = getFilteredAssignments();

    return (
        <div className="assignment-submission">
            <div className="submission-header">
                <h1>📚 My Assignments</h1>
                <p>View and submit your assignments</p>
            </div>

            {success && (
                <div className="alert alert-success">
                    <span className="icon">✅</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    All ({assignments.length})
                </button>
                <button
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({assignments.filter(a => !a.submission || a.submission.status === 'DRAFT').length})
                </button>
                <button
                    className={filter === 'submitted' ? 'active' : ''}
                    onClick={() => setFilter('submitted')}
                >
                    Submitted ({assignments.filter(a => a.submission?.status === 'SUBMITTED').length})
                </button>
                <button
                    className={filter === 'graded' ? 'active' : ''}
                    onClick={() => setFilter('graded')}
                >
                    Graded ({assignments.filter(a => a.submission?.status === 'GRADED').length})
                </button>
            </div>

            {/* Assignments Grid */}
            <div className="assignments-grid">
                {filteredAssignments.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📝</div>
                        <h3>No Assignments Found</h3>
                        <p>You don't have any assignments in this category</p>
                    </div>
                ) : (
                    filteredAssignments.map(assignment => {
                        const daysRemaining = getDaysRemaining(assignment.due_date);
                        const overdue = isOverdue(assignment.due_date);

                        return (
                            <div key={assignment.id} className="assignment-card">
                                <div className="assignment-header">
                                    <h3>{assignment.title}</h3>
                                    <span
                                        className="status-badge"
                                        style={{ background: getStatusColor(assignment) }}
                                    >
                                        {assignment.submission?.status || 'NOT SUBMITTED'}
                                    </span>
                                </div>

                                <div className="assignment-meta">
                                    <div className="meta-item">
                                        <span className="icon">📖</span>
                                        <span>{assignment.subject_name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="icon">👨‍🏫</span>
                                        <span>{assignment.teacher_name}</span>
                                    </div>
                                    <div className="meta-item">
                                        <span className="icon">📅</span>
                                        <span>Assigned: {new Date(assignment.assigned_date).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="assignment-description">
                                    <p>{assignment.description}</p>
                                </div>

                                {/* Due Date */}
                                <div className={`due-date ${overdue ? 'overdue' : ''}`}>
                                    <span className="icon">⏰</span>
                                    <span>
                                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                                        {!overdue && daysRemaining >= 0 && (
                                            <span className="days-remaining"> ({daysRemaining} days left)</span>
                                        )}
                                        {overdue && <span className="overdue-text"> (OVERDUE)</span>}
                                    </span>
                                </div>

                                {/* Marks */}
                                <div className="marks-section">
                                    {assignment.submission?.status === 'GRADED' ? (
                                        <div className="graded-marks">
                                            <span className="score">
                                                {assignment.submission.marks_obtained}/{assignment.max_marks}
                                            </span>
                                            <span className="percentage">
                                                ({((assignment.submission.marks_obtained! / assignment.max_marks) * 100).toFixed(1)}%)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="max-marks">Max Marks: {assignment.max_marks}</div>
                                    )}
                                </div>

                                {/* Remarks */}
                                {assignment.submission?.remarks && (
                                    <div className="remarks-section">
                                        <strong>Teacher's Feedback:</strong>
                                        <p>{assignment.submission.remarks}</p>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="assignment-actions">
                                    {assignment.attachment && (
                                        <a
                                            href={assignment.attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-download"
                                        >
                                            📥 Download
                                        </a>
                                    )}

                                    {assignment.submission?.status === 'GRADED' ? (
                                        <button className="btn btn-view" disabled>
                                            ✅ Graded
                                        </button>
                                    ) : assignment.submission?.status === 'SUBMITTED' ? (
                                        <button className="btn btn-submitted" disabled>
                                            ⏳ Submitted
                                        </button>
                                    ) : (
                                        <button
                                            className="btn btn-submit"
                                            onClick={() => {
                                                setSelectedAssignment(assignment);
                                                setSubmissionText(assignment.submission?.submission_text || '');
                                                setShowSubmitModal(true);
                                            }}
                                        >
                                            📝 Submit
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Submit Modal */}
            {showSubmitModal && selectedAssignment && (
                <div className="modal-overlay" onClick={() => setShowSubmitModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 Submit Assignment</h2>
                            <button className="close-btn" onClick={() => setShowSubmitModal(false)}>
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="assignment-summary">
                                <h3>{selectedAssignment.title}</h3>
                                <p>{selectedAssignment.subject_name}</p>
                                <p>Due: {new Date(selectedAssignment.due_date).toLocaleDateString()}</p>
                            </div>

                            <div className="form-group">
                                <label>Submission Text</label>
                                <textarea
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Enter your submission text here..."
                                    className="form-control"
                                    rows={6}
                                />
                            </div>

                            <div className="form-group">
                                <label>Upload File (Optional)</label>
                                <input
                                    type="file"
                                    onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                                    className="form-control"
                                    accept=".pdf,.doc,.docx,.txt,.zip"
                                />
                                {submissionFile && (
                                    <div className="file-info">
                                        📎 {submissionFile.name} ({(submissionFile.size / 1024).toFixed(2)} KB)
                                    </div>
                                )}
                            </div>

                            <div className="info-box">
                                <strong>ℹ️ Note:</strong>
                                <p>Make sure to review your submission before submitting. You can update it before the due date.</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowSubmitModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={loading || (!submissionText && !submissionFile)}
                            >
                                {loading ? '⏳ Submitting...' : '✅ Submit Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentSubmission;
