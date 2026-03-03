/**
 * Student List - Refactored with Custom Hooks and Shared Components
 * Uses useListData, useListFilters, useSelection, and shared UI components
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, UserPlus, FileDown, Trash2, Power, Eye, Edit } from 'lucide-react';
import {
    useListData,
    useListFilters,
    useSelection,
    useSorting,
    usePagination,
    useDeleteConfirmation,
    useBulkActions,
} from '../../hooks/useListPage';
import { useDebounce } from '../../hooks';
import {
    PageHeader,
    EmptyState,
    LoadingSpinner,
    StatusBadge,
    ConfirmDialog,
    SearchInput,
    FilterDropdown,
    DataTable,
} from '../../components/shared/SharedComponents';
import { Button, Card, Checkbox, Badge } from '@/design-system';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import { formatDate } from '../../utils/helpers';
import api from '../../services/api';
import { StudentListItem } from '../../types/api';
import './Students.css';

// ============================================
// Constants
// ============================================

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
];

const GENDER_OPTIONS = [
    { value: '', label: 'All Genders' },
    { value: 'MALE', label: 'Male' },
    { value: 'FEMALE', label: 'Female' },
    { value: 'OTHER', label: 'Other' },
];

// ============================================
// Main Component
// ============================================

const StudentListRefactored: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Filters
    const { filters, updateFilter, resetFilters } = useListFilters({
        search: { defaultValue: '' },
        section: { defaultValue: '' },
        gender: { defaultValue: '' },
        status: { defaultValue: 'all' },
    });

    // Debounced search
    const debouncedSearch = useDebounce(filters.search, 300);

    // Sorting
    const { sortColumn, sortDirection, handleSort, getOrdering } = useSorting('admission_number');

    // Pagination
    const { page, pageSize, setTotal, total, goToPage, changePageSize } = usePagination({
        defaultPageSize: 25,
    });

    // Sections for filter
    const [sections, setSections] = useState<any[]>([]);
    React.useEffect(() => {
        api.get('/tenants/sections/').then(res => {
            setSections(Array.isArray(res.data) ? res.data : res.data?.results || []);
        });
    }, []);

    // Build API params
    const apiFilters = useMemo(() => {
        const params: any = { search: debouncedSearch };
        if (filters.section) params.section = filters.section;
        if (filters.gender) params.gender = filters.gender;
        if (filters.status === 'active') params.is_active = true;
        else if (filters.status === 'inactive') params.is_active = false;
        return params;
    }, [debouncedSearch, filters.section, filters.gender, filters.status]);

    // Data fetching
    const { data: students, loading, error, refresh, total: fetchedTotal } = useListData<StudentListItem>({
        endpoint: '/students/students/',
        filters: apiFilters,
        ordering: getOrdering(),
        page,
        pageSize,
    });

    // Sync total from useListData to usePagination
    React.useEffect(() => {
        if (fetchedTotal > 0) {
            setTotal(fetchedTotal);
        }
    }, [fetchedTotal, setTotal]);

    // Selection
    const selection = useSelection(students);

    // Delete handling
    const deleteConfirm = useDeleteConfirmation({
        endpoint: '/students/students/',
        onSuccess: () => {
            refresh();
            selection.clearSelection();
        }
    });

    // Bulk actions
    const bulkActions = useBulkActions({
        endpoint: '/students/students/',
        onSuccess: () => {
            refresh();
            selection.clearSelection();
        }
    });

    // Handlers
    const handleToggleActive = async (student: StudentListItem) => {
        try {
            await api.patch(`/students/students/${student.id}/`, { is_active: !student.is_active });
            refresh();
        } catch (err) {
            console.error('Failed to toggle status', err);
        }
    };

    // Export configuration
    const exportColumns: ExportColumn[] = [
        { key: 'admission_number', label: 'Admission Number' },
        { key: 'full_name', label: 'Student Name' },
        { key: 'current_class_name', label: 'Class' },
        { key: 'section_name', label: 'Section' },
        { key: 'status', label: 'Status' },
        { key: 'parent_phone', label: 'Parent Phone' },
    ];

    // Table Columns
    const columns = [
        {
            key: 'selection',
            title: (
                <Checkbox
                    checked={selection.isAllSelected}
                    indeterminate={selection.isSomeSelected}
                    onChange={selection.toggleAll}
                />
            ),
            render: (student: StudentListItem) => (
                <Checkbox
                    checked={selection.isSelected(student.id)}
                    onChange={() => selection.toggleItem(student.id)}
                />
            ),
            width: '50px'
        },
        {
            key: 'photo',
            title: 'Photo',
            render: (student: StudentListItem) => (
                <div className="avatar-sm">
                    {student.photo_url ? (
                        <img src={student.photo_url} alt={student.full_name} />
                    ) : (
                        student.full_name.charAt(0)
                    )}
                </div>
            )
        },
        {
            key: 'admission_number',
            title: 'Admission No',
            sortable: true,
            render: (student: StudentListItem) => (
                <span className="font-mono text-xs font-bold">{student.admission_number}</span>
            )
        },
        {
            key: 'full_name',
            title: 'Student Name',
            sortable: true,
            render: (student: StudentListItem) => (
                <div className="student-info">
                    <span className="font-medium">{student.full_name}</span>
                </div>
            )
        },
        { key: 'current_class_name', title: 'Class', render: (s) => s.current_class_name || '-' },
        { key: 'section_name', title: 'Section', render: (s) => s.section_name || '-' },
        {
            key: 'enrollment_status',
            title: 'Enrollment',
            render: (student: StudentListItem) => {
                const status = (student as any).enrollment_status;
                if (!status) return <span style={{ color: '#888' }}>-</span>;
                const statusMap: Record<string, { label: string; variant: string; color: string }> = {
                    'ACTIVE': { label: 'Active', variant: 'success', color: '#16a34a' },
                    'COMPLETED': { label: 'Completed', variant: 'info', color: '#2563eb' },
                    'PROMOTED': { label: 'Promoted', variant: 'info', color: '#7c3aed' },
                    'DETAINED': { label: 'Detained', variant: 'warning', color: '#d97706' },
                    'SUSPENDED': { label: 'Suspended', variant: 'error', color: '#dc2626' },
                    'LEFT': { label: 'Left', variant: 'default', color: '#6b7280' },
                    'TRANSFERRED': { label: 'Transferred', variant: 'default', color: '#6b7280' },
                };
                const info = statusMap[status] || { label: status, variant: 'default', color: '#6b7280' };
                return (
                    <span style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#fff',
                        backgroundColor: info.color,
                    }}>
                        {info.label}
                    </span>
                );
            }
        },
        {
            key: 'status',
            title: 'Status',
            render: (student: StudentListItem) => (
                <StatusBadge
                    status={student.is_active ? 'Active' : 'Inactive'}
                    variant={student.is_active ? 'success' : 'default'}
                />
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            align: 'right' as const,
            render: (student: StudentListItem) => (
                <div className="flex gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${student.id}`)} title="View Profile">
                        <Eye size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/students/${student.id}/edit`)} title="Edit">
                        <Edit size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(student)}
                        title={student.is_active ? 'Deactivate' : 'Activate'}
                        className={student.is_active ? 'text-warning' : 'text-success'}
                    >
                        <Power size={16} />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteConfirm.requestDelete(student.id)} title="Delete" className="text-danger">
                        <Trash2 size={16} />
                    </Button>
                </div>
            )
        }
    ];

    return (
        <div className="page-container">
            <PageHeader
                title={t('students.title', 'Students')}
                subtitle={t('students.subtitle', 'Manage student records and profiles')}
                icon="🎓"
                actions={[
                    <ExportButton
                        key="export"
                        data={students}
                        filename="students_list"
                        title="Students List"
                        columns={exportColumns}
                        variant="outline"
                    />,
                    <Button key="add" variant="primary" iconLeft={Plus} onClick={() => navigate('/students/add')}>
                        {t('students.add', 'Add Student')}
                    </Button>
                ]}
            />

            <Card className="filter-card mb-4" padding="lg">
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4 items-end">
                    <div className="col-span-1 md:col-span-2">
                        <SearchInput
                            value={filters.search}
                            onChange={(val) => updateFilter('search', val)}
                            placeholder="Search by name or admission number..."
                        />
                    </div>
                    <FilterDropdown
                        label={t('students.section', 'Section')}
                        value={filters.section}
                        onChange={(val) => updateFilter('section', val)}
                        options={[
                            { value: '', label: 'All Sections' },
                            ...sections.map(s => ({ value: s.id, label: `${s.grade_level_name} - ${s.name}` }))
                        ]}
                        placeholder="Filter by section"
                    />
                    <FilterDropdown
                        label={t('students.status', 'Status')}
                        value={filters.status}
                        onChange={(val) => updateFilter('status', val)}
                        options={STATUS_OPTIONS}
                        placeholder="Filter by status"
                    />
                    <Button variant="outline" onClick={resetFilters}>Clear Filters</Button>
                </div>

                {selection.selectedCount > 0 && (
                    <div className="bulk-actions-bar">
                        <Badge variant="info">{selection.selectedCount} selected</Badge>
                        <Button
                            variant="danger"
                            size="sm"
                            iconLeft={Trash2}
                            onClick={() => bulkActions.bulkDelete(selection.selectedIds)}
                        >
                            Delete Selected
                        </Button>
                    </div>
                )}
            </Card>

            <DataTable
                columns={columns}
                data={students}
                loading={loading}
                emptyState={
                    <EmptyState
                        icon="👥"
                        title="No students found"
                        description="Try adjusting your filters or search term."
                        action={{ label: 'Clear Filters', onClick: resetFilters }}
                    />
                }
                pagination={{
                    currentPage: page,
                    pageSize,
                    totalItems: total,
                    onPageChange: goToPage,
                    onPageSizeChange: changePageSize
                }}
                onSort={handleSort}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                title="Delete Student"
                message="Are you sure you want to delete this student? This action cannot be undone."
                onConfirm={deleteConfirm.confirmDelete}
                onCancel={deleteConfirm.cancelDelete}
                confirmColor="error"
                isLoading={deleteConfirm.isDeleting}
            />
        </div>
    );
};

export default StudentListRefactored;
