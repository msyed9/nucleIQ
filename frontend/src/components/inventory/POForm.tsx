import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface POFormProps {
    onClose: () => void;
}

interface LineItem {
    item: string;
    quantity: number;
    unit_price: number;
}

const POForm: React.FC<POFormProps> = ({ onClose }) => {
    const [vendors, setVendors] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        vendor: '',
        delivery_date: '',
        payment_terms: '',
        reference: '',
        notes: ''
    });
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { item: '', quantity: 0, unit_price: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchVendors();
        fetchItems();
    }, []);

    const fetchVendors = async () => {
        try {
            const response = await api.get('/api/inventory/vendors/');
            setVendors(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

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
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems];
        updated[index] = { ...updated[index], [field]: value };
        setLineItems(updated);
    };

    const addLineItem = () => {
        setLineItems([...lineItems, { item: '', quantity: 0, unit_price: 0 }]);
    };

    const removeLineItem = (index: number) => {
        if (lineItems.length === 1) {
            toast.error('At least one item is required');
            return;
        }
        const updated = lineItems.filter((_, i) => i !== index);
        setLineItems(updated);
    };

    const calculateTotal = () => {
        return lineItems.reduce((total, line) => {
            return total + (line.quantity * line.unit_price);
        }, 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate line items
        const hasEmptyItems = lineItems.some(line => !line.item || line.quantity <= 0 || line.unit_price < 0);
        if (hasEmptyItems) {
            toast.error('Please fill all line items properly');
            return;
        }

        setLoading(true);

        try {
            const payload = {
                vendor: formData.vendor,
                delivery_date: formData.delivery_date,
                payment_terms: formData.payment_terms,
                reference: formData.reference,
                notes: formData.notes,
                items: lineItems.map(line => ({
                    item: line.item,
                    quantity: line.quantity,
                    unit_price: line.unit_price,
                    subtotal: line.quantity * line.unit_price
                })),
                total_amount: calculateTotal(),
                status: 'PENDING'
            };

            await api.post('/api/inventory/orders/', payload);
            toast.success('Purchase Order created successfully');
            onClose();
        } catch (error: any) {
            console.error('Error creating PO:', error);
            toast.error(error.response?.data?.message || 'Failed to create PO');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <h2 className="text-xl font-bold"> Create Purchase Order</h2>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Vendor & Delivery Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Vendor *
                                </label>
                                <select
                                    name="vendor"
                                    value={formData.vendor}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="">Select Vendor</option>
                                    {vendors.map(vendor => (
                                        <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Expected Delivery Date
                                </label>
                                <input
                                    type="date"
                                    name="delivery_date"
                                    value={formData.delivery_date}
                                    onChange={handleChange}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Terms
                                </label>
                                <input
                                    type="text"
                                    name="payment_terms"
                                    value={formData.payment_terms}
                                    onChange={handleChange}
                                    placeholder="e.g., Net 30"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reference/Requisition Number
                                </label>
                                <input
                                    type="text"
                                    name="reference"
                                    value={formData.reference}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-800">Order Items</h3>
                            <button
                                type="button"
                                onClick={addLineItem}
                                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Plus size={18} />
                                Add Item
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Item</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantity</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lineItems.map((line, index) => (
                                        <tr key={index} className="border-b">
                                            <td className="px-4 py-2">
                                                <select
                                                    value={line.item}
                                                    onChange={(e) => handleLineItemChange(index, 'item', e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">Select Item</option>
                                                    {items.map(item => (
                                                        <option key={item.id} value={item.id}>{item.name}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={line.quantity}
                                                    onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                                    min="1"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    value={line.unit_price}
                                                    onChange={(e) => handleLineItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                                    min="0"
                                                    step="0.01"
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="px-4 py-2 font-semibold">
                                                {(line.quantity * line.unit_price).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <button
                                                    type="button"
                                                    onClick={() => removeLineItem(index)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-right font-semibold">Grand Total:</td>
                                        <td className="px-4 py-3 font-bold text-lg text-blue-600">
                                            {calculateTotal().toFixed(2)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Notes
                        </label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    {/* Actions */}
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
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? 'Creating...' : 'Create Purchase Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default POForm;
