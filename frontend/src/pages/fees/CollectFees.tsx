import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import FeeReceipt from '../../components/fees/FeeReceipt';
import './CollectFees.css';

interface InvoiceItem {
    id: string;
    fee_allocation: string;
    description: string;
    amount: number;
    paid_amount: number;
    balance_amount: number;
    category_id?: string;
    category_name?: string;
    category_code?: string;
}

interface Invoice {
    id: string;
    invoice_number: string;
    student: number;
    student_name: string;
    student_admission_number?: string;
    student_class?: string;
    student_section?: string;
    invoice_date: string;
    due_date: string;
    total_amount: number;
    paid_amount: number;
    balance_amount: number;
    status: string;
    items?: InvoiceItem[];
}

// State for category-wise payment allocation
interface PaymentAllocation {
    invoice_item_id: string;
    amount: number;
    category_name: string;
}

interface ReceiptData {
    receiptNumber: string;
    transactionNumber: string;
    studentName: string;
    admissionNumber: string;
    className: string;
    section?: string;
    invoiceNumber: string;
    invoiceDate: string;
    paymentDate: string;
    paymentMode: string;
    paymentReference?: string;
    items: { description: string; amount: number }[];
    totalAmount: number;
    paidAmount: number;
    balanceAmount: number;
    collectedBy?: string;
    schoolName: string;
    schoolAddress: string;
    schoolPhone?: string;
    schoolEmail?: string;
    schoolLogo?: string;
    receiptCopies?: number;
    receiptFooterText?: string;
}

const CollectFees: React.FC = () => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
    const [tenantSettings, setTenantSettings] = useState<any>(null);

    // Category-wise payment allocation
    const [showBreakdown, setShowBreakdown] = useState(true); // Default to showing breakdown
    const [paymentAllocations, setPaymentAllocations] = useState<Record<string, string>>({});

    // Filter state variables
    const [classFilter, setClassFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [grades, setGrades] = useState<{ id: number, name: string }[]>([]);
    const [sections, setSections] = useState<{ id: number, name: string }[]>([]);

    useEffect(() => {
        fetchPendingInvoices();
        fetchTenantSettings();
        fetchGrades();
    }, []);

    // Re-fetch invoices when filters change
    useEffect(() => {
        fetchPendingInvoices();
    }, [classFilter, sectionFilter, statusFilter]);

    const fetchTenantSettings = async () => {
        try {
            const response = await api.get('/tenants/settings/current/');
            setTenantSettings(response.data);
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await api.get('/tenants/grades/');
            const data = response.data;
            setGrades(Array.isArray(data) ? data : (data?.results || []));
        } catch (error) {
            console.error('Error fetching grades:', error);
            setGrades([]);
        }
    };

    const fetchPendingInvoices = async () => {
        try {
            // Build query parameters for filters
            const params = new URLSearchParams();
            if (classFilter) params.append('class_name', classFilter);
            if (sectionFilter) params.append('section', sectionFilter);
            if (statusFilter) params.append('status', statusFilter);

            const queryString = params.toString();
            const url = `/fees/invoices/pending/${queryString ? `?${queryString}` : ''}`;

            const response = await api.get(url);
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!selectedInvoice) {
            alert('Please select an invoice');
            return;
        }

        // Calculate total from allocations or use single payment amount
        let totalPayment = 0;
        let paymentItems: { invoice_item_id: string; amount: number; is_advance: boolean; remarks: string }[] = [];

        if (showBreakdown && selectedInvoice.items && selectedInvoice.items.length > 0) {
            // Category-wise payment mode
            for (const item of selectedInvoice.items) {
                const allocation = paymentAllocations[item.id];
                const amount = parseFloat(allocation || '0');
                if (amount > 0) {
                    paymentItems.push({
                        invoice_item_id: item.id,
                        amount: amount,
                        is_advance: false,
                        remarks: ''
                    });
                    totalPayment += amount;
                }
            }

            if (paymentItems.length === 0) {
                alert('Please enter payment amount for at least one fee category');
                return;
            }
        } else {
            // Simple payment mode
            if (!paymentAmount) {
                alert('Please enter payment amount');
                return;
            }
            totalPayment = parseFloat(paymentAmount);
        }

        try {
            let response;

            if (showBreakdown && paymentItems.length > 0) {
                // Use category-wise payment endpoint
                response = await api.post('/fees/transactions/collect_with_breakdown/', {
                    invoice_id: selectedInvoice.id,
                    payment_mode: paymentMode,
                    payment_reference: paymentReference,
                    remarks: '',
                    items: paymentItems
                });
            } else {
                // Use simple payment endpoint
                response = await api.post('/fees/transactions/', {
                    invoice: selectedInvoice.id,
                    amount: totalPayment,
                    payment_mode: paymentMode,
                    payment_reference: paymentReference
                });
            }

            if (response.status === 201 || response.status === 200) {
                const transactionData = response.data;
                const newBalanceAmount = Number(selectedInvoice.balance_amount) - totalPayment;

                // Build receipt items - show category-wise breakdown if available
                let receiptItems: { description: string; amount: number }[] = [];
                if (showBreakdown && paymentItems.length > 0 && selectedInvoice.items) {
                    for (const paymentItem of paymentItems) {
                        const invoiceItem = selectedInvoice.items.find(i => i.id === paymentItem.invoice_item_id);
                        if (invoiceItem) {
                            receiptItems.push({
                                description: invoiceItem.category_name || invoiceItem.description,
                                amount: paymentItem.amount
                            });
                        }
                    }
                } else {
                    receiptItems = selectedInvoice.items?.map(i => ({
                        description: i.category_name || i.description,
                        amount: Number(i.amount)
                    })) || [{ description: 'Fee Payment', amount: Number(selectedInvoice.total_amount) }];
                }

                // Generate receipt data
                const generatedReceiptData: ReceiptData = {
                    receiptNumber: transactionData.receipt_number || `RCP-${Date.now()}`,
                    transactionNumber: transactionData.transaction_number || `TXN-${Date.now()}`,
                    studentName: selectedInvoice.student_name,
                    admissionNumber: selectedInvoice.student_admission_number || 'N/A',
                    className: selectedInvoice.student_class || 'N/A',
                    section: selectedInvoice.student_section,
                    invoiceNumber: selectedInvoice.invoice_number,
                    invoiceDate: selectedInvoice.invoice_date,
                    paymentDate: new Date().toISOString(),
                    paymentMode: paymentMode,
                    paymentReference: paymentReference || undefined,
                    items: receiptItems,
                    totalAmount: Number(selectedInvoice.total_amount),
                    paidAmount: totalPayment,
                    balanceAmount: Math.max(0, newBalanceAmount),
                    collectedBy: transactionData.collected_by_name || undefined,
                    schoolName: tenantSettings?.school_name || tenantSettings?.tenant_name || 'School Name',
                    schoolAddress: tenantSettings?.school_address || tenantSettings?.address || 'School Address',
                    schoolPhone: tenantSettings?.school_phone || tenantSettings?.phone || undefined,
                    schoolEmail: tenantSettings?.school_email || tenantSettings?.email || undefined,
                    schoolLogo: tenantSettings?.logo_url || tenantSettings?.logo || undefined,
                    receiptCopies: tenantSettings?.receipt_copies || 3,
                    receiptFooterText: tenantSettings?.receipt_footer_text || 'This is a computer generated receipt.'
                };

                setReceiptData(generatedReceiptData);
                setShowReceipt(true);

                // Reset form
                setSelectedInvoice(null);
                setPaymentAmount('');
                setPaymentReference('');
                setPaymentAllocations({});
                fetchPendingInvoices();
            } else {
                alert('Error recording payment');
            }

        } catch (error: any) {
            console.error('Error recording payment:', error);
            alert(error.response?.data?.error || 'Error recording payment');
        }
    };

    const handleGenerateMonthly = async () => {
        if (!confirm('Generate invoices for the current period?')) return;

        try {
            const response = await api.post('/fees/invoices/generate_monthly/');
            if (response.status === 200) {
                const data = response.data;
                alert(`Generated ${data.count} invoices successfully! 🎉`);
                fetchPendingInvoices();
            }
        } catch (error) {
            console.error('Error generating invoices:', error);
        }
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: 'status-pending',
            PARTIAL: 'status-partial',
            PAID: 'status-paid',
            OVERPAID: 'status-overpaid'
        };
        return colors[status] || 'status-default';
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Export column configuration
    const exportColumns: ExportColumn[] = [
        { key: 'invoice_number', label: 'Invoice Number' },
        { key: 'student_name', label: 'Student Name' },
        {
            key: 'invoice_date',
            label: 'Invoice Date',
            format: (value) => new Date(value).toLocaleDateString('en-IN')
        },
        {
            key: 'due_date',
            label: 'Due Date',
            format: (value) => new Date(value).toLocaleDateString('en-IN')
        },
        {
            key: 'total_amount',
            label: 'Total Amount (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'paid_amount',
            label: 'Paid Amount (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'balance_amount',
            label: 'Balance Amount (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        { key: 'status', label: 'Status' }
    ];

    const { t } = useTranslation();

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>💰 {t('fees.title', 'Fee Collection')}</h1>
                    <p className="subtitle">{t('fees.subtitle', 'Manage student fee payments')}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <ExportButton
                        data={filteredInvoices}
                        filename="fee_receipts"
                        title="Fee Collection Report"
                        columns={exportColumns}
                        variant="outline"
                        size="medium"
                    />
                    <button className="btn-generate" onClick={handleGenerateMonthly}>
                        <span className="btn-icon">📅</span>
                        {t('fees.generate', 'Generate Invoices')}
                    </button>
                </div>
            </div>

            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{invoices.length}</div>
                    <div className="stat-label">{t('fees.pending_invoices', 'Pending Invoices')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        ₹{invoices.reduce((sum, inv) => sum + Number(inv.balance_amount), 0).toFixed(2)}
                    </div>
                    <div className="stat-label">{t('fees.total_outstanding', 'Total Outstanding')}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">
                        {invoices.filter(inv => inv.status === 'PARTIAL').length}
                    </div>
                    <div className="stat-label">{t('fees.partial_payments', 'Partial Payments')}</div>
                </div>
            </div>

            {/* Filters Section */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '1.1rem' }}>🔍</span>
                    <h3 style={{ margin: 0, color: '#374151', fontSize: '1rem', fontWeight: '600' }}>
                        {t('fees.filters', 'Filters')}
                    </h3>
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '16px',
                    alignItems: 'flex-end'
                }}>
                    {/* Class Filter */}
                    <div style={{ minWidth: '180px', flex: '1' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}>
                            {t('fees.filter_class', 'Class')}
                        </label>
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">{t('fees.all_classes', 'All Classes')}</option>
                            {grades.map(grade => (
                                <option key={grade.id} value={grade.name}>{grade.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Section Filter */}
                    <div style={{ minWidth: '150px', flex: '1' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}>
                            {t('fees.filter_section', 'Section')}
                        </label>
                        <select
                            value={sectionFilter}
                            onChange={(e) => setSectionFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">{t('fees.all_sections', 'All Sections')}</option>
                            <option value="A">Section A</option>
                            <option value="B">Section B</option>
                            <option value="C">Section C</option>
                            <option value="D">Section D</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div style={{ minWidth: '150px', flex: '1' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '6px',
                            fontSize: '0.85rem',
                            color: '#6b7280',
                            fontWeight: '500'
                        }}>
                            {t('fees.filter_status', 'Status')}
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">{t('fees.all_status', 'All Status')}</option>
                            <option value="PENDING">{t('fees.status_pending', 'Pending')}</option>
                            <option value="PARTIAL">{t('fees.status_partial', 'Partial Payment')}</option>
                        </select>
                    </div>

                    {/* Clear Filters Button */}
                    <div style={{ minWidth: '120px' }}>
                        <button
                            onClick={() => {
                                setClassFilter('');
                                setSectionFilter('');
                                setStatusFilter('');
                            }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid #e5e7eb',
                                background: '#f3f4f6',
                                color: '#374151',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}
                        >
                            ✕ {t('fees.clear_filters', 'Clear')}
                        </button>
                    </div>
                </div>

                {/* Active Filters Display */}
                {(classFilter || sectionFilter || statusFilter) && (
                    <div style={{
                        marginTop: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e5e7eb',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                            {t('fees.active_filters', 'Active filters:')}
                        </span>
                        {classFilter && (
                            <span style={{
                                background: '#dbeafe',
                                color: '#1e40af',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                📚 {classFilter}
                            </span>
                        )}
                        {sectionFilter && (
                            <span style={{
                                background: '#dcfce7',
                                color: '#166534',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                🏷️ Section {sectionFilter}
                            </span>
                        )}
                        {statusFilter && (
                            <span style={{
                                background: statusFilter === 'PENDING' ? '#fef3c7' : '#fed7aa',
                                color: statusFilter === 'PENDING' ? '#92400e' : '#9a3412',
                                padding: '4px 10px',
                                borderRadius: '16px',
                                fontSize: '0.8rem',
                                fontWeight: '500'
                            }}>
                                📋 {statusFilter === 'PENDING' ? 'Pending' : 'Partial'}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="content">
                {/* Invoice List */}
                <div className="invoice-list">
                    <div className="list-header">
                        <h2>{t('fees.pending_invoices', 'Pending Invoices')}</h2>
                        <input
                            type="text"
                            className="search-input"
                            placeholder={t('fees.search_placeholder', '🔍 Search by student or invoice...')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div className="loading">
                            <div className="spinner"></div>
                            <p>{t('fees.loading', 'Loading invoices...')}</p>
                        </div>
                    ) : filteredInvoices.length === 0 ? (
                        <div className="empty-state">
                            <p>📭 {t('fees.no_data', 'No pending invoices found')}</p>
                        </div>
                    ) : (
                        <div className="invoices">
                            {filteredInvoices.map(invoice => (
                                <div
                                    key={invoice.id}
                                    className={`invoice-card ${selectedInvoice?.id === invoice.id ? 'selected' : ''}`}
                                    onClick={() => {
                                        setSelectedInvoice(invoice);
                                        setPaymentAllocations({});
                                    }}
                                >
                                    <div className="invoice-header">
                                        <span className="invoice-number">{invoice.invoice_number}</span>
                                        <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                                            {t(`fees.status_${invoice.status}`, { defaultValue: invoice.status })}
                                        </span>
                                    </div>

                                    <div className="invoice-details">
                                        <p className="student-name">👤 {invoice.student_name}</p>
                                        {/* Class and Section Display */}
                                        {(invoice.student_class || invoice.student_section) && (
                                            <p style={{
                                                margin: '4px 0',
                                                fontSize: '0.85rem',
                                                color: '#6b7280',
                                                display: 'flex',
                                                gap: '8px'
                                            }}>
                                                {invoice.student_class && (
                                                    <span style={{
                                                        background: '#e0e7ff',
                                                        color: '#4338ca',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        📚 {invoice.student_class}
                                                    </span>
                                                )}
                                                {invoice.student_section && (
                                                    <span style={{
                                                        background: '#dcfce7',
                                                        color: '#166534',
                                                        padding: '2px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '500'
                                                    }}>
                                                        🏷️ {invoice.student_section}
                                                    </span>
                                                )}
                                            </p>
                                        )}
                                        <div className="amount-row">
                                            <span className="amount-label">Balance:</span>
                                            <span className="amount">₹{Number(invoice.balance_amount).toFixed(2)}</span>
                                        </div>
                                        <p className="due-date">
                                            📅 Due: {new Date(invoice.due_date).toLocaleDateString('en-IN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Payment Form */}
                <div className="payment-form">
                    {selectedInvoice ? (
                        <>
                            <h2>💳 {t('fees.collect_payment', 'Collect Payment')}</h2>

                            <div className="invoice-summary">
                                <div className="summary-row">
                                    <span className="label">{t('fees.student')}:</span>
                                    <span className="value">{selectedInvoice.student_name}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">{t('fees.invoice')}:</span>
                                    <span className="value">{selectedInvoice.invoice_number}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">{t('fees.invoice_date')}:</span>
                                    <span className="value">
                                        {new Date(selectedInvoice.invoice_date).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                                <div className="summary-divider"></div>
                                <div className="summary-row">
                                    <span className="label">Total Amount:</span>
                                    <span className="value">₹{Number(selectedInvoice.total_amount).toFixed(2)}</span>
                                </div>
                                <div className="summary-row">
                                    <span className="label">Paid Amount:</span>
                                    <span className="value paid">₹{Number(selectedInvoice.paid_amount).toFixed(2)}</span>
                                </div>
                                <div className="summary-row highlight">
                                    <span className="label">Balance Due:</span>
                                    <span className="value balance">₹{Number(selectedInvoice.balance_amount).toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Category-wise Fee Breakdown */}
                            {selectedInvoice.items && selectedInvoice.items.length > 0 && (
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '12px'
                                    }}>
                                        <h3 style={{ margin: 0, fontSize: '1rem', color: '#374151' }}>
                                            📋 Fee Breakdown
                                        </h3>
                                        <label style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer'
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={showBreakdown}
                                                onChange={(e) => setShowBreakdown(e.target.checked)}
                                            />
                                            Pay by Category
                                        </label>
                                    </div>

                                    <div style={{
                                        background: '#f9fafb',
                                        border: '1px solid #e5e7eb',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f3f4f6' }}>
                                                    <th style={{ padding: '10px', textAlign: 'left', fontSize: '0.8rem', color: '#6b7280' }}>
                                                        Category
                                                    </th>
                                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
                                                        Amount
                                                    </th>
                                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
                                                        Paid
                                                    </th>
                                                    <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
                                                        Balance
                                                    </th>
                                                    {showBreakdown && (
                                                        <th style={{ padding: '10px', textAlign: 'right', fontSize: '0.8rem', color: '#6b7280' }}>
                                                            Pay Now
                                                        </th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedInvoice.items.map((item) => (
                                                    <tr key={item.id} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                        <td style={{ padding: '10px', fontSize: '0.9rem' }}>
                                                            <div style={{ fontWeight: '500' }}>
                                                                {item.category_name || item.description}
                                                            </div>
                                                            {item.category_code && (
                                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                                    {item.category_code}
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.9rem' }}>
                                                            ₹{Number(item.amount).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.9rem', color: '#059669' }}>
                                                            ₹{Number(item.paid_amount || 0).toFixed(2)}
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'right', fontSize: '0.9rem', color: '#dc2626', fontWeight: '500' }}>
                                                            ₹{Number(item.balance_amount || item.amount).toFixed(2)}
                                                        </td>
                                                        {showBreakdown && (
                                                            <td style={{ padding: '10px', textAlign: 'right' }}>
                                                                <input
                                                                    type="number"
                                                                    value={paymentAllocations[item.id] || ''}
                                                                    onChange={(e) => setPaymentAllocations({
                                                                        ...paymentAllocations,
                                                                        [item.id]: e.target.value
                                                                    })}
                                                                    placeholder="0.00"
                                                                    max={Number(item.balance_amount || item.amount)}
                                                                    min={0}
                                                                    step="0.01"
                                                                    style={{
                                                                        width: '90px',
                                                                        padding: '6px 8px',
                                                                        borderRadius: '6px',
                                                                        border: '1px solid #d1d5db',
                                                                        textAlign: 'right',
                                                                        fontSize: '0.9rem'
                                                                    }}
                                                                />
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                            </tbody>
                                            {showBreakdown && (
                                                <tfoot>
                                                    <tr style={{ borderTop: '2px solid #d1d5db', background: '#f3f4f6' }}>
                                                        <td colSpan={4} style={{ padding: '10px', textAlign: 'right', fontWeight: '600' }}>
                                                            Total Payment:
                                                        </td>
                                                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: '600', color: '#2563eb' }}>
                                                            ₹{Object.values(paymentAllocations).reduce(
                                                                (sum, val) => sum + (parseFloat(val) || 0), 0
                                                            ).toFixed(2)}
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Simple payment amount - only show if not using breakdown */}
                            {!showBreakdown && (
                                <div className="form-group">
                                    <label>💵 {t('fees.payment_amount')}</label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder={t('fees.pay_amount_placeholder')}
                                        max={Number(selectedInvoice.balance_amount)}
                                        step="0.01"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>💳 Payment Mode</label>
                                <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                                    <option value="CASH">💵 Cash</option>
                                    <option value="CHEQUE">📝 Cheque</option>
                                    <option value="CARD">💳 Card</option>
                                    <option value="UPI">📱 UPI</option>
                                    <option value="NET_BANKING">🏦 Net Banking</option>
                                    <option value="WALLET">👛 Wallet</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>🔢 Reference Number</label>
                                <input
                                    type="text"
                                    value={paymentReference}
                                    onChange={(e) => setPaymentReference(e.target.value)}
                                    placeholder="Transaction ID, Cheque No, etc."
                                />
                            </div>

                            <div className="form-actions">
                                <button className="btn-cancel" onClick={() => setSelectedInvoice(null)}>
                                    ✕ Cancel
                                </button>
                                <button className="btn-submit" onClick={handlePayment}>
                                    ✓ Record Payment
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-selection">
                            <div className="no-selection-icon">💰</div>
                            <p>Select an invoice from the list to collect payment</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Fee Receipt Modal */}
            {showReceipt && receiptData && (
                <FeeReceipt
                    receiptData={receiptData}
                    onClose={() => {
                        setShowReceipt(false);
                        setReceiptData(null);
                    }}
                />
            )}
        </div>
    );
};

export default CollectFees;
