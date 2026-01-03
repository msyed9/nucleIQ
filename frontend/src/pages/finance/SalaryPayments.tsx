import React, { useState, useEffect } from 'react';
import { Download, CheckCircle, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import SalaryBreakdown from '../../components/finance/SalaryBreakdown';
import BankFileGenerator from '../../components/finance/BankFileGenerator';
import SalaryRegister from '../../components/finance/SalaryRegister';

interface PayrollCycle {
    id: number;
    month: number;
    year: number;
    total_staff: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
    finance_status: 'NOT_POSTED' | 'POSTED';
    posted_date: string | null;
}

export const SalaryPayments: React.FC = () => {
    const [payrollCycles, setPayrollCycles] = useState<PayrollCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCycle, setSelectedCycle] = useState<PayrollCycle | null>(null);
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [showBankFile, setShowBankFile] = useState(false);
    const [showRegister, setShowRegister] = useState(false);
    const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        fetchPayrollCycles();
    }, [yearFilter]);

    const fetchPayrollCycles = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/finance/salary-payments/?year=${yearFilter}`);
            setPayrollCycles(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching payroll cycles:', error);
            toast.error('Failed to load payroll cycles');
        } finally {
            setLoading(false);
        }
    };

    const handlePostToFinance = async (cycleId: number) => {
        if (!confirm('Are you sure you want to post this payroll to finance? This action cannot be undone.')) {
            return;
        }

        try {
            await api.post('/api/finance/salary-payments/', { payroll_cycle_id: cycleId });
            toast.success('Payroll posted to finance successfully');
            fetchPayrollCycles();
        } catch (error: any) {
            console.error('Error posting to finance:', error);
            toast.error(error.response?.data?.error || 'Failed to post to finance');
        }
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const totalPosted = payrollCycles.filter(c => c.finance_status === 'POSTED').length;
    const totalPending = payrollCycles.filter(c => c.finance_status === 'NOT_POSTED').length;
    const totalGross = payrollCycles.reduce((sum, c) => sum + c.total_gross, 0);
    const totalNet = payrollCycles.reduce((sum, c) => sum + c.total_net, 0);

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
                    <h1 className="text-2xl font-bold text-gray-800">Salary Payments</h1>
                    <p className="text-gray-600 mt-1">Link payroll cycles to finance module</p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(Number(e.target.value))}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {[2024, 2025, 2026, 2027].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => setShowRegister(true)}
                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        Salary Register
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Posted Cycles</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{totalPosted}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Cycles</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{totalPending}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Gross</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">₹{totalGross.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <DollarSign className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Net</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">₹{totalNet.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <TrendingUp className="text-gray-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Payroll Cycles Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Period</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Staff Count</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gross Salary</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Deductions</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Net Salary</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Finance Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {payrollCycles.map((cycle) => (
                                <tr key={cycle.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                        {monthNames[cycle.month - 1]} {cycle.year}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-600">
                                        <div className="flex items-center justify-center gap-1">
                                            <Users size={14} />
                                            {cycle.total_staff}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        ₹{cycle.total_gross.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-red-600">
                                        ₹{cycle.total_deductions.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                                        ₹{cycle.total_net.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            cycle.finance_status === 'POSTED' 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {cycle.finance_status === 'POSTED' ? (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle size={12} />
                                                    POSTED
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    NOT POSTED
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => {
                                                    setSelectedCycle(cycle);
                                                    setShowBreakdown(true);
                                                }}
                                                className="px-3 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                            >
                                                View Breakdown
                                            </button>
                                            {cycle.finance_status === 'NOT_POSTED' ? (
                                                <button
                                                    onClick={() => handlePostToFinance(cycle.id)}
                                                    className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                                                >
                                                    Post to Finance
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCycle(cycle);
                                                        setShowBankFile(true);
                                                    }}
                                                    className="px-3 py-1 text-xs text-purple-600 bg-purple-50 rounded hover:bg-purple-100"
                                                >
                                                    Generate Bank File
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showBreakdown && selectedCycle && (
                <SalaryBreakdown
                    cycle={selectedCycle}
                    onClose={() => {
                        setShowBreakdown(false);
                        setSelectedCycle(null);
                    }}
                />
            )}

            {showBankFile && selectedCycle && (
                <BankFileGenerator
                    cycle={selectedCycle}
                    onClose={() => {
                        setShowBankFile(false);
                        setSelectedCycle(null);
                    }}
                />
            )}

            {showRegister && (
                <SalaryRegister
                    year={yearFilter}
                    onClose={() => setShowRegister(false)}
                />
            )}
        </div>
    );
};

export default SalaryPayments;