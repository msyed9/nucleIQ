import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface StockInFormProps {
    onClose: () => void;
}

const StockInForm: React.FC<StockInFormProps> = ({ onClose }) => {
    const [items, setItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        item: '',
        quantity: 0,
        unit_price: 0,
        from_location: '',
        reference: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/inventory/items/');
            setItems(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching items:', error);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: ['quantity', 'unit_price'].includes(name) ? parseFloat(value) || 0 : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/api/inventory/transactions/', {
                item: formData.item,
                transaction_type: 'GRN',
                quantity: formData.quantity,
                unit_price: formData.unit_price,
                reference: formData.reference,
                notes: formData.notes,
                transaction_date: formData.transaction_date
            });
            toast.success('Stock received successfully');
            onClose();
        } catch (error: any) {
            console.error('Error recording stock in:', error);
            toast.error(error.response?.data?.message || 'Failed to record stock in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h2 className="text-xl font-bold"> Stock In / Goods Receipt</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item *
                            </label>
                            <select
                                name="item"
                                value={formData.item}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            >
                                <option value="">Select Item</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Quantity *
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                min="1"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Unit Price ()
                            </label>
                            <input
                                type="number"
                                name="unit_price"
                                value={formData.unit_price}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                From (Supplier/Location)
                            </label>
                            <input
                                type="text"
                                name="from_location"
                                value={formData.from_location}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                PO/Invoice Number
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Date
                            </label>
                            <input
                                type="date"
                                name="transaction_date"
                                value={formData.transaction_date}
                                onChange={handleChange}
                                max={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
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
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : 'Record Stock In'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockInForm;
