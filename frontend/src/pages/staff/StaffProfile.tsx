import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import '../students/Students.css';

interface StaffProfile {
    id: string;
    employee_id: string;
    full_name: string;
    designation: string;
    department: string;
    email: string;
    phone: string;
    date_of_joining: string;
    photo_url: string | null;
    qualifications: string;
    experience_years: number;
    subjects_taught: string[];
    is_active: boolean;
}

const StaffProfile: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [staff, setStaff] = useState<StaffProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStaffProfile();
    }, [id]);

    const fetchStaffProfile = async () => {
        try {
            const response = await api.get(`/staff/staff/${id}/`);
            setStaff(response.data);
        } catch (error) {
            console.error('Error fetching staff profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen text="Loading Staff Profile..." />;
    if (!staff) return (
        <div className="error-state">
            <h2>Staff Member Not Found</h2>
            <Button onClick={() => navigate('/staff')}>Back to Staff List</Button>
        </div>
    );

    return (
        <div className="student-360-page">
            <div className="profile-header">
                <div className="profile-info">
                    <div className="profile-avatar">
                        {staff.photo_url ? (
                            <img src={staff.photo_url} alt={staff.full_name} />
                        ) : (
                            <span>{staff.full_name?.charAt(0)}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="profile-name">{staff.full_name}</h1>
                        <p className="profile-meta">
                            {staff.employee_id} | {staff.designation} | {staff.department}
                        </p>
                    </div>
                </div>
                <div className="profile-actions">
                    <Button variant="outline" onClick={() => navigate('/staff')}>Back</Button>
                    <Button variant="primary" onClick={() => alert('Edit Staff functionality is under development.')}>Edit Profile</Button>
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="main-content-layout">
                    <div className="left-column">
                        <Card title="Personal Information">
                            <div className="info-grid">
                                <div className="info-item">
                                    <span className="info-label">Email:</span>
                                    <span className="info-value">{staff.email}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Phone:</span>
                                    <span className="info-value">{staff.phone}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Date of Joining:</span>
                                    <span className="info-value">{formatDate(staff.date_of_joining)}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Experience:</span>
                                    <span className="info-value">{staff.experience_years} years</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Qualifications:</span>
                                    <span className="info-value">{staff.qualifications}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Status:</span>
                                    <span className={`status-badge status-${staff.is_active ? 'active' : 'inactive'}`}>
                                        {staff.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </div>
                        </Card>

                        {staff.subjects_taught && staff.subjects_taught.length > 0 && (
                            <Card title="Subjects Taught">
                                <div className="subjects-list">
                                    {staff.subjects_taught.map((subject, idx) => (
                                        <span key={idx} className="subject-badge">{subject}</span>
                                    ))}
                                </div>
                            </Card>
                        )}
                    </div>

                    <div className="right-column">
                        <Card title="Quick Stats">
                            <div className="stats-grid">
                                <div className="stat-item">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Classes Assigned</div>
                                </div>
                                <div className="stat-item">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Attendance</div>
                                </div>
                            </div>
                        </Card>

                        <Card title="Recent Activity">
                            <p className="no-data">No recent activity</p>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffProfile;
