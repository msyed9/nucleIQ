/**
 * Mark Attendance - Redesigned with NucleIQ Design System
 * Bulk attendance marking with search, filters, and quick actions
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle,
    XCircle,
    Clock,
    Search,
    Download,
    Calendar,
    Users
} from 'lucide-react';
import { Button, Card, Input } from '@/design-system';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import './Attendance.css';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    class_name: string;
    section: string;
    photo_url?: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

const MarkAttendance: React.FC = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/students/students/');
            const studentList = response.data.results || response.data;
            setStudents(studentList);

            // Initialize attendance as all present
            const initialAttendance: Record<string, AttendanceStatus> = {};
            studentList.forEach((student: Student) => {
                initialAttendance[student.id] = 'PRESENT';
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId: string, status: AttendanceStatus) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const newAttendance: Record<string, AttendanceStatus> = {};
        filteredStudents.forEach((student) => {
            newAttendance[student.id] = status;
        });
        setAttendance((prev) => ({ ...prev, ...newAttendance }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const attendance_data = Object.entries(attendance).map(
                ([student_id, status]) => ({
                    record_type: 'STUDENT',
                    entity_id: student_id,
                    status: status
                })
            );

            await api.post('/attendance/records/mark_bulk/', {
                date: selectedDate,
                attendance: attendance_data,
            });

            alert(t('attendance.success', { defaultValue: 'Attendance marked successfully! 🎉' }));
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert(t('attendance.error', { defaultValue: 'Failed to mark attendance.' }));
        } finally {
            setSaving(false);
        }
    };

    const filteredStudents = students.filter((student) =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: filteredStudents.length,
        present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
        absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
        late: Object.values(attendance).filter((s) => s === 'LATE').length,
    };

    if (loading) {
        return <Loading fullScreen text={t('attendance.loading', { defaultValue: 'Loading students...' })} />;
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '2.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.5rem 0'
                }}>
                    {t('attendance.title', { defaultValue: 'Mark Attendance' })}
                </h1>
                <p style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                }}>
                    {t('attendance.subtitle', { defaultValue: 'Record student attendance for today' })}
                </p>
            </div>

            {/* Stats Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-info)',
                    background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05), rgba(255,255,255,0.02))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Users size={24} color="var(--color-info)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('attendance.total', { defaultValue: 'Total Students' })}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-success)',
                    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05), rgba(255,255,255,0.02))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <CheckCircle size={24} color="var(--color-success)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.present}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('attendance.present', { defaultValue: 'Present' })}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-error)',
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05), rgba(255,255,255,0.02))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <XCircle size={24} color="var(--color-error)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.absent}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('attendance.absent', { defaultValue: 'Absent' })}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-warning)',
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(255,255,255,0.02))'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={24} color="var(--color-warning)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.late}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                {t('attendance.late', { defaultValue: 'Late' })}
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Controls */}
            <Card padding="lg" style={{ marginBottom: '2rem' }}>
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', gap: '1rem', flex: 1, minWidth: '300px' }}>
                        <Input
                            placeholder={t('attendance.search', { defaultValue: 'Search by name or admission number...' })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            iconLeft={Search}
                            fullWidth
                        />
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            iconLeft={Calendar}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                            variant="success"
                            size="sm"
                            iconLeft={CheckCircle}
                            onClick={() => handleMarkAll('PRESENT')}
                        >
                            Mark All Present
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            iconLeft={Download}
                        >
                            Export
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Attendance Table */}
            <Card padding="none">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse'
                    }}>
                        <thead style={{
                            background: 'var(--color-bg-secondary)',
                            borderBottom: '2px solid var(--color-border-light)'
                        }}>
                            <tr>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Photo
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Admission No
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Student Name
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Class
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    style={{
                                        borderBottom: '1px solid var(--color-border-light)',
                                        background: attendance[student.id] === 'PRESENT'
                                            ? 'rgba(76, 175, 80, 0.03)'
                                            : attendance[student.id] === 'ABSENT'
                                                ? 'rgba(244, 67, 54, 0.03)'
                                                : 'rgba(255, 193, 7, 0.03)',
                                        transition: 'background var(--transition-fast)'
                                    }}
                                >
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            overflow: 'hidden',
                                            background: 'var(--color-primary-50)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            color: 'var(--color-primary-700)'
                                        }}>
                                            {student.photo_url ? (
                                                <img src={student.photo_url} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                student.full_name.charAt(0)
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        {student.admission_number}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                        {student.full_name}
                                    </td>
                                    <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                        {student.class_name} - {student.section}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    border: `2px solid ${attendance[student.id] === 'PRESENT' ? 'var(--color-success)' : 'var(--color-border-light)'}`,
                                                    background: attendance[student.id] === 'PRESENT' ? 'var(--color-success)' : 'white',
                                                    color: attendance[student.id] === 'PRESENT' ? 'white' : 'var(--color-text-secondary)',
                                                    borderRadius: 'var(--radius-base)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all var(--transition-fast)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <CheckCircle size={14} />
                                                Present
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    border: `2px solid ${attendance[student.id] === 'ABSENT' ? 'var(--color-error)' : 'var(--color-border-light)'}`,
                                                    background: attendance[student.id] === 'ABSENT' ? 'var(--color-error)' : 'white',
                                                    color: attendance[student.id] === 'ABSENT' ? 'white' : 'var(--color-text-secondary)',
                                                    borderRadius: 'var(--radius-base)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all var(--transition-fast)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <XCircle size={14} />
                                                Absent
                                            </button>
                                            <button
                                                onClick={() => handleAttendanceChange(student.id, 'LATE')}
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    border: `2px solid ${attendance[student.id] === 'LATE' ? 'var(--color-warning)' : 'var(--color-border-light)'}`,
                                                    background: attendance[student.id] === 'LATE' ? 'var(--color-warning)' : 'white',
                                                    color: attendance[student.id] === 'LATE' ? 'white' : 'var(--color-text-secondary)',
                                                    borderRadius: 'var(--radius-base)',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    cursor: 'pointer',
                                                    transition: 'all var(--transition-fast)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem'
                                                }}
                                            >
                                                <Clock size={14} />
                                                Late
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{ padding: '1.5rem', borderTop: '1px solid var(--color-border-light)' }}>
                    <Button
                        variant="primary"
                        size="lg"
                        onClick={handleSubmit}
                        loading={saving}
                        fullWidth
                    >
                        {t('attendance.save', { defaultValue: 'Save Attendance' })}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default MarkAttendance;