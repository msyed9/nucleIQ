import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const Headquarters: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/tenants/hq/dashboard/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setData(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) return <div className="p-10">Loading HQ...</div>;
    if (!data) return <div className="p-10">Access Denied (Super Admin Only)</div>;

    const { overview, schools_breakdown } = data;

    return (
        <div className="bg-gray-900 min-h-screen text-white p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">🏢 Group Headquarters</h1>
                    <p className="text-gray-400">Managing {overview.schools} Schools</p>
                </div>
                <button className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700">
                    Push Curriculum
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Total Students</h3>
                    <p className="text-3xl font-bold">{overview.students}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Total Staff</h3>
                    <p className="text-3xl font-bold">{overview.staff}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Active Schools</h3>
                    <p className="text-3xl font-bold text-green-400">{overview.schools}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Group Revenue (YTD)</h3>
                    <p className="text-3xl font-bold text-yellow-400">₹{overview.total_revenue.toLocaleString()}</p>
                </div>
            </div>

            {/* School Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-700 text-gray-300">
                        <tr>
                            <th className="p-4">School Name</th>
                            <th className="p-4">Location</th>
                            <th className="p-4">Students</th>
                            <th className="p-4">Staff</th>
                            <th className="p-4">Performance</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {schools_breakdown.map((school: any) => (
                            <tr key={school.id} className="hover:bg-gray-750">
                                <td className="p-4 font-semibold">{school.name}</td>
                                <td className="p-4 text-gray-400">Delhi, India</td> {/* Mock Location */}
                                <td className="p-4">{school.student_count}</td>
                                <td className="p-4">{school.staff_count}</td>
                                <td className="p-4">
                                    <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">Excellent</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Headquarters;
