import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import FeeReceipt from '../../components/fees/FeeReceipt';
import './CollectFees.css';

interface Invoice {
    id: number;
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
    items?: { description: string; amount: number }[];
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

    useEffect(() => {
        fetchPendingInvoices();
        fetchTenantSettings();
    }, []);

    const fetchTenantSettings = async () => {
        try {
            const response = await api.get('/tenants/settings/current/');
            setTenantSettings(response.data);
        } catch (error) {
            console.error('Error fetching tenant settings:', error);
        }
    };

    const fetchPendingInvoices = async () => {
        try {
            const response = await api.get('/fees/invoices/pending/');
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };


    const handlePayment = async () => {
        if (!selectedInvoice || !paymentAmount) {
            alert('Please enter payment amount');
            return;
        }

        try {
            const response = await api.post('/fees/transactions/', {
                invoice: selectedInvoice.id,
                amount: parseFloat(paymentAmount),
                payment_mode: paymentMode,
                payment_reference: paymentReference
            });

            if (response.status === 201 || response.status === 200) {
                const transactionData = response.data;
                const newBalanceAmount = Number(selectedInvoice.balance_amount) - parseFloat(paymentAmount);

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
                    items: selectedInvoice.items || [
                        { description: 'Fee Payment', amount: Number(selectedInvoice.total_amount) }
                    ],
                    totalAmount: Number(selectedInvoice.total_amount),
                    paidAmount: parseFloat(paymentAmount),
                    balanceAmount: Math.max(0, newBalanceAmount),
                    collectedBy: transactionData.collected_by_name || undefined,
                    schoolName: tenantSettings?.school_name || tenantSettings?.tenant_name || 'School Name',
                    schoolAddress: tenantSettings?.address || 'School Address',
                    schoolPhone: tenantSettings?.phone || undefined,
                    schoolEmail: tenantSettings?.email || undefined,
                    schoolLogo: tenantSettings?.logo || undefined
                };

                setReceiptData(generatedReceiptData);
                setShowReceipt(true);

                // Reset form
                setSelectedInvoice(null);
                setPaymentAmount('');
                setPaymentReference('');
                fetchPendingInvoices();
            } else {
                alert('Error recording payment');
            }

        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Error recording payment');
        }
    };

    const handleGenerateMonthly = async () => {
        if (!confirm('Generate monthly invoices for all students?')) return;

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
                        {t('fees.generate', 'Generate Monthly Invoices')}
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
                                    onClick={() => setSelectedInvoice(invoice)}
                                >
                                    <div className="invoice-header">
                                        <span className="invoice-number">{invoice.invoice_number}</span>
                                        <span className={`status-badge ${getStatusColor(invoice.status)}`}>
                                            {t(`fees.status_${invoice.status}`, { defaultValue: invoice.status })}
                                        </span>
                                    </div>

                                    <div className="invoice-details">
                                        <p className="student-name">👤 {invoice.student_name}</p>
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
