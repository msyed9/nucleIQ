import React from 'react';
import { X, FileText, TrendingUp, Users } from 'lucide-react';

interface Transaction {
    id: number;
    date: string;
    reference: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
}

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: string;
    balance: number;
    is_debit: boolean;
    description: string;
    transaction_count: number;
    children?: Account[];
    is_active: boolean;
}

interface AccountDetailsProps {
    account: Account;
    transactions: Transaction[];
    onClose: () => void;
    onViewLedger: () => void;
}

export const AccountDetails: React.FC<AccountDetailsProps> = ({
    account,
    transactions,
    onClose,
    onViewLedger,
}) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{account.name}</h2>
                        <p className="text-sm text-gray-500 mt-1">Account Code: {account.code}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Account Summary */}
                <div className="p-6 bg-gray-50 border-b border-gray-200">
                    <div className="grid grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <FileText size={18} />
                                <span className="text-sm">Account Type</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-800">{account.account_type}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <TrendingUp size={18} />
                                <span className="text-sm">Current Balance</span>
                            </div>
                            <p className={`text-lg font-semibold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{Math.abs(account.balance).toLocaleString('en-IN')}
                                <span className="text-sm ml-1">{account.is_debit ? 'Dr' : 'Cr'}</span>
                            </p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <Users size={18} />
                                <span className="text-sm">Transactions</span>
                            </div>
                            <p className="text-lg font-semibold text-gray-800">{account.transaction_count}</p>
                        </div>

                        <div className="bg-white p-4 rounded-lg shadow-sm">
                            <div className="flex items-center gap-2 text-gray-600 mb-2">
                                <span className="text-sm">Status</span>
                            </div>
                            <p className={`text-lg font-semibold ${account.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                {account.is_active ? 'Active' : 'Inactive'}
                            </p>
                        </div>
                    </div>

                    {account.description && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-gray-700">{account.description}</p>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Transactions</h3>
                        <button
                            onClick={onViewLedger}
                            className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            View Full Ledger
                        </button>
                    </div>

                    {transactions.length > 0 ? (
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
                                    {transactions.map((txn) => (
                                        <tr key={txn.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-800">
                                                {new Date(txn.date).toLocaleDateString('en-IN')}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{txn.reference}</td>
                                            <td className="px-4 py-3 text-sm text-gray-800">{txn.description}</td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-800">
                                                {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-800">
                                                {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                                ₹{txn.balance.toLocaleString('en-IN')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <p>No transactions found for this account</p>
                        </div>
                    )}
                </div>

                {/* Sub-accounts */}
                {account.children && account.children.length > 0 && (
                    <div className="p-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sub-Accounts</h3>
                        <div className="space-y-2">
                            {account.children.map((child) => (
                                <div key={child.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-800">{child.name}</p>
                                        <p className="text-sm text-gray-500">Code: {child.code}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${child.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            ₹{Math.abs(child.balance).toLocaleString('en-IN')}
                                        </p>
                                        <p className="text-xs text-gray-500">{child.transaction_count} transactions</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
