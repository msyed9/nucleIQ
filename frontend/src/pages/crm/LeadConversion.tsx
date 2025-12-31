import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './LeadConversion.css';

interface Lead {
    id: number;
    student_name: string;
    parent_name: string;
    phone: string;
    email: string;
    source: string;
    status: string;
    interested_class: string;
    interested_section: string;
    created_at: string;
    next_follow_up: string;
    assigned_to_name?: string;
    remarks?: string;
}

interface ConversionData {
    admission_date: string;
    class_id: number;
    section_id: number;
    roll_number: string;
    fee_structure_id: number;
    discount_percentage: number;
    remarks: string;
}

const LeadConversion: React.FC = () => {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [showConversionModal, setShowConversionModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('INTERESTED');
    const [searchTerm, setSearchTerm] = useState('');
    const [classes, setClasses] = useState<any[]>([]);
    const [sections, setSections] = useState<any[]>([]);
    const [feeStructures, setFeeStructures] = useState<any[]>([]);

    const [conversionData, setConversionData] = useState<ConversionData>({
        admission_date: new Date().toISOString().split('T')[0],
        class_id: 0,
        section_id: 0,
        roll_number: '',
        fee_structure_id: 0,
        discount_percentage: 0,
        remarks: '',
    });

    const statusOptions = [
        { value: 'NEW', label: 'New Leads', color: '#3b82f6' },
        { value: 'CONTACTED', label: 'Contacted', color: '#8b5cf6' },
        { value: 'INTERESTED', label: 'Interested', color: '#f59e0b' },
        { value: 'VISIT_SCHEDULED', label: 'Visit Scheduled', color: '#10b981' },
        { value: 'VISITED', label: 'Visited', color: '#06b6d4' },
        { value: 'CONVERTED', label: 'Converted', color: '#22c55e' },
        { value: 'LOST', label: 'Lost', color: '#ef4444' },
    ];

    useEffect(() => {
        fetchLeads();
        fetchClasses();
        fetchFeeStructures();
    }, [filter]);

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/crm/leads/', {
                headers: { Authorization: `Bearer ${token}` },
                params: { status: filter }
            });
            setLeads(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching leads:', err);
        }
    };

    const fetchClasses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/academics/classes/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClasses(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching classes:', err);
        }
    };

    const fetchFeeStructures = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/api/fees/structures/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFeeStructures(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching fee structures:', err);
        }
    };

    const fetchSections = async (classId: number) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/academics/classes/${classId}/sections/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSections(response.data.results || response.data);
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    const handleConvertLead = (lead: Lead) => {
        setSelectedLead(lead);
        setShowConversionModal(true);
        setConversionData({
            admission_date: new Date().toISOString().split('T')[0],
            class_id: 0,
            section_id: 0,
            roll_number: '',
            fee_structure_id: 0,
            discount_percentage: 0,
            remarks: `Converted from lead #${lead.id}`,
        });
    };

    const handleClassChange = (classId: number) => {
        setConversionData({ ...conversionData, class_id: classId, section_id: 0 });
        fetchSections(classId);
    };

    const handleSubmitConversion = async () => {
        if (!validateConversion()) return;

        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const token = localStorage.getItem('token');

            // Create student from lead
            const studentData = {
                first_name: selectedLead?.student_name.split(' ')[0],
                last_name: selectedLead?.student_name.split(' ').slice(1).join(' '),
                class_id: conversionData.class_id,
                section_id: conversionData.section_id,
                roll_number: conversionData.roll_number,
                admission_date: conversionData.admission_date,
                phone: selectedLead?.phone,
                email: selectedLead?.email,
                parent_name: selectedLead?.parent_name,
            };

            const studentResponse = await axios.post('/api/students/', studentData, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update lead status to CONVERTED
            await axios.patch(`/api/crm/leads/${selectedLead?.id}/`, {
                status: 'CONVERTED',
                converted_at: new Date().toISOString(),
                remarks: conversionData.remarks,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Create fee assignment if fee structure selected
            if (conversionData.fee_structure_id) {
                await axios.post('/api/fees/assignments/', {
                    student: studentResponse.data.id,
                    fee_structure: conversionData.fee_structure_id,
                    discount_percentage: conversionData.discount_percentage,
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }

            setSuccess(`Lead converted successfully! Student ID: ${studentResponse.data.admission_number}`);
            setShowConversionModal(false);
            fetchLeads();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to convert lead');
        } finally {
            setLoading(false);
        }
    };

    const validateConversion = (): boolean => {
        if (!conversionData.class_id) {
            setError('Please select a class');
            return false;
        }
        if (!conversionData.section_id) {
            setError('Please select a section');
            return false;
        }
        if (!conversionData.roll_number.trim()) {
            setError('Please enter roll number');
            return false;
        }
        return true;
    };

    const updateLeadStatus = async (leadId: number, newStatus: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`/api/crm/leads/${leadId}/`, {
                status: newStatus,
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeads();
            setSuccess('Lead status updated successfully');
        } catch (err: any) {
            setError('Failed to update lead status');
        }
    };

    const filteredLeads = leads.filter(lead =>
        lead.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.parent_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.phone.includes(searchTerm)
    );

    const getStatusColor = (status: string) => {
        return statusOptions.find(s => s.value === status)?.color || '#6b7280';
    };

    return (
        <div className="lead-conversion">
            <div className="conversion-header">
                <h1>🎯 Lead Conversion</h1>
                <p>Convert interested leads into admitted students</p>
            </div>

            {success && (
                <div className="alert alert-success">
                    <span className="icon">✅</span>
                    {success}
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <span className="icon">⚠️</span>
                    {error}
                </div>
            )}

            {/* Status Filter Tabs */}
            <div className="status-tabs">
                {statusOptions.map(status => (
                    <button
                        key={status.value}
                        className={filter === status.value ? 'active' : ''}
                        onClick={() => setFilter(status.value)}
                        style={{
                            borderColor: filter === status.value ? status.color : '#e5e7eb',
                            background: filter === status.value ? status.color : 'white',
                            color: filter === status.value ? 'white' : '#374151',
                        }}
                    >
                        {status.label}
                        <span className="count">
                            {leads.filter(l => l.status === status.value).length}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Search by student name, parent name, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
            </div>

            {/* Leads Grid */}
            <div className="leads-grid">
                {filteredLeads.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <h3>No leads found</h3>
                        <p>No leads match your current filter</p>
                    </div>
                ) : (
                    filteredLeads.map(lead => (
                        <div key={lead.id} className="lead-card">
                            <div className="lead-header">
                                <div className="lead-info">
                                    <h3>{lead.student_name}</h3>
                                    <span
                                        className="status-badge"
                                        style={{ background: getStatusColor(lead.status) }}
                                    >
                                        {lead.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="lead-id">#{lead.id}</div>
                            </div>

                            <div className="lead-details">
                                <div className="detail-item">
                                    <span className="icon">👤</span>
                                    <span>{lead.parent_name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="icon">📱</span>
                                    <span>{lead.phone}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="icon">📧</span>
                                    <span>{lead.email}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="icon">📚</span>
                                    <span>Class {lead.interested_class}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="icon">📍</span>
                                    <span>{lead.source.replace('_', ' ')}</span>
                                </div>
                                {lead.next_follow_up && (
                                    <div className="detail-item">
                                        <span className="icon">📅</span>
                                        <span>Follow-up: {new Date(lead.next_follow_up).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>

                            {lead.remarks && (
                                <div className="lead-remarks">
                                    <strong>Remarks:</strong> {lead.remarks}
                                </div>
                            )}

                            <div className="lead-actions">
                                {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                                    <>
                                        <button
                                            className="btn btn-convert"
                                            onClick={() => handleConvertLead(lead)}
                                        >
                                            ✅ Convert to Student
                                        </button>
                                        <select
                                            className="status-select"
                                            value={lead.status}
                                            onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                        >
                                            {statusOptions.filter(s => s.value !== 'CONVERTED').map(status => (
                                                <option key={status.value} value={status.value}>
                                                    {status.label}
                                                </option>
                                            ))}
                                        </select>
                                    </>
                                )}
                                {lead.status === 'CONVERTED' && (
                                    <div className="converted-badge">
                                        🎉 Successfully Converted
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Conversion Modal */}
            {showConversionModal && selectedLead && (
                <div className="modal-overlay" onClick={() => setShowConversionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>🎓 Convert Lead to Student</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowConversionModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="lead-summary">
                                <h3>{selectedLead.student_name}</h3>
                                <p>Parent: {selectedLead.parent_name}</p>
                                <p>Phone: {selectedLead.phone}</p>
                            </div>

                            <div className="form-group">
                                <label>Admission Date *</label>
                                <input
                                    type="date"
                                    value={conversionData.admission_date}
                                    onChange={(e) => setConversionData({ ...conversionData, admission_date: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Class *</label>
                                    <select
                                        value={conversionData.class_id}
                                        onChange={(e) => handleClassChange(Number(e.target.value))}
                                        className="form-control"
                                    >
                                        <option value="">Select Class</option>
                                        {classes.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Section *</label>
                                    <select
                                        value={conversionData.section_id}
                                        onChange={(e) => setConversionData({ ...conversionData, section_id: Number(e.target.value) })}
                                        className="form-control"
                                        disabled={!conversionData.class_id}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map(section => (
                                            <option key={section.id} value={section.id}>{section.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Roll Number *</label>
                                <input
                                    type="text"
                                    value={conversionData.roll_number}
                                    onChange={(e) => setConversionData({ ...conversionData, roll_number: e.target.value })}
                                    placeholder="e.g., 101"
                                    className="form-control"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fee Structure</label>
                                    <select
                                        value={conversionData.fee_structure_id}
                                        onChange={(e) => setConversionData({ ...conversionData, fee_structure_id: Number(e.target.value) })}
                                        className="form-control"
                                    >
                                        <option value="">Select Fee Structure</option>
                                        {feeStructures.map(fee => (
                                            <option key={fee.id} value={fee.id}>{fee.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Discount %</label>
                                    <input
                                        type="number"
                                        value={conversionData.discount_percentage}
                                        onChange={(e) => setConversionData({ ...conversionData, discount_percentage: Number(e.target.value) })}
                                        min="0"
                                        max="100"
                                        className="form-control"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Remarks</label>
                                <textarea
                                    value={conversionData.remarks}
                                    onChange={(e) => setConversionData({ ...conversionData, remarks: e.target.value })}
                                    className="form-control"
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowConversionModal(false)}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmitConversion}
                                disabled={loading}
                            >
                                {loading ? '⏳ Converting...' : '✅ Convert to Student'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadConversion;
