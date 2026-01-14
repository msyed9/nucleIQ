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

interface AdvancePayment {
    id: string;
    student: string;
    student_name: string;
    student_admission_number: string;
    fee_category: string;
    category_name: string;
    amount: number;
    used_amount: number;
    balance_amount: number;
    advance_for_months: number;
    status: string;
    remarks: string;
    created_at: string;
}

const AdvancePayments: React.FC = () => {
    const { t } = useTranslation();
    const [advances, setAdvances] = useState<AdvancePayment[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [categories, setCategories] = useState<FeeCategory[]>([]);
    const [gradeLevels, setGradeLevels] = useState<GradeLevel[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Form state
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [showStudentDropdown, setShowStudentDropdown] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    const [advanceMonths, setAdvanceMonths] = useState('1');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchAdvances();
        fetchStudents();
        fetchCategories();
        fetchGradeLevels();
        fetchSections();
    }, [statusFilter]);

    const fetchAdvances = async () => {
        try {
            let url = '/fees/advances/';
            if (statusFilter) {
                url += `?status=${statusFilter}`;
            }
            const response = await api.get(url);
            setAdvances(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching advances:', error);
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

    const handleCreateAdvance = async () => {
        if (!selectedStudent || !selectedCategory || !amount) {
            alert('Please fill all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/fees/advances/create_advance/', {
                student_id: selectedStudent,
                fee_category_id: selectedCategory,
                amount: parseFloat(amount),
                payment_mode: paymentMode,
                payment_reference: paymentReference,
                advance_for_months: parseInt(advanceMonths),
                remarks: remarks
            });

            alert('Advance payment created successfully!');
            setShowCreateModal(false);
            resetForm();
            fetchAdvances();
        } catch (error: any) {
            console.error('Error creating advance:', error);
            alert(error.response?.data?.error || 'Error creating advance payment');
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedClass('');
        setSelectedSection('');
        setStudentSearchTerm('');
        setShowStudentDropdown(false);
        setSelectedStudent('');
        setSelectedCategory('');
        setAmount('');
        setPaymentMode('CASH');
        setPaymentReference('');
        setAdvanceMonths('1');
        setRemarks('');
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: '#059669',
            PARTIALLY_USED: '#d97706',
            FULLY_USED: '#6b7280',
            REFUNDED: '#dc2626'
        };
        return colors[status] || '#6b7280';
    };

    const getStatusBgColor = (status: string) => {
        const colors: Record<string, string> = {
            AVAILABLE: '#d1fae5',
            PARTIALLY_USED: '#fef3c7',
            FULLY_USED: '#f3f4f6',
            REFUNDED: '#fee2e2'
        };
        return colors[status] || '#f3f4f6';
    };

    const filteredAdvances = advances.filter(adv =>
        adv.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adv.student_admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>💰 {t('fees.advance_payments', 'Advance Payments')}</h1>
                    <p className="subtitle">{t('fees.advance_subtitle', 'Manage advance fee payments')}</p>
                </div>
                <button
                    className="btn-generate"
                    onClick={() => setShowCreateModal(true)}
                >
                    <span className="btn-icon">➕</span>
                    New Advance Payment
                </button>
            </div>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{advances.length}</div>
                    <div className="stat-label">Total Advances</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ₹{advances.reduce((sum, adv) => sum + Number(adv.balance_amount), 0).toFixed(2)}
                    </div>
                    <div className="stat-label">Available Balance</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {advances.filter(a => a.status === 'AVAILABLE').length}
                    </div>
                    <div className="stat-label">Active Advances</div>
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
                    <option value="AVAILABLE">Available</option>
                    <option value="PARTIALLY_USED">Partially Used</option>
                    <option value="FULLY_USED">Fully Used</option>
                    <option value="REFUNDED">Refunded</option>
                </select>
            </div>

            {/* Advances Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner"></div>
                        <p>Loading advances...</p>
                    </div>
                ) : filteredAdvances.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💰</div>
                        <p>No advance payments found</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Student</th>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Category</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Amount</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Used</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Balance</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Months</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Status</th>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAdvances.map((adv) => (
                                <tr key={adv.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '14px' }}>
                                        <div style={{ fontWeight: '500' }}>{adv.student_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{adv.student_admission_number}</div>
                                    </td>
                                    <td style={{ padding: '14px' }}>{adv.category_name}</td>
                                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '500' }}>
                                        ₹{Number(adv.amount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right', color: '#059669' }}>
                                        ₹{Number(adv.used_amount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#2563eb' }}>
                                        ₹{Number(adv.balance_amount).toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>{adv.advance_for_months}</td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            color: getStatusColor(adv.status),
                                            background: getStatusBgColor(adv.status)
                                        }}>
                                            {adv.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px', fontSize: '0.85rem', color: '#6b7280' }}>
                                        {new Date(adv.created_at).toLocaleDateString('en-IN')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Advance Modal */}
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
                            <h2 style={{ margin: 0 }}>💰 New Advance Payment</h2>
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
                                    Amount *
                                </label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
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

                            {/* Payment Mode */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Payment Mode
                                </label>
                                <select
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
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
                                    <option value="CARD">💳 Card</option>
                                    <option value="UPI">📱 UPI</option>
                                    <option value="NET_BANKING">🏦 Net Banking</option>
                                </select>
                            </div>

                            {/* Payment Reference */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Reference Number
                                </label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="Transaction ID, Cheque No, etc."
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            {/* Advance Months */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Advance for Months
                                </label>
                                <input
                                    type="number"
                                    value={advanceMonths}
                                    onChange={(e) => setAdvanceMonths(e.target.value)}
                                    min="1"
                                    max="12"
                                    style={{
                                        width: '100%',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        border: '1px solid #d1d5db',
                                        fontSize: '0.9rem'
                                    }}
                                />
                            </div>

                            {/* Remarks */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '0.9rem' }}>
                                    Remarks
                                </label>
                                <textarea
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    placeholder="Additional notes..."
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
                                onClick={handleCreateAdvance}
                                disabled={submitting}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: submitting ? '#94a3b8' : '#2563eb',
                                    color: 'white',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: '600'
                                }}
                            >
                                {submitting ? 'Creating...' : 'Create Advance'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdvancePayments;
