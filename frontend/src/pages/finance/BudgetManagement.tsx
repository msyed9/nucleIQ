import React, { useState, useEffect } from 'react';
import { Plus, Download, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import BudgetForm from '../../components/finance/BudgetForm';
import BudgetVariance from '../../components/finance/BudgetVariance';

interface Budget {
    id: number;
    year: number;
    department: string;
    category: string;
    total_amount: number;
    actual_spent: number;
    variance: number;
    variance_percent: number;
    percent_utilized: number;
}

export const BudgetManagement: React.FC = () => {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchBudgets();
    }, [selectedYear]);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/finance/budgets/?year=${selectedYear}`);
            setBudgets(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
            toast.error('Failed to load budgets');
        } finally {
            setLoading(false);
        }
    };

    const totalBudgeted = budgets.reduce((sum, b) => sum + b.total_amount, 0);
    const totalSpent = budgets.reduce((sum, b) => sum + b.actual_spent, 0);
    const totalVariance = totalBudgeted - totalSpent;
    const overallUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Budget Management</h1>
                    <p className="text-gray-600 mt-1">Track and manage organizational budgets</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowBudgetForm(true)}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Create Budget
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Budgeted</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">
                                ₹{totalBudgeted.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Spent</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{totalSpent.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <TrendingDown className="text-gray-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Variance</p>
                            <p className={`text-2xl font-bold mt-1 ${totalVariance >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {totalVariance >= 0 ? '+' : ''}₹{totalVariance.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${totalVariance >= 0 ? 'bg-green-100' : 'bg-red-100'
                            }`}>
                            {totalVariance >= 0 ? (
                                <TrendingUp className="text-green-600" size={24} />
                            ) : (
                                <TrendingDown className="text-red-600" size={24} />
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Utilization</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                {overallUtilization.toFixed(1)}%
                            </p>
                        </div>
                        <div className={`p-3 rounded-lg ${overallUtilization < 80 ? 'bg-green-100' :
                                overallUtilization < 95 ? 'bg-yellow-100' : 'bg-red-100'
                            }`}>
                            <TrendingUp className={
                                overallUtilization < 80 ? 'text-green-600' :
                                    overallUtilization < 95 ? 'text-yellow-600' : 'text-red-600'
                            } size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Budget Variance Table */}
            <BudgetVariance data={budgets.map(b => ({
                category: b.category,
                budgeted: b.total_amount,
                actual: b.actual_spent,
                variance: b.variance,
                variance_percent: b.variance_percent,
                percent_utilized: b.percent_utilized
            }))} />

            {/* Budget Form Modal */}
            {showBudgetForm && (
                <BudgetForm
                    onClose={() => setShowBudgetForm(false)}
                    onSuccess={fetchBudgets}
                />
            )}
        </div>
    );
};

export default BudgetManagement;