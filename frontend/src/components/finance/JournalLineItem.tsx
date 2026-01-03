import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

interface LineItem {
    id: string;
    account: number | null;
    account_name?: string;
    debit: number;
    credit: number;
    description: string;
}

interface JournalLineItemProps {
    lineItems: LineItem[];
    accounts: any[];
    onChange: (lineItems: LineItem[]) => void;
}

export const JournalLineItem: React.FC<JournalLineItemProps> = ({ lineItems, accounts, onChange }) => {
    const addLineItem = () => {
        const newItem: LineItem = {
            id: Date.now().toString(),
            account: null,
            debit: 0,
            credit: 0,
            description: '',
        };
        onChange([...lineItems, newItem]);
    };

    const removeLineItem = (id: string) => {
        onChange(lineItems.filter((item) => item.id !== id));
    };

    const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
        onChange(
            lineItems.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };

                    // If account is selected, get account name
                    if (field === 'account') {
                        const account = accounts.find((acc) => acc.id === value);
                        updated.account_name = account ? account.name : '';
                    }

                    // Ensure only one of debit or credit has value
                    if (field === 'debit' && value > 0) {
                        updated.credit = 0;
                    } else if (field === 'credit' && value > 0) {
                        updated.debit = 0;
                    }

                    return updated;
                }
                return item;
            })
        );
    };

    const totalDebit = lineItems.reduce((sum, item) => sum + (item.debit || 0), 0);
    const totalCredit = lineItems.reduce((sum, item) => sum + (item.credit || 0), 0);
    const difference = totalDebit - totalCredit;
    const isBalanced = Math.abs(difference) < 0.01;

    return (
        <div className="space-y-4">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/3">
                                Account
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase w-1/6">
                                Debit (₹)
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase w-1/6">
                                Credit (₹)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase w-1/3">
                                Description
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase w-16">
                                Action
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {lineItems.map((item, index) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3">
                                    <select
                                        value={item.account || ''}
                                        onChange={(e) => updateLineItem(item.id, 'account', parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        required
                                    >
                                        <option value="">-- Select Account --</option>
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                    </select>
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.debit || ''}
                                        onChange={(e) => updateLineItem(item.id, 'debit', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm"
                                        placeholder="0.00"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.credit || ''}
                                        onChange={(e) => updateLineItem(item.id, 'credit', parseFloat(e.target.value) || 0)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right text-sm"
                                        placeholder="0.00"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                        placeholder="Optional"
                                    />
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <button
                                        type="button"
                                        onClick={() => removeLineItem(item.id)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                        disabled={lineItems.length <= 2}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-semibold">
                        <tr>
                            <td className="px-4 py-3 text-right">Total:</td>
                            <td className="px-4 py-3 text-right text-blue-600">
                                ₹{totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-right text-blue-600">
                                ₹{totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                        <tr>
                            <td colSpan={3} className="px-4 py-3 text-right">
                                <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                    Difference: ₹{Math.abs(difference).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    {isBalanced && ' ✓ Balanced'}
                                </span>
                            </td>
                            <td colSpan={2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <button
                type="button"
                onClick={addLineItem}
                className="flex items-center gap-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
                <Plus size={18} />
                Add Line Item
            </button>

            {!isBalanced && lineItems.length >= 2 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">
                        ⚠️ Entry is not balanced. Total debits must equal total credits before posting.
                    </p>
                </div>
            )}
        </div>
    );
};
