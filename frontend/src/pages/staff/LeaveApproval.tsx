import React, { useState, useEffect } from 'react';
import api from '../../services/api';


const LeaveApproval: React.FC = () => {

    const [pendingLeaves, setPendingLeaves] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchPendingLeaves();
    }, []);

    const fetchPendingLeaves = async () => {
        try {
            const response = await api.get('/staff/leaves/pending/');
            setPendingLeaves(response.data || []);
        } catch (error) {
            console.error('Error fetching pending leaves:', error);
        }
    };

    const handleApprove = async (leaveId: number) => {
        setLoading(true);
        try {
            await api.post(`/staff/leaves/${leaveId}/approve/`, { remarks: 'Approved' });
            fetchPendingLeaves();
        } catch (error) {
            console.error('Error approving leave:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (leaveId: number, remarks: string) => {
        setLoading(true);
        try {
            await api.post(`/staff/leaves/${leaveId}/reject/`, { remarks });
            fetchPendingLeaves();
        } catch (error) {
            console.error('Error rejecting leave:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Leave Approval</h1>
            <div className="bg-white rounded-lg shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From - To</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pendingLeaves.map((leave) => (
                            <tr key={leave.id}>
                                <td className="px-6 py-4 whitespace-nowrap">{leave.staff_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{leave.leave_type}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{leave.from_date} - {leave.to_date}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{leave.total_days}</td>
                                <td className="px-6 py-4 text-sm">{leave.reason}</td>
                                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                                    <button
                                        onClick={() => handleApprove(leave.id)}
                                        disabled={loading}
                                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(leave.id, 'Rejected')}
                                        disabled={loading}
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
                                    >
                                        Reject
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LeaveApproval;
