import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Account {
    id?: number;
    code: string;
    name: string;
    account_type: 'ASSET' | 'LIABILITY' | 'INCOME' | 'EXPENSE' | 'EQUITY';
    parent?: number | null;
    opening_balance: number;
    is_debit: boolean;
    description: string;
    is_active: boolean;
}

interface AccountFormProps {
    account?: Account | null;
    accounts: any[];
    onSubmit: (data: Account) => void;
    onClose: () => void;
}

export const AccountForm: React.FC<AccountFormProps> = ({ account, accounts, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<Account>({
        code: '',
        name: '',
        account_type: 'ASSET',
        parent: null,
        opening_balance: 0,
        is_debit: true,
        description: '',
        is_active: true,
    });

    useEffect(() => {
        if (account) {
            setFormData(account);
        }
    }, [account]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    const suggestNextCode = (type: string, parent?: number | null) => {
        // Simple code suggestion logic
        const typePrefixes: Record<string, string> = {
            ASSET: '1',
            LIABILITY: '2',
            EQUITY: '3',
            INCOME: '4',
            EXPENSE: '5',
        };

        const prefix = typePrefixes[type] || '1';
        const existingCodes = accounts
            .filter(acc => acc.code.startsWith(prefix))
            .map(acc => parseInt(acc.code))
            .filter(code => !isNaN(code));

        const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : parseInt(prefix + '000');
        return (maxCode + 10).toString();
    };

    const handleTypeChange = (type: string) => {
        setFormData({
            ...formData,
            account_type: type as Account['account_type'],
            code: suggestNextCode(type, formData.parent),
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {account ? 'Edit Account' : 'Add New Account'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Parent Account */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Parent Account (Optional)
                        </label>
                        <select
                            value={formData.parent || ''}
                            onChange={(e) => setFormData({ ...formData, parent: e.target.value ? parseInt(e.target.value) : null })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="">-- Root Level --</option>
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.code} - {acc.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Account Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={formData.account_type}
                            onChange={(e) => handleTypeChange(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        >
                            <option value="ASSET">Asset</option>
                            <option value="LIABILITY">Liability</option>
                            <option value="EQUITY">Equity</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expense</option>
                        </select>
                    </div>

                    {/* Account Code */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                            placeholder="e.g., 1000, 1100, 1110"
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Suggested: {suggestNextCode(formData.account_type, formData.parent)}
                        </p>
                    </div>

                    {/* Account Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Account Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Cash in Hand, Bank Account"
                            required
                        />
                    </div>

                    {/* Opening Balance */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Opening Balance
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.opening_balance}
                                onChange={(e) => setFormData({ ...formData, opening_balance: parseFloat(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="0.00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Balance Type
                            </label>
                            <select
                                value={formData.is_debit ? 'debit' : 'credit'}
                                onChange={(e) => setFormData({ ...formData, is_debit: e.target.value === 'debit' })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="debit">Debit (Dr)</option>
                                <option value="credit">Credit (Cr)</option>
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Optional description for this account"
                        />
                    </div>

                    {/* Is Active */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                            Account is active
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {account ? 'Update Account' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
