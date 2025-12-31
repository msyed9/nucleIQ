import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatDate } from '../../utils/helpers';
import './Students.css';

interface StudentProfileData {
    student: any;
    kpis: any;
    recent_activity: any[];
    siblings: any[];
    family_summary: any;
    academic_summary: any;
    financial_summary: any;
    health_summary: any;
}

const Student360: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/students/students/${id}/profile_360/`);
            setData(response.data);
        } catch (error) {
            console.error('Error fetching student profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Loading fullScreen text={t('loading.profile', { defaultValue: 'Loading 360° Profile...' })} />;

    if (!data) return (
        <div className="error-state">
            <h2>{t('students.not_found', { defaultValue: 'Student Not Found' })}</h2>
            <Button onClick={() => navigate('/students')}>{t('common.back_to_list', { defaultValue: 'Back to List' })}</Button>
        </div>
    );

    const { student, kpis, recent_activity, health_summary } = data;

    return (
        <div className="student-360-page">
            <div className="profile-header">
                <div className="profile-info">
                    <div className="profile-avatar">
                        {student.photo_url ? <img src={student.photo_url} alt={student.full_name} /> : <span>{student.full_name?.charAt(0)}</span>}
                    </div>
                    <div>
                        <h1 className="profile-name">{student.full_name}</h1>
                        <p className="profile-meta">
                            {student.admission_number} | {student.class} - {student.section} | Roll: {student.roll_number}
                        </p>
                    </div>
                </div>
                <div className="profile-actions">
                    <Button variant="outline" onClick={() => navigate('/students')}>{t('common.back')}</Button>
                    <Button variant="primary">{t('common.edit')}</Button>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* KPI Bar */}
                <div className="kpi-bar">
                    <Card className="kpi-card">
                        <span className="kpi-label">Attendance</span>
                        <span className="kpi-value">{kpis.attendance_percentage}%</span>
                    </Card>
                    <Card className="kpi-card">
                        <span className="kpi-label">Fee Balance</span>
                        <span className="kpi-value">₹{kpis.fee_balance}</span>
                    </Card>
                    <Card className="kpi-card">
                        <span className="kpi-label">Remarks</span>
                        <span className="kpi-value">{kpis.total_remarks}</span>
                    </Card>
                </div>

                <div className="main-content-layout">
                    <div className="left-column">
                        {/* Feed */}
                        <Card title="Activity Feed">
                            <div className="activity-feed">
                                {recent_activity.length > 0 ? (
                                    recent_activity.map((item: any) => (
                                        <div key={item.id} className={`feed-item ${item.color_class}`}>
                                            <div className="feed-header">
                                                <span className="feed-title">{item.title}</span>
                                                <span className="feed-date">{formatDate(item.created_at)}</span>
                                            </div>
                                            <p className="feed-desc">{item.description}</p>
                                            <span className="feed-author">By: {item.created_by}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">No recent activity</p>
                                )}
                            </div>
                        </Card>
                    </div>

                    <div className="right-column">
                        {/* Health Info */}
                        <Card title="Health Summary">
                            {health_summary.bmi ? (
                                <div className="health-stats">
                                    <p><strong>Height:</strong> {health_summary.height_cm} cm</p>
                                    <p><strong>Weight:</strong> {health_summary.weight_kg} kg</p>
                                    <p><strong>BMI:</strong> {health_summary.bmi}</p>
                                    <p><strong>Allergies:</strong> {health_summary.allergies || 'None'}</p>
                                </div>
                            ) : (
                                <p className="no-data">No health records available</p>
                            )}
                        </Card>

                        {/* Family */}
                        <Card title="Family / Siblings">
                            <p><strong>Family ID:</strong> {data.family_summary.family_id}</p>
                            <div className="siblings-list">
                                {data.siblings.map((s: any) => (
                                    <div key={s.id} className="sibling-item" onClick={() => navigate(`/students/${s.id}`)}>
                                        <span>{s.name} ({s.class})</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Student360;
