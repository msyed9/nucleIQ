import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const SalahTracker: React.FC = () => {
    const [records, setRecords] = useState<any[]>([]);

    useEffect(() => {
        fetchRecords();
    }, []);

    const fetchRecords = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/salah/records/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setRecords(res.data);
        } catch (err) { console.error(err); }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">🕌 Salah Tracker</h1>
            <p className="mb-4 text-gray-600">Daily Prayer Log</p>

            <div className="bg-white rounded shadow p-4">
                {records.length === 0 ? <p>No records found.</p> : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left p-2">Date</th>
                                <th className="text-left p-2">Salah</th>
                                <th className="text-left p-2">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {records.map(r => (
                                <tr key={r.id} className="border-b hover:bg-gray-50">
                                    <td className="p-2">{r.date}</td>
                                    <td className="p-2 font-semibold">{r.salah_name}</td>
                                    <td className="p-2">
                                        <span className={`px-2 py-1 rounded text-sm ${r.status === 'OFFERED' ? 'bg-green-100 text-green-800' :
                                                r.status === 'MISSED' ? 'bg-red-100 text-red-800' : 'bg-gray-100'
                                            }`}>{r.status}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default SalahTracker;
