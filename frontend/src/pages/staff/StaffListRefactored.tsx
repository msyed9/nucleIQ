/**
 * Staff List - Refactored with Custom Hooks and Shared Components
 * Uses useListData, useListFilters, and shared UI components
 */

import React, { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    useListData,
    useDebounce,
    useModal,
    useConfirmDialog,
} from '../../hooks';
import {
    PageHeader,
    DataCard,
    EmptyState,
    LoadingSpinner,
    StatusBadge,
    ConfirmDialog,
    SearchInput,
    FilterDropdown,
} from '../../components/shared/SharedComponents';
import api from '../../services/api';
import './StaffList.css';

// ============================================
// Types
// ============================================

interface Staff {
    id: number;
    employee_id: string;
    full_name: string;
    designation: string;
    department_name: string;
    email: string;
    phone: string;
    status: string;
    photo?: string;
    joining_date: string;
}

// ============================================
// Constants
// ============================================

const DESIGNATION_OPTIONS = [
    { value: '', label: 'All Designations' },
    { value: 'PRINCIPAL', label: 'Principal' },
    { value: 'VICE_PRINCIPAL', label: 'Vice Principal' },
    { value: 'HEAD_TEACHER', label: 'Head Teacher' },
    { value: 'TEACHER', label: 'Teacher' },
    { value: 'ASSISTANT_TEACHER', label: 'Assistant Teacher' },
    { value: 'LIBRARIAN', label: 'Librarian' },
    { value: 'LAB_ASSISTANT', label: 'Lab Assistant' },
    { value: 'COUNSELOR', label: 'Counselor' },
    { value: 'ACCOUNTANT', label: 'Accountant' },
    { value: 'CLERK', label: 'Clerk' },
];

const STATUS_OPTIONS = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'SUSPENDED', label: 'Suspended' },
    { value: 'RESIGNED', label: 'Resigned' },
    { value: 'TERMINATED', label: 'Terminated' },
    { value: 'RETIRED', label: 'Retired' },
];

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    ACTIVE: 'success',
    ON_LEAVE: 'warning',
    SUSPENDED: 'error',
    RESIGNED: 'default',
    TERMINATED: 'error',
    RETIRED: 'default',
};

// ============================================
// Utility Functions
// ============================================

const formatDesignation = (designation: string): string => {
    return designation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

// ============================================
// Staff Card Component
// ============================================

interface StaffCardProps {
    member: Staff;
    onView: () => void;
    onEdit: () => void;
    onDelete?: () => void;
}

const StaffCard: React.FC<StaffCardProps> = ({ member, onView, onEdit }) => {
    const { t } = useTranslation();

    return (
        <div className="staff-card">
            <div className="staff-photo">
                {member.photo ? (
                    <img src={member.photo} alt={member.full_name} />
                ) : (
                    <div className="photo-placeholder">
                        {member.full_name.charAt(0)}
                    </div>
                )}
            </div>

            <div className="staff-info">
                <h3>{member.full_name}</h3>
                <p className="employee-id">ID: {member.employee_id}</p>
                <p className="designation">{formatDesignation(member.designation)}</p>
                {member.department_name && (
                    <p className="department">
                        <span className="icon">📚</span> {member.department_name}
                    </p>
                )}
                <p className="contact">
                    <span className="icon">📧</span> {member.email}
                </p>
                <p className="contact">
                    <span className="icon">📞</span> {member.phone}
                </p>

                <div className="staff-footer">
                    <StatusBadge
                        status={member.status.replace('_', ' ')}
                        variant={STATUS_COLORS[member.status] || 'default'}
                    />
                    <span className="joining-date">
                        {t('staff.joined', { date: formatDate(member.joining_date) })}
                    </span>
                </div>
            </div>

            <div className="staff-actions">
                <button className="btn-view" title={t('staff.view')} onClick={onView}>
                    👁️ {t('staff.view')}
                </button>
                <button className="btn-edit" title={t('staff.edit')} onClick={onEdit}>
                    ✏️ {t('staff.edit')}
                </button>
            </div>
        </div>
    );
};

// ============================================
// Main Component
// ============================================

const StaffListRefactored: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Filter state
    const [searchTerm, setSearchTerm] = React.useState('');
    const [designation, setDesignation] = React.useState('');
    const [status, setStatus] = React.useState('');

    // Debounce search term
    const debouncedSearch = useDebounce(searchTerm, 300);

    // Build filters for API
    const filters = useMemo(() => ({
        search: debouncedSearch,
        designation,
        status,
    }), [debouncedSearch, designation, status]);

    // Fetch staff data using custom hook
    const {
        data: staff,
        loading,
        error,
        refresh,
    } = useListData<Staff>({
        endpoint: '/staff/staff/',
        filters,
        pageSize: 100, // Load all for grid view
    });

    // Delete confirmation dialog
    const confirmDialog = useConfirmDialog();

    // Computed stats
    const stats = useMemo(() => {
        const total = staff.length;
        const active = staff.filter(s => s.status === 'ACTIVE').length;
        const onLeave = staff.filter(s => s.status === 'ON_LEAVE').length;
        const teachers = staff.filter(s =>
            s.designation === 'TEACHER' || s.designation === 'ASSISTANT_TEACHER'
        ).length;

        return { total, active, onLeave, teachers };
    }, [staff]);

    // Handlers
    const handleView = useCallback((id: number) => {
        navigate(`/staff/${id}`);
    }, [navigate]);

    const handleEdit = useCallback((id: number) => {
        navigate(`/staff/${id}`);
    }, [navigate]);

    const handleDelete = useCallback(async (id: number, name: string) => {
        confirmDialog.confirm({
            title: t('staff.deleteTitle', 'Delete Staff'),
            message: t('staff.deleteConfirm', { name }),
            confirmText: t('common.delete'),
            confirmColor: 'error',
            onConfirm: async () => {
                await api.delete(`/staff/staff/${id}/`);
                refresh();
            },
        });
    }, [confirmDialog, t, refresh]);

    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setDesignation('');
        setStatus('');
    }, []);

    // Render loading state
    if (loading && staff.length === 0) {
        return <LoadingSpinner text={t('staff.loading')} />;
    }

    // Render error state
    if (error) {
        return (
            <EmptyState
                icon="⚠️"
                title={t('common.error')}
                description={error}
                action={{ label: t('common.retry'), onClick: refresh }}
            />
        );
    }

    return (
        <div className="staff-list-container">
            {/* Page Header */}
            <PageHeader
                title={t('staff.title', 'Staff Directory')}
                subtitle={t('staff.subtitle', 'Manage staff members and their information')}
                icon="👩‍🏫"
                actions={[
                    <button
                        key="add-staff"
                        className="btn btn-primary"
                        onClick={() => navigate('/staff/add')}
                    >
                        {t('staff.add', 'Add Staff')}
                    </button>
                ]}
            />

            {/* Filters Section */}
            <div className="filters">
                <SearchInput
                    value={searchTerm}
                    onChange={setSearchTerm}
                    placeholder={t('staff.search_placeholder', 'Search by name, email, or employee ID...')}
                />

                <FilterDropdown
                    label={t('staff.designation', 'Designation')}
                    value={designation}
                    onChange={setDesignation}
                    options={DESIGNATION_OPTIONS}
                    placeholder="All Designations"
                />

                <FilterDropdown
                    label={t('staff.status', 'Status')}
                    value={status}
                    onChange={setStatus}
                    options={STATUS_OPTIONS}
                    placeholder="All Status"
                />

                {(searchTerm || designation || status) && (
                    <button className="btn-clear" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
                <DataCard
                    title={t('staff.total', 'Total Staff')}
                    value={stats.total}
                    icon="👥"
                />
                <DataCard
                    title={t('staff.active', 'Active')}
                    value={stats.active}
                    icon="✅"
                    variant="success"
                />
                <DataCard
                    title={t('staff.on_leave', 'On Leave')}
                    value={stats.onLeave}
                    icon="🏖️"
                    variant="warning"
                />
                <DataCard
                    title={t('staff.teachers', 'Teachers')}
                    value={stats.teachers}
                    icon="👨‍🏫"
                    variant="info"
                />
            </div>

            {/* Staff Grid */}
            {staff.length === 0 ? (
                <EmptyState
                    icon="👥"
                    title={t('staff.no_data', 'No Staff Found')}
                    description={t('staff.no_data_help', 'Add your first staff member to get started.')}
                    action={{
                        label: t('staff.add', 'Add Staff'),
                        onClick: () => navigate('/staff/add'),
                    }}
                />
            ) : (
                <div className="staff-grid">
                    {staff.map((member) => (
                        <StaffCard
                            key={member.id}
                            member={member}
                            onView={() => handleView(member.id)}
                            onEdit={() => handleEdit(member.id)}
                            onDelete={() => handleDelete(member.id, member.full_name)}
                        />
                    ))}
                </div>
            )}

            {/* Confirm Dialog */}
            {confirmDialog.isOpen && confirmDialog.options && (
                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title={confirmDialog.options.title}
                    message={confirmDialog.options.message}
                    confirmText={confirmDialog.options.confirmText}
                    cancelText={confirmDialog.options.cancelText}
                    confirmColor={confirmDialog.options.confirmColor === 'error' ? 'error' : 'primary'}
                    onConfirm={confirmDialog.handleConfirm}
                    onCancel={confirmDialog.handleCancel}
                    isLoading={confirmDialog.isLoading}
                />
            )}
        </div>
    );
};

export default StaffListRefactored;
