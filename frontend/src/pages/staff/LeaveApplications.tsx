import React, { useState } from 'react';
import api from '../../services/api';
import LeaveForm from '../../components/staff/LeaveForm';

const LeaveApplications: React.FC = () => {
    const [showForm, setShowForm] = useState(false);
    const [applications, setApplications] = useState<any[]>([]);

    const handleSuccess = () => {
        setShowForm(false);
        // Refresh applications list
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Leave Applications</h1>
                <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Apply for Leave
                </button>
            </div>
            {showForm && (
                <LeaveForm onClose={() => setShowForm(false)} onSuccess={handleSuccess} />
            )}
            <div className="bg-white rounded-lg shadow-sm p-6">
                {/* Applications list */}
            </div>
        </div>
    );
};

export default LeaveApplications;
