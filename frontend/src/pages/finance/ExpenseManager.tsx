import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { formatCurrency, formatDate } from '../../utils/helpers';
import api from '../../services/api';
import './Finance.css';

interface Expense {
    id: string;
    request_number: string;
    requested_by: string;
    amount: number;
    purpose: string;
    status: string;
    requested_date: string;
}

const ExpenseManager: React.FC = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await api.get('/finance/petty-cash/');
            setExpenses(response.data.results || response.data);
        } catch (error) {
            // Mock data
            setExpenses([
                {
                    id: '1',
                    request_number: 'PC001',
                    requested_by: 'John Doe',
                    amount: 5000,
                    purpose: 'Office Supplies',
                    status: 'pending',
                    requested_date: '2024-12-28',
                },
                {
                    id: '2',
                    request_number: 'PC002',
                    requested_by: 'Jane Smith',
                    amount: 3000,
                    purpose: 'Maintenance',
                    status: 'approved',
                    requested_date: '2024-12-27',
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const { t } = useTranslation();

    if (loading) return <Loading fullScreen text={t('expense.loading')} />;

    return (
        <div className="finance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('expense.title')}</h1>
                    <p className="page-subtitle">{t('expense.subtitle')}</p>
                </div>
                <Button variant="primary" onClick={() => setShowAddModal(true)}>
                    {t('expense.new')}
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="expense-summary">
                <Card className="summary-card">
                    <div className="summary-content">
                        <span className="summary-label">{t('expense.total_pending')}</span>
                        <span className="summary-value">
                            {formatCurrency(
                                expenses
                                    .filter((e) => e.status === 'pending')
                                    .reduce((sum, e) => sum + Number(e.amount), 0)
                            )}
                        </span>
                    </div>
                </Card>
                <Card className="summary-card">
                    <div className="summary-content">
                        <span className="summary-label">{t('expense.total_approved')}</span>
                        <span className="summary-value">
                            {formatCurrency(
                                expenses
                                    .filter((e) => e.status === 'approved')
                                    .reduce((sum, e) => sum + Number(e.amount), 0)
                            )}
                        </span>
                    </div>
                </Card>
            </div>

            {/* Expenses Table */}
            <Card>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>{t('expense.request_no')}</th>
                                <th>{t('expense.requested_by')}</th>
                                <th>{t('expense.purpose')}</th>
                                <th>{t('expense.amount')}</th>
                                <th>{t('expense.date')}</th>
                                <th>{t('expense.status')}</th>
                                <th>{t('expense.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {expenses.map((expense) => (
                                <tr key={expense.id}>
                                    <td>{expense.request_number}</td>
                                    <td>{expense.requested_by}</td>
                                    <td>{expense.purpose}</td>
                                    <td>{formatCurrency(expense.amount)}</td>
                                    <td>{formatDate(expense.requested_date)}</td>
                                    <td>
                                        <span className={`status-badge status-${expense.status}`}>
                                            {t(`expense.status_${expense.status}`, { defaultValue: expense.status })}
                                        </span>
                                    </td>
                                    <td>
                                        {expense.status === 'pending' && (
                                            <div className="action-buttons">
                                                <Button size="small" variant="success">
                                                    {t('expense.approve')}
                                                </Button>
                                                <Button size="small" variant="danger">
                                                    {t('expense.reject')}
                                                </Button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};

export default ExpenseManager;