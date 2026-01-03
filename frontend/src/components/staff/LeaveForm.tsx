import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Props {
    onClose: () => void;
    onSuccess: () => void;
}

const LeaveForm: React.FC<Props> = ({ onClose, onSuccess }) => {
    const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: ''
    });

    useEffect(() => {
        fetchLeaveTypes();
    }, []);

    const fetchLeaveTypes = async () => {
        try {
            const response = await api.get('/hr/leave-types/');
            setLeaveTypes(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching leave types:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/hr/leave-applications/', formData);
            onSuccess();
        } catch (error) {
            console.error('Error submitting leave application:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full">
                <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Leave Type *</label>
                        <select
                            value={formData.leave_type_id}
                            onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            required
                        >
                            <option value="">Select Leave Type</option>
                            {leaveTypes.map((type) => (
                                <option key={type.id} value={type.id}>{type.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">From Date *</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">To Date *</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                className="w-full px-3 py-2 border rounded"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason *</label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-3 py-2 border rounded"
                            rows={4}
                            required
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 border rounded">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LeaveForm;
