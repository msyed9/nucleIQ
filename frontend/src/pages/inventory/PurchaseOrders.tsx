import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Eye, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import POForm from '../../components/inventory/POForm';
import GoodsReceipt from '../../components/inventory/GoodsReceipt';

interface PurchaseOrder {
    id: number;
    order_number: string;
    vendor: { id: number; name: string };
    total_amount: number;
    status: string;
    ordered_at: string;
    delivery_date: string;
}

export const PurchaseOrders: React.FC = () => {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [showPOForm, setShowPOForm] = useState(false);
    const [showGRN, setShowGRN] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory/orders/');
            setOrders(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching orders:', error);
            toast.error('Failed to load purchase orders');
        } finally {
            setLoading(false);
        }
    };

    const handleReceiveStock = (order: PurchaseOrder) => {
        setSelectedPO(order);
        setShowGRN(true);
    };

    const handleCancelOrder = async (orderId: number) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;

        try {
            await api.post(`/api/inventory/orders/${orderId}/cancel/`, {
                reason: 'Cancelled by user'
            });
            toast.success('Order cancelled successfully');
            fetchOrders();
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: { [key: string]: { class: string; label: string } } = {
            'DRAFT': { class: 'bg-gray-100 text-gray-800', label: 'Draft' },
            'PENDING_APPROVAL': { class: 'bg-yellow-100 text-yellow-800', label: 'Pending Approval' },
            'APPROVED': { class: 'bg-blue-100 text-blue-800', label: 'Approved' },
            'ORDERED': { class: 'bg-purple-100 text-purple-800', label: 'Ordered' },
            'PARTIALLY_RECEIVED': { class: 'bg-orange-100 text-orange-800', label: 'Partially Received' },
            'RECEIVED': { class: 'bg-green-100 text-green-800', label: 'Received' },
            'CANCELLED': { class: 'bg-red-100 text-red-800', label: 'Cancelled' },
            'PENDING': { class: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
            'PAID': { class: 'bg-blue-100 text-blue-800', label: 'Paid' },
        };
        const config = statusConfig[status] || { class: 'bg-gray-100 text-gray-800', label: status };
        return (
            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${config.class}`}>
                {config.label}
            </span>
        );
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.vendor?.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
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
                    <h1 className="text-2xl font-bold text-gray-800"> Purchase Orders</h1>
                    <p className="text-gray-600 mt-1">Manage procurement and stock receipts</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowPOForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus size={20} />
                        Create PO
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                        <Download size={20} />
                        Export
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by PO number or vendor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="ALL">All Status</option>
                        <option value="DRAFT">Draft</option>
                        <option value="PENDING">Pending</option>
                        <option value="APPROVED">Approved</option>
                        <option value="PAID">Paid</option>
                        <option value="RECEIVED">Received</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>
                    <div className="text-gray-600 flex items-center justify-end">
                        {filteredOrders.length} orders found
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {order.order_number}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(order.ordered_at).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {order.vendor?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {Number(order.total_amount).toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex gap-2">
                                            <button
                                                className="text-blue-600 hover:text-blue-900"
                                                title="View"
                                            >
                                                <Eye size={18} />
                                            </button>
                                            {(order.status === 'PAID' || order.status === 'APPROVED') && (
                                                <button
                                                    onClick={() => handleReceiveStock(order)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Receive Stock"
                                                >
                                                    <CheckCircle size={18} />
                                                </button>
                                            )}
                                            {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
                                                <button
                                                    onClick={() => handleCancelOrder(order.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                    title="Cancel"
                                                >
                                                    <XCircle size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* PO Form Modal */}
            {showPOForm && (
                <POForm
                    onClose={() => {
                        setShowPOForm(false);
                        fetchOrders();
                    }}
                />
            )}

            {/* GRN Modal */}
            {showGRN && selectedPO && (
                <GoodsReceipt
                    purchaseOrder={selectedPO}
                    onClose={() => {
                        setShowGRN(false);
                        setSelectedPO(null);
                        fetchOrders();
                    }}
                />
            )}
        </div>
    );
};

export default PurchaseOrders;
