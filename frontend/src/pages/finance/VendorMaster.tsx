import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Vendor {
    id: number;
    code: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    outstanding_balance: number;
    total_paid: number;
    is_active: boolean;
}

export const VendorMaster: React.FC = () => {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

    useEffect(() => {
        fetchVendors();
    }, []);

    const fetchVendors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/finance/vendors/');
            setVendors(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching vendors:', error);
            toast.error('Failed to load vendors');
        } finally {
            setLoading(false);
        }
    };

    const filteredVendors = vendors.filter(
        (vendor) =>
            vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            vendor.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalOutstanding = vendors.reduce((sum, v) => sum + v.outstanding_balance, 0);
    const totalPaid = vendors.reduce((sum, v) => sum + v.total_paid, 0);

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
                    <h1 className="text-2xl font-bold text-gray-800">Vendor Master</h1>
                    <p className="text-gray-600 mt-1">Manage vendor information and track payments</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Add Vendor
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Vendors</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{vendors.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <TrendingUp className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Active Vendors</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">
                                {vendors.filter((v) => v.is_active).length}
                            </p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Outstanding</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">
                                ₹{totalOutstanding.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Paid</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">
                                ₹{totalPaid.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <Download className="text-gray-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search vendors by name or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Vendors Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Code</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Vendor Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact Person</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Email</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Outstanding</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Total Paid</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredVendors.map((vendor) => (
                                <tr key={vendor.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{vendor.code}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{vendor.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.contact_person || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.phone || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{vendor.email || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                        ₹{vendor.outstanding_balance.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right text-gray-800">
                                        ₹{vendor.total_paid.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`px-2 py-1 rounded-full text-xs font-medium ${vendor.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {vendor.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => {
                                                setSelectedVendor(vendor);
                                                // Navigate to vendor ledger
                                                toast('Vendor ledger view coming soon', { icon: 'ℹ️' });
                                            }}
                                            className="px-3 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                        >
                                            View Ledger
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredVendors.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No vendors found. Add your first vendor to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};


export default VendorMaster;