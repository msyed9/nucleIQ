import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import MemberCard from '../../components/library/MemberCard';

interface LibraryMember {
    id: string;
    member_type: 'STUDENT' | 'STAFF';
    student?: {
        id: string;
        first_name: string;
        last_name: string;
        admission_number: string;
        photo?: string;
        grade_level?: { id: string; name: string };
    };
    staff?: {
        id: string;
        first_name: string;
        last_name: string;
        employee_id: string;
        photo?: string;
        department?: { id: string; name: string };
    };
    max_books_allowed: number;
    books_issued_count: number;
    total_fines_due: number;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
}

interface Staff {
    id: string;
    first_name: string;
    last_name: string;
    employee_id: string;
}

interface BookIssue {
    id: string;
    copy: { barcode: string; book: { title: string; author: string } };
    issued_date: string;
    due_date: string;
    status: string;
}

const LibraryMembers: React.FC = () => {
    const queryClient = useQueryClient();
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [showBulkEnrollModal, setShowBulkEnrollModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [memberTypeFilter, setMemberTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

    // Enrollment form states
    const [enrollType, setEnrollType] = useState<'STUDENT' | 'STAFF'>('STUDENT');
    const [selectedPersonId, setSelectedPersonId] = useState('');
    const [maxBooks, setMaxBooks] = useState(5);

    // Bulk enrollment
    const [selectedGradeId, setSelectedGradeId] = useState('');

    // Fetch members
    const { data: members, isLoading } = useQuery<LibraryMember[]>({
        queryKey: ['library-members'],
        queryFn: async () => {
            const response = await axios.get('/api/library/members/');
            return response.data;
        }
    });

    // Fetch students for enrollment
    const { data: students } = useQuery<Student[]>({
        queryKey: ['students-for-enrollment'],
        queryFn: async () => {
            const response = await axios.get('/api/students/students/');
            return response.data.results || response.data;
        },
        enabled: showEnrollModal && enrollType === 'STUDENT'
    });

    // Fetch staff for enrollment
    const { data: staff } = useQuery<Staff[]>({
        queryKey: ['staff-for-enrollment'],
        queryFn: async () => {
            const response = await axios.get('/api/staff/staff/');
            return response.data.results || response.data;
        },
        enabled: showEnrollModal && enrollType === 'STAFF'
    });

    // Fetch grades for bulk enrollment
    const { data: grades } = useQuery<any[]>({
        queryKey: ['grades'],
        queryFn: async () => {
            const response = await axios.get('/api/tenants/grade-levels/');
            return response.data;
        },
        enabled: showBulkEnrollModal
    });

    // Fetch member details and history
    const { data: memberDetailsAny } = useQuery<{
        current_issues: BookIssue[];
        issue_history: BookIssue[];
        fine_history: any[];
    }>({
        queryKey: ['member-details', selectedMember?.id],
        queryFn: async () => {
            if (!selectedMember) return { current_issues: [], issue_history: [], fine_history: [] };
            const [issuesRes, historyRes] = await Promise.all([
                axios.get(`/api/library/issues/?member=${selectedMember.id}&status=ISSUED`),
                axios.get(`/api/library/issues/?member=${selectedMember.id}`)
            ]);
            return {
                current_issues: issuesRes.data,
                issue_history: historyRes.data,
                fine_history: []
            };
        },
        enabled: !!selectedMember && showProfileModal
    });

    const memberDetails = memberDetailsAny as any;

    // Enroll member mutation
    const enrollMemberMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await axios.post('/api/library/members/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library-members'] });
            setShowEnrollModal(false);
            resetForm();
            alert('Member enrolled successfully!');
        },
        onError: (error: any) => {
            alert(`Error: ${error.response?.data?.error || 'Failed to enroll member'}`);
        }
    });

    // Bulk enroll mutation
    const bulkEnrollMutation = useMutation({
        mutationFn: async (gradeId: string) => {
            const response = await axios.post('/api/library/members/bulk_enroll/', {
                grade_id: gradeId,
                max_books_allowed: maxBooks
            });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['library-members'] });
            setShowBulkEnrollModal(false);
            alert(`Successfully enrolled ${data.count} students!`);
        },
        onError: () => {
            alert('Failed to bulk enroll members');
        }
    });

    // Suspend member mutation
    const suspendMemberMutation = useMutation({
        mutationFn: async (memberId: string) => {
            const response = await axios.post(`/api/library/members/${memberId}/suspend/`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['library-members'] });
            alert('Member suspended successfully');
        }
    });

    const resetForm = () => {
        setEnrollType('STUDENT');
        setSelectedPersonId('');
        setMaxBooks(5);
    };

    const handleEnrollMember = () => {
        const data: any = {
            member_type: enrollType,
            max_books_allowed: maxBooks
        };

        if (enrollType === 'STUDENT') {
            data.student = selectedPersonId;
        } else {
            data.staff = selectedPersonId;
        }

        enrollMemberMutation.mutate(data);
    };

    const handleBulkEnroll = () => {
        if (!selectedGradeId) {
            alert('Please select a grade');
            return;
        }
        bulkEnrollMutation.mutate(selectedGradeId);
    };

    const handleViewProfile = (memberId: string) => {
        const member = members?.find(m => m.id === memberId);
        if (member) {
            setSelectedMember(member);
            setShowProfileModal(true);
        }
    };

    const handleSuspend = (memberId: string) => {
        if (window.confirm('Are you sure you want to suspend this member?')) {
            suspendMemberMutation.mutate(memberId);
        }
    };

    const filteredMembers = members?.filter(member => {
        const typeMatch = memberTypeFilter === 'ALL' || member.member_type === memberTypeFilter;

        let statusMatch = true;
        if (statusFilter === 'WITH_FINES') {
            statusMatch = member.total_fines_due > 0;
        } else if (statusFilter === 'OVERDUE') {
            // This would require fetching issue data, simplified for now
            statusMatch = true;
        }

        if (!searchTerm) return typeMatch && statusMatch;

        const search = searchTerm.toLowerCase();
        const person = member.member_type === 'STUDENT' ? member.student : member.staff;
        const fullName = person ? `${person.first_name} ${person.last_name}`.toLowerCase() : '';
        const identifier = member.member_type === 'STUDENT'
            ? member.student?.admission_number?.toLowerCase()
            : member.staff?.employee_id?.toLowerCase();

        return (fullName.includes(search) || identifier?.includes(search)) && typeMatch && statusMatch;
    }) || [];

    const getMemberFullName = (member: LibraryMember) => {
        const person = member.member_type === 'STUDENT' ? member.student : member.staff;
        return person ? `${person.first_name} ${person.last_name}` : 'Unknown';
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">
                            Library Members
                        </h1>
                        <p className="text-gray-600 mt-1">Manage library memberships and member activities</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowEnrollModal(true)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Enroll Member
                        </button>
                        <button
                            onClick={() => setShowBulkEnrollModal(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            Bulk Enroll Class
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Total Members</div>
                    <div className="text-2xl font-bold text-gray-800">{members?.length || 0}</div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Students</div>
                    <div className="text-2xl font-bold text-blue-600">
                        {members?.filter(m => m.member_type === 'STUDENT').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">Staff</div>
                    <div className="text-2xl font-bold text-purple-600">
                        {members?.filter(m => m.member_type === 'STAFF').length || 0}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-sm text-gray-500">With Fines</div>
                    <div className="text-2xl font-bold text-red-600">
                        {members?.filter(m => m.total_fines_due > 0).length || 0}
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="mb-6 flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow">
                <input
                    type="text"
                    placeholder=" Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
                />
                <select
                    value={memberTypeFilter}
                    onChange={(e) => setMemberTypeFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="ALL">All Types</option>
                    <option value="STUDENT">Students Only</option>
                    <option value="STAFF">Staff Only</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                >
                    <option value="ALL">All Status</option>
                    <option value="WITH_FINES">With Fines</option>
                    <option value="OVERDUE">With Overdue</option>
                </select>
            </div>

            {/* Members Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12">Loading members...</div>
                ) : filteredMembers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        <div className="text-6xl mb-4"></div>
                        <p>No members found</p>
                    </div>
                ) : (
                    filteredMembers.map(member => (
                        <MemberCard
                            key={member.id}
                            member={member}
                            onViewProfile={handleViewProfile}
                            onSuspend={handleSuspend}
                        />
                    ))
                )}
            </div>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Enroll Library Member</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Member Type
                                </label>
                                <select
                                    value={enrollType}
                                    onChange={(e) => setEnrollType(e.target.value as 'STUDENT' | 'STAFF')}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="STUDENT">Student</option>
                                    <option value="STAFF">Staff</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select {enrollType === 'STUDENT' ? 'Student' : 'Staff Member'}
                                </label>
                                <select
                                    value={selectedPersonId}
                                    onChange={(e) => setSelectedPersonId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">-- Select --</option>
                                    {enrollType === 'STUDENT' ? (
                                        students?.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.first_name} {student.last_name} ({student.admission_number})
                                            </option>
                                        ))
                                    ) : (
                                        staff?.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.first_name} {s.last_name} ({s.employee_id})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Books Allowed
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={maxBooks}
                                    onChange={(e) => setMaxBooks(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowEnrollModal(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleEnrollMember}
                                disabled={!selectedPersonId || enrollMemberMutation.isPending}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
                            >
                                {enrollMemberMutation.isPending ? 'Enrolling...' : 'Enroll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Enroll Modal */}
            {showBulkEnrollModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Bulk Enroll Class</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will enroll all students from the selected grade/section as library members.
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Select Grade/Class
                                </label>
                                <select
                                    value={selectedGradeId}
                                    onChange={(e) => setSelectedGradeId(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">-- Select Grade --</option>
                                    {grades?.map(grade => (
                                        <option key={grade.id} value={grade.id}>
                                            {grade.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Max Books Per Student
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={maxBooks}
                                    onChange={(e) => setMaxBooks(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowBulkEnrollModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkEnroll}
                                disabled={!selectedGradeId || bulkEnrollMutation.isPending}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300"
                            >
                                {bulkEnrollMutation.isPending ? 'Enrolling...' : 'Enroll All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Member Profile Modal */}
            {showProfileModal && selectedMember && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-2xl font-bold">{getMemberFullName(selectedMember)}</h3>
                                <p className="text-gray-600">
                                    {selectedMember.member_type} Member
                                </p>
                            </div>
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >

                            </button>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">Books Limit</div>
                                <div className="text-xl font-bold">{selectedMember.max_books_allowed}</div>
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">Currently Issued</div>
                                <div className="text-xl font-bold">{selectedMember.books_issued_count}</div>
                            </div>
                            <div className="bg-red-50 rounded-lg p-4">
                                <div className="text-sm text-gray-600">Total Fines</div>
                                <div className="text-xl font-bold">{selectedMember.total_fines_due.toFixed(2)}</div>
                            </div>
                        </div>

                        {/* Current Issues */}
                        <div className="mb-6">
                            <h4 className="text-lg font-semibold mb-3">Current Issues</h4>
                            {memberDetails?.current_issues && memberDetails.current_issues.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Book</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Issued</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Due</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {memberDetails.current_issues.map(issue => (
                                                <tr key={issue.id}>
                                                    <td className="px-4 py-2 text-sm">{issue.copy.book.title}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {new Date(issue.issued_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {new Date(issue.due_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                            {issue.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No books currently issued</p>
                            )}
                        </div>

                        {/* Issue History */}
                        <div>
                            <h4 className="text-lg font-semibold mb-3">Issue History</h4>
                            {memberDetails?.issue_history && memberDetails.issue_history.length > 0 ? (
                                <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Book</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Issued</th>
                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Returned</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {memberDetails.issue_history.slice(0, 20).map(issue => (
                                                <tr key={issue.id}>
                                                    <td className="px-4 py-2 text-sm">{issue.copy.book.title}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {new Date(issue.issued_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {issue.status === 'RETURNED'
                                                            ? new Date(issue.due_date).toLocaleDateString()
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No issue history</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setShowProfileModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LibraryMembers;
