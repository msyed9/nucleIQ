import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Upload, Edit2, Trash2, Package } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import ItemForm from '../../components/inventory/ItemForm';

interface InventoryItem {
    id: number;
    name: string;
    sku: string;
    category: { id: number; name: string };
    current_stock: number;
    low_stock_threshold: number;
    price: number;
    cost_price: number;
    is_sellable: boolean;
}

interface Category {
    id: number;
    name: string;
}

export const ItemMaster: React.FC = () => {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [stockFilter, setStockFilter] = useState('ALL');
    const [showItemForm, setShowItemForm] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

    useEffect(() => {
        fetchItems();
        fetchCategories();
    }, []);

    const fetchItems = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory/items/');
            setItems(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
            toast.error('Failed to load items');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await api.get('/api/inventory/categories/');
            setCategories(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const handleDeleteItem = async (id: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await api.delete(`/api/inventory/items/${id}/`);
            toast.success('Item deleted successfully');
            fetchItems();
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('Failed to delete item');
        }
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setShowItemForm(true);
    };

    const handleCloseForm = () => {
        setShowItemForm(false);
        setEditingItem(null);
        fetchItems();
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.current_stock === 0) return 'out-of-stock';
        if (item.current_stock <= item.low_stock_threshold) return 'low-stock';
        return 'in-stock';
    };

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesCategory = !selectedCategory || item.category?.id === Number(selectedCategory);
        const matchesStock = stockFilter === 'ALL' ||
            (stockFilter === 'LOW' && getStockStatus(item) === 'low-stock') ||
            (stockFilter === 'OUT' && getStockStatus(item) === 'out-of-stock') ||
            (stockFilter === 'IN' && getStockStatus(item) === 'in-stock');

        return matchesSearch && matchesCategory && matchesStock;
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
                    <h1 className="text-2xl font-bold text-gray-800"> Item Master</h1>
                    <p className="text-gray-600 mt-1">Manage your inventory items</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowItemForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Add Item
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                        <Upload size={20} />
                        Bulk Import
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>
                    <select
                        value={stockFilter}
                        onChange={(e) => setStockFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Stock Levels</option>
                        <option value="IN">In Stock</option>
                        <option value="LOW">Low Stock</option>
                        <option value="OUT">Out of Stock</option>
                    </select>
                    <div className="text-gray-600 flex items-center">
                        <Package className="mr-2" size={20} />
                        {filteredItems.length} items found
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Code/SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Min Level</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.map((item) => {
                                const stockStatus = getStockStatus(item);
                                const totalValue = item.current_stock * Number(item.cost_price);

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.sku || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.category?.name || 'Uncategorized'}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                            stockStatus === 'out-of-stock' ? 'text-red-600' :
                                            stockStatus === 'low-stock' ? 'text-orange-600' :
                                            'text-green-600'
                                        }`}>
                                            {item.current_stock}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.low_stock_threshold}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{Number(item.cost_price).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{totalValue.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                stockStatus === 'out-of-stock' ? 'bg-red-100 text-red-800' :
                                                stockStatus === 'low-stock' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                                {stockStatus === 'out-of-stock' ? 'Out of Stock' :
                                                 stockStatus === 'low-stock' ? 'Low Stock' :
                                                 'In Stock'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditItem(item)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Item Form Modal */}
            {showItemForm && (
                <ItemForm
                    item={editingItem}
                    categories={categories}
                    onClose={handleCloseForm}
                />
            )}
        </div>
    );
};

export default ItemMaster;
