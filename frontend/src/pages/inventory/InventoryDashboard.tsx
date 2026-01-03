import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface DashboardStats {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
    pendingOrders: number;
}

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    current_stock: number;
    low_stock_threshold: number;
    cost_price: number;
}

export const InventoryDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats>({
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        pendingOrders: 0
    });
    const [loading, setLoading] = useState(true);
    const [lowStockItems, setLowStockItems] = useState<InventoryItem[]>([]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [itemsRes, ordersRes] = await Promise.all([
                api.get('/api/inventory/items/'),
                api.get('/api/inventory/orders/')
            ]);

            const items = itemsRes.data.results || itemsRes.data;
            const orders = ordersRes.data.results || ordersRes.data;

            const lowStock = items.filter((item: InventoryItem) =>
                item.current_stock > 0 && item.current_stock <= item.low_stock_threshold
            );
            const outOfStock = items.filter((item: InventoryItem) => item.current_stock === 0);
            const totalValue = items.reduce((sum: number, item: InventoryItem) =>
                sum + (item.current_stock * Number(item.cost_price)), 0
            );
            const pending = orders.filter((order: any) =>
                order.status === 'PENDING' || order.status === 'PAID'
            );

            setStats({
                totalItems: items.length,
                lowStockItems: lowStock.length,
                outOfStockItems: outOfStock.length,
                totalValue: totalValue,
                pendingOrders: pending.length
            });

            setLowStockItems(lowStock);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800"> Inventory Dashboard</h1>
                    <p className="text-gray-600 mt-1">Overview of your inventory status</p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {/* Total Items */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <Package size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Total Items</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalItems}</p>
                </div>

                {/* Low Stock */}
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Low Stock Items</h3>
                    <p className="text-3xl font-bold mt-2">{stats.lowStockItems}</p>
                </div>

                {/* Out of Stock */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Out of Stock</h3>
                    <p className="text-3xl font-bold mt-2">{stats.outOfStockItems}</p>
                </div>

                {/* Total Value */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Total Inventory Value</h3>
                    <p className="text-3xl font-bold mt-2">{stats.totalValue.toLocaleString('en-IN')}</p>
                </div>

                {/* Pending Orders */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                            <ShoppingCart size={24} />
                        </div>
                    </div>
                    <h3 className="text-sm font-medium opacity-90">Pending Orders</h3>
                    <p className="text-3xl font-bold mt-2">{stats.pendingOrders}</p>
                </div>
            </div>

            {/* Low Stock Alerts */}
            {lowStockItems.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4"> Low Stock Alerts</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {lowStockItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">{item.current_stock}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.low_stock_threshold}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                                Reorder
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryDashboard;
