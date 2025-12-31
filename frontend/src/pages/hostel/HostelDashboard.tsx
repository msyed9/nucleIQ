import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const HostelDashboard: React.FC = () => {
    const [allocations, setAllocations] = useState<any[]>([]);
    const [buildings, setBuildings] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                const tenantId = localStorage.getItem('current_tenant');
                const headers = {
                    Authorization: `Bearer ${token}`,
                    'X-Tenant-ID': tenantId || ''
                };
                const [allocRes, buildRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/hostel/allocations/`, { headers }),
                    axios.get(`${API_BASE_URL}/hostel/buildings/`, { headers })
                ]);
                setAllocations(allocRes.data);
                setBuildings(buildRes.data);
            } catch (err) { console.error(err); }
        };
        fetchData();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">🛏️ Hostel Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {buildings.map((b) => (
                    <div key={b.id} className="bg-white p-4 rounded shadow">
                        <h2 className="text-xl font-bold">{b.name} ({b.building_type})</h2>
                        <p className="text-gray-500">{b.address}</p>
                    </div>
                ))}
            </div>

            <h2 className="text-xl font-bold mb-2">Allocations</h2>
            <table className="w-full bg-white shadow rounded">
                <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-3">Student</th>
                        <th className="p-3">Bed</th>
                        <th className="p-3">Start Date</th>
                        <th className="p-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {allocations.map((a) => (
                        <tr key={a.id} className="border-t">
                            <td className="p-3 font-medium">{a.student_name}</td>
                            <td className="p-3">{a.bed_detail}</td>
                            <td className="p-3">{a.start_date}</td>
                            <td className="p-3">
                                {a.is_active ? <span className="text-green-600 font-bold">Active</span> : <span className="text-red-500">Vacated</span>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default HostelDashboard;
