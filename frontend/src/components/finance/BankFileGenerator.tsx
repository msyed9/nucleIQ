import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface PayrollCycle {
    id: number;
    month: number;
    year: number;
}

interface Props {
    cycle: PayrollCycle;
    onClose: () => void;
}

const BankFileGenerator: React.FC<Props> = ({ cycle, onClose }) => {
    const [bankFormat, setBankFormat] = useState('SBI');
    const [generating, setGenerating] = useState(false);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const handleGenerateFile = async () => {
        try {
            setGenerating(true);
            const response = await api.post(
                `/api/finance/salary-payments/${cycle.id}/generate_bank_file/`,
                { format: bankFormat },
                { responseType: 'blob' }
            );

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `salary_payment_${cycle.month}_${cycle.year}_${bankFormat}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            toast.success('Bank file generated successfully');
        } catch (error) {
            console.error('Error generating bank file:', error);
            toast.error('Failed to generate bank file');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-800">
                        Generate Bank Transfer File
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    <div>
                        <p className="text-sm text-gray-600 mb-4">
                            Generate NEFT/RTGS file for {monthNames[cycle.month - 1]} {cycle.year} salary payment
                        </p>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Bank Format
                            </label>
                            <select
                                value={bankFormat}
                                onChange={(e) => setBankFormat(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="SBI">State Bank of India (SBI)</option>
                                <option value="ICICI">ICICI Bank</option>
                                <option value="HDFC">HDFC Bank</option>
                                <option value="AXIS">Axis Bank</option>
                                <option value="GENERIC">Generic CSV</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 font-medium mb-2">File Format Information:</p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                            <li>File will contain employee name, account number, IFSC code, and amount</li>
                            <li>Format is compatible with {bankFormat} bank's bulk transfer system</li>
                            <li>Review the file before uploading to your bank portal</li>
                        </ul>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleGenerateFile}
                            disabled={generating}
                            className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            <Download size={18} />
                            {generating ? 'Generating...' : 'Generate File'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankFileGenerator;