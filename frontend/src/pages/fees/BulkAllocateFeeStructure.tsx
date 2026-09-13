import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Select, Badge, useToast, ToastContainer } from '@/design-system';
import api from '../../services/api';

interface FeeStructureOption {
    id: string;
    class_level: string;
    category_name?: string;
    amount: number;
}

interface StudentOption {
    id: string;
    admission_number: string;
    full_name: string;
    current_class?: string;
    section?: string;
}

const BulkAllocateFeeStructure: React.FC = () => {
    const [feeStructures, setFeeStructures] = useState<FeeStructureOption[]>([]);
    const [feeStructureId, setFeeStructureId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<StudentOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState<Map<string, StudentOption>>(new Map());
    const [submitting, setSubmitting] = useState(false);
    const { toasts, removeToast, success, error: showError } = useToast();

    useEffect(() => {
        loadFeeStructures();
    }, []);

    useEffect(() => {
        const term = searchTerm.trim();
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        const handle = setTimeout(() => searchStudents(term), 300);
        return () => clearTimeout(handle);
    }, [searchTerm]);

    const loadFeeStructures = async () => {
        try {
            const res = await api.get('/fees/structures/', { params: { academic_year: 'all', page_size: 100 } });
            const data = res.data.results || res.data;
            setFeeStructures(data);
        } catch (err) {
            console.error('Failed to load fee structures', err);
        }
    };

    const searchStudents = async (term: string) => {
        setSearching(true);
        try {
            const res = await api.get('/students/students/', {
                params: { search: term, page_size: 10, is_active: true },
            });
            const data = res.data.results || res.data;
            setSearchResults(data);
        } catch (err) {
            console.error('Student search failed', err);
        } finally {
            setSearching(false);
        }
    };

    const addStudent = (student: StudentOption) => {
        setSelectedStudents((prev) => {
            const next = new Map(prev);
            next.set(student.id, student);
            return next;
        });
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeStudent = (id: string) => {
        setSelectedStudents((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!feeStructureId) {
            showError('Please select a fee structure');
            return;
        }
        if (selectedStudents.size === 0) {
            showError('Please select at least one student');
            return;
        }

        setSubmitting(true);
        try {
            const response = await api.post('/fees/allocations/bulk_allocate/', {
                fee_structure_id: feeStructureId,
                student_ids: Array.from(selectedStudents.keys()),
            });
            success(response.data.message || `Allocated to ${response.data.count} students`);
            setSelectedStudents(new Map());
            setFeeStructureId('');
        } catch (err: any) {
            showError(err.response?.data?.error || 'Failed to allocate fee structure. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const feeStructureOptions = feeStructures.map((fs) => ({
        value: fs.id,
        label: `${fs.class_level} — ${fs.category_name || 'Fee'} (₹${fs.amount})`,
    }));

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            <ToastContainer toasts={toasts} onDismiss={removeToast} />
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Bulk Allocate Fee Structure</h1>
                <p className="text-gray-600">Search and select students to allocate a fee structure in bulk.</p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <Select
                        label="Fee Structure"
                        options={feeStructureOptions}
                        value={feeStructureId}
                        onChange={setFeeStructureId}
                        searchable
                        placeholder="Select a fee structure..."
                        required
                    />

                    <div>
                        <Input
                            label="Search Students"
                            placeholder="Search by name or admission number..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <p className="text-sm text-gray-500 mt-1">Searching...</p>}
                        {searchResults.length > 0 && (
                            <div className="border rounded mt-2 max-h-56 overflow-y-auto divide-y">
                                {searchResults.map((student) => (
                                    <button
                                        type="button"
                                        key={student.id}
                                        onClick={() => addStudent(student)}
                                        className="w-full text-left px-3 py-2 hover:bg-gray-50 flex justify-between items-center"
                                        disabled={selectedStudents.has(student.id)}
                                    >
                                        <span>
                                            {student.full_name}{' '}
                                            <span className="text-gray-500 text-sm">({student.admission_number})</span>
                                        </span>
                                        {selectedStudents.has(student.id) && (
                                            <span className="text-xs text-gray-400">Added</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Selected Students ({selectedStudents.size})
                        </label>
                        {selectedStudents.size === 0 ? (
                            <p className="text-sm text-gray-500">No students selected yet.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {Array.from(selectedStudents.values()).map((student) => (
                                    <Badge key={student.id} variant="secondary">
                                        {student.full_name} ({student.admission_number})
                                        <button
                                            type="button"
                                            onClick={() => removeStudent(student.id)}
                                            className="ml-2 text-gray-500 hover:text-gray-800"
                                            aria-label={`Remove ${student.full_name}`}
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    <Button type="submit" fullWidth disabled={submitting}>
                        {submitting ? 'Allocating...' : 'Allocate Fee Structure'}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default BulkAllocateFeeStructure;
