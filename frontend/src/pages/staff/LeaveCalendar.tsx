import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const LeaveCalendar: React.FC = () => {
    const [leaves, setLeaves] = useState<any[]>([]);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    useEffect(() => {
        fetchLeaves();
    }, [month, year]);

    const fetchLeaves = async () => {
        try {
            const response = await api.get(`/hr/leave-calendar/?month=${year}-${String(month).padStart(2, '0')}`);
            setLeaves(response.data || []);
        } catch (error) {
            console.error('Error fetching leave calendar:', error);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">Leave Calendar</h2>
            <div className="mb-4 flex space-x-2">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="px-3 py-2 border rounded">
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                            {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                        </option>
                    ))}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded">
                    {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - 2 + i}>
                            {new Date().getFullYear() - 2 + i}
                        </option>
                    ))}
                </select>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
                {leaves.map((leave) => (
                    <div key={leave.id} className="border-b py-2">
                        <span className="font-medium">{leave.staff_name}</span> - {leave.leave_type} 
                        ({leave.from_date} to {leave.to_date})
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LeaveCalendar;
