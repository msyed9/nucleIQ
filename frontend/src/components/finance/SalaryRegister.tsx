import React, { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Props {
    year: number;
    onClose: () => void;
}

interface RegisterData {
    month: number;
    department: string;
    staff_count: number;
    gross_salary: number;
    deductions: number;
    net_salary: number;
}

const SalaryRegister: React.FC<Props> = ({ year, onClose }) => {
    const [registerData, setRegisterData] = useState<RegisterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    useEffect(() => {
        fetchRegisterData();
    }, [selectedMonth]);

    const fetchRegisterData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/finance/salary-payments/register/?month=${selectedMonth}&year=${year}`);
            setRegisterData(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching register data:', error);
            toast.error('Failed to load salary register');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        // Create CSV content
        const headers = ['Department', 'Staff Count', 'Gross Salary', 'Deductions', 'Net Salary'];
        const rows = registerData.map(data => [
            data.department,
            data.staff_count,
            data.gross_salary,
            data.deductions,
            data.net_salary
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `salary_register_${monthNames[selectedMonth - 1]}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();

        toast.success('Register exported successfully');
    };

    const totals = registerData.reduce((acc, data) => ({
        staff_count: acc.staff_count + data.staff_count,
        gross_salary: acc.gross_salary + data.gross_salary,
        deductions: acc.deductions + data.deductions,
        net_salary: acc.net_salary + data.net_salary
    }), { staff_count: 0, gross_salary: 0, deductions: 0, net_salary: 0 });

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        Salary Register - {year}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            {monthNames.map((month, index) => (
                                <option key={index} value={index + 1}>{month}</option>
                            ))}
                        </select>

                        <button
                            onClick={handleExport}
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download size={18} />
                            Export to Excel
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : (
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Department</th>
                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Staff Count</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Gross Salary</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Deductions</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Net Salary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {registerData.map((data, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-800">{data.department}</td>
                                            <td className="px-4 py-3 text-sm text-center text-gray-600">{data.staff_count}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-800">
                                                ₹{data.gross_salary.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600">
                                                ₹{data.deductions.toLocaleString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                ₹{data.net_salary.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="px-4 py-3 text-sm text-gray-800">Total</td>
                                        <td className="px-4 py-3 text-sm text-center text-gray-800">{totals.staff_count}</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-800">
                                            ₹{totals.gross_salary.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-red-600">
                                            ₹{totals.deductions.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-green-600">
                                            ₹{totals.net_salary.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalaryRegister;