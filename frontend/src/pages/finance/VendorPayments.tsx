import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Download, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Vendor {
    id: number;
    code: string;
    name: string;
    outstanding_balance: number;
}

interface Invoice {
    id: number;
    invoice_number: string;
    date: string;
    amount: number;
    outstanding_amount: number;
}

interface VendorPayment {
    id: number;
    payment_number: string;
    date: string;
    vendor: Vendor;
    amount: number;
    payment_method: string;
    reference: string;
    status: 'PENDING' | 'PAID' | 'CANCELLED';
    notes: string;
}

export const VendorPayments: React.FC = () => {
    const [payments, setPayments] = useState<VendorPayment[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Form state
    const [selectedVendor, setSelectedVendor] = useState<number | null>(null);
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [referenceNumber, setReferenceNumber] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
    const [vendorInvoices, setVendorInvoices] = useState<Invoice[]>([]);
    const [proofFile, setProofFile] = useState<File | null>(null);

    useEffect(() => {
        fetchPayments();
        fetchVendors();
    }, []);

    useEffect(() => {
        if (selectedVendor) {
            fetchVendorInvoices(selectedVendor);
        }
    }, [selectedVendor]);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/finance/vendor-payments/');
            setPayments(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        } finally {
            setLoading(false);
        }
    };

    const fetchVendors = async () => {
        try {
            const response = await api.get('/api/finance/vendors/');
            setVendors(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
        }
    };

    const fetchVendorInvoices = async (vendorId: number) => {
        try {
            const response = await api.get(`/api/finance/vendors/${vendorId}/invoices/?status=pending`);
            setVendorInvoices(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching vendor invoices:', error);
            toast.error('Failed to load vendor invoices');
        }
    };

    const handleSubmitPayment = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedVendor || !paymentAmount) {
            toast.error('Please fill all required fields');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('vendor', selectedVendor.toString());
            formData.append('date', paymentDate);
            formData.append('payment_method', paymentMethod);
            formData.append('amount', paymentAmount);
            formData.append('reference', referenceNumber);
            formData.append('notes', notes);
            formData.append('invoices', JSON.stringify(selectedInvoices));
            
            if (proofFile) {
                formData.append('proof', proofFile);
            }

            await api.post('/api/finance/vendor-payments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Payment recorded successfully');
            setShowPaymentForm(false);
            resetForm();
            fetchPayments();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Failed to record payment');
        }
    };

    const resetForm = () => {
        setSelectedVendor(null);
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setPaymentMethod('CASH');
        setReferenceNumber('');
        setPaymentAmount('');
        setNotes('');
        setSelectedInvoices([]);
        setProofFile(null);
    };

    const toggleInvoiceSelection = (invoiceId: number, amount: number) => {
        if (selectedInvoices.includes(invoiceId)) {
            setSelectedInvoices(selectedInvoices.filter(id => id !== invoiceId));
            setPaymentAmount((parseFloat(paymentAmount || '0') - amount).toString());
        } else {
            setSelectedInvoices([...selectedInvoices, invoiceId]);
            setPaymentAmount((parseFloat(paymentAmount || '0') + amount).toString());
        }
    };

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = payment.vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payment.payment_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const vendor = vendors.find(v => v.id === selectedVendor);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'PAID':
                return <CheckCircle className="text-green-600" size={16} />;
            case 'PENDING':
                return <Clock className="text-yellow-600" size={16} />;
            case 'CANCELLED':
                return <XCircle className="text-red-600" size={16} />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
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
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Vendor Payments</h1>
                    <p className="text-gray-600 mt-1">Track and manage vendor payments</p>
                </div>
                <button
                    onClick={() => setShowPaymentForm(true)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Record Payment
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by vendor name or payment number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="PAID">Paid</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Payments Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Payment #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendor</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Method</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredPayments.map((payment) => (
                                <tr key={payment.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{payment.payment_number}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(payment.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{payment.vendor.name}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        ₹{payment.amount.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.payment_method}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{payment.reference || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1 ${getStatusColor(payment.status)}`}>
                                            {getStatusIcon(payment.status)}
                                            {payment.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Form Modal */}
            {showPaymentForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                            <h2 className="text-xl font-bold text-gray-800">Record Vendor Payment</h2>
                        </div>

                        <form onSubmit={handleSubmitPayment} className="p-6 space-y-6">
                            {/* Vendor Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Vendor *
                                </label>
                                <select
                                    value={selectedVendor || ''}
                                    onChange={(e) => setSelectedVendor(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Choose a vendor</option>
                                    {vendors.map((vendor) => (
                                        <option key={vendor.id} value={vendor.id}>
                                            {vendor.name} - Outstanding: ₹{vendor.outstanding_balance.toLocaleString('en-IN')}
                                        </option>
                                    ))}
                                </select>
                                {vendor && (
                                    <p className="mt-2 text-sm text-gray-600">
                                        Outstanding Balance: <span className="font-semibold text-red-600">
                                            ₹{vendor.outstanding_balance.toLocaleString('en-IN')}
                                        </span>
                                    </p>
                                )}
                            </div>

                            {/* Invoice Selection */}
                            {selectedVendor && vendorInvoices.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Invoices to Pay
                                    </label>
                                    <div className="border border-gray-300 rounded-lg divide-y divide-gray-200 max-h-48 overflow-y-auto">
                                        {vendorInvoices.map((invoice) => (
                                            <label key={invoice.id} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedInvoices.includes(invoice.id)}
                                                        onChange={() => toggleInvoiceSelection(invoice.id, invoice.outstanding_amount)}
                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-800">{invoice.invoice_number}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(invoice.date).toLocaleDateString('en-IN')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-gray-800">
                                                    ₹{invoice.outstanding_amount.toLocaleString('en-IN')}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Payment Date */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Date *
                                    </label>
                                    <input
                                        type="date"
                                        value={paymentDate}
                                        onChange={(e) => setPaymentDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>

                                {/* Payment Method */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Method *
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="CASH">Cash</option>
                                        <option value="CHEQUE">Cheque</option>
                                        <option value="BANK_TRANSFER">Bank Transfer</option>
                                        <option value="UPI">UPI</option>
                                    </select>
                                </div>

                                {/* Reference Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reference Number {paymentMethod !== 'CASH' && '*'}
                                    </label>
                                    <input
                                        type="text"
                                        value={referenceNumber}
                                        onChange={(e) => setReferenceNumber(e.target.value)}
                                        placeholder={
                                            paymentMethod === 'CHEQUE' ? 'Cheque Number' :
                                            paymentMethod === 'BANK_TRANSFER' ? 'UTR Number' :
                                            paymentMethod === 'UPI' ? 'Transaction ID' : 'Reference'
                                        }
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required={paymentMethod !== 'CASH'}
                                    />
                                </div>

                                {/* Payment Amount */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Amount *
                                    </label>
                                    <input
                                        type="number"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        placeholder="0.00"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Upload Proof */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Upload Payment Proof
                                </label>
                                <input
                                    type="file"
                                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                                    accept="image/*,application/pdf"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes/Remarks
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter any additional notes..."
                                />
                            </div>

                            {/* Form Actions */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPaymentForm(false);
                                        resetForm();
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Record Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VendorPayments;