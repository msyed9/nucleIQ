import React from 'react';
import { Download, Printer } from 'lucide-react';

interface AccountBalance {
    code: string;
    name: string;
    debit: number;
    credit: number;
}

interface Props {
    data: AccountBalance[];
    fromDate: string;
    toDate: string;
    onExport: () => void;
    onPrint: () => void;
}

const TrialBalance: React.FC<Props> = ({ data, fromDate, toDate, onExport, onPrint }) => {
    const totalDebit = data.reduce((sum, acc) => sum + acc.debit, 0);
    const totalCredit = data.reduce((sum, acc) => sum + acc.credit, 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Trial Balance</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            From {new Date(fromDate).toLocaleDateString('en-IN')} to {new Date(toDate).toLocaleDateString('en-IN')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={onPrint}
                            className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                        >
                            <Printer size={16} />
                            Print
                        </button>
                        <button
                            onClick={onExport}
                            className="px-3 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Account Name</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Debit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Credit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {data.map((account, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-600">{account.code}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{account.name}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        {account.debit > 0 ? `₹${account.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        {account.credit > 0 ? `₹${account.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                <td colSpan={2} className="px-4 py-3 text-sm text-gray-800">Total</td>
                                <td className="px-4 py-3 text-sm text-right text-gray-800">
                                    ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-800">
                                    ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {isBalanced ? (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">
                            ✓ Trial Balance is balanced (Total Debits = Total Credits)
                        </p>
                    </div>
                ) : (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">
                            ⚠ Trial Balance is NOT balanced! Difference: ₹{Math.abs(totalDebit - totalCredit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrialBalance;