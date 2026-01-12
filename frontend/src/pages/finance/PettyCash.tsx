import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, Wallet, CheckCircle, XCircle, Clock, Upload, Eye } from 'lucide-react';
import api from '../../services/api';
import { openDownload } from '../../utils/downloadLink';
import { toast } from 'react-hot-toast';

interface PettyCashRequest {
    id: number;
    request_number: string;
    request_date: string;
    requested_by: number;
    requested_by_name: string;
    category: string;
    description: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    approved_by?: number;
    approved_by_name?: string;
    approved_at?: string;
    rejection_reason?: string;
    receipt_image?: string;
}

interface FormData {
    request_date: string;
    category: string;
    description: string;
    amount: string;
    receipt_image?: File | null;
}

const PettyCash: React.FC = () => {
    const [requests, setRequests] = useState<PettyCashRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PettyCashRequest | null>(null);
    const [formData, setFormData] = useState<FormData>({
        request_date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: '',
        receipt_image: null,
    });

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/finance/petty-cash/');
            setRequests(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching petty cash requests:', error);
            toast.error('Failed to load petty cash requests');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const submitData = new FormData();
            submitData.append('request_date', formData.request_date);
            submitData.append('category', formData.category);
            submitData.append('description', formData.description);
            submitData.append('amount', formData.amount);
            if (formData.receipt_image) {
                submitData.append('receipt_image', formData.receipt_image);
            }

            await api.post('/api/finance/petty-cash/', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Petty cash request created successfully');
            setShowForm(false);
            resetForm();
            fetchRequests();
        } catch (error: any) {
            console.error('Error creating request:', error);
            toast.error(error.response?.data?.detail || 'Failed to create request');
        }
    };

    const handleApprove = async (id: number) => {
        try {
            await api.post(`/api/finance/petty-cash/${id}/approve/`);
            toast.success('Request approved successfully');
            fetchRequests();
        } catch (error: any) {
            console.error('Error approving request:', error);
            toast.error(error.response?.data?.detail || 'Failed to approve request');
        }
    };

    const handleReject = async (id: number) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            await api.post(`/api/finance/petty-cash/${id}/reject/`, {
                rejection_reason: reason,
            });
            toast.success('Request rejected');
            fetchRequests();
        } catch (error: any) {
            console.error('Error rejecting request:', error);
            toast.error(error.response?.data?.detail || 'Failed to reject request');
        }
    };

    const handlePay = async (id: number) => {
        try {
            await api.post(`/api/finance/petty-cash/${id}/pay/`);
            toast.success('Payment processed successfully');
            fetchRequests();
        } catch (error: any) {
            console.error('Error processing payment:', error);
            toast.error(error.response?.data?.detail || 'Failed to process payment');
        }
    };

    const resetForm = () => {
        setFormData({
            request_date: new Date().toISOString().split('T')[0],
            category: '',
            description: '',
            amount: '',
            receipt_image: null,
        });
    };

    const filteredRequests = requests.filter((req) => {
        const matchesSearch =
            req.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.request_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const totalPending = requests.filter((r) => r.status === 'PENDING').reduce((sum, r) => sum + r.amount, 0);
    const totalApproved = requests.filter((r) => r.status === 'APPROVED').reduce((sum, r) => sum + r.amount, 0);
    const totalPaid = requests.filter((r) => r.status === 'PAID').reduce((sum, r) => sum + r.amount, 0);

    const getStatusBadge = (status: string) => {
        const badges = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            APPROVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
            PAID: { bg: 'bg-blue-100', text: 'text-blue-800', icon: CheckCircle },
        };
        const badge = badges[status as keyof typeof badges];
        const Icon = badge.icon;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex items-center gap-1`}>
                <Icon size={12} />
                {status}
            </span>
        );
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Petty Cash Management</h1>
                    <p className="text-gray-600 mt-1">Manage daily petty cash transactions and vouchers</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Request
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Requests</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{requests.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Wallet className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending Amount</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">₹{totalPending.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Approved Amount</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">₹{totalApproved.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Paid Amount</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">₹{totalPaid.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Download className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* New Request Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">New Petty Cash Request</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                                <input
                                    type="date"
                                    value={formData.request_date}
                                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    <option value="Tea/Coffee">Tea/Coffee</option>
                                    <option value="Stationery">Stationery</option>
                                    <option value="Cleaning">Cleaning</option>
                                    <option value="Transport">Transport</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Miscellaneous">Miscellaneous</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Image (Optional)</label>
                                <div className="flex items-center gap-2">
                                    <label className="flex-1 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 flex items-center gap-2">
                                        <Upload size={16} />
                                        <span className="text-sm text-gray-600">
                                            {formData.receipt_image ? formData.receipt_image.name : 'Choose file'}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setFormData({ ...formData, receipt_image: e.target.files?.[0] || null })}
                                            className="hidden"
                                        />
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Submit Request
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by category, description, or request number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="APPROVED">Approved</option>
                            <option value="REJECTED">Rejected</option>
                            <option value="PAID">Paid</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Request #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Requested By</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredRequests.map((request) => (
                                <tr key={request.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{request.request_number}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(request.request_date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{request.requested_by_name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{request.category}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={request.description}>
                                        {request.description}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        ₹{request.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">{getStatusBadge(request.status)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {request.receipt_image && (
                                                <button
                                                    onClick={() => openDownload(request.receipt_image)}
                                                    className="p-1 text-gray-600 hover:text-blue-600"
                                                    title="View Receipt"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            {request.status === 'PENDING' && (
                                                <>
                                                    <button
                                                        onClick={() => handleApprove(request.id)}
                                                        className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(request.id)}
                                                        className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                    >
                                                        Reject
                                                    </button>
                                                </>
                                            )}
                                            {request.status === 'APPROVED' && (
                                                <button
                                                    onClick={() => handlePay(request.id)}
                                                    className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                >
                                                    Mark Paid
                                                </button>
                                            )}
                                            {request.status === 'REJECTED' && request.rejection_reason && (
                                                <button
                                                    onClick={() => alert(`Rejection Reason: ${request.rejection_reason}`)}
                                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-50 rounded hover:bg-gray-100"
                                                >
                                                    View Reason
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredRequests.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No petty cash requests found. Create your first request to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PettyCash;
