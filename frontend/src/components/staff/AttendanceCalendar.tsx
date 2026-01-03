import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Props {
    refreshKey: number;
}

const AttendanceCalendar: React.FC<Props> = ({ refreshKey }) => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [attendance, setAttendance] = useState<any[]>([]);

    useEffect(() => {
        // TODO: Implement calendar view with monthly attendance data
        fetchMonthlyAttendance();
    }, [month, year, refreshKey]);

    const fetchMonthlyAttendance = async () => {
        try {
            const response = await api.get(`/staff/attendance/?month=${year}-${String(month).padStart(2, '0')}`);
            setAttendance(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    return (
        <div>
            <div className="mb-4">
                <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="mr-2 px-3 py-2 border rounded">
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>{new Date(2000, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                </select>
                <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="px-3 py-2 border rounded">
                    {Array.from({ length: 5 }, (_, i) => (
                        <option key={i} value={new Date().getFullYear() - 2 + i}>{new Date().getFullYear() - 2 + i}</option>
                    ))}
                </select>
            </div>
            <div className="text-gray-500">Calendar view - Implementation pending</div>
        </div>
    );
};

export default AttendanceCalendar;
