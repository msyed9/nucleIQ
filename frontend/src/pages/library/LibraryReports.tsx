import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const LibraryReports: React.FC = () => {
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [activeReport, setActiveReport] = useState<'circulation' | 'members' | 'inventory' | 'financial'>('circulation');

    const { data: stats } = useQuery({
        queryKey: ['library-stats'],
        queryFn: async () => {
            const [books, members, issues] = await Promise.all([
                axios.get('/api/library/books/'),
                axios.get('/api/library/members/'),
                axios.get('/api/library/issues/')
            ]);
            return { books: books.data, members: members.data, issues: issues.data };
        }
    });

    const circulationData = {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
            label: 'Books Issued',
            data: [65, 59, 80, 81, 56, 55],
            backgroundColor: 'rgba(59, 130, 246, 0.5)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
        }]
    };

    const categoryData = {
        labels: ['Fiction', 'Science', 'History', 'Technology', 'Arts'],
        datasets: [{
            data: [30, 20, 15, 25, 10],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }]
    };

    const exportToExcel = () => {
        alert('Export to Excel functionality will be implemented');
    };

    const exportToPDF = () => {
        alert('Export to PDF functionality will be implemented');
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800"> Library Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights and statistics</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Books</div>
                    <div className="text-2xl font-bold text-blue-600">{stats?.books?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Active Members</div>
                    <div className="text-2xl font-bold text-green-600">{stats?.members?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Currently Issued</div>
                    <div className="text-2xl font-bold text-orange-600">
                        {stats?.issues?.filter((i: any) => i.status === 'ISSUED').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Fines</div>
                    <div className="text-2xl font-bold text-red-600">
                        {stats?.members?.reduce((sum: number, m: any) => sum + (m.total_fines_due || 0), 0).toFixed(2) || '0.00'}
                    </div>
                </div>
            </div>

            {/* Report Type Tabs */}
            <div className="bg-white rounded-lg shadow mb-6">
                <div className="border-b border-gray-200">
                    <div className="flex gap-4 p-4">
                        <button
                            onClick={() => setActiveReport('circulation')}
                            className={`px-4 py-2 rounded-lg ${activeReport === 'circulation' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Circulation
                        </button>
                        <button
                            onClick={() => setActiveReport('members')}
                            className={`px-4 py-2 rounded-lg ${activeReport === 'members' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Members
                        </button>
                        <button
                            onClick={() => setActiveReport('inventory')}
                            className={`px-4 py-2 rounded-lg ${activeReport === 'inventory' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Inventory
                        </button>
                        <button
                            onClick={() => setActiveReport('financial')}
                            className={`px-4 py-2 rounded-lg ${activeReport === 'financial' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                        >
                            Financial
                        </button>
                    </div>
                </div>

                {/* Charts Section */}
                <div className="p-6">
                    {activeReport === 'circulation' && (
                        <div className="space-y-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                                <h3 className="font-semibold mb-4">Monthly Circulation Trend</h3>
                                <Bar data={circulationData} options={{ responsive: true }} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold mb-4">Books by Category</h3>
                                    <Pie data={categoryData} options={{ responsive: true }} />
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <h3 className="font-semibold mb-2">Top Borrowed Books</h3>
                                    <div className="space-y-2">
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} className="flex justify-between items-center p-2 bg-white rounded">
                                                <span className="text-sm">Sample Book {i}</span>
                                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{20 - i * 2} issues</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'members' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Member Statistics</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Total Members</div>
                                    <div className="text-2xl font-bold">{stats?.members?.length || 0}</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Students</div>
                                    <div className="text-2xl font-bold">
                                        {stats?.members?.filter((m: any) => m.member_type === 'STUDENT').length || 0}
                                    </div>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Staff</div>
                                    <div className="text-2xl font-bold">
                                        {stats?.members?.filter((m: any) => m.member_type === 'STAFF').length || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'inventory' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Inventory Overview</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Total Books</div>
                                    <div className="text-2xl font-bold">{stats?.books?.length || 0}</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Available</div>
                                    <div className="text-2xl font-bold">
                                        {stats?.books?.reduce((sum: number, b: any) => sum + (b.available_copies || 0), 0) || 0}
                                    </div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Issued</div>
                                    <div className="text-2xl font-bold">
                                        {stats?.issues?.filter((i: any) => i.status === 'ISSUED').length || 0}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReport === 'financial' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold">Financial Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Fines Collected</div>
                                    <div className="text-2xl font-bold text-green-600">0.00</div>
                                    <div className="text-xs text-gray-500 mt-1">This month</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Outstanding Fines</div>
                                    <div className="text-2xl font-bold text-red-600">
                                        {stats?.members?.reduce((sum: number, m: any) => sum + (m.total_fines_due || 0), 0).toFixed(2) || '0.00'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold mb-4">Export Reports</h3>
                <div className="flex gap-4">
                    <button
                        onClick={exportToExcel}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                         Export to Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                         Export to PDF
                    </button>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                         Print Report
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LibraryReports;
