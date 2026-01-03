import React, { useState, useEffect } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { JournalLineItem } from './JournalLineItem';

interface JournalEntryFormProps {
    entry?: any;
    accounts: any[];
    onSubmit: (data: any) => void;
    onClose: () => void;
}

export const JournalEntryForm: React.FC<JournalEntryFormProps> = ({
    entry,
    accounts,
    onSubmit,
    onClose,
}) => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        reference: '',
        description: '',
        line_items: [
            { id: '1', account: null, debit: 0, credit: 0, description: '' },
            { id: '2', account: null, debit: 0, credit: 0, description: '' },
        ],
        attachments: [] as File[],
    });

    useEffect(() => {
        if (entry) {
            setFormData({
                date: entry.date,
                reference: entry.reference || '',
                description: entry.description || '',
                line_items: entry.line_items || formData.line_items,
                attachments: [],
            });
        }
    }, [entry]);

    const handleSubmit = (e: React.FormEvent, saveAsDraft = false) => {
        e.preventDefault();

        // Validation
        if (formData.line_items.length < 2) {
            alert('At least 2 line items are required');
            return;
        }

        const totalDebit = formData.line_items.reduce((sum, item) => sum + (item.debit || 0), 0);
        const totalCredit = formData.line_items.reduce((sum, item) => sum + (item.credit || 0), 0);

        if (!saveAsDraft && Math.abs(totalDebit - totalCredit) >= 0.01) {
            alert('Entry is not balanced. Total debits must equal total credits.');
            return;
        }

        if (!formData.description.trim()) {
            alert('Description is required');
            return;
        }

        const hasInvalidAccount = formData.line_items.some((item) => !item.account);
        if (hasInvalidAccount) {
            alert('All line items must have an account selected');
            return;
        }

        onSubmit({
            ...formData,
            status: saveAsDraft ? 'DRAFT' : 'POSTED',
        });
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFormData({
                ...formData,
                attachments: [...formData.attachments, ...Array.from(e.target.files)],
            });
        }
    };

    const removeAttachment = (index: number) => {
        setFormData({
            ...formData,
            attachments: formData.attachments.filter((_, i) => i !== index),
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl my-8 mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">
                        {entry ? 'Edit Journal Entry' : 'New Journal Entry'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={(e) => handleSubmit(e, false)} className="p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Reference Number
                            </label>
                            <input
                                type="text"
                                value={formData.reference}
                                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Invoice #, Receipt #, etc."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Entry Number
                            </label>
                            <input
                                type="text"
                                value={entry?.entry_number || 'Auto-generated'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                                disabled
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description/Narration <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                            placeholder="Describe this transaction..."
                            required
                        />
                    </div>

                    {/* Line Items */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Line Items <span className="text-red-500">*</span>
                        </label>
                        <JournalLineItem
                            lineItems={formData.line_items}
                            accounts={accounts}
                            onChange={(lineItems: any) => setFormData({ ...formData, line_items: lineItems })}
                        />
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Attachments
                        </label>
                        <div className="space-y-2">
                            {formData.attachments.map((file, index) => (
                                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-700">{file.name}</span>
                                        <span className="text-xs text-gray-500">
                                            ({(file.size / 1024).toFixed(1)} KB)
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(index)}
                                        className="text-red-600 hover:text-red-700 text-sm"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                            <label className="flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 cursor-pointer transition-colors">
                                <Upload size={18} className="text-gray-400" />
                                <span className="text-sm text-gray-600">Upload Supporting Documents</span>
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleFileUpload}
                                    className="hidden"
                                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                />
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>

                        <div className="flex gap-3">
                            {!entry && (
                                <button
                                    type="button"
                                    onClick={(e) => handleSubmit(e, true)}
                                    className="px-4 py-2 text-gray-700 bg-white border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Save as Draft
                                </button>
                            )}
                            <button
                                type="submit"
                                className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                {entry ? 'Update Entry' : 'Post Entry'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
