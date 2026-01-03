import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface StockOutFormProps {
    onClose: () => void;
}

const StockOutForm: React.FC<StockOutFormProps> = ({ onClose }) => {
    const [items, setItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        item: '',
        quantity: 0,
        issued_to: '',
        purpose: '',
        reference: '',
        return_expected: false,
        return_date: '',
        notes: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });
    const [loading, setLoading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

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
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked :
                    name === 'quantity' ? parseFloat(value) || 0 : value
        }));
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const itemId = e.target.value;
        setFormData(prev => ({ ...prev, item: itemId }));
        const item = items.find(i => i.id === Number(itemId));
        setSelectedItem(item);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (selectedItem && formData.quantity > selectedItem.current_stock) {
            toast.error(`Cannot issue ${formData.quantity}. Only ${selectedItem.current_stock} available in stock.`);
            return;
        }

        setLoading(true);

        try {
            await api.post('/api/inventory/transactions/', {
                item: formData.item,
                transaction_type: 'ISSUE',
                quantity: -Math.abs(formData.quantity),
                reference: formData.reference,
                notes: `Issued to: ${formData.issued_to}. Purpose: ${formData.purpose}. ${formData.notes}`,
                transaction_date: formData.transaction_date
            });
            toast.success('Stock issued successfully');
            onClose();
        } catch (error: any) {
            console.error('Error recording stock out:', error);
            toast.error(error.response?.data?.message || 'Failed to record stock out');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="bg-orange-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h2 className="text-xl font-bold"> Stock Out / Issue</h2>
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
                                onChange={handleItemChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                                <option value="">Select Item</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} (Stock: {item.current_stock})
                                    </option>
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
                                max={selectedItem?.current_stock || undefined}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                            {selectedItem && (
                                <p className="text-sm text-gray-500 mt-1">
                                    Available: {selectedItem.current_stock}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Issued To *
                            </label>
                            <input
                                type="text"
                                name="issued_to"
                                value={formData.issued_to}
                                onChange={handleChange}
                                required
                                placeholder="Department/Person"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purpose/Reason
                            </label>
                            <input
                                type="text"
                                name="purpose"
                                value={formData.purpose}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Requisition Number
                            </label>
                            <input
                                type="text"
                                name="reference"
                                value={formData.reference}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="return_expected"
                            checked={formData.return_expected}
                            onChange={handleChange}
                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Return Expected
                        </label>
                    </div>

                    {formData.return_expected && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expected Return Date
                            </label>
                            <input
                                type="date"
                                name="return_date"
                                value={formData.return_date}
                                onChange={handleChange}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
                            className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : 'Issue Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockOutForm;
