import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import './CollectFees.css';

interface GradeLevel {
    id: string;
    name: string;
}

interface Section {
    id: string;
    name: string;
}

interface Student {
    id: string;
    full_name: string;
    admission_number: string;
    current_class?: string;
    section?: string;
}

interface FeeCategory {
    id: string;
    name: string;
    code: string;
}

interface Refund {
    id: string;
    student: string;
    student_name: string;
    student_admission_number: string;
    fee_category: string;
    category_name: string;
    refund_amount: number;
    reason: string;
    status: string;
    refund_mode: string;
    refund_reference: string;
    requested_by_name: string;
    approved_by_name: string;
    approved_at: string | null;
    processed_at: string | null;
    remarks: string;
    created_at: string;
}

const FeeRefunds: React.FC = () => {
    const { t } = useTranslation();
    const [refunds, setRefunds] = useState<Refund[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form state - Request
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [refundAmount, setRefundAmount] = useState('');
    const [reason, setReason] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);

    // Form state - Process
    const [refundMode, setRefundMode] = useState('CASH');
    const [refundReference, setRefundReference] = useState('');

    useEffect(() => {
        fetchRefunds();
        fetchStudents();
        fetchCategories();
        fetchGradeLevels();
        fetchSections();
    }, [statusFilter]);

    const fetchRefunds = async () => {
        try {
            let url = '/fees/refunds/';
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }
            const response = await api.get(url);
            setRefunds(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching refunds:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/?is_active=true');
            setStudents(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/fees/categories/?is_active=true');
            setCategories(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchGradeLevels = async () => {
        try {
            const response = await api.get('/tenants/grades/');
            setGradeLevels(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching grade levels:', error);
        }
    };

    const fetchSections = async () => {
        try {
            const response = await api.get('/tenants/sections/');
            setSections(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching sections:', error);
        }
    };

    // Filter students based on class, section, and search term
    const filteredStudentsForSelect = useMemo(() => {
        let filtered = students;

        // Filter by class (compare with name since current_class is a string)
        if (selectedClass) {
            const selectedClassName = gradeLevels.find(g => g.id === selectedClass)?.name;
            if (selectedClassName) {
                filtered = filtered.filter(s =>
                    s.current_class?.toLowerCase().includes(selectedClassName.toLowerCase())
                );
            }
        }

        // Filter by section (compare with name since section is a string)
        if (selectedSection) {
            const selectedSectionName = sections.find(sec => sec.id === selectedSection)?.name;
            if (selectedSectionName) {
                filtered = filtered.filter(s =>
                    s.section?.toLowerCase().includes(selectedSectionName.toLowerCase())
                );
            }
        }

        // Filter by search term
        if (studentSearchTerm) {
            const searchLower = studentSearchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.full_name?.toLowerCase().includes(searchLower) ||
                s.admission_number?.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }, [students, selectedClass, selectedSection, studentSearchTerm, gradeLevels, sections]);

    // Get selected student details
    const selectedStudentDetails = useMemo(() => {
        return students.find(s => s.id === selectedStudent);
    }, [students, selectedStudent]);

    const handleRequestRefund = async () => {
        if (!selectedStudent || !selectedCategory || !refundAmount || !reason) {
            alert('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/fees/refunds/request_refund/', {
                student_id: selectedStudent,
                fee_category_id: selectedCategory,
                refund_amount: parseFloat(refundAmount),
                reason: reason,
                remarks: remarks
            });

            alert('Refund request submitted successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchRefunds();
        } catch (error: any) {
            console.error('Error requesting refund:', error);
            alert(error.response?.data?.error || 'Error requesting refund');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async (refund: Refund) => {
        if (!confirm('Are you sure you want to approve this refund?')) return;

        try {
            await api.post(`/fees/refunds/${refund.id}/approve/`);
            alert('Refund approved successfully!');
            fetchRefunds();
        } catch (error: any) {
            console.error('Error approving refund:', error);
            alert(error.response?.data?.error || 'Error approving refund');
        }
    };

    const handleReject = async (refund: Refund) => {
        const reason = prompt('Please enter rejection reason:');
        if (reason === null) return;

        try {
            await api.post(`/fees/refunds/${refund.id}/reject/`, { remarks: reason });
            alert('Refund rejected!');
            fetchRefunds();
        } catch (error: any) {
            console.error('Error rejecting refund:', error);
            alert(error.response?.data?.error || 'Error rejecting refund');
        }
    };

    const handleProcess = async () => {
        if (!selectedRefund) return;

        setSubmitting(true);
        try {
            await api.post(`/fees/refunds/${selectedRefund.id}/process/`, {
                refund_mode: refundMode,
                refund_reference: refundReference
            });

            alert('Refund processed successfully!');
            setShowProcessModal(false);
            setSelectedRefund(null);
            setRefundMode('CASH');
            setRefundReference('');
            fetchRefunds();
        } catch (error: any) {
            console.error('Error processing refund:', error);
            alert(error.response?.data?.error || 'Error processing refund');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedClass('');
        setSelectedSection('');
        setStudentSearchTerm('');
        setSelectedStudent('');
        setSelectedCategory('');
        setRefundAmount('');
        setReason('');
        setRemarks('');
        setShowStudentDropdown(false);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: '#d97706',
            APPROVED: '#2563eb',
            PROCESSED: '#059669',
            REJECTED: '#dc2626'
        };
        return colors[status] || '#6b7280';
    };

    const getStatusBgColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: '#fef3c7',
            APPROVED: '#dbeafe',
            PROCESSED: '#d1fae5',
            REJECTED: '#fee2e2'
        };
        return colors[status] || '#f3f4f6';
    };

    const filteredRefunds = refunds.filter(ref =>
        ref.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ref.student_admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>🔄 {t('fees.refunds', 'Fee Refunds')}</h1>
                    <p className="subtitle">{t('fees.refunds_subtitle', 'Manage fee refund requests')}</p>
                </div>
                <button
                    className="btn-generate"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="btn-icon">➕</span>
                    Request Refund
                </button>
            </div>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{refunds.filter(r => r.status === 'PENDING').length}</div>
                    <div className="stat-label">Pending Approval</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">{refunds.filter(r => r.status === 'APPROVED').length}</div>
                    <div className="stat-label">Approved</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ₹{refunds.filter(r => r.status === 'PROCESSED')
                            .reduce((sum, r) => sum + Number(r.refund_amount), 0).toFixed(2)}
                    </div>
                    <div className="stat-label">Total Refunded</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <input
                    type="text"
                    placeholder="🔍 Search by student or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        flex: 1,
                        minWidth: '250px',
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem'
                    }}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #d1d5db',
                        fontSize: '0.9rem',
                        minWidth: '150px'
                    }}
                >
                    <option value="">All Status</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="PROCESSED">Processed</option>
                    <option value="REJECTED">Rejected</option>
                </select>
            </div>

            {/* Refunds Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner"></div>
                        <p>Loading refunds...</p>
                    </div>
                ) : filteredRefunds.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔄</div>
                        <p>No refund requests found</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Student</th>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Category</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Amount</th>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Reason</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Status</th>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Date</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRefunds.map((refund) => (
                                <tr key={refund.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '14px' }}>
                                        <div style={{ fontWeight: '500' }}>{refund.student_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{refund.student_admission_number}</div>
                                    </td>
                                    <td style={{ padding: '14px' }}>{refund.category_name}</td>
                                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
                                        ₹{Number(refund.refund_amount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', maxWidth: '200px' }}>
                                        <div style={{
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            fontSize: '0.85rem'
                                        }}>
                                            {refund.reason}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: getStatusColor(refund.status),
                                            background: getStatusBgColor(refund.status)
                                        }}>
                                            {refund.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px', fontSize: '0.85rem', color: '#6b7280' }}>
                                        {new Date(refund.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            {refund.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(refund)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#059669',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        ✓ Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(refund)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            borderRadius: '6px',
                                                            border: 'none',
                                                            background: '#dc2626',
                                                            color: 'white',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem'
                                                        }}
                                                    >
                                                        ✕ Reject
                                                    </button>
                                                </>
                                            )}
                                            {refund.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedRefund(refund);
                                                        setShowProcessModal(true);
                                                    }}
                                                    style={{
                                                        padding: '6px 12px',
                                                        borderRadius: '6px',
                                                        border: 'none',
                                                        background: '#2563eb',
                                                        color: 'white',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem'
                                                    }}
                                                >
                                                    💰 Process
                                                </button>
                                            )}
                                            {refund.status === 'PROCESSED' && (
                                                <span style={{ fontSize: '0.8rem', color: '#059669' }}>
                                                    ✓ {refund.refund_mode}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Request Refund Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '500px',
                        maxHeight: '90vh',
                        overflow: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>🔄 Request Refund</h2>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Class and Section Selection */}
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                        Class
                                    </label>
                                    <select
                                        value={selectedClass}
                                        onChange={(e) => {
                                            setSelectedClass(e.target.value);
                                            setSelectedStudent('');
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">All Classes</option>
                                        {gradeLevels.map(g => (
                                            <option key={g.id} value={g.id}>
                                                {g.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                        Section
                                    </label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => {
                                            setSelectedSection(e.target.value);
                                            setSelectedStudent('');
                                        }}
                                        style={{
                                            width: '100%',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            border: '1px solid #d1d5db',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        <option value="">All Sections</option>
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Student Search & Select */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Student *
                                    <span style={{ fontSize: '0.8rem', color: '#6b7280', fontWeight: '400', marginLeft: '8px' }}>
                                        ({filteredStudentsForSelect.length} students)
                                    </span>
                                </label>

                                {/* Selected student display */}
                                {selectedStudentDetails && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 14px',
                                        background: '#eff6ff',
                                        borderRadius: '8px',
                                        marginBottom: '8px',
                                        border: '1px solid #2563eb'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: '500' }}>{selectedStudentDetails.full_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                {selectedStudentDetails.admission_number}
                                                {selectedStudentDetails.current_class && ` • ${selectedStudentDetails.current_class}`}
                                                {selectedStudentDetails.section && ` ${selectedStudentDetails.section}`}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedStudent('')}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#dc2626',
                                                cursor: 'pointer',
                                                fontSize: '1.2rem'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}

                                {/* Search input */}
                                {!selectedStudent && (
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            value={studentSearchTerm}
                                            onChange={(e) => {
                                                setStudentSearchTerm(e.target.value);
                                                setShowStudentDropdown(true);
                                            }}
                                            onFocus={() => setShowStudentDropdown(true)}
                                            placeholder="🔍 Search by name or admission number..."
                                            style={{
                                                width: '100%',
                                                padding: '10px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '0.9rem'
                                            }}
                                        />

                                        {/* Dropdown list */}
                                        {showStudentDropdown && filteredStudentsForSelect.length > 0 && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                maxHeight: '200px',
                                                overflow: 'auto',
                                                background: 'white',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                zIndex: 10
                                            }}>
                                                {filteredStudentsForSelect.slice(0, 50).map(s => (
                                                    <div
                                                        key={s.id}
                                                        onClick={() => {
                                                            setSelectedStudent(s.id);
                                                            setStudentSearchTerm('');
                                                            setShowStudentDropdown(false);
                                                        }}
                                                        style={{
                                                            padding: '10px 14px',
                                                            cursor: 'pointer',
                                                            borderBottom: '1px solid #e5e7eb',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onMouseEnter={(e) => (e.currentTarget.style.background = '#f3f4f6')}
                                                        onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                                                    >
                                                        <div style={{ fontWeight: '500' }}>{s.full_name}</div>
                                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                                                            {s.admission_number}
                                                            {s.current_class && ` • ${s.current_class}`}
                                                            {s.section && ` ${s.section}`}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {showStudentDropdown && filteredStudentsForSelect.length === 0 && studentSearchTerm && (
                                            <div style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                padding: '14px',
                                                background: 'white',
                                                border: '1px solid #d1d5db',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                zIndex: 10,
                                                textAlign: 'center',
                                                color: '#6b7280'
                                            }}>
                                                No students found
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Category Select */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Fee Category *
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Amount */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Refund Amount *
                                </label>
                                <input
                                    type="number"
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            {/* Reason */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Reason *
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Enter reason for refund..."
                                    rows={3}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Additional Remarks
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Additional notes..."
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => { setShowCreateModal(false); resetForm(); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestRefund}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: submitting ? '#94a3b8' : '#dc2626',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                {submitting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Process Refund Modal */}
            {showProcessModal && selectedRefund && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        width: '100%',
                        maxWidth: '400px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0 }}>💰 Process Refund</h2>
                            <button
                                onClick={() => { setShowProcessModal(false); setSelectedRefund(null); }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{
                            background: '#f9fafb',
                            padding: '16px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Student:</strong> {selectedRefund.student_name}
                            </div>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Category:</strong> {selectedRefund.category_name}
                            </div>
                            <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#dc2626' }}>
                                <strong>Amount:</strong> ₹{Number(selectedRefund.refund_amount).toFixed(2)}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Refund Mode *
                                </label>
                                <select
                                    value={refundMode}
                                    onChange={(e) => setRefundMode(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    <option value="CASH">💵 Cash</option>
                                    <option value="CHEQUE">📝 Cheque</option>
                                    <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                                    <option value="ADJUSTMENT">📋 Adjusted to Future Fees</option>
                                    <option value="OTHER">📌 Other</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={refundReference}
                                    onChange={(e) => setRefundReference(e.target.value)}
                                    placeholder="Cheque No, Transaction ID, etc."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                            <button
                                onClick={() => { setShowProcessModal(false); setSelectedRefund(null); }}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #d1d5db',
                                    background: 'white',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleProcess}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: submitting ? '#94a3b8' : '#059669',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                {submitting ? 'Processing...' : 'Process Refund'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FeeRefunds;
