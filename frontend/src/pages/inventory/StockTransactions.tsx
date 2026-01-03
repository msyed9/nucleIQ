import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import StockInForm from '../../components/inventory/StockInForm';
import StockOutForm from '../../components/inventory/StockOutForm';
import StockAdjustForm from '../../components/inventory/StockAdjustForm';

interface Transaction {
    id: number;
    item: { id: number; name: string };
    transaction_type: string;
    quantity: number;
    unit_price: number;
    reference: string;
    notes: string;
    transaction_date: string;
    performed_by: { id: number; name: string };
}

export const StockTransactions: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [transactionType, setTransactionType] = useState('ALL');
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState<'IN' | 'OUT' | 'ADJUST' | null>(null);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory/transactions/');
            setTransactions(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            toast.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenForm = (type: 'IN' | 'OUT' | 'ADJUST') => {
        setFormType(type);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setFormType(null);
        fetchTransactions();
    };

    const getTransactionTypeLabel = (type: string) => {
        const types: { [key: string]: string } = {
            'GRN': 'Goods Received',
            'ISSUE': 'Issued',
            'SALE': 'Sale',
            'ADJUST': 'Adjustment',
            'RETURN': 'Return'
        };
        return types[type] || type;
    };

    const filteredTransactions = transactions.filter(txn => {
        const matchesSearch = txn.item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            txn.reference.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = transactionType === 'ALL' || txn.transaction_type === transactionType;
        return matchesSearch && matchesType;
    });

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
                    <h1 className="text-2xl font-bold text-gray-800"> Stock Transactions</h1>
                    <p className="text-gray-600 mt-1">Track all inventory movements</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleOpenForm('IN')}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <TrendingUp size={20} />
                        Stock In
                    </button>
                    <button
                        onClick={() => handleOpenForm('OUT')}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                        <TrendingDown size={20} />
                        Stock Out
                    </button>
                    <button
                        onClick={() => handleOpenForm('ADJUST')}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                        <Plus size={20} />
                        Adjustment
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search transactions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={transactionType}
                        onChange={(e) => setTransactionType(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Types</option>
                        <option value="GRN">Goods Received</option>
                        <option value="ISSUE">Issued</option>
                        <option value="SALE">Sale</option>
                        <option value="ADJUST">Adjustment</option>
                        <option value="RETURN">Return</option>
                    </select>
                    <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reference</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTransactions.map((txn) => (
                                <tr key={txn.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(txn.transaction_date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {txn.item.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            txn.transaction_type === 'GRN' ? 'bg-green-100 text-green-800' :
                                            txn.transaction_type === 'ISSUE' || txn.transaction_type === 'SALE' ? 'bg-orange-100 text-orange-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {getTransactionTypeLabel(txn.transaction_type)}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                        txn.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {Number(txn.unit_price || 0).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {txn.reference || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {txn.notes || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {txn.performed_by?.name || 'System'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Forms */}
            {showForm && formType === 'IN' && <StockInForm onClose={handleCloseForm} />}
            {showForm && formType === 'OUT' && <StockOutForm onClose={handleCloseForm} />}
            {showForm && formType === 'ADJUST' && <StockAdjustForm onClose={handleCloseForm} />}
        </div>
    );
};

export default StockTransactions;
