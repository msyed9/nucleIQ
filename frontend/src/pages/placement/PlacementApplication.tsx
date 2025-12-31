import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlacementApplication.css';

interface PlacementDrive {
    id: number;
    title: string;
    recruiter: {
        id: number;
        name: string;
        industry: string;
    };
    date: string;
    eligibility_criteria: string;
    roles_offered: string;
    package_range: string;
    is_active: boolean;
}

interface Application {
    id: number;
    drive: number;
    student: number;
    applied_at: string;
    status: string;
    ctc?: number;
}

const PlacementApplication: React.FC = () => {
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [myApplications, setMyApplications] = useState<Application[]>([]);
    const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
    const [showApplicationModal, setShowApplicationModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState<'all' | 'applied' | 'available'>('available');
    const [studentId, setStudentId] = useState<number | null>(null);

    // Application form data
    const [resumeFile, setResumeFile] = useState<File | null>(null);
    const [coverLetter, setCoverLetter] = useState('');
    const [expectedCTC, setExpectedCTC] = useState('');
    const [availability, setAvailability] = useState('');

    useEffect(() => {
        fetchDrives();
        fetchMyApplications();
        fetchStudentProfile();
    }, []);

    const fetchStudentProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/users/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Assuming the user has a student_id field
            setStudentId(response.data.student_id || 1); // Fallback for demo
        } catch (err) {
            console.error('Error fetching student profile:', err);
        }
    };

    const fetchDrives = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/placement/drives/', {
                headers: { Authorization: `Bearer ${token}` },
                params: { is_active: true }
            });
            setDrives(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching drives:', err);
        }
    };

    const fetchMyApplications = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/placement/applications/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMyApplications(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching applications:', err);
        }
    };

    const handleApplyClick = (drive: PlacementDrive) => {
        setSelectedDrive(drive);
        setShowApplicationModal(true);
        setCoverLetter('');
        setExpectedCTC('');
        setAvailability('');
        setResumeFile(null);
    };

    const handleSubmitApplication = async () => {
        if (!validateApplication()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            const formData = new FormData();
            formData.append('drive', selectedDrive!.id.toString());
            formData.append('student', studentId!.toString());
            if (resumeFile) {
                formData.append('resume', resumeFile);
            }

            await axios.post('/api/placement/applications/', formData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                }
            });

            setSuccess('Application submitted successfully!');
            setShowApplicationModal(false);
            fetchMyApplications();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to submit application');
        } finally {
            setLoading(false);
        }
    };

    const validateApplication = (): boolean => {
        if (!resumeFile) {
            setError('Please upload your resume');
            return false;
        }
        return true;
    };

    const isAlreadyApplied = (driveId: number): boolean => {
        return myApplications.some(app => app.drive === driveId);
    };

    const getApplicationStatus = (driveId: number): string | null => {
        const app = myApplications.find(app => app.drive === driveId);
        return app?.status || null;
    };

    const getStatusColor = (status: string): string => {
        const colors: { [key: string]: string } = {
            'APPLIED': '#3b82f6',
            'SHORTLISTED': '#f59e0b',
            'REJECTED': '#ef4444',
            'OFFERED': '#22c55e',
            'ACCEPTED': '#10b981',
        };
        return colors[status] || '#6b7280';
    };

    const filteredDrives = drives.filter(drive => {
        if (filter === 'applied') {
            return isAlreadyApplied(drive.id);
        } else if (filter === 'available') {
            return !isAlreadyApplied(drive.id);
        }
        return true;
    });

    return (
        <div className="placement-application">
            <div className="application-header">
                <h1>💼 Placement Drives</h1>
                <p>Apply for campus placement opportunities</p>
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

            {/* Statistics */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-details">
                        <div className="stat-value">{drives.length}</div>
                        <div className="stat-label">Active Drives</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-details">
                        <div className="stat-value">{myApplications.length}</div>
                        <div className="stat-label">My Applications</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-details">
                        <div className="stat-value">
                            {myApplications.filter(app => app.status === 'SHORTLISTED' || app.status === 'OFFERED').length}
                        </div>
                        <div className="stat-label">Shortlisted</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🎉</div>
                    <div className="stat-details">
                        <div className="stat-value">
                            {myApplications.filter(app => app.status === 'OFFERED' || app.status === 'ACCEPTED').length}
                        </div>
                        <div className="stat-label">Offers</div>
                    </div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                <button
                    className={filter === 'available' ? 'active' : ''}
                    onClick={() => setFilter('available')}
                >
                    🆕 Available Drives
                </button>
                <button
                    className={filter === 'applied' ? 'active' : ''}
                    onClick={() => setFilter('applied')}
                >
                    📋 My Applications
                </button>
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    🌐 All Drives
                </button>
            </div>

            {/* Drives Grid */}
            <div className="drives-grid">
                {filteredDrives.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No drives found</h3>
                        <p>
                            {filter === 'applied'
                                ? "You haven't applied to any drives yet"
                                : "No placement drives available at the moment"}
                        </p>
                    </div>
                ) : (
                    filteredDrives.map(drive => {
                        const applied = isAlreadyApplied(drive.id);
                        const status = getApplicationStatus(drive.id);

                        return (
                            <div key={drive.id} className="drive-card">
                                <div className="drive-header">
                                    <div className="company-logo">
                                        {drive.recruiter.name.charAt(0)}
                                    </div>
                                    <div className="drive-title-section">
                                        <h3>{drive.title}</h3>
                                        <p className="company-name">{drive.recruiter.name}</p>
                                    </div>
                                    {applied && status && (
                                        <span
                                            className="status-badge"
                                            style={{ background: getStatusColor(status) }}
                                        >
                                            {status}
                                        </span>
                                    )}
                                </div>

                                <div className="drive-details">
                                    <div className="detail-row">
                                        <span className="icon">🏢</span>
                                        <span className="label">Industry:</span>
                                        <span className="value">{drive.recruiter.industry}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">📅</span>
                                        <span className="label">Date:</span>
                                        <span className="value">{new Date(drive.date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="icon">💰</span>
                                        <span className="label">Package:</span>
                                        <span className="value">{drive.package_range}</span>
                                    </div>
                                </div>

                                <div className="drive-section">
                                    <h4>📋 Roles Offered</h4>
                                    <p>{drive.roles_offered}</p>
                                </div>

                                <div className="drive-section">
                                    <h4>✅ Eligibility Criteria</h4>
                                    <p>{drive.eligibility_criteria}</p>
                                </div>

                                <div className="drive-actions">
                                    {!applied ? (
                                        <button
                                            className="btn btn-apply"
                                            onClick={() => handleApplyClick(drive)}
                                        >
                                            📝 Apply Now
                                        </button>
                                    ) : (
                                        <div className="applied-badge">
                                            ✅ Application Submitted
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Application Modal */}
            {showApplicationModal && selectedDrive && (
                <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>📝 Apply for Placement</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowApplicationModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="drive-summary">
                                <h3>{selectedDrive.title}</h3>
                                <p>{selectedDrive.recruiter.name}</p>
                                <p className="package">💰 {selectedDrive.package_range}</p>
                            </div>

                            <div className="form-group">
                                <label>Resume / CV *</label>
                                <div className="file-upload">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                                        id="resume-upload"
                                        className="file-input"
                                    />
                                    <label htmlFor="resume-upload" className="file-label">
                                        {resumeFile ? (
                                            <>
                                                <span className="icon">📄</span>
                                                <span>{resumeFile.name}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="icon">📎</span>
                                                <span>Upload Resume (PDF, DOC, DOCX)</span>
                                            </>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cover Letter (Optional)</label>
                                <textarea
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    placeholder="Tell us why you're a great fit for this role..."
                                    className="form-control"
                                    rows={5}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Expected CTC (Optional)</label>
                                    <input
                                        type="text"
                                        value={expectedCTC}
                                        onChange={(e) => setExpectedCTC(e.target.value)}
                                        placeholder="e.g., 6 LPA"
                                        className="form-control"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Availability</label>
                                    <select
                                        value={availability}
                                        onChange={(e) => setAvailability(e.target.value)}
                                        className="form-control"
                                    >
                                        <option value="">Select</option>
                                        <option value="IMMEDIATE">Immediate</option>
                                        <option value="1_MONTH">1 Month Notice</option>
                                        <option value="2_MONTHS">2 Months Notice</option>
                                        <option value="3_MONTHS">3 Months Notice</option>
                                    </select>
                                </div>
                            </div>

                            <div className="info-box">
                                <strong>💡 Application Tips:</strong>
                                <ul>
                                    <li>Ensure your resume is up-to-date and error-free</li>
                                    <li>Highlight relevant skills and projects</li>
                                    <li>Tailor your cover letter to the specific role</li>
                                    <li>Double-check all information before submitting</li>
                                </ul>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowApplicationModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitApplication}
                                disabled={loading}
                            >
                                {loading ? '⏳ Submitting...' : '📤 Submit Application'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlacementApplication;
