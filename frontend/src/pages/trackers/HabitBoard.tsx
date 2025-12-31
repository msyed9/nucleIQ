import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const HabitBoard: React.FC = () => {
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/habits/logs/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setLogs(res.data);
            } catch (err) { console.error(err); }
        };
        fetchLogs();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">⭐ Habit Board</h1>

            <div className="space-y-4">
                {logs.map((log) => (
                    <div key={log.id} className="bg-white p-4 rounded shadow border-l-4 border-l-indigo-500 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">{log.habit_name}</h3>
                            <p className="text-sm text-gray-500">{new Date(log.date).toLocaleDateString()} by {log.staff_name}</p>
                            {log.remarks && <p className="text-gray-600 mt-1">"{log.remarks}"</p>}
                        </div>
                        <div className={`text-xl font-bold ${log.points_awarded > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {log.points_awarded > 0 ? '+' : ''}{log.points_awarded} pts
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default HabitBoard;
