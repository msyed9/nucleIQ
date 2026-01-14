import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import './CollectFees.css';

interface TransactionItem {
    id: string;
    invoice_item: string;
    amount: number;
    is_advance: boolean;
    remarks: string;
    category_id: string;
    category_name: string;
    category_code: string;
    invoice_item_description: string;
}

interface Transaction {
    id: string;
    invoice: string;
    invoice_number: string;
    student_name: string;
    student_admission_number: string;
    transaction_number: string;
    transaction_date: string;
    amount: number;
    payment_mode: string;
    payment_reference: string;
    collected_by_name: string;
    receipt_number: string;
    remarks: string;
    items?: TransactionItem[];
}

const PaymentHistory: React.FC = () => {
    const { t } = useTranslation();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [paymentModeFilter, setPaymentModeFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
    const [loadingItems, setLoadingItems] = useState(false);

    useEffect(() => {
        fetchTransactions();
    }, [paymentModeFilter]);

    const fetchTransactions = async () => {
        try {
            let url = '/fees/transactions/';
            const params = new URLSearchParams();
            if (paymentModeFilter) params.append('payment_mode', paymentModeFilter);

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await api.get(url);
            setTransactions(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactionBreakdown = async (transaction: Transaction) => {
        setSelectedTransaction(transaction);
        setLoadingItems(true);

        try {
            const response = await api.get(`/fees/transactions/${transaction.id}/breakdown/`);
            setTransactionItems(response.data.items || []);
        } catch (error) {
            console.error('Error fetching breakdown:', error);
            setTransactionItems([]);
        } finally {
            setLoadingItems(false);
        }
    };

    const getPaymentModeIcon = (mode: string) => {
        const icons: Record<string, string> = {
            CASH: '💵',
            CHEQUE: '📝',
            CARD: '💳',
            UPI: '📱',
            NET_BANKING: '🏦',
            WALLET: '👛',
            OTHER: '📌'
        };
        return icons[mode] || '💰';
    };

    const getPaymentModeName = (mode: string) => {
        const names: Record<string, string> = {
            CASH: 'Cash',
            CHEQUE: 'Cheque',
            CARD: 'Card',
            UPI: 'UPI',
            NET_BANKING: 'Net Banking',
            WALLET: 'Wallet',
            OTHER: 'Other'
        };
        return names[mode] || mode;
    };

    // Filter transactions
    const filteredTransactions = transactions.filter(txn => {
        // Search filter
        const matchesSearch =
            txn.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.transaction_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.student_admission_number?.toLowerCase().includes(searchTerm.toLowerCase());

        // Date filter
        let matchesDate = true;
        if (dateFrom) {
            matchesDate = matchesDate && new Date(txn.transaction_date) >= new Date(dateFrom);
        }
        if (dateTo) {
            matchesDate = matchesDate && new Date(txn.transaction_date) <= new Date(dateTo + 'T23:59:59');
        }

        return matchesSearch && matchesDate;
    });

    // Calculate totals
    const totalAmount = filteredTransactions.reduce((sum, txn) => sum + Number(txn.amount), 0);
    const paymentModeTotals = filteredTransactions.reduce((acc, txn) => {
        acc[txn.payment_mode] = (acc[txn.payment_mode] || 0) + Number(txn.amount);
        return acc;
    }, {} as Record<string, number>);

    // Export columns
    const exportColumns: ExportColumn[] = [
        { key: 'transaction_number', label: 'Transaction #' },
        { key: 'receipt_number', label: 'Receipt #' },
        { key: 'student_name', label: 'Student Name' },
        { key: 'student_admission_number', label: 'Admission #' },
        { key: 'invoice_number', label: 'Invoice #' },
        {
            key: 'transaction_date',
            label: 'Date',
            format: (value) => new Date(value).toLocaleDateString('en-IN')
        },
        {
            key: 'amount',
            label: 'Amount (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'payment_mode',
            label: 'Payment Mode',
            format: (value) => getPaymentModeName(value)
        },
        { key: 'payment_reference', label: 'Reference' },
        { key: 'collected_by_name', label: 'Collected By' }
    ];

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>📜 {t('fees.payment_history', 'Payment History')}</h1>
                    <p className="subtitle">{t('fees.payment_history_subtitle', 'View all fee transactions with category breakdown')}</p>
                </div>
                <ExportButton
                    data={filteredTransactions}
                    filename="payment_history"
                    title="Payment History Report"
                    columns={exportColumns}
                    variant="outline"
                    size="medium"
                />
            </div>

            {/* Stats */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">{filteredTransactions.length}</div>
                    <div className="stat-label">Total Transactions</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value">₹{totalAmount.toFixed(2)}</div>
                    <div className="stat-label">Total Collected</div>
                </div>
                {Object.entries(paymentModeTotals).slice(0, 2).map(([mode, amount]) => (
                    <div className="stat-card" key={mode}>
                        <div className="stat-value">₹{amount.toFixed(2)}</div>
                        <div className="stat-label">{getPaymentModeIcon(mode)} {getPaymentModeName(mode)}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search by student, transaction, or invoice..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div style={{ minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                            Payment Mode
                        </label>
                        <select
                            value={paymentModeFilter}
                            onChange={(e) => setPaymentModeFilter(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem'
                            }}
                        >
                            <option value="">All Modes</option>
                            <option value="CASH">💵 Cash</option>
                            <option value="CHEQUE">📝 Cheque</option>
                            <option value="CARD">💳 Card</option>
                            <option value="UPI">📱 UPI</option>
                            <option value="NET_BANKING">🏦 Net Banking</option>
                        </select>
                    </div>

                    <div style={{ minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                            From Date
                        </label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <div style={{ minWidth: '150px' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                            To Date
                        </label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 14px',
                                borderRadius: '8px',
                                border: '1px solid #d1d5db',
                                fontSize: '0.9rem'
                            }}
                        />
                    </div>

                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setPaymentModeFilter('');
                            setDateFrom('');
                            setDateTo('');
                        }}
                        style={{
                            padding: '10px 16px',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            background: '#f3f4f6',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        ✕ Clear
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Transactions Table */}
                <div style={{
                    flex: 1,
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden'
                }}>
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center' }}>
                            <div className="spinner"></div>
                            <p>Loading transactions...</p>
                        </div>
                    ) : filteredTransactions.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📜</div>
                            <p>No transactions found</p>
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Transaction</th>
                                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Student</th>
                                    <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Date</th>
                                    <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Amount</th>
                                    <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Mode</th>
                                    <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((txn) => (
                                    <tr
                                        key={txn.id}
                                        style={{
                                            borderBottom: '1px solid #e5e7eb',
                                            background: selectedTransaction?.id === txn.id ? '#eff6ff' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => fetchTransactionBreakdown(txn)}
                                    >
                                        <td style={{ padding: '14px' }}>
                                            <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>{txn.transaction_number}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{txn.receipt_number}</div>
                                        </td>
                                        <td style={{ padding: '14px' }}>
                                            <div style={{ fontWeight: '500' }}>{txn.student_name}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{txn.student_admission_number}</div>
                                        </td>
                                        <td style={{ padding: '14px', fontSize: '0.85rem', color: '#6b7280' }}>
                                            {new Date(txn.transaction_date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                            ₹{Number(txn.amount).toFixed(2)}
                                        </td>
                                        <td style={{ padding: '14px', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 10px',
                                                borderRadius: '16px',
                                                fontSize: '0.75rem',
                                                fontWeight: '500',
                                                background: '#f3f4f6',
                                                color: '#374151'
                                            }}>
                                                {getPaymentModeIcon(txn.payment_mode)} {getPaymentModeName(txn.payment_mode)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '14px', textAlign: 'center' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fetchTransactionBreakdown(txn);
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #d1d5db',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    fontSize: '0.8rem'
                                                }}
                                            >
                                                📋 Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Transaction Details Panel */}
                {selectedTransaction && (
                    <div style={{
                        width: '380px',
                        background: 'white',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>📋 Transaction Details</h3>
                            <button
                                onClick={() => setSelectedTransaction(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.2rem',
                                    cursor: 'pointer',
                                    color: '#6b7280'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            {/* Transaction Info */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Transaction #</span>
                                    <span style={{ fontWeight: '500' }}>{selectedTransaction.transaction_number}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Receipt #</span>
                                    <span style={{ fontWeight: '500' }}>{selectedTransaction.receipt_number}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Student</span>
                                    <span style={{ fontWeight: '500' }}>{selectedTransaction.student_name}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Date</span>
                                    <span>{new Date(selectedTransaction.transaction_date).toLocaleDateString('en-IN')}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Payment Mode</span>
                                    <span>{getPaymentModeIcon(selectedTransaction.payment_mode)} {getPaymentModeName(selectedTransaction.payment_mode)}</span>
                                </div>
                                {selectedTransaction.payment_reference && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Reference</span>
                                        <span>{selectedTransaction.payment_reference}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ color: '#6b7280', fontSize: '0.85rem' }}>Collected By</span>
                                    <span>{selectedTransaction.collected_by_name || 'N/A'}</span>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '12px',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #e5e7eb'
                                }}>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Total Amount</span>
                                    <span style={{ fontWeight: '600', fontSize: '1.1rem', color: '#059669' }}>
                                        ₹{Number(selectedTransaction.amount).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Category Breakdown */}
                            <div>
                                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: '#374151' }}>
                                    📊 Category Breakdown
                                </h4>
                                {loadingItems ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                                        Loading breakdown...
                                    </div>
                                ) : transactionItems.length === 0 ? (
                                    <div style={{
                                        padding: '16px',
                                        textAlign: 'center',
                                        color: '#6b7280',
                                        background: '#f9fafb',
                                        borderRadius: '8px'
                                    }}>
                                        No category breakdown available
                                    </div>
                                ) : (
                                    <div style={{
                                        background: '#f9fafb',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        {transactionItems.map((item, index) => (
                                            <div
                                                key={item.id || index}
                                                style={{
                                                    padding: '12px 14px',
                                                    borderBottom: index < transactionItems.length - 1 ? '1px solid #e5e7eb' : 'none',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: '500', fontSize: '0.9rem' }}>
                                                        {item.category_name || item.invoice_item_description}
                                                    </div>
                                                    {item.category_code && (
                                                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                            {item.category_code}
                                                        </div>
                                                    )}
                                                    {item.is_advance && (
                                                        <span style={{
                                                            fontSize: '0.7rem',
                                                            padding: '2px 6px',
                                                            background: '#dbeafe',
                                                            color: '#2563eb',
                                                            borderRadius: '4px',
                                                            marginTop: '4px',
                                                            display: 'inline-block'
                                                        }}>
                                                            Advance
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ fontWeight: '600', color: '#059669' }}>
                                                    ₹{Number(item.amount).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaymentHistory;
