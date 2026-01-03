import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const ABCAnalysis: React.FC = () => {
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [analysis, setAnalysis] = useState({ A: [] as any[], B: [] as any[], C: [] as any[] });

    useEffect(() => {
        performAnalysis();
    }, []);

    const performAnalysis = async () => {
        try {
            const response = await api.get('/api/inventory/items/');
            const data = response.data.results || response.data;
            
            // Calculate value for each item
            const withValues = data.map((item: any) => ({
                ...item,
                totalValue: item.current_stock * Number(item.cost_price)
            })).sort((a, b) => b.totalValue - a.totalValue);

            // Calculate cumulative percentages
            const totalValue = withValues.reduce((sum: number, item: any) => sum + item.totalValue, 0);
            let cumulative = 0;
            const withCumulative = withValues.map(item => {
                cumulative += item.totalValue;
                return {
                    ...item,
                    percentage: (item.totalValue / totalValue) * 100,
                    cumulativePercentage: (cumulative / totalValue) * 100
                };
            });

            // Classify A, B, C
            const A = withCumulative.filter(item => item.cumulativePercentage <= 80);
            const B = withCumulative.filter(item => item.cumulativePercentage > 80 && item.cumulativePercentage <= 95);
            const C = withCumulative.filter(item => item.cumulativePercentage > 95);

            setAnalysis({ A, B, C });
            setItems(withCumulative);
        } catch (error) {
            console.error('Error performing ABC analysis:', error);
            toast.error('Failed to load ABC analysis');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">ABC Classification Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                        <h4 className="text-sm font-medium text-gray-600">Category A (High Value)</h4>
                        <p className="text-2xl font-bold text-green-600 mt-2">{analysis.A.length} items</p>
                        <p className="text-xs text-gray-500 mt-1">~80% of total value</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-yellow-500">
                        <h4 className="text-sm font-medium text-gray-600">Category B (Medium Value)</h4>
                        <p className="text-2xl font-bold text-yellow-600 mt-2">{analysis.B.length} items</p>
                        <p className="text-xs text-gray-500 mt-1">~15% of total value</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border-l-4 border-gray-400">
                        <h4 className="text-sm font-medium text-gray-600">Category C (Low Value)</h4>
                        <p className="text-2xl font-bold text-gray-600 mt-2">{analysis.C.length} items</p>
                        <p className="text-xs text-gray-500 mt-1">~5% of total value</p>
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">% of Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cumulative %</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {items.map((item, index) => {
                            const category = item.cumulativePercentage <= 80 ? 'A' :
                                           item.cumulativePercentage <= 95 ? 'B' : 'C';
                            const categoryClass = category === 'A' ? 'bg-green-100 text-green-800' :
                                                category === 'B' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-gray-100 text-gray-800';
                            
                            return (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${categoryClass}`}>
                                            {category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {item.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.current_stock}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {item.totalValue.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.percentage.toFixed(2)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {item.cumulativePercentage.toFixed(2)}%
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ABCAnalysis;
