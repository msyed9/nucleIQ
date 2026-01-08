import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertCircle, CheckCircle, Clock, XCircle, Star, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface Complaint {
    id: number;
    allocation: number;
    room: number;
    student_name?: string;
    room_number?: string;
    complaint_type: string;
    subject: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    reported_date: string;
    assigned_to?: number;
    assigned_to_name?: string;
    assigned_date?: string;
    status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
    resolution_date?: string;
    resolution_notes?: string;
    student_rating?: number;
    student_feedback?: string;
}

interface ComplaintFormData {
    allocation: string;
    room: string;
    complaint_type: string;
    subject: string;
    description: string;
    priority: string;
}

const Complaints: React.FC = () => {
    const navigate = useNavigate();
    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
    const [showForm, setShowForm] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
    const [formData, setFormData] = useState<ComplaintFormData>({
        allocation: '',
        room: '',
        complaint_type: '',
        subject: '',
        description: '',
        priority: 'MEDIUM',
    });

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/hostel/complaints/');
            setComplaints(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching complaints:', error);
            toast.error('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/api/hostel/complaints/', {
                allocation: parseInt(formData.allocation),
                room: formData.room ? parseInt(formData.room) : null,
                complaint_type: formData.complaint_type,
                subject: formData.subject,
                description: formData.description,
                priority: formData.priority,
            });

            toast.success('Complaint registered successfully');
            setShowForm(false);
            resetForm();
            fetchComplaints();
        } catch (error: any) {
            console.error('Error creating complaint:', error);
            toast.error(error.response?.data?.detail || 'Failed to register complaint');
        }
    };

    const handleAssign = async (id: number) => {
        const staffId = prompt('Enter staff ID to assign:');
        if (!staffId) return;

        try {
            await api.post(`/api/hostel/complaints/${id}/assign/`, {
                staff_id: parseInt(staffId),
            });
            toast.success('Complaint assigned successfully');
            fetchComplaints();
        } catch (error: any) {
            console.error('Error assigning complaint:', error);
            toast.error(error.response?.data?.detail || 'Failed to assign complaint');
        }
    };

    const handleResolve = async (id: number) => {
        const notes = prompt('Enter resolution notes:');
        if (!notes) return;

        try {
            await api.post(`/api/hostel/complaints/${id}/resolve/`, {
                resolution_notes: notes,
            });
            toast.success('Complaint resolved successfully');
            fetchComplaints();
        } catch (error: any) {
            console.error('Error resolving complaint:', error);
            toast.error(error.response?.data?.detail || 'Failed to resolve complaint');
        }
    };

    const handleFeedback = async (id: number) => {
        const rating = prompt('Enter rating (1-5):');
        const feedback = prompt('Enter feedback:');
        if (!rating) return;

        try {
            await api.post(`/api/hostel/complaints/${id}/feedback/`, {
                rating: parseInt(rating),
                feedback: feedback || '',
            });
            toast.success('Feedback submitted successfully');
            fetchComplaints();
        } catch (error: any) {
            console.error('Error submitting feedback:', error);
            toast.error(error.response?.data?.detail || 'Failed to submit feedback');
        }
    };

    const resetForm = () => {
        setFormData({
            allocation: '',
            room: '',
            complaint_type: '',
            subject: '',
            description: '',
            priority: 'MEDIUM',
        });
    };

    const filteredComplaints = complaints.filter((complaint) => {
        const matchesSearch =
            complaint.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            complaint.complaint_type.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || complaint.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || complaint.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const pendingCount = complaints.filter((c) => c.status === 'PENDING').length;
    const assignedCount = complaints.filter((c) => c.status === 'ASSIGNED' || c.status === 'IN_PROGRESS').length;
    const resolvedCount = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const urgentCount = complaints.filter((c) => c.priority === 'URGENT' && c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;

    const getPriorityBadge = (priority: string) => {
        const badges: Record<string, { bg: string; text: string }> = {
            LOW: { bg: 'bg-gray-100', text: 'text-gray-800' },
            MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800' },
            HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
            URGENT: { bg: 'bg-red-100', text: 'text-red-800' },
        };
        const badge = badges[priority] || { bg: 'bg-gray-100', text: 'text-gray-800' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                {priority}
            </span>
        );
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { bg: string; text: string; icon: any }> = {
            PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
            ASSIGNED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
            IN_PROGRESS: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Clock },
            RESOLVED: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
            CLOSED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: CheckCircle },
            REJECTED: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
        };
        const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
        const Icon = badge.icon;
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text} flex items-center gap-1`}>
                <Icon size={12} />
                {status.replace('_', ' ')}
            </span>
        );
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
                    <h1 className="text-2xl font-bold text-gray-800">Hostel Complaints</h1>
                    <p className="text-gray-600 mt-1">Track and manage hostel maintenance requests and complaints</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => navigate('/hostel/complaints/analytics')}
                        className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                    >
                        <BarChart3 size={18} />
                        Analytics
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        New Complaint
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total Complaints</p>
                            <p className="text-2xl font-bold text-gray-800 mt-1">{complaints.length}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <AlertCircle className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Pending</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingCount}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-lg">
                            <Clock className="text-yellow-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">In Progress</p>
                            <p className="text-2xl font-bold text-blue-600 mt-1">{assignedCount}</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Clock className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Urgent Issues</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{urgentCount}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-lg">
                            <AlertCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* New Complaint Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Register New Complaint</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Allocation ID</label>
                                <input
                                    type="number"
                                    value={formData.allocation}
                                    onChange={(e) => setFormData({ ...formData, allocation: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter allocation ID"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Room ID (Optional)</label>
                                <input
                                    type="number"
                                    value={formData.room}
                                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter room ID"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Complaint Type</label>
                                <select
                                    value={formData.complaint_type}
                                    onChange={(e) => setFormData({ ...formData, complaint_type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="">Select Type</option>
                                    <option value="ELECTRICAL">Electrical</option>
                                    <option value="PLUMBING">Plumbing</option>
                                    <option value="FURNITURE">Furniture</option>
                                    <option value="CLEANLINESS">Cleanliness</option>
                                    <option value="PEST_CONTROL">Pest Control</option>
                                    <option value="AC_REPAIR">AC Repair</option>
                                    <option value="INTERNET">Internet/WiFi</option>
                                    <option value="SECURITY">Security</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="LOW">Low</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="HIGH">High</option>
                                    <option value="URGENT">Urgent</option>
                                </select>
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Brief description of the issue"
                                    required
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    rows={4}
                                    placeholder="Detailed description of the complaint"
                                    required
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
                                Submit Complaint
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
                            placeholder="Search complaints..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="PENDING">Pending</option>
                            <option value="ASSIGNED">Assigned</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="RESOLVED">Resolved</option>
                            <option value="CLOSED">Closed</option>
                            <option value="REJECTED">Rejected</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Priority</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Complaints Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Room</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Type</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Subject</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Priority</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Assigned To</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredComplaints.map((complaint) => (
                                <tr key={complaint.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(complaint.reported_date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{complaint.student_name || 'N/A'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{complaint.room_number || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800">{complaint.complaint_type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={complaint.subject}>
                                        {complaint.subject}
                                    </td>
                                    <td className="px-4 py-3 text-center">{getPriorityBadge(complaint.priority)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center">{getStatusBadge(complaint.status)}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{complaint.assigned_to_name || '-'}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            {complaint.status === 'PENDING' && (
                                                <button
                                                    onClick={() => handleAssign(complaint.id)}
                                                    className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                                                >
                                                    Assign
                                                </button>
                                            )}
                                            {(complaint.status === 'ASSIGNED' || complaint.status === 'IN_PROGRESS') && (
                                                <button
                                                    onClick={() => handleResolve(complaint.id)}
                                                    className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                            {complaint.status === 'RESOLVED' && !complaint.student_rating && (
                                                <button
                                                    onClick={() => handleFeedback(complaint.id)}
                                                    className="px-2 py-1 text-xs text-yellow-600 bg-yellow-50 rounded hover:bg-yellow-100 flex items-center gap-1"
                                                >
                                                    <Star size={12} />
                                                    Feedback
                                                </button>
                                            )}
                                            {complaint.student_rating && (
                                                <div className="flex items-center gap-1 text-yellow-600">
                                                    <Star size={14} fill="currentColor" />
                                                    <span className="text-xs font-medium">{complaint.student_rating}/5</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredComplaints.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No complaints found. Register your first complaint to get started.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Complaints;
