/**
 * Attendance Reports & Analytics
 * View late students, absent students, and detailed attendance reports
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Clock,
    UserX,
    Calendar,
    Filter,
    Download,
    TrendingUp,
    AlertTriangle
} from 'lucide-react';
import { Button, Card, Input, Select } from '@/design-system';
import api from '../../services/api';
import Loading from '../../components/common/Loading';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';

interface AttendanceRecord {
    id: string;
    student: string | null;
    student_name: string;
    student_admission_number: string;
    student_class: string | null;
    student_section: string | null;
    student_photo: string | null;
    date: string;
    status: string;
    check_in_time?: string;
    method: string;
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

type ReportType = 'late' | 'absent' | 'all';

const AttendanceReports: React.FC = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [grades, setGrades] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [reportType, setReportType] = useState<ReportType>('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [lateThreshold, setLateThreshold] = useState('09:30'); // Default late time

    useEffect(() => {
        fetchGrades();
        fetchSections();
    }, []);

    useEffect(() => {
        fetchAttendanceRecords();
    }, [selectedDate, reportType, classFilter, sectionFilter]);

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

    const fetchAttendanceRecords = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('date', selectedDate);

            if (reportType === 'late') {
                params.append('status', 'LATE');
            } else if (reportType === 'absent') {
                params.append('status', 'ABSENT');
            }

            // Use backend filtering for class and section
            if (classFilter) {
                params.append('class_name', classFilter);
            }
            if (sectionFilter) {
                params.append('section', sectionFilter);
            }

            const response = await api.get(`/attendance/records/?${params.toString()}`);
            const fetchedRecords = response.data.results || response.data;
            setRecords(fetchedRecords);
        } catch (error) {
            console.error('Error fetching attendance records:', error);
        } finally {
            setLoading(false);
        }
    };

    const stats = {
        total: records.length,
        late: records.filter(r => r.status === 'LATE').length,
        absent: records.filter(r => r.status === 'ABSENT').length,
        present: records.filter(r => r.status === 'PRESENT').length,
    };

    const exportData = records.map(record => ({
        date: record.date,
        admission_number: record.student_admission_number,
        student_name: record.student_name,
        class: record.student_class || 'N/A',
        section: record.student_section || 'N/A',
        status: record.status,
        check_in_time: record.check_in_time || 'N/A',
        method: record.method
    }));

    const exportColumns: ExportColumn[] = [
        { key: 'date', label: 'Date' },
        { key: 'admission_number', label: 'Admission No' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'class', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'status', label: 'Status' },
        { key: 'check_in_time', label: 'Check-in Time' },
        { key: 'method', label: 'Method' }
    ];

    if (loading) {
        return <Loading fullScreen text="Loading attendance reports..." />;
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
                    Attendance Reports
                </h1>
                <p style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                }}>
                    View detailed attendance reports, late arrivals, and absentees
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
                        <TrendingUp size={24} color="var(--color-info)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.total}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Total Records
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-warning)',
                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.05), rgba(255,255,255,0.02))',
                    cursor: 'pointer'
                }} onClick={() => setReportType('late')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Clock size={24} color="var(--color-warning)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.late}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Late Arrivals
                            </div>
                        </div>
                    </div>
                </Card>

                <Card padding="md" style={{
                    borderLeft: '4px solid var(--color-error)',
                    background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.05), rgba(255,255,255,0.02))',
                    cursor: 'pointer'
                }} onClick={() => setReportType('absent')}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <UserX size={24} color="var(--color-error)" />
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                                {stats.absent}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                Absentees
                            </div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card padding="lg" style={{ marginBottom: '2rem' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '2px solid var(--color-border-light)', paddingBottom: '0.75rem' }}>
                    <Filter size={18} color="var(--color-primary)" />
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                        Report Filters
                    </h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem'
                }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Report Type
                        </label>
                        <Select
                            options={[
                                { value: 'all', label: 'All Records' },
                                { value: 'late', label: 'Late Arrivals Only' },
                                { value: 'absent', label: 'Absentees Only' }
                            ]}
                            value={reportType}
                            onChange={(val: any) => setReportType(val as ReportType)}
                            fullWidth
                        />
                    </div>

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

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                            Late Threshold Time
                        </label>
                        <Input
                            type="time"
                            value={lateThreshold}
                            onChange={(e) => setLateThreshold(e.target.value)}
                            iconLeft={Clock}
                            fullWidth
                        />
                    </div>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <ExportButton
                        data={exportData}
                        filename={`attendance_report_${reportType}_${selectedDate}`}
                        title={`Attendance Report - ${reportType.toUpperCase()} - ${selectedDate}`}
                        columns={exportColumns}
                        variant="primary"
                        size="small"

                    />
                </div>
            </Card>

            {/* Records Table */}
            <Card padding="none">
                {records.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                        <AlertTriangle size={48} color="var(--color-text-secondary)" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontSize: '1.125rem', color: 'var(--color-text-secondary)' }}>
                            No records found for selected filters
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                        Check-in Time
                                    </th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                        Method
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.map((record) => (
                                    <tr
                                        key={record.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border-light)',
                                            background: record.status === 'LATE'
                                                ? 'rgba(255, 193, 7, 0.03)'
                                                : record.status === 'ABSENT'
                                                    ? 'rgba(244, 67, 54, 0.03)'
                                                    : 'transparent'
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
                                                {record.student_photo ? (
                                                    <img src={record.student_photo} alt={record.student_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    record.student_name?.charAt(0) || '?'
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {record.student_admission_number}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                                            {record.student_name}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {record.student_class || 'N/A'} - {record.student_section || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: record.status === 'PRESENT'
                                                    ? 'var(--color-success)'
                                                    : record.status === 'LATE'
                                                        ? 'var(--color-warning)'
                                                        : 'var(--color-error)',
                                                color: 'white'
                                            }}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {record.check_in_time || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {record.method?.replace('_', ' ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default AttendanceReports;
