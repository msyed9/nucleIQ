import React, { useState, useEffect } from 'react';
import { X, Save, Package } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface GoodsReceiptProps {
    purchaseOrder: any;
    onClose: () => void;
}

interface ReceiptItem {
    item_id: number;
    item_name: string;
    ordered_qty: number;
    received_qty: number;
    receiving_now: number;
}

const GoodsReceipt: React.FC<GoodsReceiptProps> = ({ purchaseOrder, onClose }) => {
    const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        fetchOrderItems();
    }, []);

    const fetchOrderItems = async () => {
        try {
            const response = await api.get(`/api/inventory/orders/${purchaseOrder.id}/`);
            const orderData = response.data;
            
            const items = orderData.order_items?.map((item: any) => ({
                item_id: item.item.id || item.item,
                item_name: item.item.name || 'Item',
                ordered_qty: item.quantity,
                received_qty: 0,
                receiving_now: item.quantity
            })) || [];

            setReceiptItems(items);
        } catch (error) {
            console.error('Error fetching order items:', error);
            toast.error('Failed to load order items');
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (index: number, value: number) => {
        const updated = [...receiptItems];
        updated[index].receiving_now = Math.max(0, Math.min(value, updated[index].ordered_qty - updated[index].received_qty));
        setReceiptItems(updated);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Create stock transactions for each received item
            const transactions = receiptItems
                .filter(item => item.receiving_now > 0)
                .map(item => ({
                    item: item.item_id,
                    transaction_type: 'GRN',
                    quantity: item.receiving_now,
                    reference: purchaseOrder.order_number,
                    notes: notes,
                    transaction_date: new Date().toISOString()
                }));

            // Create all transactions
            await Promise.all(
                transactions.map(txn => api.post('/api/inventory/transactions/', txn))
            );

            // Update PO status
            const allReceived = receiptItems.every(item => 
                item.receiving_now + item.received_qty === item.ordered_qty
            );
            const newStatus = allReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
            
            await api.patch(`/api/inventory/orders/${purchaseOrder.id}/`, {
                status: newStatus
            });

            toast.success('Stock received successfully');
            onClose();
        } catch (error: any) {
            console.error('Error receiving stock:', error);
            toast.error(error.response?.data?.message || 'Failed to receive stock');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-green-600 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold"> Goods Receipt Note (GRN)</h2>
                        <p className="text-sm text-green-100">PO: {purchaseOrder.order_number}</p>
                    </div>
                    <button onClick={onClose} className="text-white hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">Order Information</h3>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-600">Vendor:</span>
                                <span className="ml-2 font-medium">{purchaseOrder.vendor?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Order Date:</span>
                                <span className="ml-2 font-medium">
                                    {new Date(purchaseOrder.ordered_at).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Receiving Items</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordered</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Already Received</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receiving Now</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pending</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {receiptItems.map((item, index) => {
                                        const pending = item.ordered_qty - item.received_qty - item.receiving_now;
                                        return (
                                            <tr key={index}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                    {item.item_name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.ordered_qty}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {item.received_qty}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="number"
                                                        value={item.receiving_now}
                                                        onChange={(e) => handleQuantityChange(index, parseFloat(e.target.value) || 0)}
                                                        min="0"
                                                        max={item.ordered_qty - item.received_qty}
                                                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </td>
                                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${
                                                    pending === 0 ? 'text-green-600' : 'text-orange-600'
                                                }`}>
                                                    {pending}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Receipt Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="Any notes about the delivery..."
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
                            disabled={loading || receiptItems.every(item => item.receiving_now === 0)}
                            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <Package size={20} />
                            {loading ? 'Processing...' : 'Receive Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default GoodsReceipt;
