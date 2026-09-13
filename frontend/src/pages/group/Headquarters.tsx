import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Modal, Button, useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';

interface SchoolBreakdown {
    id: string;
    name: string;
    subdomain: string;
    is_active: boolean;
    location: string | null;
    student_count: number;
    staff_count: number;
    revenue_collected: number;
    revenue_pending: number;
    collection_rate: number | null;
}

interface DashboardData {
    overview: {
        schools: number;
        students: number;
        staff: number;
        total_revenue: number;
        total_pending: number;
    };
    schools_breakdown: SchoolBreakdown[];
}

const performanceBadge = (rate: number | null) => {
    if (rate === null) return <span className="bg-gray-700 text-gray-300 px-2 py-1 rounded text-xs">No data</span>;
    if (rate >= 90) return <span className="bg-green-900 text-green-300 px-2 py-1 rounded text-xs">Excellent ({rate.toFixed(0)}%)</span>;
    if (rate >= 70) return <span className="bg-yellow-900 text-yellow-300 px-2 py-1 rounded text-xs">Good ({rate.toFixed(0)}%)</span>;
    return <span className="bg-red-900 text-red-300 px-2 py-1 rounded text-xs">At Risk ({rate.toFixed(0)}%)</span>;
};

const Headquarters: React.FC = () => {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCurriculumModal, setShowCurriculumModal] = useState(false);
    const [curriculumText, setCurriculumText] = useState('Mathematics, MATH\nEnglish, ENG\nScience, SCI');
    const [pushing, setPushing] = useState(false);
    const { toasts, removeToast, success, error: showError } = useToast();

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await api.get('/tenants/hq/dashboard/');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const parseCurriculumInput = () => {
        return curriculumText
            .split('\n')
            .map((line) => line.trim())
            .filter(Boolean)
            .map((line) => {
                const [name, code] = line.split(',').map((part) => part.trim());
                return { name, code: code || name.slice(0, 4).toUpperCase() };
            })
            .filter((subject) => subject.name);
    };

    const handlePushCurriculum = async () => {
        const subjects = parseCurriculumInput();
        if (subjects.length === 0) {
            showError('Enter at least one subject (Name, Code) per line');
            return;
        }

        setPushing(true);
        try {
            const res = await api.post('/tenants/hq/push_curriculum/', { subjects });
            success(
                `Created ${res.data.subjects_created} subject(s) across ${res.data.schools_affected} school(s)`
            );
            setShowCurriculumModal(false);
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to push curriculum');
        } finally {
            setPushing(false);
        }
    };

    if (loading) return <div className="p-10 text-white bg-gray-900 min-h-screen">Loading HQ...</div>;
    if (!data) return <div className="p-10 text-white bg-gray-900 min-h-screen">Access Denied (Super Admin Only)</div>;

    const { overview, schools_breakdown } = data;

    return (
        <div className="bg-gray-900 min-h-screen text-white p-8">
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">🏢 Group Headquarters</h1>
                    <p className="text-gray-400">Managing {overview.schools} Schools</p>
                </div>
                <button
                    className="bg-blue-600 px-4 py-2 rounded font-bold hover:bg-blue-700"
                    onClick={() => setShowCurriculumModal(true)}
                >
                    Push Curriculum
                </button>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                    <h3 className="text-gray-400 text-sm">Group Revenue Collected</h3>
                    <p className="text-3xl font-bold text-yellow-400">₹{overview.total_revenue.toLocaleString()}</p>
                </div>
                <div className="bg-gray-800 p-6 rounded-lg">
                    <h3 className="text-gray-400 text-sm">Group Fees Pending</h3>
                    <p className="text-3xl font-bold text-red-400">₹{overview.total_pending.toLocaleString()}</p>
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
                            <th className="p-4">Revenue Collected</th>
                            <th className="p-4">Revenue Pending</th>
                            <th className="p-4">Performance</th>
                            <th className="p-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {schools_breakdown.map((school) => (
                            <tr key={school.id} className="hover:bg-gray-750">
                                <td className="p-4 font-semibold">{school.name}</td>
                                <td className="p-4 text-gray-400">{school.location || '—'}</td>
                                <td className="p-4">{school.student_count}</td>
                                <td className="p-4">{school.staff_count}</td>
                                <td className="p-4">₹{school.revenue_collected.toLocaleString()}</td>
                                <td className="p-4">₹{school.revenue_pending.toLocaleString()}</td>
                                <td className="p-4">{performanceBadge(school.collection_rate)}</td>
                                <td className="p-4">
                                    <Link
                                        to={`/settings/10-year-migration/${school.id}`}
                                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm font-medium"
                                    >
                                        <span>Migrate Data</span>
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={showCurriculumModal}
                onClose={() => setShowCurriculumModal(false)}
                title="Push Curriculum to All Schools"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowCurriculumModal(false)}>Cancel</Button>
                        <Button onClick={handlePushCurriculum} disabled={pushing}>
                            {pushing ? 'Pushing...' : 'Push to Schools'}
                        </Button>
                    </>
                }
            >
                <p className="text-sm text-gray-600 mb-2">
                    One subject per line, as <code>Name, Code</code>. Existing subjects (matched by name or code) are skipped per school.
                </p>
                <textarea
                    className="w-full border rounded p-2 text-sm text-gray-900 font-mono"
                    rows={8}
                    value={curriculumText}
                    onChange={(e) => setCurriculumText(e.target.value)}
                />
            </Modal>
        </div>
    );
};

export default Headquarters;

