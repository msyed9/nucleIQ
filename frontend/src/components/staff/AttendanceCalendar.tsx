import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface Props {
    refreshKey: number;
}

const AttendanceCalendar: React.FC<Props> = ({ refreshKey }) => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [attendance, setAttendance] = useState<any[]>([]);

    useEffect(() => {
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
    const buildMonthGrid = (y: number, m: number) => {
        const first = new Date(y, m - 1, 1);
        const startDay = first.getDay();
        const daysInMonth = new Date(y, m, 0).getDate();

        const cells: Array<(number | null)> = [];
        for (let i = 0; i < startDay; i++) cells.push(null);
        for (let d = 1; d <= daysInMonth; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    };

    const [dayMap, setDayMap] = useState<Record<string, any[]>>({});
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDate, setModalDate] = useState<string | null>(null);

    useEffect(() => {
        const map: Record<string, any[]> = {};
        attendance.forEach((rec: any) => {
            if (!rec || !rec.date) return;
            const key = rec.date.split('T')[0];
            if (!map[key]) map[key] = [];
            map[key].push(rec);
        });
        setDayMap(map);
    }, [attendance]);

    const openDayModal = useCallback((dateIso: string) => {
        setModalDate(dateIso);
        setModalOpen(true);
    }, []);

    const closeModal = () => {
        setModalOpen(false);
        setModalDate(null);
    };

    const updateRecordStatusLocally = (recordId: string, newStatus: string) => {
        // update attendance and dayMap locally for immediate UI feedback
        setAttendance((prev: any[]) => prev.map((r: any) => r.id === recordId ? { ...r, status: newStatus } : r));
        setDayMap((prev) => {
            const copy = { ...prev };
            Object.keys(copy).forEach((k) => {
                copy[k] = copy[k].map((r: any) => r.id === recordId ? { ...r, status: newStatus } : r);
            });
            return copy;
        });
    };

    const handleMarkStatus = async (record: any, status: string) => {
        try {
            // optimistic update
            updateRecordStatusLocally(record.id, status);
            await api.patch(`/api/attendance/records/${record.id}/`, { status });
            // success - no-op
        } catch (err) {
            console.error('Failed to update status', err);
            // rollback fetch
            fetchMonthlyAttendance();
        }
    };

    const handleEditRecord = async (record: any) => {
        // Simple inline edit prompt for quick editing (can be replaced with a proper form)
        const newRemarks = prompt('Edit remarks:', record.remarks || '');
        if (newRemarks === null) return;
        try {
            await api.patch(`/api/attendance/records/${record.id}/`, { remarks: newRemarks });
            fetchMonthlyAttendance();
        } catch (err) {
            console.error('Failed to edit record', err);
            alert('Failed to save changes');
        }
    };

    const tileContent = ({ date, view }: { date: Date; view: string }) => {
        if (view !== 'month') return null;
        const key = date.toISOString().split('T')[0];
        const recs = dayMap[key] || [];
        if (recs.length === 0) return null;

        const present = recs.filter((r: any) => (r.status || r.attendance_status || '').toString().toLowerCase().includes('present')).length;
        const absent = recs.filter((r: any) => (r.status || r.attendance_status || '').toString().toLowerCase().includes('absent')).length;
        const late = recs.filter((r: any) => (r.status || r.attendance_status || '').toString().toLowerCase().includes('late')).length;

        return (
            <div className="mt-1 text-xs flex justify-center gap-1">
                {present > 0 && <span className="px-1 rounded bg-green-200 text-green-800">{present}</span>}
                {late > 0 && <span className="px-1 rounded bg-yellow-200 text-yellow-800">{late}</span>}
                {absent > 0 && <span className="px-1 rounded bg-red-200 text-red-800">{absent}</span>}
            </div>
        );
    };

    const onClickDay = (date: Date) => {
        const key = date.toISOString().split('T')[0];
        openDayModal(key);
    };

    return (
        <div>
            <div className="mb-4 flex gap-2 items-center">
                <Calendar
                    onActiveStartDateChange={({ activeStartDate }) => {
                        if (!activeStartDate) return;
                        setMonth(activeStartDate.getMonth() + 1);
                        setYear(activeStartDate.getFullYear());
                    }}
                    value={new Date(year, month - 1, 1)}
                    tileContent={tileContent}
                    onClickDay={onClickDay}
                />
            </div>

            <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-50 border border-green-200 rounded-sm"></span><span className="text-sm text-gray-600">Present</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-yellow-50 border border-yellow-200 rounded-sm"></span><span className="text-sm text-gray-600">Late</span></div>
                <div className="flex items-center gap-2"><span className="w-3 h-3 bg-red-50 border border-red-200 rounded-sm"></span><span className="text-sm text-gray-600">Absent</span></div>
            </div>

            {/* Modal */}
            {modalOpen && modalDate && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40 px-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Attendance details — {modalDate}</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={closeModal} className="px-3 py-1 bg-gray-100 rounded text-sm">Close</button>
                            </div>
                        </div>

                        <div className="space-y-3 max-h-96 overflow-auto">
                            {(dayMap[modalDate] || []).map((r: any, i: number) => (
                                <div key={i} className="p-3 border rounded flex items-start gap-3 justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{r.student?.first_name ? `${r.student.first_name} ${r.student.last_name || ''}` : r.staff?.first_name || r.name || 'Unknown'}</div>
                                        <div className="text-xs text-gray-600">Status: <span className="font-semibold">{r.status || r.attendance_status}</span></div>
                                        {r.remarks && <div className="text-xs text-gray-500 mt-1">{r.remarks}</div>}
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="text-xs text-gray-500">{r.check_in_time || (r.scan_timestamp && r.scan_timestamp.split ? r.scan_timestamp.split('T')[1] : '')}</div>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEditRecord(r)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edit</button>
                                            <button onClick={() => handleMarkStatus(r, 'ABSENT')} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Mark Absent</button>
                                            <button onClick={() => handleMarkStatus(r, 'PRESENT')} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Mark Present</button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {(!dayMap[modalDate] || dayMap[modalDate].length === 0) && (
                                <div className="text-center text-gray-600 py-8">No records for this date.</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceCalendar;
