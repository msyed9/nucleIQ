import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import ExportButton from '../../components/common/ExportButton';
import { ExportColumn } from '../../utils/exportUtils';
import './CollectFees.css';

interface CategoryReport {
    category_id: string;
    category_name: string;
    category_code: string;
    total_invoiced: number;
    total_collected: number;
    total_pending: number;
    collection_percentage: number;
    transaction_count: number;
}

interface DateRange {
    from: string;
    to: string;
}

const CategoryWiseReport: React.FC = () => {
    const { t } = useTranslation();
    const [report, setReport] = useState<CategoryReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<DateRange>({
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchReport();
    }, [dateRange]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            // Use optimized backend endpoint
            const response = await api.get('/fees/invoices/category_report/', {
                params: {
                    from_date: dateRange.from,
                    to_date: dateRange.to
                }
            });

            const reportData = Array.isArray(response.data) ? response.data : [];
            setReport(reportData);
        } catch (error) {
            console.error('Error fetching report:', error);
            // Fallback to client-side processing if backend endpoint not available
            try {
                const [transactionsRes, invoicesRes, categoriesRes] = await Promise.all([
                    api.get('/fees/transactions/'),
                    api.get('/fees/invoices/'),
                    api.get('/fees/categories/')
                ]);

                const transactions = Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data.results || [];
                const invoices = Array.isArray(invoicesRes.data) ? invoicesRes.data : invoicesRes.data.results || [];
                const categories = Array.isArray(categoriesRes.data) ? categoriesRes.data : categoriesRes.data.results || [];

                // Build report data
                const categoryMap: Record<string, CategoryReport> = {};

                // Initialize with categories
                categories.forEach((cat: any) => {
                    categoryMap[cat.id] = {
                        category_id: cat.id,
                        category_name: cat.name,
                        category_code: cat.code,
                        total_invoiced: 0,
                        total_collected: 0,
                        total_pending: 0,
                        collection_percentage: 0,
                        transaction_count: 0
                    };
                });

                // Calculate invoiced amounts from invoices
                invoices.forEach((inv: any) => {
                    if (inv.items) {
                        inv.items.forEach((item: any) => {
                            if (item.category_id && categoryMap[item.category_id]) {
                                categoryMap[item.category_id].total_invoiced += Number(item.amount || 0);
                                categoryMap[item.category_id].total_collected += Number(item.paid_amount || 0);
                                categoryMap[item.category_id].total_pending += Number(item.balance_amount || 0);
                            }
                        });
                    }
                });

                // Count transactions
                transactions.forEach((txn: any) => {
                    const txnDate = new Date(txn.transaction_date);
                    const fromDate = new Date(dateRange.from);
                    const toDate = new Date(dateRange.to + 'T23:59:59');

                    if (txnDate >= fromDate && txnDate <= toDate) {
                        if (txn.items) {
                            txn.items.forEach((item: any) => {
                                if (item.category_id && categoryMap[item.category_id]) {
                                    categoryMap[item.category_id].transaction_count++;
                                }
                            });
                        }
                    }
                });

                // Calculate collection percentage
                Object.values(categoryMap).forEach((cat) => {
                    if (cat.total_invoiced > 0) {
                        cat.collection_percentage = (cat.total_collected / cat.total_invoiced) * 100;
                    }
                });

                // Filter out categories with no activity
                const reportData = Object.values(categoryMap).filter(
                    cat => cat.total_invoiced > 0 || cat.total_collected > 0
                );

                setReport(reportData);
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                setReport([]);
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals
    const totals = report.reduce((acc, cat) => ({
        invoiced: acc.invoiced + cat.total_invoiced,
        collected: acc.collected + cat.total_collected,
        pending: acc.pending + cat.total_pending,
        transactions: acc.transactions + cat.transaction_count
    }), { invoiced: 0, collected: 0, pending: 0, transactions: 0 });

    const overallPercentage = totals.invoiced > 0 ? (totals.collected / totals.invoiced) * 100 : 0;

    // Export columns
    const exportColumns: ExportColumn[] = [
        { key: 'category_name', label: 'Category Name' },
        { key: 'category_code', label: 'Code' },
        {
            key: 'total_invoiced',
            label: 'Total Invoiced (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'total_collected',
            label: 'Total Collected (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'total_pending',
            label: 'Pending (₹)',
            format: (value) => Number(value).toFixed(2)
        },
        {
            key: 'collection_percentage',
            label: 'Collection %',
            format: (value) => `${Number(value).toFixed(1)}%`
        },
        { key: 'transaction_count', label: 'Transactions' }
    ];

    const getProgressColor = (percentage: number) => {
        if (percentage >= 80) return '#059669';
        if (percentage >= 50) return '#d97706';
        return '#dc2626';
    };

    return (
        <div className="collect-fees-container">
            <div className="header">
                <div className="header-left">
                    <h1>📊 {t('fees.category_report', 'Category-wise Collection Report')}</h1>
                    <p className="subtitle">{t('fees.category_report_subtitle', 'Analyze fee collection by category')}</p>
                </div>
                <ExportButton
                    data={report}
                    filename="category_wise_collection"
                    title="Category-wise Collection Report"
                    columns={exportColumns}
                    variant="outline"
                    size="medium"
                />
            </div>

            {/* Summary Cards */}
            <div className="stats-bar">
                <div className="stat-card">
                    <div className="stat-value">₹{totals.invoiced.toFixed(2)}</div>
                    <div className="stat-label">Total Invoiced</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#059669' }}>₹{totals.collected.toFixed(2)}</div>
                    <div className="stat-label">Total Collected</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: '#dc2626' }}>₹{totals.pending.toFixed(2)}</div>
                    <div className="stat-label">Total Pending</div>
                </div>
                <div className="stat-card">
                    <div className="stat-value" style={{ color: getProgressColor(overallPercentage) }}>
                        {overallPercentage.toFixed(1)}%
                    </div>
                    <div className="stat-label">Collection Rate</div>
                </div>
            </div>

            {/* Date Range Filter */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-end',
                flexWrap: 'wrap'
            }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                        From Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: '#6b7280' }}>
                        To Date
                    </label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                        style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: '1px solid #d1d5db',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
                <button
                    onClick={fetchReport}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '8px',
                        border: 'none',
                        background: '#2563eb',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Report Table */}
            <div style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <div className="spinner"></div>
                        <p>Loading report...</p>
                    </div>
                ) : report.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📊</div>
                        <p>No data available for the selected period</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '14px', textAlign: 'left', fontSize: '0.85rem', color: '#6b7280' }}>Category</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Invoiced</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Collected</th>
                                <th style={{ padding: '14px', textAlign: 'right', fontSize: '0.85rem', color: '#6b7280' }}>Pending</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280', width: '200px' }}>Progress</th>
                                <th style={{ padding: '14px', textAlign: 'center', fontSize: '0.85rem', color: '#6b7280' }}>Transactions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.map((cat) => (
                                <tr key={cat.category_id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '14px' }}>
                                        <div style={{ fontWeight: '500' }}>{cat.category_name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{cat.category_code}</div>
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '500' }}>
                                        ₹{cat.total_invoiced.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                        ₹{cat.total_collected.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'right', color: '#dc2626' }}>
                                        ₹{cat.total_pending.toFixed(2)}
                                    </td>
                                    <td style={{ padding: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{
                                                flex: 1,
                                                height: '8px',
                                                background: '#e5e7eb',
                                                borderRadius: '4px',
                                                overflow: 'hidden'
                                            }}>
                                                <div style={{
                                                    width: `${Math.min(cat.collection_percentage, 100)}%`,
                                                    height: '100%',
                                                    background: getProgressColor(cat.collection_percentage),
                                                    borderRadius: '4px',
                                                    transition: 'width 0.3s ease'
                                                }} />
                                            </div>
                                            <span style={{
                                                minWidth: '50px',
                                                fontSize: '0.85rem',
                                                fontWeight: '600',
                                                color: getProgressColor(cat.collection_percentage)
                                            }}>
                                                {cat.collection_percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px', textAlign: 'center', fontWeight: '500' }}>
                                        {cat.transaction_count}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={{ background: '#f9fafb', borderTop: '2px solid #d1d5db' }}>
                                <td style={{ padding: '14px', fontWeight: '600' }}>TOTAL</td>
                                <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600' }}>
                                    ₹{totals.invoiced.toFixed(2)}
                                </td>
                                <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#059669' }}>
                                    ₹{totals.collected.toFixed(2)}
                                </td>
                                <td style={{ padding: '14px', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>
                                    ₹{totals.pending.toFixed(2)}
                                </td>
                                <td style={{ padding: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            flex: 1,
                                            height: '8px',
                                            background: '#e5e7eb',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                width: `${Math.min(overallPercentage, 100)}%`,
                                                height: '100%',
                                                background: getProgressColor(overallPercentage),
                                                borderRadius: '4px'
                                            }} />
                                        </div>
                                        <span style={{
                                            minWidth: '50px',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            color: getProgressColor(overallPercentage)
                                        }}>
                                            {overallPercentage.toFixed(1)}%
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '14px', textAlign: 'center', fontWeight: '600' }}>
                                    {totals.transactions}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CategoryWiseReport;
