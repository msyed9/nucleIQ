import React from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2, Eye } from 'lucide-react';

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: string;
    balance: number;
    is_debit: boolean;
    is_active: boolean;
    transaction_count: number;
    children?: Account[];
}

interface AccountTreeProps {
    accounts: Account[];
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
    onViewDetails: (account: Account) => void;
}

const AccountTreeNode: React.FC<{
    account: Account;
    level: number;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
    onViewDetails: (account: Account) => void;
}> = ({ account, level, onEdit, onDelete, onViewDetails }) => {
    const [isExpanded, setIsExpanded] = React.useState(level < 2);

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            ASSET: 'text-blue-600 bg-blue-50',
            LIABILITY: 'text-red-600 bg-red-50',
            INCOME: 'text-green-600 bg-green-50',
            EXPENSE: 'text-orange-600 bg-orange-50',
            EQUITY: 'text-purple-600 bg-purple-50',
        };
        return colors[type] || 'text-gray-600 bg-gray-50';
    };

    const hasChildren = account.children && account.children.length > 0;

    return (
        <div className="account-tree-node">
            <div
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors ${!account.is_active ? 'opacity-50' : ''
                    }`}
                style={{ paddingLeft: `${level * 24 + 12}px` }}
            >
                {/* Expand/Collapse Icon */}
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={!hasChildren}
                >
                    {hasChildren ? (
                        isExpanded ? (
                            <ChevronDown size={18} />
                        ) : (
                            <ChevronRight size={18} />
                        )
                    ) : (
                        <span className="w-[18px]" />
                    )}
                </button>

                {/* Account Code */}
                <span className="font-mono text-sm text-gray-600 w-24">{account.code}</span>

                {/* Account Name */}
                <span className="flex-1 font-medium text-gray-800">{account.name}</span>

                {/* Account Type Badge */}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(account.account_type)}`}>
                    {account.account_type}
                </span>

                {/* Balance */}
                <span className={`font-semibold w-32 text-right ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{Math.abs(account.balance).toLocaleString('en-IN')}
                    <span className="text-xs ml-1">{account.is_debit ? 'Dr' : 'Cr'}</span>
                </span>

                {/* Transaction Count */}
                <span className="text-sm text-gray-500 w-20 text-center">{account.transaction_count} txns</span>

                {/* Status */}
                <span className={`w-16 text-xs ${account.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                    {account.is_active ? 'Active' : 'Inactive'}
                </span>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onViewDetails(account)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="View Details"
                    >
                        <Eye size={16} />
                    </button>
                    <button
                        onClick={() => onEdit(account)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(account)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                        disabled={account.transaction_count > 0}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {/* Children */}
            {hasChildren && isExpanded && (
                <div className="children">
                    {account.children!.map((child) => (
                        <AccountTreeNode
                            key={child.id}
                            account={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onViewDetails={onViewDetails}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export const AccountTree: React.FC<AccountTreeProps> = ({ accounts, onEdit, onDelete, onViewDetails }) => {
    return (
        <div className="account-tree bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <span className="w-[42px]"></span>
                    <span className="w-24">Code</span>
                    <span className="flex-1">Account Name</span>
                    <span className="w-24">Type</span>
                    <span className="w-32 text-right">Balance</span>
                    <span className="w-20 text-center">Transactions</span>
                    <span className="w-16">Status</span>
                    <span className="w-24">Actions</span>
                </div>
            </div>
            <div className="p-2">
                {accounts.map((account) => (
                    <AccountTreeNode
                        key={account.id}
                        account={account}
                        level={0}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onViewDetails={onViewDetails}
                    />
                ))}
            </div>
        </div>
    );
};
