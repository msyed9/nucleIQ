import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import './CollectFees.css';

interface Student {
    id: string;
    full_name: string;
    admission_number: string;
    current_class?: { name: string };
    current_section?: { name: string };
}

interface LedgerEntry {
    date: string;
    type: 'INVOICE' | 'PAYMENT' | 'ADVANCE' | 'REFUND';
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
    category?: string;
}

interface CategorySummary {
    category_name: string;
    total_invoiced: number;
    total_paid: number;
    balance: number;
}

const StudentLedger: React.FC = () => {
    const { t } = useTranslation();
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
    const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCategoryBreakdown, setShowCategoryBreakdown] = useState(true);

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students/?is_active=true');
            setStudents(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchStudentLedger = async (student: Student) => {
        setSelectedStudent(student);
        setLoading(true);
        setLedgerEntries([]);
        setCategorySummary([]);

        try {
            // Fetch invoices, transactions, advances, and refunds for this student
            const [invoicesRes, transactionsRes, advancesRes, refundsRes] = await Promise.all([
                api.get(`/fees/invoices/?student=${student.id}`),
                api.get(`/fees/transactions/`),
                api.get(`/fees/advances/?student=${student.id}`),
                api.get(`/fees/refunds/?student=${student.id}`)
            ]);

            const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.results || [];
            const allTransactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data.results || [];
            const advances = Array.isArray(advancesRes.data) ? advancesRes.data : advancesRes.data.results || [];
            const refunds = Array.isArray(refundsRes.data) ? refundsRes.data : refundsRes.data.results || [];

            // Filter transactions for this student's invoices
            const studentInvoiceIds = invoices.map((inv: any) => inv.id);
            const transactions = allTransactions.filter((txn: any) =>
                studentInvoiceIds.includes(txn.invoice)
            );

            // Build ledger entries
            const entries: LedgerEntry[] = [];
            let runningBalance = 0;

            // Add invoices (debits)
            invoices.forEach((inv: any) => {
                runningBalance += Number(inv.total_amount);
                entries.push({
                    date: inv.invoice_date,
                    type: 'INVOICE',
                    reference: inv.invoice_number,
                    description: `Fee Invoice - ${inv.items?.map((i: any) => i.category_name || i.description).join(', ') || 'Monthly Fee'}`,
                    debit: Number(inv.total_amount),
                    credit: 0,
                    balance: runningBalance
                });
            });

            // Add payments (credits)
            transactions.forEach((txn: any) => {
                runningBalance -= Number(txn.amount);
                entries.push({
                    date: txn.transaction_date,
                    type: 'PAYMENT',
                    reference: txn.receipt_number,
                    description: `Payment - ${txn.payment_mode}${txn.payment_reference ? ` (${txn.payment_reference})` : ''}`,
                    debit: 0,
                    credit: Number(txn.amount),
                    balance: runningBalance
                });
            });

            // Add advances (credits)
            advances.forEach((adv: any) => {
                runningBalance -= Number(adv.amount);
                entries.push({
                    date: adv.created_at,
                    type: 'ADVANCE',
                    reference: `ADV-${adv.id.substring(0, 8)}`,
                    description: `Advance Payment - ${adv.category_name}`,
                    debit: 0,
                    credit: Number(adv.amount),
                    balance: runningBalance,
                    category: adv.category_name
                });
            });

            // Add refunds (debits - money going back)
            refunds.filter((ref: any) => ref.status === 'PROCESSED').forEach((ref: any) => {
                runningBalance += Number(ref.refund_amount);
                entries.push({
                    date: ref.processed_at || ref.created_at,
                    type: 'REFUND',
                    reference: `REF-${ref.id.substring(0, 8)}`,
                    description: `Refund - ${ref.category_name}: ${ref.reason}`,
                    debit: Number(ref.refund_amount),
                    credit: 0,
                    balance: runningBalance,
                    category: ref.category_name
                });
            });

            // Sort by date
            entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            // Recalculate running balance
            let balance = 0;
            entries.forEach(entry => {
                balance += entry.debit - entry.credit;
                entry.balance = balance;
            });

            setLedgerEntries(entries);

            // Build category summary from invoices
            const catMap: Record<string, CategorySummary> = {};
            invoices.forEach((inv: any) => {
                if (inv.items) {
                    inv.items.forEach((item: any) => {
                        const catName = item.category_name || item.description;
                        if (!catMap[catName]) {
                            catMap[catName] = {
                                category_name: catName,
                                total_invoiced: 0,
                                total_paid: 0,
                                balance: 0
                            };
                        }
                        catMap[catName].total_invoiced += Number(item.amount || 0);
                        catMap[catName].total_paid += Number(item.paid_amount || 0);
                        catMap[catName].balance += Number(item.balance_amount || item.amount || 0);
                    });
                }
            });

            setCategorySummary(Object.values(catMap));

        } catch (error) {
            console.error('Error fetching ledger:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            INVOICE: '📋',
            PAYMENT: '💰',
            ADVANCE: '⏩',
            REFUND: '🔄'
        };
        return icons[type] || '📄';
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            INVOICE: '#dc2626',
            PAYMENT: '#059669',
            ADVANCE: '#2563eb',
            REFUND: '#d97706'
        };
        return colors[type] || '#6b7280';
    };

    // Filter students
    const filteredStudents = students.filter(s =>
        s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Totals
    const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debit, 0);
    const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.credit, 0);
    const currentBalance = ledgerEntries.length > 0 ? ledgerEntries[ledgerEntries.length - 1].balance : 0;

    // Export columns
    const exportColumns: ExportColumn[] = [
        {
            key: 'date',
            label: 'Date',
            format: (value) => new Date(value).toLocaleDateString('en-IN')
        },
        { key: 'type', label: 'Type' },
        { key: 'reference', label: 'Reference' },
        { key: 'description', label: 'Description' },
        {
            key: 'debit',
            label: 'Debit (₹)',
            format: (value) => value > 0 ? Number(value).toFixed(2) : ''
        },
        {
            key: 'credit',
            label: 'Credit (₹)',
            format: (value) => value > 0 ? Number(value).toFixed(2) : ''
        },
        {
            key: 'balance',
            label: 'Balance (₹)',
            format: (value) => Number(value).toFixed(2)
        }
    ];

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>📒 {t('fees.student_ledger', 'Student Ledger')}</h1>
                    <p className="subtitle">{t('fees.student_ledger_subtitle', 'View complete fee ledger for individual students')}</p>
                </div>
                {selectedStudent && ledgerEntries.length > 0 && (
                    <ExportButton
                        data={ledgerEntries}
                        filename={`ledger_${selectedStudent.admission_number}`}
                        title={`Student Ledger - ${selectedStudent.full_name}`}
                        columns={exportColumns}
                        variant="outline"
                        size="medium"
                    />
                )}
            </div>

            <div style={{ display: 'flex', gap: '20px' }}>
                {/* Student List */}
                <div style={{
                    width: '320px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    overflow: 'hidden',
                    maxHeight: 'calc(100vh - 200px)',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
                        <input
                            type="text"
                            placeholder="🔍 Search students..."
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
                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {filteredStudents.map(student => (
                            <div
                                key={student.id}
                                onClick={() => fetchStudentLedger(student)}
                                style={{
                                    padding: '14px 16px',
                                    borderBottom: '1px solid #e5e7eb',
                                    cursor: 'pointer',
                                    background: selectedStudent?.id === student.id ? '#eff6ff' : 'white',
                                    transition: 'background 0.2s'
                                }}
                            >
                                <div style={{ fontWeight: '500' }}>{student.full_name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: '8px' }}>
                                    <span>{student.admission_number}</span>
                                    {student.current_class && (
                                        <span>• {student.current_class.name}</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ledger Content */}
                <div style={{ flex: 1 }}>
                    {!selectedStudent ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '60px 40px',
                            textAlign: 'center',
                            color: '#6b7280'
                        }}>
                            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📒</div>
                            <h3>Select a student to view their fee ledger</h3>
                            <p>Search and click on a student from the list on the left</p>
                        </div>
                    ) : loading ? (
                        <div style={{
                            background: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                            padding: '60px 40px',
                            textAlign: 'center'
                        }}>
                            <div className="spinner"></div>
                            <p>Loading ledger...</p>
                        </div>
                    ) : (
                        <>
                            {/* Student Info & Summary */}
                            <div style={{
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                padding: '20px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h2 style={{ margin: '0 0 4px 0' }}>{selectedStudent.full_name}</h2>
                                        <p style={{ margin: 0, color: '#6b7280' }}>
                                            {selectedStudent.admission_number}
                                            {selectedStudent.current_class && ` • ${selectedStudent.current_class.name}`}
                                            {selectedStudent.current_section && ` ${selectedStudent.current_section.name}`}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '12px 20px',
                                        borderRadius: '8px',
                                        background: currentBalance > 0 ? '#fee2e2' : '#d1fae5',
                                        textAlign: 'right'
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Current Balance</div>
                                        <div style={{
                                            fontSize: '1.5rem',
                                            fontWeight: '700',
                                            color: currentBalance > 0 ? '#dc2626' : '#059669'
                                        }}>
                                            ₹{Math.abs(currentBalance).toFixed(2)}
                                            {currentBalance > 0 ? ' Due' : currentBalance < 0 ? ' Credit' : ''}
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Stats */}
                                <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                                    <div style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#fef3c7',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#92400e' }}>
                                            ₹{totalDebit.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#92400e' }}>Total Invoiced</div>
                                    </div>
                                    <div style={{
                                        flex: 1,
                                        padding: '12px',
                                        background: '#d1fae5',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '1.2rem', fontWeight: '600', color: '#065f46' }}>
                                            ₹{totalCredit.toFixed(2)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#065f46' }}>Total Paid</div>
                                    </div>
                                </div>
                            </div>

                            {/* Category Breakdown Toggle */}
                            {categorySummary.length > 0 && (
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    marginBottom: '20px',
                                    overflow: 'hidden'
                                }}>
                                    <div
                                        style={{
                                            padding: '14px 20px',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                            borderBottom: showCategoryBreakdown ? '1px solid #e5e7eb' : 'none'
                                        }}
                                        onClick={() => setShowCategoryBreakdown(!showCategoryBreakdown)}
                                    >
                                        <h3 style={{ margin: 0, fontSize: '1rem' }}>📊 Category-wise Breakdown</h3>
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {showCategoryBreakdown ? '▼' : '▶'}
                                        </span>
                                    </div>
                                    {showCategoryBreakdown && (
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: '#f9fafb' }}>
                                                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Category</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Invoiced</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Paid</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {categorySummary.map((cat, idx) => (
                                                    <tr key={idx} style={{ borderTop: '1px solid #e5e7eb' }}>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>{cat.category_name}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>₹{cat.total_invoiced.toFixed(2)}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right', color: '#059669' }}>₹{cat.total_paid.toFixed(2)}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: cat.balance > 0 ? '#dc2626' : '#059669' }}>
                                                            ₹{cat.balance.toFixed(2)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            )}

                            {/* Ledger Table */}
                            <div style={{
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                overflow: 'hidden'
                            }}>
                                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>📜 Transaction History</h3>
                                </div>
                                {ledgerEntries.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                                        <p>No transactions found for this student</p>
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Date</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Type</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Reference</th>
                                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Description</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Debit</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Credit</th>
                                                <th style={{ padding: '12px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Balance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ledgerEntries.map((entry, idx) => (
                                                <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>
                                                        {new Date(entry.date).toLocaleDateString('en-IN')}
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: '500',
                                                            background: `${getTypeColor(entry.type)}20`,
                                                            color: getTypeColor(entry.type)
                                                        }}>
                                                            {getTypeIcon(entry.type)} {entry.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', fontSize: '0.85rem', fontWeight: '500' }}>
                                                        {entry.reference}
                                                    </td>
                                                    <td style={{ padding: '12px', fontSize: '0.85rem', maxWidth: '300px' }}>
                                                        {entry.description}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#dc2626', fontWeight: entry.debit > 0 ? '500' : '400' }}>
                                                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', color: '#059669', fontWeight: entry.credit > 0 ? '500' : '400' }}>
                                                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                                                    </td>
                                                    <td style={{
                                                        padding: '12px',
                                                        textAlign: 'right',
                                                        fontWeight: '600',
                                                        color: entry.balance > 0 ? '#dc2626' : entry.balance < 0 ? '#059669' : '#374151'
                                                    }}>
                                                        ₹{Math.abs(entry.balance).toFixed(2)}
                                                        {entry.balance > 0 ? ' DR' : entry.balance < 0 ? ' CR' : ''}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr style={{ background: '#f9fafb', borderTop: '2px solid #d1d5db' }}>
                                                <td colSpan={4} style={{ padding: '12px', fontWeight: '600' }}>TOTAL</td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
                                                    ₹{totalDebit.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                                    ₹{totalCredit.toFixed(2)}
                                                </td>
                                                <td style={{
                                                    padding: '12px',
                                                    textAlign: 'right',
                                                    fontWeight: '700',
                                                    color: currentBalance > 0 ? '#dc2626' : '#059669'
                                                }}>
                                                    ₹{Math.abs(currentBalance).toFixed(2)}
                                                    {currentBalance > 0 ? ' DR' : currentBalance < 0 ? ' CR' : ''}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentLedger;
