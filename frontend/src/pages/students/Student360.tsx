/**
 * Student 360 Profile - Redesigned with NucleiQ Design System
 * Comprehensive student view with KPIs, tabs, and activity timeline
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    Edit,
    Printer,
    CheckCircle,
    DollarSign,
    TrendingUp,
    FileText,
    Heart,
    Users,
    BookOpen,
    CreditCard,
    Activity,
    MessageSquare,
    User,
    Calendar,
    Phone,
    Mail,
    MapPin,
    AlertCircle,
    ClipboardList
} from 'lucide-react';
import { Button, Card } from '@/design-system';
import api from '../../services/api';
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
    attendance_details: any;
    fee_details: any;
    complaints?: { summary: any; items: any[] };
    homework?: { summary: any; items: any[] };
    exam_results?: { items: any[]; trend: any[]; average_percentage: number | null };
    teacher_remarks?: { summary: any; at_risk: boolean; items: any[] };
}

type TabType = 'academic' | 'financial' | 'health' | 'documents' | 'attendance' | 'remarks' | 'complaints' | 'homework' | 'teacher_remarks';

const Student360: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('attendance');
    const [documents, setDocuments] = useState<any[]>([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [remarks, setRemarks] = useState<any[]>([]);
    const [remarksLoading, setRemarksLoading] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            const response = await api.get(`/students/students/${id}/profile_360/`);
            setData(response.data);
        } catch (error: any) {
            console.error('Error fetching student profile:', error);
            if (error?.response?.status === 403) {
                setForbidden(true);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch documents when documents tab is active
    useEffect(() => {
        if (activeTab === 'documents' && id && documents.length === 0) {
            const fetchDocuments = async () => {
                setDocumentsLoading(true);
                try {
                    const response = await api.get(`/students/students/${id}/documents/`);
                    setDocuments(response.data);
                } catch (error) {
                    console.error('Error fetching documents:', error);
                } finally {
                    setDocumentsLoading(false);
                }
            };
            fetchDocuments();
        }
    }, [activeTab, id]);

    // Fetch remarks when remarks tab is active
    useEffect(() => {
        if (activeTab === 'remarks' && id && remarks.length === 0) {
            const fetchRemarks = async () => {
                setRemarksLoading(true);
                try {
                    const response = await api.get(`/students/students/${id}/remarks/`);
                    setRemarks(response.data);
                } catch (error) {
                    console.error('Error fetching remarks:', error);
                    // Fallback to recent_activity from profile data
                } finally {
                    setRemarksLoading(false);
                }
            };
            fetchRemarks();
        }
    }, [activeTab, id]);

    if (loading) {
        return <Loading fullScreen text={t('loading.profile', { defaultValue: 'Loading 360° Profile...' })} />;
    }

    if (forbidden) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '1rem',
                textAlign: 'center'
            }}>
                <AlertCircle size={48} color="var(--color-danger)" />
                <h2 style={{ color: 'var(--color-text-primary)', margin: 0 }}>
                    {t('errors.forbidden_title', { defaultValue: '403 — Access Denied' })}
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '420px' }}>
                    {t('students.no_access', { defaultValue: "You don't have permission to view this student's profile. Teachers can view only the students they teach." })}
                </p>
                <Button onClick={() => navigate('/students')} iconLeft={ArrowLeft}>
                    {t('common.back_to_list', { defaultValue: 'Back to List' })}
                </Button>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: '1rem'
            }}>
                <h2 style={{ color: 'var(--color-text-primary)' }}>
                    {t('students.not_found', { defaultValue: 'Student Not Found' })}
                </h2>
                <Button onClick={() => navigate('/students')} iconLeft={ArrowLeft}>
                    {t('common.back_to_list', { defaultValue: 'Back to List' })}
                </Button>
            </div>
        );
    }

    const { student, kpis, recent_activity, health_summary, attendance_details, fee_details, academic_summary, financial_summary, complaints, homework, exam_results, teacher_remarks } = data;

    const tabs = [
        { id: 'attendance' as TabType, label: t('student.attendance', { defaultValue: 'Attendance' }), icon: CheckCircle },
        { id: 'financial' as TabType, label: t('student.financial', { defaultValue: 'Financial' }), icon: CreditCard },
        { id: 'academic' as TabType, label: t('student.academic', { defaultValue: 'Academic' }), icon: BookOpen },
        { id: 'homework' as TabType, label: t('student.homework', { defaultValue: 'Homework' }), icon: ClipboardList },
        { id: 'complaints' as TabType, label: t('student.complaints', { defaultValue: 'Complaints' }), icon: AlertCircle },
        { id: 'teacher_remarks' as TabType, label: t('student.teacherRemarks', { defaultValue: 'Teacher Remarks' }), icon: MessageSquare },
        { id: 'remarks' as TabType, label: t('student.remarks', { defaultValue: 'Remarks' }), icon: MessageSquare },
        { id: 'health' as TabType, label: t('student.health', { defaultValue: 'Health' }), icon: Heart },
        { id: 'documents' as TabType, label: t('student.documents', { defaultValue: 'Documents' }), icon: FileText },
    ];

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <Button
                    variant="ghost"
                    iconLeft={ArrowLeft}
                    onClick={() => navigate('/students')}
                    style={{ marginBottom: '1rem' }}
                >
                    {t('common.back', { defaultValue: 'Back to Students' })}
                </Button>

                <Card padding="lg">
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1.5rem',
                        flexWrap: 'wrap'
                    }}>
                        {/* Profile Photo */}
                        <div style={{
                            width: '96px',
                            height: '96px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: '4px solid var(--color-primary-500)',
                            flexShrink: 0,
                            background: 'var(--color-primary-50)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            fontWeight: 700,
                            color: 'var(--color-primary-700)'
                        }}>
                            {student.photo_url ? (
                                <img
                                    src={student.photo_url}
                                    alt={student.full_name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <span>{student.full_name?.charAt(0)}</span>
                            )}
                        </div>

                        {/* Student Info */}
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <h1 style={{
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '1.75rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)',
                                margin: '0 0 0.5rem 0'
                            }}>
                                {student.full_name}
                            </h1>

                            {/* Primary Info Row */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flexWrap: 'wrap',
                                marginBottom: '0.75rem'
                            }}>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.75rem',
                                    background: 'var(--color-primary-50)',
                                    color: 'var(--color-primary-700)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 600
                                }}>
                                    <BookOpen size={14} />
                                    Class {student.class} - {student.section}
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.75rem',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-secondary)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500
                                }}>
                                    <User size={14} />
                                    Roll: {student.roll_number || 'N/A'}
                                </span>
                                <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.75rem',
                                    background: 'var(--color-bg-secondary)',
                                    color: 'var(--color-text-secondary)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: '0.8125rem',
                                    fontWeight: 500
                                }}>
                                    {student.admission_number}
                                </span>
                                {student.blood_group && (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.25rem',
                                        padding: '0.25rem 0.75rem',
                                        background: 'rgba(244, 67, 54, 0.1)',
                                        color: 'var(--color-danger)',
                                        borderRadius: 'var(--radius-base)',
                                        fontSize: '0.8125rem',
                                        fontWeight: 600
                                    }}>
                                        <Heart size={14} />
                                        {student.blood_group}
                                    </span>
                                )}
                            </div>

                            {/* Secondary Info Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '0.5rem',
                                fontSize: '0.8125rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                {student.age && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Calendar size={14} color="var(--color-text-tertiary)" />
                                        <span>Age: <strong>{student.age} years</strong></span>
                                    </div>
                                )}
                                {student.email && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Mail size={14} color="var(--color-text-tertiary)" />
                                        <span>{student.email}</span>
                                    </div>
                                )}
                                {student.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Phone size={14} color="var(--color-text-tertiary)" />
                                        <span>{student.phone}</span>
                                    </div>
                                )}
                            </div>

                            {/* Parent Info */}
                            {(student.father_name || student.mother_name) && (
                                <div style={{
                                    marginTop: '0.75rem',
                                    padding: '0.75rem',
                                    background: 'var(--color-bg-secondary)',
                                    borderRadius: 'var(--radius-base)',
                                    fontSize: '0.8125rem'
                                }}>
                                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                        {student.father_name && (
                                            <div>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>Father: </span>
                                                <strong style={{ color: 'var(--color-text-primary)' }}>{student.father_name}</strong>
                                                {student.father_phone && (
                                                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                                        ({student.father_phone})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                        {student.mother_name && (
                                            <div>
                                                <span style={{ color: 'var(--color-text-tertiary)' }}>Mother: </span>
                                                <strong style={{ color: 'var(--color-text-primary)' }}>{student.mother_name}</strong>
                                                {student.mother_phone && (
                                                    <span style={{ color: 'var(--color-text-secondary)', marginLeft: '0.5rem' }}>
                                                        ({student.mother_phone})
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <Button variant="outline" iconLeft={Edit} onClick={() => navigate(`/students/${id}/edit`)}>
                                {t('common.edit', { defaultValue: 'Edit' })}
                            </Button>
                            <Button variant="outline" iconLeft={Printer} onClick={() => window.print()}>
                                {t('common.print', { defaultValue: 'Print' })}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>

            {/* KPI Pills */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <Card
                    padding="md"
                    style={{
                        borderLeft: `4px solid var(--color-success)`,
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(255,255,255,0.02))'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle size={24} color="var(--color-success)" />
                        <div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)'
                            }}>
                                {kpis.attendance_percentage}%
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Attendance
                            </div>
                        </div>
                    </div>
                </Card>

                <Card
                    padding="md"
                    style={{
                        borderLeft: `4px solid ${kpis.fee_balance > 0 ? 'var(--color-warning)' : 'var(--color-success)'}`,
                        background: `linear-gradient(135deg, ${kpis.fee_balance > 0 ? 'rgba(255, 193, 7, 0.05)' : 'rgba(76, 175, 80, 0.05)'}, rgba(255,255,255,0.02))`
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <DollarSign size={24} color={kpis.fee_balance > 0 ? 'var(--color-warning)' : 'var(--color-success)'} />
                        <div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)'
                            }}>
                                ₹{kpis.fee_balance}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Fee Balance
                            </div>
                        </div>
                    </div>
                </Card>

                <Card
                    padding="md"
                    style={{
                        borderLeft: `4px solid var(--color-info)`,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(255,255,255,0.02))'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <TrendingUp size={24} color="var(--color-info)" />
                        <div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)'
                            }}>
                                {data.academic_summary?.average_score || 'N/A'}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Avg Score
                            </div>
                        </div>
                    </div>
                </Card>

                <Card
                    padding="md"
                    style={{
                        borderLeft: `4px solid var(--color-primary-500)`,
                        background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(255,255,255,0.02))'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <FileText size={24} color="var(--color-primary-500)" />
                        <div>
                            <div style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--color-text-primary)'
                            }}>
                                {kpis.total_remarks}
                            </div>
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Remarks
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '2px solid var(--color-border-light)',
                marginBottom: '2rem',
                overflowX: 'auto'
            }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '1rem 1.5rem',
                                background: 'none',
                                border: 'none',
                                borderBottom: `3px solid ${activeTab === tab.id ? 'var(--color-primary-700)' : 'transparent'}`,
                                color: activeTab === tab.id ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                                fontFamily: 'var(--font-family-primary)',
                                fontSize: '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Content Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '2rem'
            }}>
                {/* Main Content */}
                <div>
                    {activeTab === 'attendance' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Attendance Details</h3>}
                            padding="lg"
                        >
                            {attendance_details ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Attendance Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-primary-700)'
                                            }}>
                                                {attendance_details.total_days || 0}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Total Days
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-success)'
                                            }}>
                                                {attendance_details.present_days || 0}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Present
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(244, 67, 54, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-danger)'
                                            }}>
                                                {attendance_details.absent_days || 0}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Absent
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 193, 7, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-warning)'
                                            }}>
                                                {attendance_details.late_days || 0}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Late
                                            </div>
                                        </div>
                                    </div>

                                    {/* Percentage Bar */}
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                                Attendance Percentage
                                            </span>
                                            <span style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 700,
                                                color: attendance_details.percentage >= 75 ? 'var(--color-success)' : 'var(--color-danger)'
                                            }}>
                                                {attendance_details.percentage || 0}%
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '12px',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '6px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${attendance_details.percentage || 0}%`,
                                                background: attendance_details.percentage >= 75
                                                    ? 'linear-gradient(90deg, var(--color-success), #81C784)'
                                                    : 'linear-gradient(90deg, var(--color-danger), #E57373)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                        {attendance_details.percentage < 75 && (
                                            <p style={{
                                                marginTop: '0.5rem',
                                                fontSize: '0.875rem',
                                                color: 'var(--color-danger)',
                                                fontWeight: 500
                                            }}>
                                                ⚠️ Below minimum required attendance (75%)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    No attendance records available
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'financial' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Fee Details</h3>}
                            padding="lg"
                        >
                            {fee_details ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Fee Summary Cards */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1.25rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--color-primary-500)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Total Fee
                                            </div>
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                color: 'var(--color-text-primary)'
                                            }}>
                                                ₹{fee_details.total_fee?.toLocaleString() || 0}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.25rem',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--color-success)'
                                        }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Paid Amount
                                            </div>
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                color: 'var(--color-success)'
                                            }}>
                                                ₹{fee_details.paid_amount?.toLocaleString() || 0}
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1.25rem',
                                            background: fee_details.pending_amount > 0 ? 'rgba(244, 67, 54, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: `4px solid ${fee_details.pending_amount > 0 ? 'var(--color-danger)' : 'var(--color-success)'}`
                                        }}>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginBottom: '0.5rem'
                                            }}>
                                                Pending Amount
                                            </div>
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: 700,
                                                color: fee_details.pending_amount > 0 ? 'var(--color-danger)' : 'var(--color-success)'
                                            }}>
                                                ₹{fee_details.pending_amount?.toLocaleString() || 0}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Discount Information */}
                                    {fee_details.discount_percentage > 0 && (
                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(33, 150, 243, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--color-info)'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div>
                                                    <div style={{
                                                        fontSize: '0.875rem',
                                                        color: 'var(--color-text-secondary)'
                                                    }}>
                                                        Discount Applied
                                                    </div>
                                                    <div style={{
                                                        fontSize: '1.25rem',
                                                        fontWeight: 600,
                                                        color: 'var(--color-info)',
                                                        marginTop: '0.25rem'
                                                    }}>
                                                        {fee_details.discount_percentage}% off
                                                    </div>
                                                </div>
                                                <div style={{
                                                    fontSize: '1.5rem',
                                                    fontWeight: 700,
                                                    color: 'var(--color-info)'
                                                }}>
                                                    ₹{fee_details.discount_amount?.toLocaleString() || 0}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Payment Progress */}
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.5rem'
                                        }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                                                Payment Progress
                                            </span>
                                            <span style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: 'var(--color-text-secondary)'
                                            }}>
                                                {100 - (fee_details.pending_percentage || 0)}% Paid
                                            </span>
                                        </div>
                                        <div style={{
                                            height: '12px',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '6px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${100 - (fee_details.pending_percentage || 0)}%`,
                                                background: 'linear-gradient(90deg, var(--color-success), #81C784)',
                                                transition: 'width 0.3s ease'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Alert if pending */}
                                    {fee_details.pending_amount > 0 && (
                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 193, 7, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--color-warning)'
                                        }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                color: 'var(--color-warning)',
                                                fontWeight: 500
                                            }}>
                                                ⚠️ Fee payment pending: ₹{fee_details.pending_amount.toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    No fee records available
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'academic' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Academic Performance</h3>}
                            padding="lg"
                        >
                            {academic_summary ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {/* Academic Stats Grid */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                                        gap: '1rem'
                                    }}>
                                        <div style={{
                                            padding: '1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-primary-700)'
                                            }}>
                                                {academic_summary.subjects_count || 0}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Subjects
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(76, 175, 80, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-success)'
                                            }}>
                                                {academic_summary.average_score ?? 'N/A'}
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Avg Score
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(33, 150, 243, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{
                                                fontSize: '2rem',
                                                fontWeight: 700,
                                                color: 'var(--color-info)'
                                            }}>
                                                {academic_summary.attendance_percentage || 0}%
                                            </div>
                                            <div style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                marginTop: '0.25rem'
                                            }}>
                                                Attendance
                                            </div>
                                        </div>
                                    </div>

                                    {/* Academic Performance Note */}
                                    {academic_summary.average_score === null && (
                                        <div style={{
                                            padding: '1rem',
                                            background: 'rgba(255, 193, 7, 0.1)',
                                            borderRadius: 'var(--radius-md)',
                                            borderLeft: '4px solid var(--color-warning)'
                                        }}>
                                            <p style={{
                                                margin: 0,
                                                fontSize: '0.875rem',
                                                color: 'var(--color-warning)',
                                                fontWeight: 500
                                            }}>
                                                ℹ️ No exam scores recorded yet for the current academic year.
                                            </p>
                                        </div>
                                    )}

                                    {/* Recent Exam Results */}
                                    <div>
                                        <h4 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>
                                            Recent Exam Results
                                            {exam_results?.average_percentage != null && (
                                                <span style={{
                                                    marginLeft: '0.5rem',
                                                    fontSize: '0.8125rem',
                                                    fontWeight: 500,
                                                    color: 'var(--color-text-secondary)'
                                                }}>
                                                    (avg {exam_results.average_percentage}%)
                                                </span>
                                            )}
                                        </h4>
                                        {exam_results && exam_results.items.length > 0 ? (
                                            <div style={{ overflowX: 'auto' }}>
                                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                                    <thead>
                                                        <tr style={{ textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                                            <th style={{ padding: '0.5rem' }}>Exam</th>
                                                            <th style={{ padding: '0.5rem' }}>Subject</th>
                                                            <th style={{ padding: '0.5rem' }}>Marks</th>
                                                            <th style={{ padding: '0.5rem' }}>%</th>
                                                            <th style={{ padding: '0.5rem' }}>Grade</th>
                                                            <th style={{ padding: '0.5rem' }}>Result</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {exam_results.items.map((r: any) => (
                                                            <tr key={r.id} style={{ borderTop: '1px solid var(--color-border-light)' }}>
                                                                <td style={{ padding: '0.5rem' }}>{r.exam || '—'}</td>
                                                                <td style={{ padding: '0.5rem' }}>{r.subject || '—'}</td>
                                                                <td style={{ padding: '0.5rem' }}>
                                                                    {r.is_absent ? 'Absent' : `${r.marks_obtained ?? '—'} / ${r.total_marks ?? '—'}`}
                                                                </td>
                                                                <td style={{ padding: '0.5rem' }}>{r.percentage != null ? `${r.percentage}%` : '—'}</td>
                                                                <td style={{ padding: '0.5rem' }}>{r.grade || '—'}</td>
                                                                <td style={{ padding: '0.5rem' }}>
                                                                    <span style={{
                                                                        fontWeight: 600,
                                                                        color: r.is_pass ? 'var(--color-success)' : 'var(--color-danger)'
                                                                    }}>
                                                                        {r.is_absent ? '—' : (r.is_pass ? 'Pass' : 'Fail')}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                                No published exam results yet.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    No academic data available.
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'health' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Health Summary</h3>}
                            padding="lg"
                        >
                            {health_summary?.bmi ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <p><strong>Height:</strong> {health_summary.height_cm} cm</p>
                                    <p><strong>Weight:</strong> {health_summary.weight_kg} kg</p>
                                    <p><strong>BMI:</strong> {health_summary.bmi}</p>
                                    <p><strong>Allergies:</strong> {health_summary.allergies || 'None'}</p>
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    No health records available
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'documents' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Documents</h3>}
                            padding="lg"
                        >
                            {documentsLoading ? (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    Loading documents...
                                </p>
                            ) : documents.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {documents.map((doc: any) => (
                                        <div
                                            key={doc.id}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: '4px solid var(--color-primary-500)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}
                                        >
                                            <div>
                                                <div style={{
                                                    fontWeight: 600,
                                                    fontSize: '0.9375rem',
                                                    color: 'var(--color-text-primary)',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    <FileText size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                                    {doc.title || doc.document_type || 'Document'}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-tertiary)'
                                                }}>
                                                    {doc.document_type && <span style={{ marginRight: '1rem' }}>Type: {doc.document_type}</span>}
                                                    {doc.uploaded_at && <span>Uploaded: {formatDate(doc.uploaded_at || doc.created_at)}</span>}
                                                </div>
                                                {doc.description && (
                                                    <p style={{
                                                        fontSize: '0.8125rem',
                                                        color: 'var(--color-text-secondary)',
                                                        margin: '0.5rem 0 0 0'
                                                    }}>
                                                        {doc.description}
                                                    </p>
                                                )}
                                            </div>
                                            {doc.file && (
                                                <a
                                                    href={doc.file}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{
                                                        padding: '0.5rem 1rem',
                                                        background: 'var(--color-primary-50)',
                                                        color: 'var(--color-primary-700)',
                                                        borderRadius: 'var(--radius-base)',
                                                        fontSize: '0.8125rem',
                                                        fontWeight: 600,
                                                        textDecoration: 'none',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    View
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No documents uploaded for this student.
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'remarks' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Student Remarks</h3>}
                            padding="lg"
                        >
                            {remarksLoading ? (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    Loading remarks...
                                </p>
                            ) : (remarks.length > 0 || (recent_activity && recent_activity.length > 0)) ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {(remarks.length > 0 ? remarks : recent_activity).map((remark: any) => (
                                        <div
                                            key={remark.id}
                                            style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `4px solid ${remark.type === 'POSITIVE' ? 'var(--color-success)' :
                                                    remark.type === 'NEGATIVE' ? 'var(--color-danger)' :
                                                        remark.type === 'ACHIEVEMENT' ? 'var(--color-primary-500)' :
                                                            remark.type === 'DISCIPLINE' ? 'var(--color-danger)' :
                                                                remark.type === 'COMPLAINT' ? 'var(--color-warning)' :
                                                                    'var(--color-text-tertiary)'
                                                    }`
                                            }}
                                        >
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'flex-start',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    flexWrap: 'wrap'
                                                }}>
                                                    <span style={{
                                                        fontWeight: 600,
                                                        fontSize: '0.9375rem',
                                                        color: 'var(--color-text-primary)'
                                                    }}>
                                                        {remark.title}
                                                    </span>
                                                    {remark.is_important && (
                                                        <span style={{
                                                            padding: '0.125rem 0.5rem',
                                                            fontSize: '0.625rem',
                                                            fontWeight: 600,
                                                            borderRadius: '4px',
                                                            background: 'var(--color-danger)',
                                                            color: 'white',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Important
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-tertiary)'
                                                }}>
                                                    {formatDate(remark.created_at)}
                                                </span>
                                            </div>

                                            <p style={{
                                                fontSize: '0.875rem',
                                                color: 'var(--color-text-secondary)',
                                                margin: '0 0 0.75rem 0'
                                            }}>
                                                {remark.description}
                                            </p>

                                            <div style={{
                                                display: 'flex',
                                                gap: '0.5rem',
                                                flexWrap: 'wrap',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 500,
                                                    borderRadius: '4px',
                                                    background: remark.type === 'POSITIVE' ? 'rgba(76, 175, 80, 0.15)' :
                                                        remark.type === 'NEGATIVE' ? 'rgba(244, 67, 54, 0.15)' :
                                                            remark.type === 'ACHIEVEMENT' ? 'rgba(33, 150, 243, 0.15)' :
                                                                'rgba(158, 158, 158, 0.15)',
                                                    color: remark.type === 'POSITIVE' ? 'var(--color-success)' :
                                                        remark.type === 'NEGATIVE' ? 'var(--color-danger)' :
                                                            remark.type === 'ACHIEVEMENT' ? 'var(--color-primary-700)' :
                                                                'var(--color-text-secondary)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {remark.type?.toLowerCase()}
                                                </span>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    fontSize: '0.6875rem',
                                                    fontWeight: 500,
                                                    borderRadius: '4px',
                                                    background: 'rgba(158, 158, 158, 0.15)',
                                                    color: 'var(--color-text-secondary)',
                                                    textTransform: 'capitalize'
                                                }}>
                                                    {remark.category?.toLowerCase()}
                                                </span>
                                                {remark.requires_action && !remark.action_taken && (
                                                    <span style={{
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.6875rem',
                                                        fontWeight: 500,
                                                        borderRadius: '4px',
                                                        background: 'rgba(255, 152, 0, 0.15)',
                                                        color: 'var(--color-warning)'
                                                    }}>
                                                        Action Required
                                                    </span>
                                                )}
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--color-text-tertiary)',
                                                    marginLeft: 'auto'
                                                }}>
                                                    By: {remark.created_by}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No remarks found for this student.
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'homework' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Homework</h3>}
                            padding="lg"
                        >
                            {/* Summary chips */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(76, 175, 80, 0.12)', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    Completed: {homework?.summary?.completed ?? 0}
                                </span>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(255, 193, 7, 0.15)', color: 'var(--color-warning)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    Pending: {homework?.summary?.pending ?? 0}
                                </span>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(244, 67, 54, 0.12)', color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    Overdue: {homework?.summary?.overdue ?? 0}
                                </span>
                            </div>
                            {homework && homework.items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {homework.items.map((hw: any) => {
                                        const statusColor = hw.status === 'COMPLETED' ? 'var(--color-success)'
                                            : hw.status === 'OVERDUE' ? 'var(--color-danger)' : 'var(--color-warning)';
                                        return (
                                            <div key={hw.id} style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `4px solid ${statusColor}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600 }}>{hw.title}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.75rem', color: statusColor, textTransform: 'capitalize' }}>
                                                        {hw.status?.toLowerCase()}
                                                    </span>
                                                </div>
                                                <div style={{ marginTop: '0.375rem', fontSize: '0.8125rem', color: 'var(--color-text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    {hw.subject && <span>📘 {hw.subject}</span>}
                                                    {hw.due_date && <span>📅 Due {formatDate(hw.due_date)}</span>}
                                                    {hw.teacher && <span>👤 {hw.teacher}</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No homework assigned for this student.
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'complaints' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Complaints / Issues / Queries</h3>}
                            padding="lg"
                        >
                            {/* Summary chips */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(244, 67, 54, 0.12)', color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    Open: {complaints?.summary?.open ?? 0}
                                </span>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(33, 150, 243, 0.12)', color: 'var(--color-info)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    In Progress: {complaints?.summary?.in_progress ?? 0}
                                </span>
                                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '999px', background: 'rgba(76, 175, 80, 0.12)', color: 'var(--color-success)', fontWeight: 600, fontSize: '0.8125rem' }}>
                                    Resolved: {complaints?.summary?.resolved ?? 0}
                                </span>
                            </div>
                            {complaints && complaints.items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {complaints.items.map((c: any) => {
                                        const priorityColor = c.priority === 'URGENT' || c.priority === 'HIGH' ? 'var(--color-danger)'
                                            : c.priority === 'MEDIUM' ? 'var(--color-warning)' : 'var(--color-text-secondary)';
                                        const resolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
                                        return (
                                            <div key={c.id} style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `4px solid ${resolved ? 'var(--color-success)' : priorityColor}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600 }}>{c.title}</span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.75rem', color: resolved ? 'var(--color-success)' : priorityColor, textTransform: 'capitalize' }}>
                                                        {c.status?.replace('_', ' ').toLowerCase()}
                                                    </span>
                                                </div>
                                                {c.description && (
                                                    <p style={{ margin: '0.5rem 0', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                                        {c.description}
                                                    </p>
                                                )}
                                                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.6875rem', marginBottom: '0.25rem' }}>
                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(158, 158, 158, 0.15)', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{c.type?.toLowerCase()}</span>
                                                    {c.category && <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(158, 158, 158, 0.15)', color: 'var(--color-text-secondary)', textTransform: 'capitalize' }}>{c.category?.toLowerCase()}</span>}
                                                    <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(158, 158, 158, 0.15)', color: priorityColor, textTransform: 'capitalize' }}>{c.priority?.toLowerCase()}</span>
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span>Raised by: {c.raised_by}</span>
                                                    {c.assigned_to && <span>Assigned to: {c.assigned_to}</span>}
                                                    <span>{formatDate(c.created_at)}</span>
                                                </div>
                                                {resolved && c.resolution_notes && (
                                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.8125rem', color: 'var(--color-success)' }}>
                                                        ✅ {c.resolution_notes}
                                                    </p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No complaints, issues or queries logged for this student.
                                </p>
                            )}
                        </Card>
                    )}

                    {activeTab === 'teacher_remarks' && (
                        <Card
                            header={
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <h3 style={{ margin: 0 }}>Teacher Daily Observations</h3>
                                    {teacher_remarks?.at_risk && (
                                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(244, 67, 54, 0.15)', color: 'var(--color-danger)', fontWeight: 600, fontSize: '0.75rem' }}>
                                            At Risk
                                        </span>
                                    )}
                                </div>
                            }
                            padding="lg"
                        >
                            {/* 30-day flag summary cards */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                                {[
                                    { label: 'No Homework', value: teacher_remarks?.summary?.did_not_do_homework ?? 0, color: 'var(--color-danger)' },
                                    { label: 'Incomplete Classwork', value: teacher_remarks?.summary?.did_not_complete_classwork ?? 0, color: 'var(--color-warning)' },
                                    { label: 'Disruptive', value: teacher_remarks?.summary?.was_disruptive ?? 0, color: 'var(--color-danger)' },
                                    { label: 'Absent', value: teacher_remarks?.summary?.was_absent ?? 0, color: 'var(--color-text-secondary)' },
                                    { label: 'Participated Well', value: teacher_remarks?.summary?.participated_well ?? 0, color: 'var(--color-success)' },
                                ].map((s) => (
                                    <div key={s.label} style={{ padding: '0.625rem 0.875rem', borderRadius: 'var(--radius-md)', background: 'var(--color-bg-secondary)', minWidth: '110px' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                                        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-secondary)' }}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)', marginTop: 0, marginBottom: '1rem' }}>
                                Flag counts over the last {teacher_remarks?.summary?.window_days ?? 30} days.
                            </p>

                            {teacher_remarks && teacher_remarks.items.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {teacher_remarks.items.map((r: any) => {
                                        const flags: string[] = [];
                                        if (r.did_not_do_homework) flags.push('No homework');
                                        if (r.did_not_complete_classwork) flags.push('Incomplete classwork');
                                        if (r.was_disruptive) flags.push('Disruptive');
                                        if (r.was_absent) flags.push('Absent');
                                        if (r.participated_well) flags.push('Participated well');
                                        return (
                                            <div key={r.id} style={{
                                                padding: '1rem',
                                                background: 'var(--color-bg-secondary)',
                                                borderRadius: 'var(--radius-md)',
                                                borderLeft: `4px solid ${r.has_negative_flag ? 'var(--color-danger)' : 'var(--color-success)'}`
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <span style={{ fontWeight: 600 }}>{r.teacher || 'Teacher'}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-tertiary)' }}>{r.date ? formatDate(r.date) : ''}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', margin: '0.5rem 0' }}>
                                                    {flags.map((f) => (
                                                        <span key={f} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(158, 158, 158, 0.15)', color: 'var(--color-text-secondary)', fontSize: '0.6875rem' }}>{f}</span>
                                                    ))}
                                                    {r.severity && (
                                                        <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: 'rgba(244, 67, 54, 0.12)', color: 'var(--color-danger)', fontSize: '0.6875rem', textTransform: 'capitalize' }}>{r.severity.toLowerCase()}</span>
                                                    )}
                                                </div>
                                                {r.remark && (
                                                    <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{r.remark}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: '2rem' }}>
                                    No teacher observations recorded for this student.
                                </p>
                            )}
                        </Card>
                    )}
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Activity Feed */}
                    <Card
                        header={<h3 style={{ margin: 0, fontSize: '1rem' }}>Recent Activity</h3>}
                        padding="md"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {recent_activity.length > 0 ? (
                                recent_activity.slice(0, 5).map((item: any) => (
                                    <div
                                        key={item.id}
                                        style={{
                                            paddingBottom: '1rem',
                                            borderBottom: '1px solid var(--color-border-light)'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            marginBottom: '0.25rem'
                                        }}>
                                            <Activity size={14} color="var(--color-primary-500)" />
                                            <span style={{
                                                fontSize: '0.875rem',
                                                fontWeight: 600,
                                                color: 'var(--color-text-primary)'
                                            }}>
                                                {item.title}
                                            </span>
                                        </div>
                                        <p style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-text-secondary)',
                                            margin: '0 0 0.25rem 0'
                                        }}>
                                            {item.description}
                                        </p>
                                        <span style={{
                                            fontSize: '0.625rem',
                                            color: 'var(--color-text-tertiary)'
                                        }}>
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-tertiary)',
                                    textAlign: 'center'
                                }}>
                                    No recent activity
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Family Info */}
                    <Card
                        header={<h3 style={{ margin: 0, fontSize: '1rem' }}>Family / Siblings</h3>}
                        padding="md"
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {data.siblings && data.siblings.length > 0 ? (
                                data.siblings.map((s: any) => (
                                    <div
                                        key={s.id}
                                        onClick={() => navigate(`/students/${s.id}`)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: 'var(--radius-base)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            borderLeft: '3px solid var(--color-primary-400)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--color-primary-50)';
                                            e.currentTarget.style.borderLeftColor = 'var(--color-primary-600)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                            e.currentTarget.style.borderLeftColor = 'var(--color-primary-400)';
                                        }}
                                    >
                                        <Users size={16} color="var(--color-primary-500)" />
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.875rem',
                                                color: 'var(--color-primary-700)',
                                                marginBottom: '0.125rem',
                                            }}>
                                                {s.name}
                                            </div>
                                            <div style={{
                                                fontSize: '0.75rem',
                                                color: 'var(--color-text-tertiary)',
                                            }}>
                                                {s.class} • {s.admission_number}
                                            </div>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--color-primary-500)',
                                            fontWeight: 500,
                                        }}>
                                            View →
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-tertiary)',
                                    textAlign: 'center',
                                    margin: '0.5rem 0',
                                }}>
                                    No siblings found
                                </p>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Student360;
