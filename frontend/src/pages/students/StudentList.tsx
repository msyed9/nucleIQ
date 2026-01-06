/**
 * Student List - Redesigned with NucleIQ Design System
 * Data table with search, filter, sort, and bulk actions
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Plus,
    Search,
    Download,
    Eye,
    Edit,
    Trash2
} from 'lucide-react';
import { Button, Card, Input, Badge, Select, Checkbox, Modal } from '@/design-system';
import Loading from '../../components/common/Loading';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';
import './Students.css';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    current_class: string;
    section: string;
    date_of_birth: string;
    age?: number;
    is_active: boolean;
    photo?: string;
}

const StudentList: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [genderFilter, setGenderFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [sections, setSections] = useState<any[]>([]);
    const [sortBy, setSortBy] = useState('');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchStudents();
        fetchSections();
    }, [searchTerm, sectionFilter, genderFilter, statusFilter, sortBy, sortOrder]);

    const fetchStudents = async () => {
        try {
            const params: any = {};
            if (searchTerm) params.search = searchTerm;
            if (sectionFilter) params.section = sectionFilter;
            if (genderFilter) params.gender = genderFilter;
            if (statusFilter === 'active') params.is_active = true;
            else if (statusFilter === 'inactive') params.is_active = false;
            if (sortBy) params.ordering = sortOrder === 'desc' ? `-${sortBy}` : sortBy;

            const response = await api.get('/students/students/', { params });
            let studentData: any[] = [];

            if (Array.isArray(response.data)) {
                studentData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                studentData = response.data.results;
            }

            setStudents(studentData);
            setSelectedStudents(new Set());
        } catch (error) {
            console.error('Error fetching students:', error);
            // Mock data
            setStudents([
                {
                    id: '1',
                    admission_number: 'ADM001',
                    full_name: 'Ravi Kumar',
                    current_class: 'Class 10',
                    section: 'A',
                    date_of_birth: '2010-05-15',
                    is_active: true,
                },
                {
                    id: '2',
                    admission_number: 'ADM002',
                    full_name: 'Priya Sharma',
                    current_class: 'Class 10',
                    section: 'B',
                    date_of_birth: '2010-08-20',
                    is_active: true,
                },
                {
                    id: '3',
                    admission_number: 'ADM003',
                    full_name: 'Arjun Reddy',
                    current_class: 'Class 9',
                    section: 'A',
                    date_of_birth: '2011-03-12',
                    is_active: false,
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async () => {
        try {
            const res = await api.get('/tenants/sections/');
            const sectionsData = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setSections(sectionsData);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedStudents.size === 0) return;
        if (!confirm(`Delete ${selectedStudents.size} student(s)?`)) return;
        
        try {
            await Promise.all(
                Array.from(selectedStudents).map(id => api.delete(`/students/students/${id}/`))
            );
            fetchStudents();
        } catch (error) {
            console.error('Bulk delete failed:', error);
            alert('Failed to delete some students');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(new Set(students.map(s => s.id)));
        } else {
            setSelectedStudents(new Set());
        }
    };

    const handleSelectStudent = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedStudents);
        if (checked) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedStudents(newSelected);
    };

    const handleDeleteClick = (id: string) => {
        setStudentToDelete(id);
        setShowDeleteModal(true);
    };

    const handleDeleteConfirm = async () => {
        if (studentToDelete) {
            try {
                await api.delete(`/students/students/${studentToDelete}/`);
                fetchStudents();
                setShowDeleteModal(false);
                setStudentToDelete(null);
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    // Export column configuration
    const exportColumns: ExportColumn[] = [
        { key: 'admission_number', label: 'Admission Number' },
        { key: 'full_name', label: 'Student Name' },
        { key: 'current_class', label: 'Class' },
        { key: 'section', label: 'Section' },
        {
            key: 'date_of_birth',
            label: 'Date of Birth',
            format: (value) => formatDate(value)
        },
        {
            key: 'is_active',
            label: 'Status',
            format: (value) => value ? 'Active' : 'Inactive'
        }
    ];



    const allSelected = students.length > 0 && selectedStudents.size === students.length;
    const someSelected = selectedStudents.size > 0 && selectedStudents.size < students.length;

    const classOptions = [
        { value: '', label: 'All Classes' },
        { value: 'Class 9', label: 'Class 9' },
        { value: 'Class 10', label: 'Class 10' },
    ];

    const statusOptions = [
        { value: 'all', label: 'All Status' },
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
    ];

    if (loading) {
        return <Loading fullScreen text={t('loading.students', { defaultValue: 'Loading students...' })} />;
    }

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div>
                    <h1 style={{
                        fontFamily: 'var(--font-family-primary)',
                        fontSize: '2.25rem',
                        fontWeight: 700,
                        color: 'var(--color-text-primary)',
                        margin: '0 0 0.5rem 0'
                    }}>
                        {t('students.title', { defaultValue: 'Students' })}
                    </h1>
                    <p style={{
                        fontSize: '1rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                    }}>
                        {t('students.subtitle', { defaultValue: 'Manage student records and profiles' })}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <ExportButton
                        data={students}
                        filename="students_list"
                        title="Students List"
                        columns={exportColumns}
                        variant="outline"
                    />
                    <Button variant="primary" iconLeft={Plus} onClick={() => navigate('/students/add')}>
                        {t('students.add', { defaultValue: 'Add Student' })}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card padding="lg" style={{ marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    alignItems: 'end'
                }}>
                    <Input
                        placeholder={t('students.search_placeholder', { defaultValue: 'Search by name or admission number...' })}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        iconLeft={Search}
                        fullWidth
                    />

                    <Select
                        options={[
                            { value: '', label: 'All Sections' },
                            ...sections.map(s => ({
                                value: s.id.toString(),
                                label: `${s.grade_level_name} - ${s.name}`
                            }))
                        ]}
                        value={sectionFilter}
                        onChange={setSectionFilter}
                        placeholder="Filter by section"
                        fullWidth
                    />

                    <Select
                        options={[
                            { value: '', label: 'All Genders' },
                            { value: 'M', label: 'Male' },
                            { value: 'F', label: 'Female' },
                            { value: 'O', label: 'Other' }
                        ]}
                        value={genderFilter}
                        onChange={setGenderFilter}
                        placeholder="Filter by gender"
                        fullWidth
                    />

                    <Select
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filter by status"
                        fullWidth
                    />

                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setSearchTerm('');
                            setSectionFilter('');
                            setGenderFilter('');
                            setStatusFilter('all');
                            setSortBy('');
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>

                {selectedStudents.size > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '1rem',
                        background: 'rgba(33, 150, 243, 0.05)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <span style={{
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--color-primary-700)'
                        }}>
                            {selectedStudents.size} student(s) selected
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button variant="danger" size="sm" onClick={handleBulkDelete}>
                                Delete Selected
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Table */}
            <Card padding="none">
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{
                            background: 'var(--color-bg-secondary)',
                            borderBottom: '2px solid var(--color-border-light)'
                        }}>
                            <tr>
                                <th style={{
                                    padding: '1rem',
                                    textAlign: 'left',
                                    width: '50px'
                                }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', pointerEvents: 'auto', cursor: 'pointer' }}>
                                        <Checkbox
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                            tabIndex={0}
                                            style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                        />
                                    </div>
                                </th>
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
                                    Section
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Age
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Date of Birth
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Status
                                </th>
                                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length > 0 ? (
                                students.map((student) => (
                                    <tr
                                        key={student.id}
                                        style={{
                                            borderBottom: '1px solid var(--color-border-light)',
                                            transition: 'background var(--transition-fast)',
                                            background: selectedStudents.has(student.id) ? 'rgba(33, 150, 243, 0.05)' : 'transparent'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedStudents.has(student.id)) {
                                                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedStudents.has(student.id)) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', pointerEvents: 'auto', cursor: 'pointer' }}>
                                                <Checkbox
                                                    checked={selectedStudents.has(student.id)}
                                                    onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                                                    tabIndex={0}
                                                    style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                                                />
                                            </div>
                                        </td>
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
                                                {student.photo ? (
                                                    <img src={student.photo} alt={student.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                                            {student.current_class}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {student.section}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {student.age || 'N/A'}
                                        </td>
                                        <td style={{ padding: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {formatDate(student.date_of_birth)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Badge variant={student.is_active ? 'success' : 'neutral'} size="sm">
                                                {student.is_active ? t('common.active', { defaultValue: 'Active' }) : t('common.inactive', { defaultValue: 'Inactive' })}
                                            </Badge>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    iconOnly={Eye}
                                                    onClick={() => navigate(`/students/${student.id}`)}
                                                    aria-label="View student"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    iconOnly={Edit}
                                                    onClick={() => navigate(`/students/${student.id}/edit`)}
                                                    aria-label="Edit student"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    iconOnly={Trash2}
                                                    onClick={() => handleDeleteClick(student.id)}
                                                    aria-label="Delete student"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={10} style={{
                                        padding: '3rem',
                                        textAlign: 'center',
                                        color: 'var(--color-text-tertiary)'
                                    }}>
                                        {t('students.no_data', { defaultValue: 'No students found' })}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--color-border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--color-text-secondary)',
                        margin: 0
                    }}>
                        Showing {students.length} students
                    </p>
                </div>
            </Card>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Confirm Delete"
                size="sm"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                            Cancel
                        </Button>
                        <Button variant="danger" onClick={handleDeleteConfirm}>
                            Delete
                        </Button>
                    </>
                }
            >
                <p>Are you sure you want to delete this student? This action cannot be undone.</p>
            </Modal>
        </div>
    );
};

export default StudentList;
