import React, { useState, useEffect } from 'react';
import api from '../../services/api';

interface Props {
    selectedDate: string;
    onDateChange: (date: string) => void;
    onSuccess: () => void;
}

const AttendanceMarker: React.FC<Props> = ({ selectedDate, onDateChange, onSuccess }) => {
    const [staff, setStaff] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<Record<number, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchStaff();
        fetchAttendance();
    }, [selectedDate]);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff/staff/?status=ACTIVE');
            setStaff(response.data.results || response.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };

    const fetchAttendance = async () => {
        try {
            const response = await api.get(`/staff/attendance/?date=${selectedDate}`);
            const attendanceData: Record<number, any> = {};
            (response.data.results || response.data || []).forEach((item: any) => {
                attendanceData[item.staff] = item;
            });
            setAttendance(attendanceData);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const handleStatusChange = (staffId: number, status: string) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], staff: staffId, status, date: selectedDate }
        }));
    };

    const handleTimeChange = (staffId: number, field: 'check_in_time' | 'check_out_time', value: string) => {
        setAttendance(prev => ({
            ...prev,
            [staffId]: { ...prev[staffId], [field]: value }
        }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const attendanceData = Object.values(attendance).map(item => ({
                staff_id: item.staff,
                status: item.status,
                check_in_time: item.check_in_time || null,
                check_out_time: item.check_out_time || null
            }));
            
            await api.post('/staff/attendance/mark_bulk/', {
                date: selectedDate,
                attendance: attendanceData
            });
            onSuccess();
        } catch (error) {
            console.error('Error marking attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllPresent = () => {
        const newAttendance: Record<number, any> = {};
        staff.forEach(s => {
            newAttendance[s.id] = {
                staff: s.id,
                status: 'PRESENT',
                date: selectedDate,
                check_in_time: '09:00',
                check_out_time: '17:00'
            };
        });
        setAttendance(newAttendance);
    };

    return (
        <div>
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => onDateChange(e.target.value)}
                        className="px-3 py-2 border rounded"
                    />
                </div>
                <button
                    onClick={markAllPresent}
                    className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                    Mark All Present
                </button>
            </div>

            <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time In</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Out</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {staff.map((s) => (
                            <tr key={s.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium">{s.full_name}</div>
                                    <div className="text-sm text-gray-500">{s.employee_id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={attendance[s.id]?.status || ''}
                                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                        className="px-3 py-2 border rounded"
                                    >
                                        <option value="">Select</option>
                                        <option value="PRESENT">Present</option>
                                        <option value="ABSENT">Absent</option>
                                        <option value="HALF_DAY">Half Day</option>
                                        <option value="ON_LEAVE">On Leave</option>
                                        <option value="WEEK_OFF">Week Off</option>
                                        <option value="HOLIDAY">Holiday</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="time"
                                        value={attendance[s.id]?.check_in_time || ''}
                                        onChange={(e) => handleTimeChange(s.id, 'check_in_time', e.target.value)}
                                        className="px-3 py-2 border rounded"
                                        disabled={attendance[s.id]?.status !== 'PRESENT'}
                                    />
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <input
                                        type="time"
                                        value={attendance[s.id]?.check_out_time || ''}
                                        onChange={(e) => handleTimeChange(s.id, 'check_out_time', e.target.value)}
                                        className="px-3 py-2 border rounded"
                                        disabled={attendance[s.id]?.status !== 'PRESENT'}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSubmit}
                    disabled={loading || Object.keys(attendance).length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                    {loading ? 'Saving...' : 'Save Attendance'}
                </button>
            </div>
        </div>
    );
};

export default AttendanceMarker;
