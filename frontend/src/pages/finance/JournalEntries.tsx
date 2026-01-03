import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, FileText, Printer, Copy, RotateCcw } from 'lucide-react';
import { JournalEntryForm } from '../../components/finance/JournalEntryForm';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

interface JournalEntry {
    id: number;
    entry_number: string;
    date: string;
    reference: string;
    description: string;
    total_amount: number;
    status: 'DRAFT' | 'POSTED' | 'REVERSED';
    created_by: string;
    created_at: string;
    line_items: any[];
}

export const JournalEntries: React.FC = () => {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        fetchEntries();
        fetchAccounts();
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterStatus !== 'ALL') params.append('status', filterStatus);
            if (dateFrom) params.append('from_date', dateFrom);
            if (dateTo) params.append('to_date', dateTo);
            if (searchTerm) params.append('search', searchTerm);

            const response = await api.get(`/api/finance/journal-entries/?${params.toString()}`);
            setEntries(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            toast.error('Failed to load journal entries');
        } finally {
            setLoading(false);
        }
    };

    const fetchAccounts = async () => {
        try {
            const response = await api.get('/api/finance/accounts/');
            setAccounts(response.data.results || response.data);
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleAddEntry = () => {
        setSelectedEntry(null);
        setShowForm(true);
    };

    const handleEditEntry = (entry: JournalEntry) => {
        if (entry.status !== 'DRAFT') {
            toast.error('Only draft entries can be edited');
            return;
        }
        setSelectedEntry(entry);
        setShowForm(true);
    };

    const handleDeleteEntry = async (entry: JournalEntry) => {
        if (entry.status !== 'DRAFT') {
            toast.error('Only draft entries can be deleted');
            return;
        }

        if (!confirm(`Are you sure you want to delete entry ${entry.entry_number}?`)) {
            return;
        }

        try {
            await api.delete(`/api/finance/journal-entries/${entry.id}/`);
            toast.success('Entry deleted successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error deleting entry:', error);
            toast.error('Failed to delete entry');
        }
    };

    const handlePostEntry = async (entry: JournalEntry) => {
        try {
            await api.post(`/api/finance/journal-entries/${entry.id}/post/`);
            toast.success('Entry posted successfully');
            fetchEntries();
        } catch (error: any) {
            console.error('Error posting entry:', error);
            toast.error(error.response?.data?.message || 'Failed to post entry');
        }
    };

    const handleReverseEntry = async (entry: JournalEntry) => {
        if (!confirm(`Are you sure you want to reverse entry ${entry.entry_number}?`)) {
            return;
        }

        try {
            await api.post(`/api/finance/journal-entries/${entry.id}/reverse/`);
            toast.success('Entry reversed successfully');
            fetchEntries();
        } catch (error) {
            console.error('Error reversing entry:', error);
            toast.error('Failed to reverse entry');
        }
    };

    const handleDuplicateEntry = (entry: JournalEntry) => {
        const duplicated = {
            ...entry,
            id: undefined,
            entry_number: undefined,
            status: 'DRAFT',
            date: new Date().toISOString().split('T')[0],
        };
        setSelectedEntry(duplicated as any);
        setShowForm(true);
    };

    const handleSubmitForm = async (data: any) => {
        try {
            if (selectedEntry && selectedEntry.id) {
                await api.patch(`/api/finance/journal-entries/${selectedEntry.id}/`, data);
                toast.success('Entry updated successfully');
            } else {
                await api.post('/api/finance/journal-entries/', data);
                toast.success('Entry created successfully');
            }
            setShowForm(false);
            fetchEntries();
        } catch (error: any) {
            console.error('Error saving entry:', error);
            toast.error(error.response?.data?.message || 'Failed to save entry');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            DRAFT: 'bg-yellow-100 text-yellow-800',
            POSTED: 'bg-green-100 text-green-800',
            REVERSED: 'bg-red-100 text-red-800',
        };
        return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
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
                    <h1 className="text-2xl font-bold text-gray-800">Journal Entries</h1>
                    <p className="text-gray-600 mt-1">Manage double-entry journal transactions</p>
                </div>
                <button
                    onClick={handleAddEntry}
                    className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Entry
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by reference or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchEntries()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <option value="ALL">All Status</option>
                            <option value="DRAFT">Draft</option>
                            <option value="POSTED">Posted</option>
                            <option value="REVERSED">Reversed</option>
                        </select>
                    </div>

                    <div>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="From Date"
                        />
                    </div>

                    <div>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="To Date"
                        />
                    </div>
                </div>

                <div className="flex justify-end mt-4">
                    <button
                        onClick={fetchEntries}
                        className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Filter size={16} />
                        Apply Filters
                    </button>
                </div>
            </div>

            {/* Entries Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Entry #</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reference</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Description</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase">Amount</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Created By</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {entries.map((entry) => (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{entry.entry_number}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {new Date(entry.date).toLocaleDateString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{entry.reference || '-'}</td>
                                    <td className="px-4 py-3 text-sm text-gray-800 max-w-xs truncate">{entry.description}</td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-800">
                                        ₹{entry.total_amount?.toLocaleString('en-IN')}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(entry.status)}`}>
                                            {entry.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{entry.created_by}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleDuplicateEntry(entry)}
                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Duplicate"
                                            >
                                                <Copy size={16} />
                                            </button>
                                            {entry.status === 'DRAFT' && (
                                                <>
                                                    <button
                                                        onClick={() => handleEditEntry(entry)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit"
                                                    >
                                                        <FileText size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePostEntry(entry)}
                                                        className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100"
                                                    >
                                                        Post
                                                    </button>
                                                </>
                                            )}
                                            {entry.status === 'POSTED' && (
                                                <button
                                                    onClick={() => handleReverseEntry(entry)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                    title="Reverse"
                                                >
                                                    <RotateCcw size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => window.print()}
                                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                title="Print"
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {entries.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <p>No journal entries found. Create your first entry to get started.</p>
                    </div>
                )}
            </div>

            {/* Form Modal */}
            {showForm && (
                <JournalEntryForm
                    entry={selectedEntry}
                    accounts={accounts}
                    onSubmit={handleSubmitForm}
                    onClose={() => setShowForm(false)}
                />
            )}
        </div>
    );
};


export default JournalEntries;