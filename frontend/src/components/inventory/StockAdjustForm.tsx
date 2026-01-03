import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface StockAdjustFormProps {
    onClose: () => void;
}

const StockAdjustForm: React.FC<StockAdjustFormProps> = ({ onClose }) => {
    const [items, setItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        item: '',
        physical_count: 0,
        reason: '',
        approved_by: '',
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
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'physical_count' ? parseFloat(value) || 0 : value
        }));
    };

    const handleItemChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const itemId = e.target.value;
        setFormData(prev => ({ ...prev, item: itemId }));
        const item = items.find(i => i.id === Number(itemId));
        setSelectedItem(item);
    };

    const getDifference = () => {
        if (!selectedItem) return 0;
        return formData.physical_count - selectedItem.current_stock;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const difference = getDifference();

        try {
            await api.post('/api/inventory/transactions/', {
                item: formData.item,
                transaction_type: 'ADJUST',
                quantity: difference,
                reference: 'Stock Adjustment',
                notes: `Reason: ${formData.reason}. Approved by: ${formData.approved_by}. ${formData.notes}`,
                transaction_date: formData.transaction_date
            });
            toast.success('Stock adjusted successfully');
            onClose();
        } catch (error: any) {
            console.error('Error recording adjustment:', error);
            toast.error(error.response?.data?.message || 'Failed to record adjustment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="bg-purple-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h2 className="text-xl font-bold"> Stock Adjustment</h2>
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Select Item</option>
                                {items.map(item => (
                                    <option key={item.id} value={item.id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Current Stock (System)
                            </label>
                            <input
                                type="number"
                                value={selectedItem?.current_stock || 0}
                                disabled
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Physical Count *
                            </label>
                            <input
                                type="number"
                                name="physical_count"
                                value={formData.physical_count}
                                onChange={handleChange}
                                min="0"
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Difference
                            </label>
                            <input
                                type="number"
                                value={getDifference()}
                                disabled
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 ${
                                    getDifference() > 0 ? 'text-green-600' :
                                    getDifference() < 0 ? 'text-red-600' : 'text-gray-600'
                                } font-semibold`}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason for Difference *
                        </label>
                        <select
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">Select Reason</option>
                            <option value="Damaged">Damaged</option>
                            <option value="Expired">Expired</option>
                            <option value="Lost">Lost</option>
                            <option value="Stolen">Stolen</option>
                            <option value="Counting Error">Counting Error</option>
                            <option value="Physical Verification">Physical Verification</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Approved By
                            </label>
                            <input
                                type="text"
                                name="approved_by"
                                value={formData.approved_by}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {Math.abs(getDifference()) > 10 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <p className="text-sm text-yellow-800">
                                 <strong>Warning:</strong> Large variance detected. Approval may be required.
                            </p>
                        </div>
                    )}

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
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Saving...' : 'Record Adjustment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustForm;
