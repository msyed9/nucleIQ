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
    Calendar,
    Heart,
    Users,
    BookOpen,
    CreditCard,
    Activity
} from 'lucide-react';
import { Button, Card, Badge, KPICard } from '@/design-system';
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
}

type TabType = 'academic' | 'financial' | 'health' | 'documents';

const Student360: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [data, setData] = useState<StudentProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('academic');

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

    const { student, kpis, recent_activity, health_summary } = data;

    const tabs = [
        { id: 'academic' as TabType, label: t('student.academic', { defaultValue: 'Academic' }), icon: BookOpen },
        { id: 'financial' as TabType, label: t('student.financial', { defaultValue: 'Financial' }), icon: CreditCard },
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
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                flexWrap: 'wrap',
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)',
                                marginBottom: '0.5rem'
                            }}>
                                <span>Class {student.class} - {student.section}</span>
                                <span>•</span>
                                <span>Roll {student.roll_number}</span>
                                <span>•</span>
                                <span>{student.admission_number}</span>
                            </div>
                            {student.parent_name && (
                                <div style={{
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-tertiary)'
                                }}>
                                    Parent: {student.parent_name} • {student.parent_phone}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <Button variant="outline" iconLeft={Edit}>
                                {t('common.edit', { defaultValue: 'Edit' })}
                            </Button>
                            <Button variant="outline" iconLeft={Printer}>
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

                    {activeTab === 'financial' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Financial Summary</h3>}
                            padding="lg"
                        >
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                Financial records will be displayed here.
                            </p>
                        </Card>
                    )}

                    {activeTab === 'health' && (
                        <Card
                            header={<h3 style={{ margin: 0 }}>Health Summary</h3>}
                            padding="lg"
                        >
                            {health_summary.bmi ? (
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
