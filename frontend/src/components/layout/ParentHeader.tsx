/**
 * Parent Portal Header
 * 
 * Header for parent portal showing:
 * - Parent name
 * - Active student selector (if multiple children)
 * - Notifications
 */

import React, { useState, useEffect } from 'react';
import { Bell, User, Menu } from 'lucide-react';
import './Layout.css';

interface Student {
    id: number;
    admission_number: string;
    first_name: string;
    last_name: string;
}

interface ParentHeaderProps {
    onMenuClick?: () => void;
}

const ParentHeader: React.FC<ParentHeaderProps> = ({ onMenuClick }) => {
    const [students, setStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        // Load students from localStorage (set during login)
        const studentsData = localStorage.getItem('students');
        if (studentsData) {
            const parsedStudents = JSON.parse(studentsData);
            setStudents(parsedStudents);
            if (parsedStudents.length > 0) {
                setSelectedStudent(parsedStudents[0]);
            }
        }
    }, []);

    return (
        <header className="header">
            <div className="header-left">
                {onMenuClick && (
                    <button
                        className="mobile-menu-btn"
                        onClick={onMenuClick}
                        aria-label="Toggle menu"
                    >
                        <Menu size={20} />
                    </button>
                )}
                {students.length > 1 && (
                    <select
                        value={selectedStudent?.id || ''}
                        onChange={(e) => {
                            const student = students.find(s => s.id === parseInt(e.target.value));
                            setSelectedStudent(student || null);
                        }}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontSize: '14px',
                            fontWeight: 500,
                        }}
                    >
                        {students.map(student => (
                            <option key={student.id} value={student.id}>
                                {student.first_name} {student.last_name} ({student.admission_number})
                            </option>
                        ))}
                    </select>
                )}
                {students.length === 1 && selectedStudent && (
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#64748b' }}>
                        Viewing: {selectedStudent.first_name} {selectedStudent.last_name}
                    </span>
                )}
            </div>

            <div className="header-right">
                <button className="icon-button">
                    <Bell size={20} />
                </button>
                <button className="icon-button">
                    <User size={20} />
                </button>
            </div>
        </header>
    );
};

export default ParentHeader;