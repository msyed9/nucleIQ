/**
 * Fee Payment History Page
 * Displays all fee payments/transactions in chronological order with receipt viewing capability
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import FeeReceipt from '../../components/fees/FeeReceipt';
import { formatDate } from '../../utils/helpers';
import './Fees.css';

interface FeeTransaction {
    id: number;
    transaction_number: string;
    receipt_number: string;
    transaction_date: string;
    amount: string;
    payment_mode: string;
    payment_reference: string;
    remarks: string;
    invoice: number;
    invoice_number?: string;
    student_name?: string;
    student_admission_number?: string;
    category_name?: string;
    collected_by_name?: string;
}

// Receipt data interface matching FeeReceipt component's expected format
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
    items: Array<{
        description: string;
        amount: number;
    }>;
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

const FeePaymentHistory: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<FeeTransaction[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [paymentMode, setPaymentMode] = useState('');

    // Receipt Modal
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedReceiptData, setSelectedReceiptData] = useState<ReceiptData | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(20);

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, searchQuery, dateFrom, dateTo, paymentMode]);

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const response = await api.get('/fees/transactions/');
            const data = response.data;
            const transactionList = Array.isArray(data) ? data : (data?.results || []);
            // Sort by transaction date (newest first)
            transactionList.sort((a: FeeTransaction, b: FeeTransaction) =>
                new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
            );
            setTransactions(transactionList);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...transactions];

        // Search filter (by student name, admission number, receipt number, transaction number)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(tx =>
                (tx.student_name?.toLowerCase().includes(query)) ||
                (tx.student_admission_number?.toLowerCase().includes(query)) ||
                (tx.receipt_number?.toLowerCase().includes(query)) ||
                (tx.transaction_number?.toLowerCase().includes(query))
            );
        }

        // Date range filter
        if (dateFrom) {
            filtered = filtered.filter(tx =>
                new Date(tx.transaction_date) >= new Date(dateFrom)
            );
        }
        if (dateTo) {
            const endDate = new Date(dateTo);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(tx =>
                new Date(tx.transaction_date) <= endDate
            );
        }

        // Payment mode filter
        if (paymentMode) {
            filtered = filtered.filter(tx => tx.payment_mode === paymentMode);
        }

        setFilteredTransactions(filtered);
        setCurrentPage(1);
    };

    const handleViewReceipt = async (transaction: FeeTransaction) => {
        try {
            // Fetch invoice details to build receipt data
            const invoiceResponse = await api.get(`/fees/invoices/${transaction.invoice}/`);
            const invoice = invoiceResponse.data;

            // Fetch branding for receipt
            let branding: any = {};
            try {
                const brandingResponse = await api.get('/tenants/branding/');
                branding = brandingResponse.data;
            } catch (e) {
                console.warn('Could not fetch branding:', e);
            }

            // Map to FeeReceipt expected format (camelCase)
            const receiptData: ReceiptData = {
                receiptNumber: transaction.receipt_number || transaction.transaction_number,
                transactionNumber: transaction.transaction_number,
                studentName: invoice.student_name || transaction.student_name || 'N/A',
                admissionNumber: invoice.student_admission_number || transaction.student_admission_number || 'N/A',
                className: invoice.class_name || 'N/A',
                section: invoice.section || '',
                invoiceNumber: invoice.invoice_number || transaction.invoice_number || 'N/A',
                invoiceDate: invoice.invoice_date || transaction.transaction_date,
                paymentDate: transaction.transaction_date,
                paymentMode: transaction.payment_mode,
                paymentReference: transaction.payment_reference,
                items: invoice.items?.map((item: any) => ({
                    description: item.description,
                    amount: parseFloat(item.amount)
                })) || [{ description: transaction.category_name || 'Fee Payment', amount: parseFloat(transaction.amount) }],
                totalAmount: parseFloat(invoice.total_amount || transaction.amount),
                paidAmount: parseFloat(invoice.paid_amount || transaction.amount),
                balanceAmount: parseFloat(invoice.balance_amount || '0'),
                collectedBy: transaction.collected_by_name,
                schoolName: branding.school_name || 'School Name',
                schoolAddress: branding.school_address || '',
                schoolPhone: branding.school_phone || '',
                schoolEmail: branding.school_email || '',
                schoolLogo: branding.logo_url || '',
                receiptCopies: branding.receipt_copies || 3,
                receiptFooterText: branding.receipt_footer_text || 'This is a computer generated receipt.'
            };

            setSelectedReceiptData(receiptData);
            setShowReceipt(true);
        } catch (error) {
            console.error('Error fetching receipt details:', error);
            // Fallback with available data
            const receiptData: ReceiptData = {
                receiptNumber: transaction.receipt_number || transaction.transaction_number,
                transactionNumber: transaction.transaction_number,
                studentName: transaction.student_name || 'N/A',
                admissionNumber: transaction.student_admission_number || 'N/A',
                className: 'N/A',
                section: '',
                invoiceNumber: transaction.invoice_number || 'N/A',
                invoiceDate: transaction.transaction_date,
                paymentDate: transaction.transaction_date,
                paymentMode: transaction.payment_mode,
                paymentReference: transaction.payment_reference,
                items: [{ description: transaction.category_name || 'Fee Payment', amount: parseFloat(transaction.amount) }],
                totalAmount: parseFloat(transaction.amount),
                paidAmount: parseFloat(transaction.amount),
                balanceAmount: 0,
                collectedBy: transaction.collected_by_name,
                schoolName: 'School Name',
                schoolAddress: '',
                schoolPhone: '',
                schoolEmail: '',
                schoolLogo: '',
                receiptCopies: 3,
                receiptFooterText: 'This is a computer generated receipt.'
            };
            setSelectedReceiptData(receiptData);
            setShowReceipt(true);
        }
    };

    const getPaymentModeIcon = (mode: string) => {
        switch (mode) {
            case 'CASH': return '💵';
            case 'CHEQUE': return '📝';
            case 'CARD': return '💳';
            case 'UPI': return '📱';
            case 'NET_BANKING': return '🏦';
            case 'WALLET': return '👛';
            default: return '💰';
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const clearFilters = () => {
        setSearchQuery('');
        setDateFrom('');
        setDateTo('');
        setPaymentMode('');
    };

    // Pagination calculations
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Calculate totals
    const totalAmount = filteredTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

    if (loading) return <Loading fullScreen text={t('common.loading')} />;

    return (
        <div className="fee-history-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">📜 {t('fees.payment_history', { defaultValue: 'Fee Payment History' })}</h1>
                    <p className="page-subtitle">{t('fees.payment_history_subtitle', { defaultValue: 'View all fee payments and receipts in chronological order' })}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <Card>
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: '#059669' }}>
                            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div style={{ color: '#6b7280', marginTop: '4px' }}>
                            {t('fees.total_collected', { defaultValue: 'Total Collected' })} ({filteredTransactions.length} {t('fees.transactions', { defaultValue: 'transactions' })})
                        </div>
                    </div>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
                    <div className="form-group" style={{ minWidth: '200px', flex: 1 }}>
                        <label>{t('common.search', { defaultValue: 'Search' })}</label>
                        <input
                            type="text"
                            placeholder={t('fees.search_placeholder', { defaultValue: 'Student name, admission no, receipt no...' })}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ minWidth: '140px' }}>
                        <label>{t('fees.date_from', { defaultValue: 'From Date' })}</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ minWidth: '140px' }}>
                        <label>{t('fees.date_to', { defaultValue: 'To Date' })}</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ minWidth: '150px' }}>
                        <label>{t('fees.payment_mode', { defaultValue: 'Payment Mode' })}</label>
                        <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                            <option value="">{t('common.all', { defaultValue: 'All' })}</option>
                            <option value="CASH">Cash</option>
                            <option value="CHEQUE">Cheque</option>
                            <option value="CARD">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="NET_BANKING">Net Banking</option>
                            <option value="WALLET">Wallet</option>
                        </select>
                    </div>
                    <Button variant="outline" onClick={clearFilters}>
                        🔄 {t('common.clear', { defaultValue: 'Clear' })}
                    </Button>
                </div>

                {/* Transactions Table */}
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('fees.date_time', { defaultValue: 'Date & Time' })}</th>
                                <th>{t('fees.receipt_no', { defaultValue: 'Receipt No' })}</th>
                                <th>{t('fees.student', { defaultValue: 'Student' })}</th>
                                <th>{t('fees.amount', { defaultValue: 'Amount' })}</th>
                                <th>{t('fees.payment_mode', { defaultValue: 'Mode' })}</th>
                                <th>{t('fees.reference', { defaultValue: 'Reference' })}</th>
                                <th>{t('common.actions', { defaultValue: 'Actions' })}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                                        {t('fees.no_transactions', { defaultValue: 'No transactions found' })}
                                    </td>
                                </tr>
                            ) : (
                                currentTransactions.map((tx) => (
                                    <tr key={tx.id}>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{formatDate(tx.transaction_date)}</div>
                                        </td>
                                        <td>
                                            <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: '4px' }}>
                                                {tx.receipt_number || tx.transaction_number}
                                            </code>
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '500' }}>{tx.student_name || 'N/A'}</div>
                                            <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{tx.student_admission_number}</div>
                                        </td>
                                        <td style={{ fontWeight: '600', color: '#059669' }}>
                                            ₹{parseFloat(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                background: '#e0e7ff',
                                                padding: '4px 8px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem'
                                            }}>
                                                {getPaymentModeIcon(tx.payment_mode)} {tx.payment_mode.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                                                {tx.payment_reference || '-'}
                                            </span>
                                        </td>
                                        <td>
                                            <Button
                                                size="small"
                                                variant="outline"
                                                onClick={() => handleViewReceipt(tx)}
                                            >
                                                🧾 {t('fees.view_receipt', { defaultValue: 'Receipt' })}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginTop: '16px',
                        padding: '12px 0',
                        borderTop: '1px solid #e5e7eb'
                    }}>
                        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                            {t('common.showing', { defaultValue: 'Showing' })} {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} {t('common.of', { defaultValue: 'of' })} {filteredTransactions.length}
                        </span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                            >
                                ← {t('common.previous', { defaultValue: 'Previous' })}
                            </Button>
                            <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: '#f3f4f6', borderRadius: '6px' }}>
                                {currentPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="small"
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                            >
                                {t('common.next', { defaultValue: 'Next' })} →
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Receipt Modal */}
            {showReceipt && selectedReceiptData && (
                <FeeReceipt
                    receiptData={selectedReceiptData}
                    onClose={() => {
                        setShowReceipt(false);
                        setSelectedReceiptData(null);
                    }}
                />
            )}
        </div>
    );
};

export default FeePaymentHistory;
