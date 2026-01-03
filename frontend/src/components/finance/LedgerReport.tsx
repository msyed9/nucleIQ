import React from 'react';
import { Download, Printer } from 'lucide-react';

interface LedgerTransaction {
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Props {
    accountName: string;
    accountCode: string;
    openingBalance: number;
    transactions: LedgerTransaction[];
    closingBalance: number;
    fromDate: string;
    toDate: string;
    onExport: () => void;
    onPrint: () => void;
}

const LedgerReport: React.FC<Props> = ({
    accountName,
    accountCode,
    openingBalance,
    transactions,
    closingBalance,
    fromDate,
    toDate,
    onExport,
    onPrint
}) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">Ledger Report</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Account: {accountCode} - {accountName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
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

                {/* Opening Balance */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Opening Balance</span>
                        <span className="text-sm font-bold text-gray-800">
                            ₹{openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Debit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Credit</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {transactions.map((txn, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(txn.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-700">{txn.reference}</td>
                                    <td className="px-4 py-3 text-sm text-gray-700">{txn.description}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-bold text-gray-900">
                                        ₹{txn.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Closing Balance */}
                <div className="mt-4 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">Closing Balance</span>
                        <span className="text-lg font-bold text-blue-800">
                            ₹{closingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LedgerReport;