import React from 'react';
import { Download, FileText, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
    reportName: string;
    reportData: any;
    format?: 'PDF' | 'EXCEL' | 'CSV';
}

const ReportExport: React.FC<Props> = ({ reportName, reportData, format = 'EXCEL' }) => {

    const handleExport = (exportFormat: 'PDF' | 'EXCEL' | 'CSV') => {
        try {
            if (exportFormat === 'CSV' || exportFormat === 'EXCEL') {
                // Convert data to CSV
                let csvContent = '';

                if (Array.isArray(reportData)) {
                    // Extract headers
                    const headers = Object.keys(reportData[0] || {});
                    csvContent = headers.join(',') + '\n';

                    // Add rows
                    reportData.forEach(row => {
                        const values = headers.map(header => {
                            const value = row[header];
                            // Escape commas and quotes
                            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                                return `"${value.replace(/"/g, '""')}"`;
                            }
                            return value;
                        });
                        csvContent += values.join(',') + '\n';
                    });
                }

                // Create download
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `${reportName}_${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);

                toast.success(`Report exported as ${exportFormat}`);
            } else if (exportFormat === 'PDF') {
                // For PDF, we would typically use a library like jsPDF or call a backend endpoint
                toast('PDF export functionality coming soon', { icon: 'ℹ️' });
            }
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export report');
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handlePrint}
                className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                title="Print Report"
            >
                <Printer size={16} />
                <span className="hidden sm:inline">Print</span>
            </button>
            <button
                onClick={() => handleExport('CSV')}
                className="px-3 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                title="Export to CSV"
            >
                <FileText size={16} />
                <span className="hidden sm:inline">CSV</span>
            </button>
            <button
                onClick={() => handleExport('EXCEL')}
                className="px-3 py-2 text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors flex items-center gap-2"
                title="Export to Excel"
            >
                <Download size={16} />
                <span className="hidden sm:inline">Excel</span>
            </button>
            <button
                onClick={() => handleExport('PDF')}
                className="px-3 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                title="Export to PDF"
            >
                <FileText size={16} />
                <span className="hidden sm:inline">PDF</span>
            </button>
        </div>
    );
};

export default ReportExport;