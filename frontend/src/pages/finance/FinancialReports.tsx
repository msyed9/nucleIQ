import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import './FinancialReports.css';

interface ReportItem {
    account: string;
    amount: number;
}

interface IncomeStatement {
    period: {
        start_date: string;
        end_date: string;
    };
    income: {
        items: ReportItem[];
        total: number;
    };
    expenses: {
        items: ReportItem[];
        total: number;
    };
    net_profit: number;
    is_profit: boolean;
}

interface BalanceSheet {
    as_of_date: string;
    assets: {
        items: ReportItem[];
        total: number;
    };
    liabilities: {
        items: ReportItem[];
        total: number;
    };
    equity: {
        items: ReportItem[];
        total: number;
    };
    total_liabilities_equity: number;
    is_balanced: boolean;
}

const FinancialReports: React.FC = () => {
    const [reportType, setReportType] = useState<'income' | 'balance'>('income');

    // Income Statement dates
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Balance Sheet date
    const [asOfDate, setAsOfDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Fetch Income Statement
    const { data: incomeStatement, isLoading: incomeLoading, refetch: refetchIncome } = useQuery<IncomeStatement>({
        queryKey: ['income-statement', startDate, endDate],
        queryFn: async () => {
            const response = await axios.get(
                `/api/finance/reports/income_statement/?start_date=${startDate}&end_date=${endDate}`
            );
            return response.data;
        },
        enabled: reportType === 'income'
    });

    // Fetch Balance Sheet
    const { data: balanceSheet, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<BalanceSheet>({
        queryKey: ['balance-sheet', asOfDate],
        queryFn: async () => {
            const response = await axios.get(
                `/api/finance/reports/balance_sheet/?as_of_date=${asOfDate}`
            );
            return response.data;
        },
        enabled: reportType === 'balance'
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const handleGenerateReport = () => {
        if (reportType === 'income') {
            refetchIncome();
        } else {
            refetchBalance();
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="financial-reports-container">
            <div className="page-header">
                <h1>📊 Financial Reports</h1>
                <p>Comprehensive financial statements and analysis</p>
            </div>

            {/* Report Type Selection */}
            <div className="report-controls">
                <div className="report-type-tabs">
                    <button
                        className={`report-tab ${reportType === 'income' ? 'active' : ''}`}
                        onClick={() => setReportType('income')}
                    >
                        📈 Income Statement (P&L)
                    </button>
                    <button
                        className={`report-tab ${reportType === 'balance' ? 'active' : ''}`}
                        onClick={() => setReportType('balance')}
                    >
                        💰 Balance Sheet
                    </button>
                </div>

                {/* Date Inputs */}
                <div className="date-controls">
                    {reportType === 'income' ? (
                        <>
                            <div className="date-input-group">
                                <label>From Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="date-input-group">
                                <label>To Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="date-input-group">
                            <label>As of Date</label>
                            <input
                                type="date"
                                value={asOfDate}
                                onChange={(e) => setAsOfDate(e.target.value)}
                            />
                        </div>
                    )}
                    <button className="btn btn-primary" onClick={handleGenerateReport}>
                        🔄 Generate Report
                    </button>
                    <button className="btn btn-secondary" onClick={handlePrint}>
                        🖨️ Print
                    </button>
                </div>
            </div>

            {/* Income Statement Report */}
            {reportType === 'income' && (
                <div className="report-content">
                    {incomeLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Generating Income Statement...</p>
                        </div>
                    ) : incomeStatement ? (
                        <div className="report-card">
                            <div className="report-header">
                                <h2>Income Statement (Profit & Loss)</h2>
                                <p className="report-period">
                                    For the period: {formatDate(incomeStatement.period.start_date)} to {formatDate(incomeStatement.period.end_date)}
                                </p>
                            </div>

                            {/* Income Section */}
                            <div className="report-section">
                                <h3 className="section-title income-title">Revenue / Income</h3>
                                <table className="report-table">
                                    <tbody>
                                        {incomeStatement.income.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="account-name">{item.account}</td>
                                                <td className="amount-value">{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td className="account-name"><strong>Total Income</strong></td>
                                            <td className="amount-value"><strong>{formatCurrency(incomeStatement.income.total)}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Expenses Section */}
                            <div className="report-section">
                                <h3 className="section-title expense-title">Expenses</h3>
                                <table className="report-table">
                                    <tbody>
                                        {incomeStatement.expenses.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="account-name">{item.account}</td>
                                                <td className="amount-value">{formatCurrency(item.amount)}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td className="account-name"><strong>Total Expenses</strong></td>
                                            <td className="amount-value"><strong>{formatCurrency(incomeStatement.expenses.total)}</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Net Profit/Loss */}
                            <div className="report-summary">
                                <div className={`summary-card ${incomeStatement.is_profit ? 'profit' : 'loss'}`}>
                                    <div className="summary-label">
                                        {incomeStatement.is_profit ? '✅ Net Profit' : '❌ Net Loss'}
                                    </div>
                                    <div className="summary-amount">
                                        {formatCurrency(Math.abs(incomeStatement.net_profit))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>No Data Available</h3>
                            <p>Click "Generate Report" to view the Income Statement</p>
                        </div>
                    )}
                </div>
            )}

            {/* Balance Sheet Report */}
            {reportType === 'balance' && (
                <div className="report-content">
                    {balanceLoading ? (
                        <div className="loading-state">
                            <div className="spinner"></div>
                            <p>Generating Balance Sheet...</p>
                        </div>
                    ) : balanceSheet ? (
                        <div className="report-card">
                            <div className="report-header">
                                <h2>Balance Sheet</h2>
                                <p className="report-period">
                                    As of: {formatDate(balanceSheet.as_of_date)}
                                </p>
                            </div>

                            <div className="balance-sheet-grid">
                                {/* Assets Section */}
                                <div className="balance-column">
                                    <div className="report-section">
                                        <h3 className="section-title asset-title">Assets</h3>
                                        <table className="report-table">
                                            <tbody>
                                                {balanceSheet.assets.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="account-name">{item.account}</td>
                                                        <td className="amount-value">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="total-row">
                                                    <td className="account-name"><strong>Total Assets</strong></td>
                                                    <td className="amount-value"><strong>{formatCurrency(balanceSheet.assets.total)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Liabilities & Equity Section */}
                                <div className="balance-column">
                                    {/* Liabilities */}
                                    <div className="report-section">
                                        <h3 className="section-title liability-title">Liabilities</h3>
                                        <table className="report-table">
                                            <tbody>
                                                {balanceSheet.liabilities.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="account-name">{item.account}</td>
                                                        <td className="amount-value">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="total-row">
                                                    <td className="account-name"><strong>Total Liabilities</strong></td>
                                                    <td className="amount-value"><strong>{formatCurrency(balanceSheet.liabilities.total)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Equity */}
                                    <div className="report-section">
                                        <h3 className="section-title equity-title">Equity</h3>
                                        <table className="report-table">
                                            <tbody>
                                                {balanceSheet.equity.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td className="account-name">{item.account}</td>
                                                        <td className="amount-value">{formatCurrency(item.amount)}</td>
                                                    </tr>
                                                ))}
                                                <tr className="total-row">
                                                    <td className="account-name"><strong>Total Equity</strong></td>
                                                    <td className="amount-value"><strong>{formatCurrency(balanceSheet.equity.total)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Total Liabilities + Equity */}
                                    <div className="report-section">
                                        <table className="report-table">
                                            <tbody>
                                                <tr className="grand-total-row">
                                                    <td className="account-name"><strong>Total Liabilities + Equity</strong></td>
                                                    <td className="amount-value"><strong>{formatCurrency(balanceSheet.total_liabilities_equity)}</strong></td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Balance Check */}
                            <div className="report-summary">
                                <div className={`summary-card ${balanceSheet.is_balanced ? 'balanced' : 'unbalanced'}`}>
                                    <div className="summary-label">
                                        {balanceSheet.is_balanced ? '✅ Books are Balanced' : '⚠️ Books are Not Balanced'}
                                    </div>
                                    {!balanceSheet.is_balanced && (
                                        <div className="summary-note">
                                            Difference: {formatCurrency(Math.abs(balanceSheet.assets.total - balanceSheet.total_liabilities_equity))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">💰</div>
                            <h3>No Data Available</h3>
                            <p>Click "Generate Report" to view the Balance Sheet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FinancialReports;
