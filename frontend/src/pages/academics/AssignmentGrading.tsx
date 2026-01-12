import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { openDownload } from '../../utils/downloadLink';
import './AssignmentGrading.css';

interface Assignment {
    id: number;
    title: string;
    subject_name: string;
    section_name: string;
    max_marks: number;
    total_students: number;
    submitted_count: number;
    graded_count: number;
    pending_count: number;
}

interface Submission {
    id: number;
    student_name: string;
    student_id: number;
    submitted_at: string;
    submission_text?: string;
    submission_file?: string;
    marks_obtained?: number;
    remarks?: string;
    status: string;
}

const AssignmentGrading: React.FC = () => {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [showGradeModal, setShowGradeModal] = useState(false);
    const [marks, setMarks] = useState<number>(0);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchAssignments();
    }, []);

    useEffect(() => {
        if (selectedAssignment) {
            fetchSubmissions(selectedAssignment.id);
        }
    }, [selectedAssignment]);

    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/academics/assignments/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAssignments(response.data.results || response.data);
            if (response.data.length > 0 && !selectedAssignment) {
                setSelectedAssignment(response.data[0]);
            }
        } catch (err) {
            console.error('Error fetching assignments:', err);
        }
    };

    const fetchSubmissions = async (assignmentId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/academics/assignments/${assignmentId}/submissions/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSubmissions(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching submissions:', err);
        }
    };

    const handleGrade = async () => {
        if (!selectedSubmission || !selectedAssignment) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/academics/submissions/${selectedSubmission.id}/grade/`, {
                marks_obtained: marks,
                remarks: remarks
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setSuccess('Submission graded successfully!');
            setShowGradeModal(false);
            setMarks(0);
            setRemarks('');
            fetchSubmissions(selectedAssignment.id);
            fetchAssignments();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to grade submission');
        } finally {
            setLoading(false);
        }
    };

    const downloadSubmission = (fileUrl: string) => {
        openDownload(fileUrl);
    };

    return (
        <div className="assignment-grading">
            <div className="grading-header">
                <h1>📝 Assignment Grading</h1>
                <p>Grade student submissions</p>
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

            <div className="grading-grid">
                {/* Assignments List */}
                <div className="assignments-panel">
                    <h2>📚 Assignments</h2>
                    <div className="assignments-list">
                        {assignments.map(assignment => (
                            <div
                                key={assignment.id}
                                className={`assignment-item ${selectedAssignment?.id === assignment.id ? 'active' : ''}`}
                                onClick={() => setSelectedAssignment(assignment)}
                            >
                                <h3>{assignment.title}</h3>
                                <p>{assignment.subject_name} • {assignment.section_name}</p>
                                <div className="stats">
                                    <span>📊 {assignment.submitted_count}/{assignment.total_students} submitted</span>
                                    <span>✅ {assignment.graded_count} graded</span>
                                    <span>⏳ {assignment.pending_count} pending</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submissions Panel */}
                <div className="submissions-panel">
                    {selectedAssignment ? (
                        <>
                            <div className="panel-header">
                                <h2>{selectedAssignment.title}</h2>
                                <span className="max-marks">Max Marks: {selectedAssignment.max_marks}</span>
                            </div>

                            <div className="submissions-table">
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Student</th>
                                            <th>Submitted</th>
                                            <th>Status</th>
                                            <th>Marks</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {submissions.map(submission => (
                                            <tr key={submission.id}>
                                                <td className="student-name">{submission.student_name}</td>
                                                <td>{new Date(submission.submitted_at).toLocaleDateString()}</td>
                                                <td>
                                                    <span className={`status-badge ${submission.status.toLowerCase()}`}>
                                                        {submission.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    {submission.marks_obtained !== null && submission.marks_obtained !== undefined
                                                        ? `${submission.marks_obtained}/${selectedAssignment.max_marks}`
                                                        : '-'}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {submission.submission_file && (
                                                            <button
                                                                className="btn-icon"
                                                                onClick={() => downloadSubmission(submission.submission_file!)}
                                                                title="Download"
                                                            >
                                                                📥
                                                            </button>
                                                        )}
                                                        <button
                                                            className="btn-grade"
                                                            onClick={() => {
                                                                setSelectedSubmission(submission);
                                                                setMarks(submission.marks_obtained || 0);
                                                                setRemarks(submission.remarks || '');
                                                                setShowGradeModal(true);
                                                            }}
                                                        >
                                                            {submission.status === 'GRADED' ? '✏️ Edit' : '📝 Grade'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📚</div>
                            <h3>Select an Assignment</h3>
                            <p>Choose an assignment to view and grade submissions</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Grade Modal */}
            {showGradeModal && selectedSubmission && selectedAssignment && (
                <div className="modal-overlay" onClick={() => setShowGradeModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 Grade Submission</h2>
                            <button className="close-btn" onClick={() => setShowGradeModal(false)}>✕</button>
                        </div>

                        <div className="modal-body">
                            <div className="submission-info">
                                <h3>{selectedSubmission.student_name}</h3>
                                <p>Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}</p>
                            </div>

                            {selectedSubmission.submission_text && (
                                <div className="submission-content">
                                    <h4>Submission Text:</h4>
                                    <p>{selectedSubmission.submission_text}</p>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Marks Obtained (out of {selectedAssignment.max_marks}) *</label>
                                <input
                                    type="number"
                                    value={marks}
                                    onChange={(e) => setMarks(Number(e.target.value))}
                                    min="0"
                                    max={selectedAssignment.max_marks}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-group">
                                <label>Remarks/Feedback</label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Provide feedback to the student..."
                                    className="form-control"
                                    rows={4}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowGradeModal(false)} disabled={loading}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleGrade} disabled={loading}>
                                {loading ? '⏳ Grading...' : '✅ Submit Grade'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssignmentGrading;
