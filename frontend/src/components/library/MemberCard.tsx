import React from 'react';

interface MemberCardProps {
    member: {
        id: string;
        member_type: string;
        student?: {
            first_name: string;
            last_name: string;
            admission_number: string;
            photo?: string;
            grade_level?: { name: string };
        };
        staff?: {
            first_name: string;
            last_name: string;
            employee_id: string;
            photo?: string;
            department?: { name: string };
        };
        max_books_allowed: number;
        books_issued_count: number;
        total_fines_due: number;
        status?: string;
    };
    onViewProfile: (id: string) => void;
    onSuspend?: (id: string) => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, onViewProfile, onSuspend }) => {
    const isStudent = member.member_type === 'STUDENT';
    const person = isStudent ? member.student : member.staff;
    const fullName = person ? `${person.first_name} ${person.last_name}` : 'Unknown';
    const identifier = isStudent ? member.student?.admission_number : member.staff?.employee_id;
    const department = isStudent ? member.student?.grade_level?.name : member.staff?.department?.name;
    const hasFines = member.total_fines_due > 0;
    const limitReached = member.books_issued_count >= member.max_books_allowed;

    return (
        <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
                {/* Photo */}
                <div className="flex-shrink-0">
                    {person?.photo ? (
                        <img
                            src={person.photo}
                            alt={fullName}
                            className="w-16 h-16 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                            {fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                        {fullName}
                    </h3>
                    <p className="text-sm text-gray-600">
                        {identifier}  {department || 'N/A'}
                    </p>
                    <div className="mt-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isStudent ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                            }`}>
                            {member.member_type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-500">Books Issued</div>
                    <div className={`text-lg font-bold ${limitReached ? 'text-red-600' : 'text-gray-900'}`}>
                        {member.books_issued_count}/{member.max_books_allowed}
                    </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-xs text-gray-500">Fines Due</div>
                    <div className={`text-lg font-bold ${hasFines ? 'text-red-600' : 'text-gray-900'}`}>
                        {member.total_fines_due.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex gap-2">
                <button
                    onClick={() => onViewProfile(member.id)}
                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                    View Profile
                </button>
                {onSuspend && (
                    <button
                        onClick={() => onSuspend(member.id)}
                        className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                    >
                        Suspend
                    </button>
                )}
            </div>

            {/* Status badges */}
            {(limitReached || hasFines) && (
                <div className="mt-3 flex gap-2">
                    {limitReached && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Limit Reached
                        </span>
                    )}
                    {hasFines && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Has Fines
                        </span>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberCard;
