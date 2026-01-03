import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    AlertCircle,
    Wallet,
    BarChart3,
    PieChart,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface KPIData {
    total_revenue: number;
    revenue_change: number;
    total_expenses: number;
    expense_percentage: number;
    net_profit: number;
    profit_margin: number;
    outstanding_receivables: number;
    defaulters_count: number;
    outstanding_payables: number;
    pending_bills_count: number;
    bank_balance: number;
    cash_in_hand: number;
}

export const FinanceDashboard: React.FC = () => {
    const [kpiData, setKpiData] = useState<KPIData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState('THIS_MONTH');

    useEffect(() => {
        fetchDashboardData();
    }, [selectedPeriod]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/finance/dashboard/kpis/?period=${selectedPeriod}`);
            setKpiData(response.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !kpiData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const isProfit = kpiData.net_profit >= 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Finance Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of financial performance and key metrics</p>
                </div>
                <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="THIS_MONTH">This Month</option>
                    <option value="LAST_MONTH">Last Month</option>
                    <option value="THIS_QUARTER">This Quarter</option>
                    <option value="THIS_YEAR">This Year</option>
                </select>
            </div>

            {/* KPI Cards - Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                        <div className={`flex items-center gap-1 text-sm ${kpiData.revenue_change >= 0 ? 'text-green-200' : 'text-red-200'}`}>
                            {kpiData.revenue_change >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                            {Math.abs(kpiData.revenue_change).toFixed(1)}%
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
                    <p className="text-3xl font-bold mt-2">₹{kpiData.total_revenue.toLocaleString('en-IN')}</p>
                    <div className="mt-4 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
                        <div className="h-full bg-white rounded-full" style={{ width: '75%' }}></div>
                    </div>
                </div>

                {/* Total Expenses */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <CreditCard size={24} />
                        </div>
                        <div className="text-sm">
                            {kpiData.expense_percentage.toFixed(1)}% of revenue
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Total Expenses</h3>
                    <p className="text-3xl font-bold mt-2">₹{kpiData.total_expenses.toLocaleString('en-IN')}</p>
                    <div className="mt-4 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${Math.min(kpiData.expense_percentage, 100)}%` }}
                        ></div>
                    </div>
                </div>

                {/* Net Profit/Loss */}
                <div
                    className={`bg-gradient-to-br ${isProfit ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'
                        } rounded-lg shadow-lg p-6 text-white`}
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            {isProfit ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        </div>
                        <div className="text-sm">
                            {kpiData.profit_margin.toFixed(1)}% margin
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Net {isProfit ? 'Profit' : 'Loss'}</h3>
                    <p className="text-3xl font-bold mt-2">₹{Math.abs(kpiData.net_profit).toLocaleString('en-IN')}</p>
                    <div className="mt-4 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-white rounded-full"
                            style={{ width: `${Math.min(Math.abs(kpiData.profit_margin), 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* KPI Cards - Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Outstanding Receivables */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Outstanding Receivables</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{kpiData.outstanding_receivables.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{kpiData.defaulters_count} defaulters</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <AlertCircle className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Outstanding Payables */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Outstanding Payables</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{kpiData.outstanding_payables.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{kpiData.pending_bills_count} pending bills</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <CreditCard className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Bank Balance */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Bank Balance</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{kpiData.bank_balance.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">All accounts</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Wallet className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                {/* Cash in Hand */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Cash in Hand</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{kpiData.cash_in_hand.toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Petty cash</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cash Flow Trend */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Cash Flow Trend (6 Months)</h3>
                        <BarChart3 className="text-gray-400" size={20} />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        <p>Chart visualization coming soon</p>
                    </div>
                </div>

                {/* Expense Breakdown */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Expense Breakdown</h3>
                        <PieChart className="text-gray-400" size={20} />
                    </div>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                        <p>Chart visualization coming soon</p>
                    </div>
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p className="font-medium text-gray-800">Transaction #{i}</p>
                                <p className="text-sm text-gray-500">2026-01-{String(i).padStart(2, '0')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-800">₹{(10000 * i).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-gray-500">View Details</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Alerts */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <AlertCircle className="text-yellow-600 mt-0.5" size={20} />
                    <div>
                        <h4 className="font-semibold text-yellow-800">Alerts & Notifications</h4>
                        <ul className="mt-2 space-y-1 text-sm text-yellow-700">
                            <li>• Low bank balance warning in Account #1234</li>
                            <li>• Budget exceeded for Marketing department</li>
                            <li>• 3 vendor payments due in next 7 days</li>
                            <li>• 2 pending approvals for journal entries</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default FinanceDashboard;