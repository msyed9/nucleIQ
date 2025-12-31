import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import api from '../../services/api';
import './Attendance.css';

interface Student {
    id: string;
    admission_number: string;
    full_name: string;
    class_name: string;
    section: string;
}

// Attendance record interface removed as it's handled inline in mark_bulk payload

const MarkAttendance: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { t } = useTranslation();
    const [selectedDate, setSelectedDate] = useState(
        new Date().toISOString().split('T')[0]
    );

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const response = await api.get('/students/students/');
            const studentList = response.data.results || response.data;
            setStudents(studentList);

            // Initialize attendance as all present
            const initialAttendance: Record<string, string> = {};
            studentList.forEach((student: Student) => {
                initialAttendance[student.id] = 'PRESENT'; // Match backend enum
            });
            setAttendance(initialAttendance);
        } catch (error) {
            console.error('Error fetching students for attendance:', error);
            // Mock data
            const mockStudents = [
                { id: '1', admission_number: 'ADM001', full_name: 'John Doe', class_name: 'Class 10', section: 'A' },
                { id: '2', admission_number: 'ADM002', full_name: 'Jane Smith', class_name: 'Class 10', section: 'A' },
                { id: '3', admission_number: 'ADM003', full_name: 'Mike Johnson', class_name: 'Class 10', section: 'A' },
            ];
            setStudents(mockStudents);
            const initialAttendance: Record<string, string> = {};
            mockStudents.forEach((student) => {
                initialAttendance[student.id] = 'PRESENT';
            });
            setAttendance(initialAttendance);
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceChange = (studentId: string, status: string) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            const attendance_data = Object.entries(attendance).map(
                ([student_id, status]) => ({
                    record_type: 'STUDENT',
                    entity_id: student_id,
                    status: status
                })
            );

            await api.post('/attendance/records/mark_bulk/', {
                date: selectedDate,
                attendance: attendance_data,
            });

            alert('Attendance marked successfully! 🎉');
        } catch (error) {
            console.error('Error marking attendance:', error);
            alert('Failed to mark attendance. (Using mock mode fallback)');
        } finally {
            setSaving(false);
        }
    };

    const stats = {
        total: students.length,
        present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
        absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
        late: Object.values(attendance).filter((s) => s === 'LATE').length,
    };

    if (loading) return <Loading fullScreen text={t('attendance.loading')} />;

    return (
        <div className="attendance-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('attendance.title')}</h1>
                    <p className="page-subtitle">{t('attendance.subtitle')}</p>
                </div>
                <div className="date-selector">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="date-input"
                    />
                </div>
            </div>

            {/* Stats */}
            <div className="attendance-stats">
                <Card className="stat-card-small">
                    <div className="stat-small">
                        <span className="stat-label-small">{t('attendance.total')}</span>
                        <span className="stat-value-small">{stats.total}</span>
                    </div>
                </Card>
                <Card className="stat-card-small stat-present">
                    <div className="stat-small">
                        <span className="stat-label-small">{t('attendance.present')}</span>
                        <span className="stat-value-small">{stats.present}</span>
                    </div>
                </Card>
                <Card className="stat-card-small stat-absent">
                    <div className="stat-small">
                        <span className="stat-label-small">{t('attendance.absent')}</span>
                        <span className="stat-value-small">{stats.absent}</span>
                    </div>
                </Card>
                <Card className="stat-card-small stat-late">
                    <div className="stat-small">
                        <span className="stat-label-small">{t('attendance.late')}</span>
                        <span className="stat-value-small">{stats.late}</span>
                    </div>
                </Card>
            </div>

            {/* Attendance Table */}
            <Card>
                <div className="table-container">
                    <table className="attendance-table">
                        <thead>
                            <tr>
                                <th>{t('attendance.admission_no')}</th>
                                <th>{t('attendance.student_name')}</th>
                                <th>{t('attendance.class')}</th>
                                <th>{t('attendance.section')}</th>
                                <th>{t('attendance.status')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td>{student.admission_number}</td>
                                    <td className="student-name">{student.full_name}</td>
                                    <td>{student.class_name}</td>
                                    <td>{student.section}</td>
                                    <td>
                                        <div className="attendance-buttons">
                                            <button
                                                className={`attendance-btn ${attendance[student.id] === 'PRESENT' ? 'active-present' : ''
                                                    }`}
                                                onClick={() => handleAttendanceChange(student.id, 'PRESENT')}
                                            >
                                                ✓ {t('attendance.present')}
                                            </button>
                                            <button
                                                className={`attendance-btn ${attendance[student.id] === 'ABSENT' ? 'active-absent' : ''
                                                    }`}
                                                onClick={() => handleAttendanceChange(student.id, 'ABSENT')}
                                            >
                                                ✗ {t('attendance.absent')}
                                            </button>
                                            <button
                                                className={`attendance-btn ${attendance[student.id] === 'LATE' ? 'active-late' : ''
                                                    }`}
                                                onClick={() => handleAttendanceChange(student.id, 'LATE')}
                                            >
                                                ⏰ {t('attendance.late')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="attendance-footer">
                    <Button
                        variant="primary"
                        size="large"
                        onClick={handleSubmit}
                        loading={saving}
                        fullWidth
                    >
                        {t('attendance.save')}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default MarkAttendance;