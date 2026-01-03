import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const StockSummary: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalValue, setTotalValue] = useState(0);

    useEffect(() => {
        fetchStockSummary();
    }, []);

    const fetchStockSummary = async () => {
        try {
            const response = await api.get('/api/inventory/items/');
            const data = response.data.results || response.data;
            setItems(data);
            
            const value = data.reduce((sum: number, item: any) => 
                sum + (item.current_stock * Number(item.cost_price)), 0
            );
            setTotalValue(value);
        } catch (error) {
            console.error('Error fetching stock summary:', error);
            toast.error('Failed to load stock summary');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Total Inventory Value</h3>
                <p className="text-3xl font-bold text-blue-600">{totalValue.toLocaleString('en-IN')}</p>
                <p className="text-sm text-blue-700 mt-1">Based on current stock and cost price</p>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map(item => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {item.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.category?.name || 'Uncategorized'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {item.current_stock}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {Number(item.cost_price).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                    {(item.current_stock * Number(item.cost_price)).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockSummary;
