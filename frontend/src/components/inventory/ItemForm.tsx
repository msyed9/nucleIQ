import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface ItemFormProps {
    item: any | null;
    categories: any[];
    onClose: () => void;
}

const ItemForm: React.FC<ItemFormProps> = ({ item, categories, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        category: '',
        description: '',
        current_stock: 0,
        low_stock_threshold: 10,
        price: 0,
        cost_price: 0,
        is_sellable: false,
        image: null as File | null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (item) {
            setFormData({
                name: item.name || '',
                sku: item.sku || '',
                category: item.category?.id || '',
                description: item.description || '',
                current_stock: item.current_stock || 0,
                low_stock_threshold: item.low_stock_threshold || 10,
                price: item.price || 0,
                cost_price: item.cost_price || 0,
                is_sellable: item.is_sellable || false,
                image: null
            });
        }
    }, [item]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    type === 'number' ? parseFloat(value) || 0 : value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, image: e.target.files![0] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'image' && formData.image) {
                    data.append(key, formData.image);
                } else if (key !== 'image') {
                    data.append(key, String(formData[key as keyof typeof formData]));
                }
            });

            if (item) {
                await api.patch(`/api/inventory/items/${item.id}/`, data);
                toast.success('Item updated successfully');
            } else {
                await api.post('/api/inventory/items/', data);
                toast.success('Item created successfully');
            }
            onClose();
        } catch (error: any) {
            console.error('Error saving item:', error);
            toast.error(error.response?.data?.message || 'Failed to save item');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        {item ? 'Edit Item' : 'Add New Item'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    SKU/Item Code
                                </label>
                                <input
                                    type="text"
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stock Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Stock
                                </label>
                                <input
                                    type="number"
                                    name="current_stock"
                                    value={formData.current_stock}
                                    onChange={handleChange}
                                    min="0"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Stock Level *
                                </label>
                                <input
                                    type="number"
                                    name="low_stock_threshold"
                                    value={formData.low_stock_threshold}
                                    onChange={handleChange}
                                    min="0"
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pricing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Cost Price ()
                                </label>
                                <input
                                    type="number"
                                    name="cost_price"
                                    value={formData.cost_price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Selling Price ()
                                </label>
                                <input
                                    type="number"
                                    name="price"
                                    value={formData.price}
                                    onChange={handleChange}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Options */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Options</h3>
                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_sellable"
                                    checked={formData.is_sellable}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label className="ml-2 block text-sm text-gray-700">
                                    Available in Parent Store
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Image
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ItemForm;
