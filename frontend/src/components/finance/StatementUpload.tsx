import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    onUpload: (file: File, mapping: ColumnMapping) => void;
}

interface ColumnMapping {
    dateColumn: string;
    descriptionColumn: string;
    debitColumn: string;
    creditColumn: string;
    balanceColumn: string;
}

const StatementUpload: React.FC<Props> = ({ onUpload }) => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [showMapping, setShowMapping] = useState(false);
    const [mapping, setMapping] = useState<ColumnMapping>({
        dateColumn: 'Date',
        descriptionColumn: 'Description',
        debitColumn: 'Debit',
        creditColumn: 'Credit',
        balanceColumn: 'Balance'
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                setSelectedFile(file);
                setShowMapping(true);
            } else {
                toast.error('Please select a CSV or Excel file');
            }
        }
    };

    const handleUpload = () => {
        if (selectedFile) {
            onUpload(selectedFile, mapping);
            setSelectedFile(null);
            setShowMapping(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={20} />
                Upload Bank Statement
            </h3>

            <div className="space-y-4">
                {!selectedFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                        <label className="cursor-pointer">
                            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                            <p className="text-xs text-gray-500">CSV or Excel files only</p>
                            <input
                                type="file"
                                accept=".csv,.xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </label>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                                <FileText className="text-blue-600" size={20} />
                                <span className="text-sm font-medium text-blue-800">{selectedFile.name}</span>
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedFile(null);
                                    setShowMapping(false);
                                }}
                                className="text-sm text-blue-600 hover:text-blue-700"
                            >
                                Remove
                            </button>
                        </div>

                        {showMapping && (
                            <div className="border border-gray-200 rounded-lg p-4">
                                <h4 className="text-sm font-semibold text-gray-800 mb-3">Map Columns</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Date Column</label>
                                        <input
                                            type="text"
                                            value={mapping.dateColumn}
                                            onChange={(e) => setMapping({ ...mapping, dateColumn: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Description Column</label>
                                        <input
                                            type="text"
                                            value={mapping.descriptionColumn}
                                            onChange={(e) => setMapping({ ...mapping, descriptionColumn: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Debit Column</label>
                                        <input
                                            type="text"
                                            value={mapping.debitColumn}
                                            onChange={(e) => setMapping({ ...mapping, debitColumn: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Credit Column</label>
                                        <input
                                            type="text"
                                            value={mapping.creditColumn}
                                            onChange={(e) => setMapping({ ...mapping, creditColumn: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Balance Column</label>
                                        <input
                                            type="text"
                                            value={mapping.balanceColumn}
                                            onChange={(e) => setMapping({ ...mapping, balanceColumn: e.target.value })}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    className="mt-4 w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Import Statement
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatementUpload;