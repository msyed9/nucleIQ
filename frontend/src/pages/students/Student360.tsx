/**
 * Student 360 Profile - Redesigned with NucleIQ Design System
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
    MapPin
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
}

type TabType = 'academic' | 'financial' | 'health' | 'documents' | 'attendance' | 'remarks';

const Student360: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('attendance');

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

    if (loading) {
        return <Loading fullScreen text={t('loading.profile', { defaultValue: 'Loading 360° Profile...' })} />;
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

    const { student, kpis, recent_activity, health_summary, attendance_details, fee_details } = data;

    const tabs = [
        { id: 'attendance' as TabType, label: t('student.attendance', { defaultValue: 'Attendance' }), icon: CheckCircle },
        { id: 'financial' as TabType, label: t('student.financial', { defaultValue: 'Financial' }), icon: CreditCard },
        { id: 'academic' as TabType, label: t('student.academic', { defaultValue: 'Academic' }), icon: BookOpen },
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
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Academic performance data will be displayed here.
                            </p>
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
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Student documents will be displayed here.
                            </p>
                        </Card>
                    )}

                    {activeTab === 'remarks' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Student Remarks</h3>}
                            padding="lg"
                        >
                            {recent_activity && recent_activity.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {recent_activity.map((remark: any) => (
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
                        <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                            <strong>Family ID:</strong> {data.family_summary.family_id}
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {data.siblings.map((s: any) => (
                                <div
                                    key={s.id}
                                    onClick={() => navigate(`/students/${s.id}`)}
                                    style={{
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-secondary)',
                                        borderRadius: 'var(--radius-base)',
                                        cursor: 'pointer',
                                        transition: 'background var(--transition-fast)',
                                        fontSize: '0.875rem'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-tertiary)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-bg-secondary)'}
                                >
                                    <Users size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                    {s.name} ({s.class})
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Student360;
