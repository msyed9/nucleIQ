import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Props {
    refreshKey: number;
}

const AttendanceSummary: React.FC<Props> = ({ refreshKey }) => {
    const [summary, setSummary] = useState<any[]>([]);
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    useEffect(() => {
        if (fromDate && toDate) {
            fetchSummary();
        }
    }, [fromDate, toDate, refreshKey]);

    const fetchSummary = async () => {
        try {
            const response = await api.get(`/staff/attendance/summary/?from_date=${fromDate}&to_date=${toDate}`);
            setSummary(response.data || []);
        } catch (error) {
            console.error('Error fetching summary:', error);
        }
    };

    return (
        <div>
            <div className="mb-4 flex space-x-2">
                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 border rounded" />
                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 border rounded" />
            </div>
            <div className="text-gray-500">Attendance summary table - Implementation pending</div>
        </div>
    );
};

export default AttendanceSummary;
