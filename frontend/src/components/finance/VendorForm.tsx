import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Vendor {
    id?: number;
    code: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    bank_account_number: string;
    ifsc_code: string;
    payment_terms: string;
    credit_limit: number;
    gst_number: string;
    pan_number: string;
    is_active: boolean;
}

interface VendorFormProps {
    vendor?: Vendor | null;
    onSubmit: (data: Vendor) => void;
    onClose: () => void;
}

export const VendorForm: React.FC<VendorFormProps> = ({ vendor, onSubmit, onClose }) => {
    const [formData, setFormData] = useState<Vendor>({
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        bank_account_number: '',
        ifsc_code: '',
        payment_terms: 'NET_30',
        credit_limit: 0,
        gst_number: '',
        pan_number: '',
        is_active: true,
    });

    useEffect(() => {
        if (vendor) {
            setFormData(vendor);
        }
    }, [vendor]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {vendor ? 'Edit Vendor' : 'Add New Vendor'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., VEN001"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Vendor Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Company Name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contact Person
                                </label>
                                <input
                                    type="text"
                                    value={formData.contact_person}
                                    onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Contact Name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="+91 1234567890"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="vendor@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Address
                                </label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={2}
                                    placeholder="Full Address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bank Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Bank Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Account Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.bank_account_number}
                                    onChange={(e) => setFormData({ ...formData, bank_account_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Account Number"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    IFSC Code
                                </label>
                                <input
                                    type="text"
                                    value={formData.ifsc_code}
                                    onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="IFSC Code"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Terms & Tax Details */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Terms & Tax Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Payment Terms
                                </label>
                                <select
                                    value={formData.payment_terms}
                                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="IMMEDIATE">Immediate</option>
                                    <option value="NET_15">Net 15 Days</option>
                                    <option value="NET_30">Net 30 Days</option>
                                    <option value="NET_60">Net 60 Days</option>
                                    <option value="NET_90">Net 90 Days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Credit Limit (₹)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.credit_limit}
                                    onChange={(e) => setFormData({ ...formData, credit_limit: parseFloat(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    GST Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.gst_number}
                                    onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="GST Number"
                                    maxLength={15}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    PAN Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.pan_number}
                                    onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase() })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="PAN Number"
                                    maxLength={10}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={formData.is_active}
                            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                            Vendor is active
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {vendor ? 'Update Vendor' : 'Create Vendor'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
