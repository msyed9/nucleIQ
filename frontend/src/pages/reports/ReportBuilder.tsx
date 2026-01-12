import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { openDownload } from '../../utils/downloadLink';

const ReportBuilder: React.FC = () => {
    const { t } = useTranslation();
    const [templates, setTemplates] = useState<any[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [generating, setGenerating] = useState(false);
    const [filters, setFilters] = useState<any>({});
    const [format, setFormat] = useState('PDF');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/reports/templates/');
            setTemplates(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleGenerate = async () => {
        if (!selectedTemplate) return;
        
        setGenerating(true);
        try {
            const response = await api.post(`/reports/templates/${selectedTemplate.id}/generate/`, {
                filters,
                format,
                date_range_start: dateRange.start,
                date_range_end: dateRange.end
            });
            
            // Download the file
            if (response.data.file_url) {
                openDownload(response.data.file_url);
            }
            
            alert('Report generated successfully!');
        } catch (error) {
            console.error('Error generating report:', error);
            alert('Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Report Builder</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Template Selection */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Select Report Template</h2>
                    <div className="space-y-2">
                        {templates.map((template) => (
                            <div
                                key={template.id}
                                onClick={() => setSelectedTemplate(template)}
                                className={`p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                                    selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : ''
                                }`}
                            >
                                <h3 className="font-medium">{template.name}</h3>
                                <p className="text-sm text-gray-600">{template.category_display}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Configuration */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Configuration</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Output Format</label>
                            <select
                                value={format}
                                onChange={(e) => setFormat(e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                            >
                                <option value="PDF">PDF</option>
                                <option value="EXCEL">Excel</option>
                                <option value="CSV">CSV</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">Start Date</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">End Date</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                            />
                        </div>
                    </div>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Preview</h2>
                    
                    {selectedTemplate ? (
                        <div className="space-y-3">
                            <div>
                                <h3 className="font-medium">{selectedTemplate.name}</h3>
                                <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                            </div>
                            
                            <div className="text-sm">
                                <p><strong>Category:</strong> {selectedTemplate.category_display}</p>
                                <p><strong>Format:</strong> {format}</p>
                                {dateRange.start && <p><strong>From:</strong> {dateRange.start}</p>}
                                {dateRange.end && <p><strong>To:</strong> {dateRange.end}</p>}
                            </div>

                            <button
                                onClick={handleGenerate}
                                disabled={generating}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {generating ? 'Generating...' : 'Generate Report'}
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-500">Select a template to begin</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportBuilder;
