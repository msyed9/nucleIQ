import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const MovementReport: React.FC = () => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        to: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchMovements();
    }, [dateRange]);

    const fetchMovements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory/transactions/');
            const data = response.data.results || response.data;
            
            // Filter by date range
            const filtered = data.filter((txn: any) => {
                const txnDate = new Date(txn.transaction_date).toISOString().split('T')[0];
                return txnDate >= dateRange.from && txnDate <= dateRange.to;
            });
            
            setTransactions(filtered);
        } catch (error) {
            console.error('Error fetching movements:', error);
            toast.error('Failed to load movement report');
        } finally {
            setLoading(false);
        }
    };

    const handleDateChange = (field: 'from' | 'to', value: string) => {
        setDateRange(prev => ({ ...prev, [field]: value }));
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    const totalIn = transactions.filter(t => t.quantity > 0).reduce((sum, t) => sum + t.quantity, 0);
    const totalOut = transactions.filter(t => t.quantity < 0).reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={dateRange.from}
                        onChange={(e) => handleDateChange('from', e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={dateRange.to}
                        onChange={(e) => handleDateChange('to', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-green-700">Total Stock In</h4>
                    <p className="text-2xl font-bold text-green-600 mt-2">+{totalIn}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-red-700">Total Stock Out</h4>
                    <p className="text-2xl font-bold text-red-600 mt-2">-{totalOut}</p>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {transactions.map((txn, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(txn.transaction_date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {txn.item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {txn.transaction_type}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                    txn.quantity > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {txn.reference || '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MovementReport;
