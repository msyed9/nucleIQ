import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Download, Upload } from 'lucide-react';
import { AccountTree } from '../../components/finance/AccountTree';
import { AccountForm } from '../../components/finance/AccountForm';
import { AccountDetails } from '../../components/finance/AccountDetails';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: string;
    balance: number;
    is_debit: boolean;
    is_active: boolean;
    transaction_count: number;
    description?: string;
    parent?: number | null;
    children?: Account[];
    opening_balance?: number;
}

const ChartOfAccounts: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [showTemplateModal, setShowTemplateModal] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [accounts, searchTerm, filterType, filterStatus]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/finance/accounts/tree/');
            setAccounts(response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load accounts');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...accounts];

        // Search filter
        if (searchTerm) {
            const search = searchTerm.toLowerCase();
            filtered = filterAccountsRecursive(filtered, (acc) =>
                acc.code.toLowerCase().includes(search) || acc.name.toLowerCase().includes(search)
            );
        }

        // Type filter
        if (filterType !== 'ALL') {
            filtered = filterAccountsRecursive(filtered, (acc) => acc.account_type === filterType);
        }

        // Status filter
        if (filterStatus === 'ACTIVE') {
            filtered = filterAccountsRecursive(filtered, (acc) => acc.is_active);
        } else if (filterStatus === 'INACTIVE') {
            filtered = filterAccountsRecursive(filtered, (acc) => !acc.is_active);
        }

        setFilteredAccounts(filtered);
    };

    const filterAccountsRecursive = (accounts: any[], predicate: (acc: any) => boolean): any[] => {
        return accounts
            .map((acc) => {
                const matchesPredicate = predicate(acc);
                const filteredChildren = acc.children ? filterAccountsRecursive(acc.children, predicate) : [];

                if (matchesPredicate || filteredChildren.length > 0) {
                    return { ...acc, children: filteredChildren };
                }
                return null;
            })
            .filter((acc) => acc !== null);
    };

    const handleAddAccount = () => {
        setSelectedAccount(null);
        setShowForm(true);
    };

    const handleEditAccount = (account: Account) => {
        setSelectedAccount(account);
        setShowForm(true);
    };

    const handleDeleteAccount = async (account: Account) => {
        if (account.transaction_count > 0) {
            toast.error('Cannot delete account with transactions');
            return;
        }

        if (!confirm(`Are you sure you want to delete account "${account.name}"?`)) {
            return;
        }

        try {
            await api.delete(`/api/finance/accounts/${account.id}/`);
            toast.success('Account deleted successfully');
            fetchAccounts();
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Failed to delete account');
        }
    };

    const navigate = useNavigate();

    const handleViewDetails = async (account: Account) => {
        setSelectedAccount(account);
        setShowDetails(true);

        try {
            const resp = await api.get(`/api/finance/accounts/${account.id}/transactions/`);
            setAccountTransactions(resp.data.results || resp.data || []);
        } catch (err) {
            console.error('Failed to fetch transactions for account', account.id, err);
            setAccountTransactions([]);
        }
    };

    const handleSubmitForm = async (data: any) => {
        try {
            if (selectedAccount) {
                await api.patch(`/api/finance/accounts/${selectedAccount.id}/`, data);
                toast.success('Account updated successfully');
            } else {
                await api.post('/api/finance/accounts/', data);
                toast.success('Account created successfully');
            }
            setShowForm(false);
            fetchAccounts();
        } catch (error: any) {
            console.error('Error saving account:', error);
            toast.error(error.response?.data?.message || 'Failed to save account');
        }
    };

    const handleImportTemplate = async (templateName: string) => {
        try {
            await api.post('/api/finance/accounts/import_template/', { template_name: templateName });
            toast.success('Template imported successfully');
            setShowTemplateModal(false);
            fetchAccounts();
        } catch (error) {
            console.error('Error importing template:', error);
            toast.error('Failed to import template');
        }
    };

    const handleExport = () => {
        // Export accounts to CSV
        const csv = convertToCSV(accounts);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chart-of-accounts-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const convertToCSV = (accounts: Account[], level = 0): string => {
        let csv = level === 0 ? 'Code,Name,Type,Balance,Dr/Cr,Status,Transactions\n' : '';

        accounts.forEach((acc) => {
            csv += `${acc.code},"${acc.name}",${acc.account_type},${acc.balance},${acc.is_debit ? 'Dr' : 'Cr'},${acc.is_active ? 'Active' : 'Inactive'},${acc.transaction_count}\n`;
            if (acc.children && acc.children.length > 0) {
                csv += convertToCSV(acc.children, level + 1);
            }
        });

        return csv;
    };

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
                    <h1 className="text-2xl font-bold text-gray-800">Chart of Accounts</h1>
                    <p className="text-gray-600 mt-1">Manage your account hierarchy and structure</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowTemplateModal(true)}
                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <Upload size={18} />
                        Import Template
                    </button>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    <button
                        onClick={handleAddAccount}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by code or name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Types</option>
                            <option value="ASSET">Assets</option>
                            <option value="LIABILITY">Liabilities</option>
                            <option value="EQUITY">Equity</option>
                            <option value="INCOME">Income</option>
                            <option value="EXPENSE">Expenses</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="ACTIVE">Active Only</option>
                            <option value="INACTIVE">Inactive Only</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Account Tree */}
            {filteredAccounts.length > 0 ? (
                <AccountTree
                    accounts={filteredAccounts}
                    onEdit={handleEditAccount}
                    onDelete={handleDeleteAccount}
                    onViewDetails={handleViewDetails}
                />
            ) : (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <p className="text-gray-500">No accounts found. Add your first account or import a template.</p>
                </div>
            )}

            {/* Account Form Modal */}
            {showForm && (
                <AccountForm
                    account={selectedAccount as any}
                    accounts={accounts}
                    onSubmit={handleSubmitForm}
                    onClose={() => setShowForm(false)}
                />
            )}

            {/* Account Details Modal */}
            {showDetails && selectedAccount && (
                <AccountDetails
                    account={selectedAccount as any}
                    transactions={accountTransactions}
                    onClose={() => setShowDetails(false)}
                    onViewLedger={() => {
                        // Navigate to ledger / finance report for this account
                        navigate(`/finance/ledger?account=${selectedAccount?.id}`);
                    }}
                />
            )}

            {/* Template Import Modal */}
            {showTemplateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Import Chart of Accounts Template</h2>
                        <p className="text-gray-600 mb-6">Choose a pre-configured template to get started quickly:</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => handleImportTemplate('educational_institution')}
                                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <h3 className="font-semibold text-gray-800">Educational Institution</h3>
                                <p className="text-sm text-gray-600 mt-1">Standard accounts for schools and colleges</p>
                            </button>

                            <button
                                onClick={() => handleImportTemplate('small_business')}
                                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <h3 className="font-semibold text-gray-800">Small Business</h3>
                                <p className="text-sm text-gray-600 mt-1">General business accounting structure</p>
                            </button>

                            <button
                                onClick={() => handleImportTemplate('non_profit')}
                                className="w-full p-4 text-left border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
                            >
                                <h3 className="font-semibold text-gray-800">Non-Profit Organization</h3>
                                <p className="text-sm text-gray-600 mt-1">Accounts for NGOs and trusts</p>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowTemplateModal(false)}
                            className="w-full mt-6 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccounts;
