import React, { useState, useEffect } from 'react';
import { Plus, Download, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StatementUpload from '../../components/finance/StatementUpload';
import ReconciliationMatch from '../../components/finance/ReconciliationMatch';

interface BankAccount {
    id: number;
    account_name: string;
    account_number: string;
    bank_name: string;
    balance: number;
}

interface Transaction {
    id: number;
    date: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    matched: boolean;
}

interface ReconciliationSummary {
    bank_balance: number;
    book_balance: number;
    outstanding_deposits: number;
    outstanding_withdrawals: number;
    bank_charges: number;
    reconciled_balance: number;
}

export const BankReconciliation: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
    const [bankTransactions, setBankTransactions] = useState<Transaction[]>([]);
    const [bookTransactions, setBookTransactions] = useState<Transaction[]>([]);
    const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [showAddAccount, setShowAddAccount] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            fetchTransactions();
        }
    }, [selectedAccount]);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/finance/bank-accounts/');
            setAccounts(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
            toast.error('Failed to load bank accounts');
        } finally {
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const response = await api.get(`/api/finance/bank-reconciliation/${selectedAccount}/transactions/`);
            setBankTransactions(response.data.bank_transactions || []);
            setBookTransactions(response.data.book_transactions || []);
            setSummary(response.data.summary || null);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
        }
    };

    const handleUploadStatement = async (file: File, mapping: any) => {
        if (!selectedAccount) return;

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('mapping', JSON.stringify(mapping));

            await api.post(`/api/finance/bank-reconciliation/${selectedAccount}/upload_statement/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Statement uploaded successfully');
            fetchTransactions();
        } catch (error) {
            console.error('Error uploading statement:', error);
            toast.error('Failed to upload statement');
        }
    };

    const handleMatchTransactions = async (bankId: number, bookId: number) => {
        try {
            await api.post(`/api/finance/bank-reconciliation/${selectedAccount}/match/`, {
                bank_transaction_id: bankId,
                book_transaction_id: bookId
            });

            toast.success('Transactions matched successfully');
            fetchTransactions();
        } catch (error) {
            console.error('Error matching transactions:', error);
            toast.error('Failed to match transactions');
        }
    };

    const handleAutoMatch = async () => {
        try {
            await api.post(`/api/finance/bank-reconciliation/${selectedAccount}/auto_match/`);
            toast.success('Auto-matching completed');
            fetchTransactions();
        } catch (error) {
            console.error('Error auto-matching:', error);
            toast.error('Failed to auto-match transactions');
        }
    };

    const handleDownloadReport = () => {
        toast('Downloading reconciliation report...', { icon: 'ℹ️' });
        // Download logic would go here
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
                    <h1 className="text-2xl font-bold text-gray-800">Bank Reconciliation</h1>
                    <p className="text-gray-600 mt-1">Reconcile bank statements with book entries</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleDownloadReport}
                        disabled={!selectedAccount}
                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Download size={18} />
                        Download Report
                    </button>
                    <button
                        onClick={() => setShowAddAccount(true)}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add Bank Account
                    </button>
                </div>
            </div>

            {/* Bank Account Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Bank Account</label>
                <select
                    value={selectedAccount || ''}
                    onChange={(e) => setSelectedAccount(Number(e.target.value))}
                    className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">Choose a bank account</option>
                    {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                            {account.bank_name} - {account.account_number} (Balance: ₹{account.balance.toLocaleString('en-IN')})
                        </option>
                    ))}
                </select>
            </div>

            {selectedAccount && (
                <>
                    {/* Reconciliation Summary */}
                    {summary && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">Reconciliation Summary</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Balance as per Bank</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            ₹{summary.bank_balance.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Balance as per Books</span>
                                        <span className="text-sm font-medium text-gray-800">
                                            ₹{summary.book_balance.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Outstanding Deposits</span>
                                        <span className="text-sm font-medium text-green-600">
                                            +₹{summary.outstanding_deposits.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-gray-600">Outstanding Withdrawals</span>
                                        <span className="text-sm font-medium text-red-600">
                                            -₹{summary.outstanding_withdrawals.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-blue-600 font-medium">Reconciled Balance</p>
                                            <p className="text-2xl font-bold text-blue-700 mt-1">
                                                ₹{summary.reconciled_balance.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <CheckCircle className="text-blue-600" size={24} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Upload Statement */}
                    <StatementUpload onUpload={handleUploadStatement} />

                    {/* Match Transactions */}
                    <ReconciliationMatch
                        bankTransactions={bankTransactions}
                        bookTransactions={bookTransactions}
                        onMatch={handleMatchTransactions}
                        onAutoMatch={handleAutoMatch}
                    />
                </>
            )}
        </div>
    );
};

export default BankReconciliation;