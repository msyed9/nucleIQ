import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const LiveClassJoin: React.FC = () => {
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                const tenantId = localStorage.getItem('current_tenant');
                const res = await axios.get(`${API_BASE_URL}/lms/live/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Tenant-ID': tenantId || ''
                    }
                });
                setClasses(res.data);
            } catch (err) { console.error(err); }
        };
        fetchClasses();
    }, []);

    const joinClass = (url: string) => {
        window.open(url, '_blank');
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">📹 Live Classroom</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map((cls) => (
                    <div key={cls.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded mb-2 inline-block font-bold">LIVE NOW</span>
                        <h3 className="font-bold text-xl">{cls.title}</h3>
                        <p className="text-gray-600 font-medium">{cls.subject_name}</p>
                        <p className="text-gray-500 text-sm mt-1">Teacher: {cls.teacher_name}</p>

                        <div className="mt-4 flex justify-between items-center">
                            <span className="text-sm text-gray-400">
                                {new Date(cls.start_time).toLocaleTimeString()}
                            </span>
                            <button
                                onClick={() => joinClass(cls.meeting_link)}
                                className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition"
                            >
                                Join Class
                            </button>
                        </div>
                    </div>
                ))}

                {classes.length === 0 && (
                    <div className="col-span-3 text-center py-10 text-gray-400">
                        No live classes scheduled for today.
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveClassJoin;
