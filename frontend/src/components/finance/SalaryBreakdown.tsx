import React from 'react';
import { X } from 'lucide-react';

interface PayrollCycle {
    id: number;
    month: number;
    year: number;
    total_gross: number;
    total_deductions: number;
    total_net: number;
}

interface Props {
    cycle: PayrollCycle;
    onClose: () => void;
}

const SalaryBreakdown: React.FC<Props> = ({ cycle, onClose }) => {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    // Sample breakdown - would come from API in real implementation
    const breakdown = {
        gross_salary: cycle.total_gross,
        deductions: {
            tds: cycle.total_gross * 0.05,
            pf: cycle.total_gross * 0.06,
            loan_recovery: cycle.total_gross * 0.02,
            other: cycle.total_gross * 0.01
        },
        net_salary: cycle.total_net
    };

    const journalEntry = [
        { account: 'Salary Expense', debit: breakdown.gross_salary, credit: 0 },
        { account: 'TDS Payable', debit: 0, credit: breakdown.deductions.tds },
        { account: 'PF Payable', debit: 0, credit: breakdown.deductions.pf },
        { account: 'Loan Receivable', debit: 0, credit: breakdown.deductions.loan_recovery },
        { account: 'Other Deductions', debit: 0, credit: breakdown.deductions.other },
        { account: 'Bank Account', debit: 0, credit: breakdown.net_salary }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        Salary Breakdown - {monthNames[cycle.month - 1]} {cycle.year}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Breakdown Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">Gross Salary</p>
                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                ₹{breakdown.gross_salary.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                            <p className="text-sm text-red-600 font-medium">Total Deductions</p>
                            <p className="text-2xl font-bold text-red-700 mt-1">
                                ₹{(breakdown.gross_salary - breakdown.net_salary).toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-green-600 font-medium">Net Salary</p>
                            <p className="text-2xl font-bold text-green-700 mt-1">
                                ₹{breakdown.net_salary.toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>

                    {/* Deduction Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Deduction Details</h3>
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">TDS Deducted</span>
                                <span className="text-sm font-medium text-gray-800">
                                    ₹{breakdown.deductions.tds.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">PF Deducted</span>
                                <span className="text-sm font-medium text-gray-800">
                                    ₹{breakdown.deductions.pf.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Loan Recovery</span>
                                <span className="text-sm font-medium text-gray-800">
                                    ₹{breakdown.deductions.loan_recovery.toLocaleString('en-IN')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Other Deductions</span>
                                <span className="text-sm font-medium text-gray-800">
                                    ₹{breakdown.deductions.other.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Journal Entry Preview */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Journal Entry Preview</h3>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Account</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Debit</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Credit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {journalEntry.map((entry, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-800">{entry.account}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                                {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                                {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold">
                                        <td className="px-4 py-3 text-sm text-gray-800">Total</td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-800">
                                            ₹{breakdown.gross_salary.toLocaleString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-800">
                                            ₹{breakdown.gross_salary.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

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

export default SalaryBreakdown;