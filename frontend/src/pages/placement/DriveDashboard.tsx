import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const DriveDashboard: React.FC = () => {
    const [drives, setDrives] = useState<any[]>([]);

    useEffect(() => {
        const fetchDrives = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/placement/drives/`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setDrives(res.data);
            } catch (err) { console.error(err); }
        };
        fetchDrives();
    }, []);

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">👔 Placement Cell</h1>

            <div className="space-y-4">
                {drives.map(drive => (
                    <div key={drive.id} className="bg-white p-6 rounded shadow flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{drive.company}</h3>
                            <p className="text-blue-600 font-medium">{drive.title}</p>
                            <p className="text-sm text-gray-500 mt-1">Date: {drive.date} | Package: {drive.package_range}</p>
                            <p className="text-gray-600 mt-2 text-sm">{drive.roles_offered}</p>
                        </div>
                        <button className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                            View Applications
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DriveDashboard;
