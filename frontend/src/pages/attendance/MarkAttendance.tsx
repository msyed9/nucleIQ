/**
 * Mark Attendance - Redesigned with NucleiQ Design System
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
    Users,
    Filter,
    AlertCircle
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/design-system';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import './Attendance.css';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    class_name: string;
    section: string;
    photo_url?: string;
}

interface GradeLevel {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
    grade_level: string;
    grade_level_name: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';
type FilterOption = '' | 'LATE' | 'ABSENT' | 'PRESENT';

const MarkAttendance: React.FC = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState<Student[]>([]);
    const [grades, setGrades] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<FilterOption>('');

    useEffect(() => {
        fetchGrades();
        fetchSections();
        fetchStudents();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [classFilter, sectionFilter]);

    const fetchGrades = async () => {
        try {
            const response = await api.get('/tenants/grades/');
            setGrades(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await api.get('/tenants/sections/');
            setSections(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            let url = '/students/students/';
            const params: string[] = [];

            // Request all students for attendance marking (override default pagination)
            params.push('page_size=1000');

            if (classFilter) {
                params.push(`class_name=${classFilter}`);
            }
            if (sectionFilter) {
                params.push(`section=${sectionFilter}`);
            }

            if (params.length > 0) {
                url += `?${params.join('&')}`;
            }

            const response = await api.get(url);
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

    const filteredStudents = students.filter((student) => {
        // Search filter
        const matchesSearch = student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchQuery.toLowerCase());

        // Status filter
        const matchesStatus = !statusFilter || attendance[student.id] === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: filteredStudents.length,
        present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
        absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
        late: Object.values(attendance).filter((s) => s === 'LATE').length,
    };

    // Prepare data for export
    const attendanceExportData = filteredStudents.map(student => ({
        admission_number: student.admission_number,
        full_name: student.full_name,
        class_name: student.class_name,
        section: student.section,
        status: attendance[student.id] || 'PRESENT',
        date: selectedDate
    }));

    // Export column configuration
    const exportColumns: ExportColumn[] = [
        { key: 'admission_number', label: 'Admission Number' },
        { key: 'full_name', label: 'Student Name' },
        { key: 'class_name', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Attendance Status' },
        {
            key: 'date',
            label: 'Date',
            format: (value) => new Date(value).toLocaleDateString('en-IN')
        }
    ];

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
                {/* Filters Section */}
                <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--color-border-light)', paddingBottom: '0.75rem' }}>
                    <Filter size={18} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        Filters
                    </h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Class
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'All Classes' },
                                ...grades.map(g => ({ value: g.name, label: g.name }))
                            ]}
                            value={classFilter}
                            onChange={(val: any) => {
                                setClassFilter(val);
                                setSectionFilter(''); // Reset section when class changes
                            }}
                            fullWidth
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Section
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'All Sections' },
                                ...sections
                                    .filter(s => !classFilter || s.grade_level_name === classFilter)
                                    .map(s => ({ value: s.name, label: s.name }))
                            ]}
                            value={sectionFilter}
                            onChange={(val: any) => setSectionFilter(val)}
                            fullWidth
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Status Filter
                        </label>
                        <Select
                            options={[
                                { value: '', label: 'All Status' },
                                { value: 'PRESENT', label: 'Present Only' },
                                { value: 'ABSENT', label: 'Absent Only' },
                                { value: 'LATE', label: 'Late Only' }
                            ]}
                            value={statusFilter}
                            onChange={(val: any) => setStatusFilter(val as FilterOption)}
                            fullWidth
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Date
                        </label>
                        <Input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            iconLeft={Calendar}
                            fullWidth
                        />
                    </div>
                </div>

                {/* Active Filters Badge */}
                {(classFilter || sectionFilter || statusFilter) && (
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.75rem', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-base)' }}>
                        <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <AlertCircle size={16} />
                            Active Filters:
                        </span>
                        {classFilter && (
                            <span style={{ padding: '0.25rem 0.75rem', background: 'var(--color-primary)', color: 'white', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                Class: {classFilter}
                            </span>
                        )}
                        {sectionFilter && (
                            <span style={{ padding: '0.25rem 0.75rem', background: 'var(--color-info)', color: 'white', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                Section: {sectionFilter}
                            </span>
                        )}
                        {statusFilter && (
                            <span style={{ padding: '0.25rem 0.75rem', background: 'var(--color-warning)', color: 'white', borderRadius: '1rem', fontSize: '0.75rem', fontWeight: 600 }}>
                                Status: {statusFilter}
                            </span>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setClassFilter('');
                                setSectionFilter('');
                                setStatusFilter('');
                            }}
                            style={{ marginLeft: 'auto', fontSize: '0.75rem' }}
                        >
                            Clear All
                        </Button>
                    </div>
                )}

                {/* Search and Quick Actions */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <Input
                            placeholder={t('attendance.search', { defaultValue: 'Search by name or admission number...' })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            iconLeft={Search}
                            fullWidth
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
                        <ExportButton
                            data={attendanceExportData}
                            filename={`attendance_${selectedDate}`}
                            title={`Attendance Report - ${selectedDate}`}
                            columns={exportColumns}
                            variant="outline"
                            size="small"
                        />
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