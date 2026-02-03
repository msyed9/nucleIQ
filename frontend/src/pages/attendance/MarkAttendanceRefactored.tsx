/**
 * Mark Attendance - Refactored with Custom Hooks and Shared Components
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
    CheckCircle,
    XCircle,
    Clock,
    Users,
    Calendar,
} from 'lucide-react';
import {
    useListData,
    useDebounce,
} from '../../hooks';
import {
    PageHeader,
    DataCard,
    EmptyState,
    LoadingSpinner,
    SearchInput,
    FilterDropdown,
    DataTable,
} from '../../components/shared/SharedComponents';
import { Button, Card, Input } from '@/design-system';
import ExportButton from '../../components/common/ExportButton';
import api from '../../services/api';
import './Attendance.css';

// ============================================
// Types
// ============================================

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    class_name: string;
    section: string;
    photo_url?: string;
}

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

// ============================================
// Main Component
// ============================================

const MarkAttendanceRefactored: React.FC = () => {
    const { t } = useTranslation();

    // Filters State
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Master data
    const [grades, setGrades] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);

    // Attendance State
    const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
    const [saving, setSaving] = useState(false);

    // Debounced search
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Fetch Master Data
    useEffect(() => {
        Promise.all([
            api.get('/tenants/grades/'),
            api.get('/tenants/sections/')
        ]).then(([gradesRes, sectionsRes]) => {
            setGrades(gradesRes.data.results || gradesRes.data);
            setSections(sectionsRes.data.results || sectionsRes.data);
        });
    }, []);

    // API Filters
    const apiFilters = useMemo(() => {
        const params: any = { page_size: 1000 };
        if (classFilter) params.class_name = classFilter;
        if (sectionFilter) params.section = sectionFilter;
        return params;
    }, [classFilter, sectionFilter]);

    // Data Fetching
    const { data: students, loading, refresh } = useListData<Student>({
        endpoint: '/students/students/',
        filters: apiFilters,
        onSuccess: (data: any) => {
            const initial: Record<string, AttendanceStatus> = {};
            const list = data.results || data;
            list.forEach((s: Student) => {
                initial[s.id] = 'PRESENT';
            });
            setAttendanceMap(initial);
        }
    });

    // Client-side filtering (Search & Status)
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchesSearch = s.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                s.admission_number.toLowerCase().includes(debouncedSearch.toLowerCase());
            const matchesStatus = !statusFilter || attendanceMap[s.id] === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [students, debouncedSearch, statusFilter, attendanceMap]);

    // Stats
    const stats = useMemo(() => {
        const values = Object.values(attendanceMap);
        return {
            total: filteredStudents.length,
            present: values.filter(v => v === 'PRESENT').length,
            absent: values.filter(v => v === 'ABSENT').length,
            late: values.filter(v => v === 'LATE').length,
        };
    }, [filteredStudents, attendanceMap]);

    // Handlers
    const handleStatusChange = (id: string, status: AttendanceStatus) => {
        setAttendanceMap(prev => ({ ...prev, [id]: status }));
    };

    const handleMarkAll = (status: AttendanceStatus) => {
        const update: Record<string, AttendanceStatus> = {};
        filteredStudents.forEach(s => { update[s.id] = status; });
        setAttendanceMap(prev => ({ ...prev, ...update }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const attendance_data = Object.entries(attendanceMap).map(([id, status]) => ({
                record_type: 'STUDENT',
                entity_id: id,
                status: status
            }));

            await api.post('/attendance/records/mark_bulk/', {
                date: selectedDate,
                attendance: attendance_data,
            });

            alert(t('common.success'));
        } catch (error) {
            console.error('Error saving attendance:', error);
            alert(t('common.error'));
        } finally {
            setSaving(false);
        }
    };

    // Columns
    const columns = [
        {
            key: 'photo',
            title: 'Photo',
            render: (s: Student) => (
                <div className="avatar-sm">
                    {s.photo_url ? <img src={s.photo_url} alt={s.full_name} /> : s.full_name.charAt(0)}
                </div>
            )
        },
        { key: 'admission_number', title: 'Admission No' },
        { key: 'full_name', title: 'Student Name', className: 'font-medium' },
        {
            key: 'class',
            title: 'Class/Section',
            render: (s: Student) => `${s.class_name} - ${s.section}`
        },
        {
            key: 'status',
            title: 'Action',
            render: (s: Student) => {
                const current = attendanceMap[s.id] || 'PRESENT';
                return (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={current === 'PRESENT' ? 'success' : 'outline'}
                            onClick={() => handleStatusChange(s.id, 'PRESENT')}
                            iconLeft={CheckCircle}
                        >
                            Present
                        </Button>
                        <Button
                            size="sm"
                            variant={current === 'ABSENT' ? 'danger' : 'outline'}
                            onClick={() => handleStatusChange(s.id, 'ABSENT')}
                            iconLeft={XCircle}
                        >
                            Absent
                        </Button>
                        <Button
                            size="sm"
                            variant={current === 'LATE' ? 'warning' : 'outline'}
                            onClick={() => handleStatusChange(s.id, 'LATE')}
                            iconLeft={Clock}
                        >
                            Late
                        </Button>
                    </div>
                );
            }
        }
    ];

    if (loading && students.length === 0) return <LoadingSpinner fullScreen />;

    return (
        <div className="page-container">
            <PageHeader
                title={t('attendance.title', 'Mark Attendance')}
                subtitle={t('attendance.subtitle', 'Bulk record student attendance')}
                icon="📅"
                actions={[
                    <ExportButton
                        key="export"
                        data={filteredStudents.map(s => ({ ...s, status: attendanceMap[s.id], date: selectedDate }))}
                        filename={`attendance_${selectedDate}`}
                        title={`Attendance - ${selectedDate}`}
                        columns={[
                            { key: 'admission_number', label: 'Admission No' },
                            { key: 'full_name', label: 'Name' },
                            { key: 'status', label: 'Status' }
                        ]}
                        variant="outline"
                    />
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <DataCard title="Total Students" value={stats.total} icon={<Users />} variant="info" />
                <DataCard title="Present" value={stats.present} icon={<CheckCircle />} variant="success" />
                <DataCard title="Absent" value={stats.absent} icon={<XCircle />} variant="error" />
                <DataCard title="Late" value={stats.late} icon={<Clock />} variant="warning" />
            </div>

            <Card className="mb-4" padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <FilterDropdown
                        label="Class"
                        value={classFilter}
                        onChange={(v) => { setClassFilter(v); setSectionFilter(''); }}
                        options={[{ value: '', label: 'All Classes' }, ...grades.map(g => ({ value: g.name, label: g.name }))]}
                    />
                    <FilterDropdown
                        label="Section"
                        value={sectionFilter}
                        onChange={setSectionFilter}
                        options={[
                            { value: '', label: 'All Sections' },
                            ...sections.filter(s => !classFilter || s.grade_level_name === classFilter).map(s => ({ value: s.name, label: s.name }))
                        ]}
                    />
                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} iconLeft={Calendar} />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="success" onClick={() => handleMarkAll('PRESENT')}>Mark All Present</Button>
                        <Button variant="outline" onClick={() => { setClassFilter(''); setSectionFilter(''); setSearchTerm(''); }}>Clear</Button>
                    </div>
                </div>
                <div className="mt-4">
                    <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Search by name or admission number..." />
                </div>
            </Card>

            <DataTable
                columns={columns}
                data={filteredStudents}
                loading={loading}
                emptyState={<EmptyState title="No students found" icon="👥" />}
            />

            <div className="mt-6 flex justify-end">
                <Button variant="primary" size="lg" onClick={handleSubmit} loading={saving} style={{ minWidth: '200px' }}>
                    Save Attendance
                </Button>
            </div>
        </div>
    );
};

export default MarkAttendanceRefactored;
