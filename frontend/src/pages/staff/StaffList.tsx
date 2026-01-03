import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import './StaffList.css';

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

const StaffList: React.FC = () => {
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        designation: '',
        department: '',
        status: '',
        search: ''
    });

    useEffect(() => {
        console.log('StaffList mounted or filters changed', filters);
        fetchStaff();
    }, [filters]);

    const fetchStaff = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.designation) params.append('designation', filters.designation);
            if (filters.department) params.append('department', filters.department);
            if (filters.status) params.append('status', filters.status);
            if (filters.search) params.append('search', filters.search);

            const response = await api.get(`/staff/staff/?${params}`);
            console.log('fetchStaff response', response?.data);

            // Handle different response structures
            let staffData: any[] = [];
            if (Array.isArray(response.data)) {
                // Direct array response
                staffData = response.data;
            } else if (response.data.results && Array.isArray(response.data.results)) {
                // Paginated response with results array
                staffData = response.data.results;
            } else if (typeof response.data === 'object') {
                // Object response - might be a single object or empty
                console.warn('Unexpected staff response structure:', response.data);
                staffData = [];
            }

            setStaff(staffData);
        } catch (error) {
            console.error('Error fetching staff:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-800',
            ON_LEAVE: 'bg-yellow-100 text-yellow-800',
            SUSPENDED: 'bg-red-100 text-red-800',
            RESIGNED: 'bg-gray-100 text-gray-800'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    };

    const formatDesignation = (designation: string) => {
        return designation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const { t } = useTranslation();

    const [mountedAt] = useState(() => new Date().toISOString());

    return (
        <div className="staff-list-container">
            <div style={{ background: '#eef6ff', color: '#0b3b66', padding: '8px 12px', borderRadius: 6, marginBottom: 12, fontSize: 13 }}>
                <strong>DEBUG:</strong> StaffList mounted at {mountedAt} — loading: {String(loading)} — staff: {staff.length} — filters: {JSON.stringify(filters)}
            </div>
            {/* Header */}
            <div className="header">
                <h1>👩‍🏫 {t('staff.title', 'Staff Directory')}</h1>
                <button className="btn-primary">{t('staff.add', '+ Add Staff')}</button>
            </div>

            {/* Filters */}
            <div className="filters">
                <input
                    type="text"
                    placeholder={t('staff.search_placeholder', 'Search by name, email, or employee ID...')}
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="search-input"
                />

                <select
                    value={filters.designation}
                    onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Designations</option>
                    <option value="PRINCIPAL">Principal</option>
                    <option value="VICE_PRINCIPAL">Vice Principal</option>
                    <option value="HEAD_TEACHER">Head Teacher</option>
                    <option value="TEACHER">Teacher</option>
                    <option value="ASSISTANT_TEACHER">Assistant Teacher</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="LAB_ASSISTANT">Lab Assistant</option>
                    <option value="COUNSELOR">Counselor</option>
                    <option value="ACCOUNTANT">Accountant</option>
                    <option value="CLERK">Clerk</option>
                </select>

                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_LEAVE">On Leave</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="RESIGNED">Resigned</option>
                    <option value="TERMINATED">Terminated</option>
                    <option value="RETIRED">Retired</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-value">{staff.length}</div>
                    <div className="stat-label">{t('staff.total', 'Total Staff')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {staff.filter(s => s.status === 'ACTIVE').length}
                    </div>
                    <div className="stat-label">{t('staff.active', 'Active')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {staff.filter(s => s.status === 'ON_LEAVE').length}
                    </div>
                    <div className="stat-label">{t('staff.on_leave', 'On Leave')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {staff.filter(s => s.designation === 'TEACHER' || s.designation === 'ASSISTANT_TEACHER').length}
                    </div>
                    <div className="stat-label">{t('staff.teachers', 'Teachers')}</div>
                </div>
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div className="loading">
                    <div className="spinner"></div>
                    <p>{t('staff.loading')}</p>
                </div>
            ) : staff.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon">👥</div>
                    <h3>{t('staff.no_data')}</h3>
                    <p>{t('staff.no_data_help')}</p>
                </div>
            ) : (
                <div className="staff-grid">
                    {staff.map((member) => (
                        <div key={member.id} className="staff-card">
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
                                    <span className={`status-badge ${getStatusBadge(member.status)}`}>
                                        {t(`staff.status_${member.status}`, { defaultValue: member.status.replace('_', ' ') })}
                                    </span>
                                    <span className="joining-date">
                                        {t('staff.joined', { date: new Date(member.joining_date).toLocaleDateString() })}
                                    </span>
                                </div>
                            </div>

                            <div className="staff-actions">
                                <button className="btn-view" title={t('staff.view')}>
                                    👁️ {t('staff.view')}
                                </button>
                                <button className="btn-edit" title={t('staff.edit')}>
                                    ✏️ {t('staff.edit')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StaffList;
