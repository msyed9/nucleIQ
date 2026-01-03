import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import AttendanceMarker from '../../components/staff/AttendanceMarker';
import AttendanceCalendar from '../../components/staff/AttendanceCalendar';
import AttendanceSummary from '../../components/staff/AttendanceSummary';

const StaffAttendance: React.FC = () => {
    const { t } = useTranslation();
    const [view, setView] = useState<'mark' | 'calendar' | 'summary'>('mark');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleAttendanceMarked = () => {
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">{t('staff.attendance', 'Staff Attendance')}</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setView('mark')}
                            className={`px-4 py-2 rounded ${view === 'mark' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Mark Attendance
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`px-4 py-2 rounded ${view === 'calendar' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Calendar View
                        </button>
                        <button
                            onClick={() => setView('summary')}
                            className={`px-4 py-2 rounded ${view === 'summary' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Summary
                        </button>
                    </div>
                </div>

                {view === 'mark' && (
                    <AttendanceMarker
                        selectedDate={selectedDate}
                        onDateChange={setSelectedDate}
                        onSuccess={handleAttendanceMarked}
                    />
                )}

                {view === 'calendar' && (
                    <AttendanceCalendar refreshKey={refreshKey} />
                )}

                {view === 'summary' && (
                    <AttendanceSummary refreshKey={refreshKey} />
                )}
            </div>
        </div>
    );
};

export default StaffAttendance;
