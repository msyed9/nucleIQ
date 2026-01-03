import React, { useState } from 'react';
import api from '../../services/api';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const CompOffRequest: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        worked_date: '',
        reason: '',
        attachment: null as File | null
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = new FormData();
        data.append('worked_date', formData.worked_date);
        data.append('reason', formData.reason);
        if (formData.attachment) data.append('attachment', formData.attachment);

        try {
            await api.post('/staff/comp_off/', data);
            onSuccess();
        } catch (error) {
            console.error('Error requesting comp off:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Request Compensatory Off</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Date Worked</label>
                        <input
                            type="date"
                            value={formData.worked_date}
                            onChange={(e) => setFormData({ ...formData, worked_date: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            rows={3}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Attachment (Optional)</label>
                        <input
                            type="file"
                            onChange={(e) => setFormData({ ...formData, attachment: e.target.files?.[0] || null })}
                            className="w-full px-3 py-2 border rounded"
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit Request</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CompOffRequest;
