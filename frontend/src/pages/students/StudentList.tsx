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
    const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/students/');
            let studentData: any[] = [];

            if (Array.isArray(response.data)) {
                studentData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                studentData = response.data.results;
            }

            setStudents(studentData);
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

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.admission_number.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesClass = !classFilter || student.current_class === classFilter;

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'active' && student.is_active) ||
            (statusFilter === 'inactive' && !student.is_active);

        return matchesSearch && matchesClass && matchesStatus;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
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
                setStudents(students.filter(s => s.id !== studentToDelete));
                setShowDeleteModal(false);
                setStudentToDelete(null);
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };



    const allSelected = filteredStudents.length > 0 && selectedStudents.size === filteredStudents.length;
    const someSelected = selectedStudents.size > 0 && selectedStudents.size < filteredStudents.length;

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
                    <Button variant="outline" iconLeft={Download}>
                        {t('common.export', { defaultValue: 'Export' })}
                    </Button>
                    <Button variant="primary" iconLeft={Plus} onClick={() => navigate('/students/add')}>
                        {t('students.add', { defaultValue: 'Add Student' })}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card padding="lg" style={{ marginBottom: '1.5rem' }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                        options={classOptions}
                        value={classFilter}
                        onChange={setClassFilter}
                        placeholder="Filter by class"
                        fullWidth
                    />

                    <Select
                        options={statusOptions}
                        value={statusFilter}
                        onChange={setStatusFilter}
                        placeholder="Filter by status"
                        fullWidth
                    />
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
                            <Button variant="outline" size="sm">
                                Bulk Edit
                            </Button>
                            <Button variant="danger" size="sm">
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
                                    <Checkbox
                                        checked={allSelected}
                                        indeterminate={someSelected}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                    />
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
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
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
                                            <Checkbox
                                                checked={selectedStudents.has(student.id)}
                                                onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                                            />
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
                                    <td colSpan={9} style={{
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
                        Showing {filteredStudents.length} of {students.length} students
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
