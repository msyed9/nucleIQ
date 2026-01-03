import React from 'react';
import { X } from 'lucide-react';

interface VendorLedgerProps {
    vendorId: number;
    vendorName: string;
    transactions: Array<{
        id: number;
        date: string;
        type: 'INVOICE' | 'PAYMENT' | 'DEBIT_NOTE' | 'CREDIT_NOTE';
        reference: string;
        description: string;
        debit: number;
        credit: number;
        balance: number;
    }>;
    onClose: () => void;
}

export const VendorLedger: React.FC<VendorLedgerProps> = ({
    vendorId,
    vendorName,
    transactions,
    onClose,
}) => {
    const openingBalance = transactions.length > 0 ? transactions[0].balance - transactions[0].debit + transactions[0].credit : 0;
    const closingBalance = transactions.length > 0 ? transactions[transactions.length - 1].balance : 0;
    const totalDebit = transactions.reduce((sum, txn) => sum + txn.debit, 0);
    const totalCredit = transactions.reduce((sum, txn) => sum + txn.credit, 0);

    const getTypeColor = (type: string) => {
        const colors = {
            INVOICE: 'text-red-600 bg-red-50',
            PAYMENT: 'text-green-600 bg-green-50',
            DEBIT_NOTE: 'text-orange-600 bg-orange-50',
            CREDIT_NOTE: 'text-blue-600 bg-blue-50',
        };
        return colors[type as keyof typeof colors] || 'text-gray-600 bg-gray-50';
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        const csv = [
            'Date,Type,Reference,Description,Debit,Credit,Balance',
            ...transactions.map(txn =>
                `${txn.date},${txn.type},${txn.reference},"${txn.description}",${txn.debit},${txn.credit},${txn.balance}`
            )
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vendor-ledger-${vendorId}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">Vendor Ledger</h2>
                        <p className="text-sm text-gray-600 mt-1">{vendorName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleExport}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Export CSV
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            Print
                        </button>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Summary */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Opening Balance</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">
                                ₹{openingBalance.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Total Debit</p>
                            <p className="text-xl font-bold text-red-600 mt-1">
                                ₹{totalDebit.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Total Credit</p>
                            <p className="text-xl font-bold text-green-600 mt-1">
                                ₹{totalCredit.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm text-gray-600">Closing Balance</p>
                            <p className={`text-xl font-bold mt-1 ${closingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.abs(closingBalance).toLocaleString('en-IN')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Transactions Table */}
                <div className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Debit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Credit</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {transactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-800">
                                            {new Date(txn.date).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(txn.type)}`}>
                                                {txn.type.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{txn.reference}</td>
                                        <td className="px-4 py-3 text-sm text-gray-800">{txn.description}</td>
                                        <td className="px-4 py-3 text-sm text-right text-red-600">
                                            {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-green-600">
                                            {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                            ₹{txn.balance.toLocaleString('en-IN')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 font-semibold">
                                <tr>
                                    <td colSpan={4} className="px-4 py-3 text-right">Total:</td>
                                    <td className="px-4 py-3 text-right text-red-600">
                                        ₹{totalDebit.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-green-600">
                                        ₹{totalCredit.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-right text-gray-800">
                                        ₹{closingBalance.toLocaleString('en-IN')}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {transactions.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <p>No transactions found for this vendor</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
