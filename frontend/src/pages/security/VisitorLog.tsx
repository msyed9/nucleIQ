import React, { useState, useEffect } from 'react';
import { Plus, Search, UserCheck, UserX, Clock, Users, Building2, Eye, Printer } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import VisitorBadgePrint from '../../components/security/VisitorBadgePrint';

interface Visitor {
    id: number;
    visitor_number: string;
    name: string;
    phone: string;
    email: string;
    organization: string;
    purpose: string;
    lead?: number;
    meeting_with?: number;
    meeting_with_name?: string;
    check_in_time: string;
    check_out_time?: string;
    photo?: string;
    badge_number: string;
    badge_printed: boolean;
    notes: string;
    feedback: string;
}

interface VisitorFormData {
    name: string;
    phone: string;
    email: string;
    organization: string;
    purpose: string;
    meeting_with: string;
    badge_number: string;
    notes: string;
}

const VisitorLog: React.FC = () => {
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [purposeFilter, setPurposeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showForm, setShowForm] = useState(false);
    const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
    const [badgePrintVisitor, setBadgePrintVisitor] = useState<Visitor | null>(null);
    const [formData, setFormData] = useState<VisitorFormData>({
        name: '',
        phone: '',
        email: '',
        organization: '',
        purpose: '',
        meeting_with: '',
        badge_number: '',
        notes: '',
    });

    useEffect(() => {
        fetchVisitors();
    }, []);

    const fetchVisitors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/crm/visitors/');
            setVisitors(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching visitors:', error);
            toast.error('Failed to load visitor log');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/crm/visitors/', {
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                organization: formData.organization,
                purpose: formData.purpose,
                meeting_with: formData.meeting_with ? parseInt(formData.meeting_with) : null,
                badge_number: formData.badge_number,
                notes: formData.notes,
            });

            toast.success('Visitor checked in successfully');
            setShowForm(false);
            resetForm();
            fetchVisitors();
        } catch (error: any) {
            console.error('Error checking in visitor:', error);
            toast.error(error.response?.data?.detail || 'Failed to check in visitor');
        }
    };

    const handleCheckout = async (id: number) => {
        const feedback = prompt('Enter visitor feedback (optional):');

        try {
            await api.post(`/api/crm/visitors/${id}/checkout/`, {
                feedback: feedback || '',
            });
            toast.success('Visitor checked out successfully');
            fetchVisitors();
        } catch (error: any) {
            console.error('Error checking out visitor:', error);
            toast.error(error.response?.data?.detail || 'Failed to check out visitor');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            phone: '',
            email: '',
            organization: '',
            purpose: '',
            meeting_with: '',
            badge_number: '',
            notes: '',
        });
    };

    const filteredVisitors = visitors.filter((visitor) => {
        const matchesSearch =
            visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.phone.includes(searchTerm) ||
            visitor.visitor_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            visitor.organization.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPurpose = purposeFilter === 'ALL' || visitor.purpose === purposeFilter;
        const matchesStatus =
            statusFilter === 'ALL' ||
            (statusFilter === 'CHECKED_IN' && !visitor.check_out_time) ||
            (statusFilter === 'CHECKED_OUT' && visitor.check_out_time);
        return matchesSearch && matchesPurpose && matchesStatus;
    });

    const totalVisitors = visitors.length;
    const checkedIn = visitors.filter((v) => !v.check_out_time).length;
    const checkedOut = visitors.filter((v) => v.check_out_time).length;
    const todayVisitors = visitors.filter((v) => {
        const today = new Date().toDateString();
        return new Date(v.check_in_time).toDateString() === today;
    }).length;

    const getPurposeBadge = (purpose: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            ENQUIRY: { bg: 'bg-blue-100', text: 'text-blue-800' },
            ADMISSION: { bg: 'bg-green-100', text: 'text-green-800' },
            PARENT_MEETING: { bg: 'bg-purple-100', text: 'text-purple-800' },
            VENDOR: { bg: 'bg-orange-100', text: 'text-orange-800' },
            GUEST: { bg: 'bg-pink-100', text: 'text-pink-800' },
            INTERVIEW: { bg: 'bg-teal-100', text: 'text-teal-800' },
            OTHER: { bg: 'bg-gray-100', text: 'text-gray-800' },
        };
        const badge = badges[purpose] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {purpose.replace('_', ' ')}
            </span>
        );
    };

    const getStatusBadge = (visitor: Visitor) => {
        if (visitor.check_out_time) {
            return (
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 flex items-center gap-1">
                    <UserX size={12} />
                    Checked Out
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1">
                <UserCheck size={12} />
                Checked In
            </span>
        );
    };

    const calculateDuration = (checkIn: string, checkOut?: string) => {
        const start = new Date(checkIn);
        const end = checkOut ? new Date(checkOut) : new Date();
        const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Visitor Log</h1>
                    <p className="text-gray-600 mt-1">Track and manage campus visitor entries and exits</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    Check In Visitor
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Visitors</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{totalVisitors}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Currently In Campus</p>
                            <p className="text-2xl font-bold text-green-600 mt-1">{checkedIn}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                            <UserCheck className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Today's Visitors</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{todayVisitors}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Checked Out</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{checkedOut}</p>
                        </div>
                        <div className="p-3 bg-gray-100 rounded-lg">
                            <UserX className="text-gray-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Check-in Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Check In New Visitor</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter visitor name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter phone number"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                                <input
                                    type="text"
                                    value={formData.organization}
                                    onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Company/Organization"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Visit *</label>
                                <select
                                    value={formData.purpose}
                                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Purpose</option>
                                    <option value="ENQUIRY">Enquiry</option>
                                    <option value="ADMISSION">Admission</option>
                                    <option value="PARENT_MEETING">Parent Meeting</option>
                                    <option value="VENDOR">Vendor</option>
                                    <option value="GUEST">Guest</option>
                                    <option value="INTERVIEW">Interview</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Meeting With (Staff ID)</label>
                                <input
                                    type="number"
                                    value={formData.meeting_with}
                                    onChange={(e) => setFormData({ ...formData, meeting_with: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter staff ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number</label>
                                <input
                                    type="text"
                                    value={formData.badge_number}
                                    onChange={(e) => setFormData({ ...formData, badge_number: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., V001"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={3}
                                    placeholder="Additional notes about the visit"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                                Check In
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, phone, or visitor number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <select
                            value={purposeFilter}
                            onChange={(e) => setPurposeFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Purposes</option>
                            <option value="ENQUIRY">Enquiry</option>
                            <option value="ADMISSION">Admission</option>
                            <option value="PARENT_MEETING">Parent Meeting</option>
                            <option value="VENDOR">Vendor</option>
                            <option value="GUEST">Guest</option>
                            <option value="INTERVIEW">Interview</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="CHECKED_IN">Checked In</option>
                            <option value="CHECKED_OUT">Checked Out</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Visitors Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Visitor #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Name</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Phone</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Organization</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Purpose</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Meeting With</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Check In</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Duration</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredVisitors.map((visitor) => (
                                <tr key={visitor.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{visitor.visitor_number}</td>
                                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">{visitor.name}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{visitor.phone}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{visitor.organization || '-'}</td>
                                    <td className="px-4 py-3 text-center">{getPurposeBadge(visitor.purpose)}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{visitor.meeting_with_name || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(visitor.check_in_time).toLocaleString('en-IN', {
                                            dateStyle: 'short',
                                            timeStyle: 'short',
                                        })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {calculateDuration(visitor.check_in_time, visitor.check_out_time)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">{getStatusBadge(visitor)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {!visitor.check_out_time ? (
                                                <>
                                                    <button
                                                        onClick={() => setBadgePrintVisitor(visitor)}
                                                        className="p-1 text-blue-600 hover:text-blue-800"
                                                        title="Print Badge"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCheckout(visitor.id)}
                                                        className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-100"
                                                    >
                                                        Check Out
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    onClick={() => setSelectedVisitor(visitor)}
                                                    className="p-1 text-gray-600 hover:text-blue-600"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredVisitors.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No visitors found. Check in your first visitor to get started.</p>
                    </div>
                )}
            </div>

            {/* Visitor Details Modal */}
            {selectedVisitor && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Visitor Details</h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Visitor Number</p>
                                    <p className="font-medium">{selectedVisitor.visitor_number}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-medium">{selectedVisitor.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-medium">{selectedVisitor.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium">{selectedVisitor.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Organization</p>
                                    <p className="font-medium">{selectedVisitor.organization || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Purpose</p>
                                    <p className="font-medium">{selectedVisitor.purpose}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Check In Time</p>
                                    <p className="font-medium">
                                        {new Date(selectedVisitor.check_in_time).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Check Out Time</p>
                                    <p className="font-medium">
                                        {selectedVisitor.check_out_time
                                            ? new Date(selectedVisitor.check_out_time).toLocaleString('en-IN')
                                            : '-'}
                                    </p>
                                </div>
                            </div>
                            {selectedVisitor.notes && (
                                <div>
                                    <p className="text-sm text-gray-600">Notes</p>
                                    <p className="font-medium">{selectedVisitor.notes}</p>
                                </div>
                            )}
                            {selectedVisitor.feedback && (
                                <div>
                                    <p className="text-sm text-gray-600">Feedback</p>
                                    <p className="font-medium">{selectedVisitor.feedback}</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedVisitor(null)}
                                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Badge Print Modal */}
            {badgePrintVisitor && (
                <VisitorBadgePrint
                    visitor={badgePrintVisitor}
                    onClose={() => {
                        setBadgePrintVisitor(null);
                        fetchVisitors(); // Refresh to update badge_printed status
                    }}
                />
            )}
        </div>
    );
};

export default VisitorLog;
