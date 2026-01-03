import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const ScheduledReports: React.FC = () => {
    const { t } = useTranslation();
    const [schedules, setSchedules] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        template: '',
        name: '',
        frequency: 'WEEKLY',
        day_of_week: 1,
        time: '09:00',
        email_recipients: '',
        email_subject: '',
        email_body: ''
    });

    useEffect(() => {
        fetchSchedules();
        fetchTemplates();
    }, []);

    const fetchSchedules = async () => {
        try {
            const response = await api.get('/reports/scheduled/');
            setSchedules(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching schedules:', error);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await api.get('/reports/templates/');
            setTemplates(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const emailList = formData.email_recipients.split(',').map(e => e.trim());
            await api.post('/reports/scheduled/', {
                ...formData,
                email_recipients: emailList
            });
            setShowForm(false);
            fetchSchedules();
        } catch (error) {
            console.error('Error creating schedule:', error);
        }
    };

    const toggleStatus = async (id: number) => {
        try {
            await api.post(`/reports/scheduled/${id}/toggle_status/`);
            fetchSchedules();
        } catch (error) {
            console.error('Error toggling status:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Scheduled Reports</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Schedule New Report
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Report Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Template</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Run</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {schedules.map((schedule) => (
                            <tr key={schedule.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{schedule.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{schedule.template_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{schedule.frequency_display}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{schedule.next_run || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded ${schedule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {schedule.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleStatus(schedule.id)}
                                        className="text-blue-600 hover:text-blue-900 mr-2"
                                    >
                                        {schedule.is_active ? 'Deactivate' : 'Activate'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Schedule New Report</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Report Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Template</label>
                                <select
                                    value={formData.template}
                                    onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                >
                                    <option value="">Select Template</option>
                                    {templates.map((template) => (
                                        <option key={template.id} value={template.id}>{template.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Frequency</label>
                                    <select
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                        className="w-full px-3 py-2 border rounded"
                                    >
                                        <option value="DAILY">Daily</option>
                                        <option value="WEEKLY">Weekly</option>
                                        <option value="MONTHLY">Monthly</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={formData.time}
                                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                                        className="w-full px-3 py-2 border rounded"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email Recipients (comma-separated)</label>
                                <input
                                    type="text"
                                    value={formData.email_recipients}
                                    onChange={(e) => setFormData({ ...formData, email_recipients: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    placeholder="email1@example.com, email2@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email Subject</label>
                                <input
                                    type="text"
                                    value={formData.email_subject}
                                    onChange={(e) => setFormData({ ...formData, email_subject: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Email Body</label>
                                <textarea
                                    value={formData.email_body}
                                    onChange={(e) => setFormData({ ...formData, email_body: e.target.value })}
                                    className="w-full px-3 py-2 border rounded"
                                    rows={4}
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Schedule Report</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduledReports;
