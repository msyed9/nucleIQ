/**
 * Habit Board - Full-featured Habit & Discipline Tracking
 * Award points, track habits, and view student leaderboards
 */

import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Loading from '../../components/common/Loading';
import { useToast, ToastContainer } from '@/design-system';
import './Trackers.css';

interface Habit {
    id: string;
    name: string;
    category: 'GOOD' | 'BAD';
    points: number;
    icon: string;
}

interface HabitLog {
    id: string;
    student: string;
    student_name?: string;
    habit: string;
    habit_name: string;
    staff_name: string;
    date: string;
    points_awarded: number;
    remarks: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    current_class?: string;
    photo?: string;
    total_points?: number;
}

interface Section {
    id: number;
    name: string;
    grade_level_name: string;
}

const DEFAULT_GOOD_HABITS = [
    { icon: '📚', name: 'Completed Homework', points: 5 },
    { icon: '🙋', name: 'Active Participation', points: 3 },
    { icon: '🤝', name: 'Helping Others', points: 5 },
    { icon: '🧹', name: 'Kept Area Clean', points: 2 },
    { icon: '⏰', name: 'Punctuality', points: 3 },
    { icon: '📖', name: 'Extra Reading', points: 4 },
    { icon: '🏆', name: 'Excellence Award', points: 10 },
    { icon: '🎯', name: 'Goal Achievement', points: 5 },
];

const DEFAULT_BAD_HABITS = [
    { icon: '📵', name: 'Phone Usage', points: -5 },
    { icon: '💬', name: 'Talking in Class', points: -3 },
    { icon: '⏰', name: 'Late to Class', points: -3 },
    { icon: '📝', name: 'Incomplete Work', points: -4 },
    { icon: '🚫', name: 'Misbehavior', points: -5 },
    { icon: '🗣️', name: 'Disrespectful', points: -7 },
];

const HabitBoard: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [habits, setHabits] = useState<Habit[]>([]);
    const [logs, setLogs] = useState<HabitLog[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
    const [remarks, setRemarks] = useState('');
    const [showAwardModal, setShowAwardModal] = useState(false);
    const [viewMode, setViewMode] = useState<'award' | 'leaderboard' | 'history'>('award');
    const { toasts, removeToast, success, error } = useToast();

    useEffect(() => {
        fetchSections();
        fetchHabits();
        fetchLogs();
    }, []);

    useEffect(() => {
        if (selectedSection) {
            fetchStudents();
        }
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            const res = await api.get('/tenants/sections/');
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setSections(data);
            if (data.length > 0) {
                setSelectedSection(data[0].id.toString());
            }
        } catch (err) {
            console.error('Error fetching sections:', err);
        }
    };

    const fetchHabits = async () => {
        try {
            const res = await api.get('/habits/habits/');
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setHabits(data);
        } catch (err) {
            console.error('Error fetching habits:', err);
            // Use defaults if API fails
            setHabits([]);
        }
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/students/students/?section=${selectedSection}`);
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            // Calculate total points for each student from logs
            const studentsWithPoints = data.map((s: Student) => ({
                ...s,
                total_points: logs
                    .filter(l => l.student === s.id)
                    .reduce((sum, l) => sum + l.points_awarded, 0)
            }));
            setStudents(studentsWithPoints);
        } catch (err) {
            console.error('Error fetching students:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/habits/logs/');
            const data = Array.isArray(res.data) ? res.data : res.data?.results || [];
            setLogs(data);
        } catch (err) {
            console.error('Error fetching logs:', err);
        }
    };

    const awardPoints = async () => {
        if (!selectedStudent || !selectedHabit) return;

        try {
            await api.post('/habits/logs/', {
                student: selectedStudent.id,
                habit: selectedHabit.id,
                remarks: remarks,
            });
            success(`${selectedHabit.points > 0 ? '+' : ''}${selectedHabit.points} points awarded!`);
            setShowAwardModal(false);
            setSelectedStudent(null);
            setSelectedHabit(null);
            setRemarks('');
            fetchLogs();
            fetchStudents();
        } catch (err: any) {
            console.error('Error awarding points:', err);
            error('Failed to award points');
        }
    };

    const quickAward = (student: Student, habitInfo: { icon: string; name: string; points: number }) => {
        // Find matching habit or create a quick log
        const matchingHabit = habits.find(h => h.name === habitInfo.name);
        if (matchingHabit) {
            setSelectedStudent(student);
            setSelectedHabit(matchingHabit);
            setShowAwardModal(true);
        } else {
            // Award without saved habit
            setSelectedStudent(student);
            setShowAwardModal(true);
        }
    };

    const getStudentPoints = (studentId: string): number => {
        return logs
            .filter(l => l.student === studentId)
            .reduce((sum, l) => sum + l.points_awarded, 0);
    };

    const getLeaderboard = (): Student[] => {
        return [...students]
            .map(s => ({ ...s, total_points: getStudentPoints(s.id) }))
            .sort((a, b) => (b.total_points || 0) - (a.total_points || 0))
            .slice(0, 10);
    };

    if (loading && students.length === 0) {
        return <Loading fullScreen text="Loading Habit Board..." />;
    }

    return (
        <>
            <ToastContainer toasts={toasts} onDismiss={removeToast} position="top-right" />
            <div className="tracker-page">
                <div className="page-header">
                    <div>
                        <h1 className="page-title">⭐ Habit & Discipline Board</h1>
                        <p className="page-subtitle">Award points and track student habits</p>
                    </div>
                    <div className="view-tabs">
                        <button
                            className={`view-tab ${viewMode === 'award' ? 'active' : ''}`}
                            onClick={() => setViewMode('award')}
                        >
                            🎯 Award Points
                        </button>
                        <button
                            className={`view-tab ${viewMode === 'leaderboard' ? 'active' : ''}`}
                            onClick={() => setViewMode('leaderboard')}
                        >
                            🏆 Leaderboard
                        </button>
                        <button
                            className={`view-tab ${viewMode === 'history' ? 'active' : ''}`}
                            onClick={() => setViewMode('history')}
                        >
                            📜 History
                        </button>
                    </div>
                </div>

                {viewMode === 'award' && (
                    <>
                        {/* Filters */}
                        <Card className="filters-card">
                            <div className="tracker-filters">
                                <div className="filter-group">
                                    <label>Section</label>
                                    <select
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                    >
                                        {sections.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.grade_level_name} - {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </Card>

                        {/* Student Cards with Quick Actions */}
                        <div className="habit-student-grid">
                            {students.map(student => {
                                const points = getStudentPoints(student.id);
                                return (
                                    <div key={student.id} className="habit-student-card">
                                        <div className="habit-student-header">
                                            <div className="student-avatar">
                                                {student.photo ? (
                                                    <img src={student.photo} alt={student.first_name} />
                                                ) : (
                                                    <span>{student.first_name[0]}{student.last_name?.[0] || ''}</span>
                                                )}
                                            </div>
                                            <div className="student-info">
                                                <h4>{student.first_name} {student.last_name}</h4>
                                                <p>{student.admission_number}</p>
                                            </div>
                                            <div className={`points-badge ${points >= 0 ? 'positive' : 'negative'}`}>
                                                {points >= 0 ? '+' : ''}{points} pts
                                            </div>
                                        </div>

                                        <div className="quick-habit-section">
                                            <h5>Quick Award:</h5>
                                            <div className="habit-chips">
                                                {DEFAULT_GOOD_HABITS.slice(0, 4).map((h, i) => (
                                                    <button
                                                        key={i}
                                                        className="habit-chip good"
                                                        onClick={() => quickAward(student, h)}
                                                        title={`${h.name} (+${h.points})`}
                                                    >
                                                        {h.icon}
                                                    </button>
                                                ))}
                                                {DEFAULT_BAD_HABITS.slice(0, 2).map((h, i) => (
                                                    <button
                                                        key={i}
                                                        className="habit-chip bad"
                                                        onClick={() => quickAward(student, h)}
                                                        title={`${h.name} (${h.points})`}
                                                    >
                                                        {h.icon}
                                                    </button>
                                                ))}
                                                <button
                                                    className="habit-chip more"
                                                    onClick={() => { setSelectedStudent(student); setShowAwardModal(true); }}
                                                >
                                                    ➕
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}

                {viewMode === 'leaderboard' && (
                    <Card>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🏆 Top Performers
                        </h3>
                        <div className="leaderboard">
                            {getLeaderboard().map((student, index) => (
                                <div key={student.id} className={`leaderboard-item rank-${index + 1}`}>
                                    <div className="rank-badge">
                                        {index === 0 && '🥇'}
                                        {index === 1 && '🥈'}
                                        {index === 2 && '🥉'}
                                        {index > 2 && `#${index + 1}`}
                                    </div>
                                    <div className="student-avatar small">
                                        {student.photo ? (
                                            <img src={student.photo} alt={student.first_name} />
                                        ) : (
                                            <span>{student.first_name[0]}</span>
                                        )}
                                    </div>
                                    <div className="leaderboard-info">
                                        <h4>{student.first_name} {student.last_name}</h4>
                                        <p>{student.current_class || student.admission_number}</p>
                                    </div>
                                    <div className={`points-badge ${(student.total_points || 0) >= 0 ? 'positive' : 'negative'}`}>
                                        {(student.total_points || 0) >= 0 ? '+' : ''}{student.total_points || 0} pts
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {viewMode === 'history' && (
                    <Card>
                        <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📜 Recent Activity
                        </h3>
                        <div className="activity-timeline">
                            {logs.slice(0, 20).map(log => (
                                <div
                                    key={log.id}
                                    className={`timeline-item ${log.points_awarded >= 0 ? 'positive' : 'negative'}`}
                                >
                                    <div className="timeline-icon">
                                        {log.points_awarded >= 0 ? '✨' : '⚠️'}
                                    </div>
                                    <div className="timeline-content">
                                        <div className="timeline-header">
                                            <strong>{log.habit_name}</strong>
                                            <span className={`points ${log.points_awarded >= 0 ? 'good' : 'bad'}`}>
                                                {log.points_awarded >= 0 ? '+' : ''}{log.points_awarded}
                                            </span>
                                        </div>
                                        <p className="timeline-meta">
                                            Awarded by {log.staff_name} • {new Date(log.date).toLocaleDateString()}
                                        </p>
                                        {log.remarks && <p className="timeline-remarks">"{log.remarks}"</p>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                )}

                {/* Award Modal */}
                {showAwardModal && selectedStudent && (
                    <div className="modal-overlay" onClick={() => setShowAwardModal(false)}>
                        <div className="modal-content award-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Award Points</h2>
                                <button className="modal-close" onClick={() => setShowAwardModal(false)}>✕</button>
                            </div>
                            <div className="modal-body">
                                <div className="award-student-preview">
                                    <div className="student-avatar">
                                        {selectedStudent.photo ? (
                                            <img src={selectedStudent.photo} alt={selectedStudent.first_name} />
                                        ) : (
                                            <span>{selectedStudent.first_name[0]}</span>
                                        )}
                                    </div>
                                    <div>
                                        <h3>{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                                        <p>{selectedStudent.admission_number}</p>
                                    </div>
                                </div>

                                <div className="habit-selection">
                                    <h4>Good Habits (+Points)</h4>
                                    <div className="habit-grid">
                                        {DEFAULT_GOOD_HABITS.map((h, i) => (
                                            <button
                                                key={i}
                                                className={`habit-option good ${selectedHabit?.name === h.name ? 'selected' : ''}`}
                                                onClick={() => setSelectedHabit({ id: i.toString(), name: h.name, category: 'GOOD', points: h.points, icon: h.icon } as Habit)}
                                            >
                                                <span className="habit-icon">{h.icon}</span>
                                                <span className="habit-name">{h.name}</span>
                                                <span className="habit-points">+{h.points}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <h4>Infractions (-Points)</h4>
                                    <div className="habit-grid">
                                        {DEFAULT_BAD_HABITS.map((h, i) => (
                                            <button
                                                key={i}
                                                className={`habit-option bad ${selectedHabit?.name === h.name ? 'selected' : ''}`}
                                                onClick={() => setSelectedHabit({ id: i.toString(), name: h.name, category: 'BAD', points: h.points, icon: h.icon } as Habit)}
                                            >
                                                <span className="habit-icon">{h.icon}</span>
                                                <span className="habit-name">{h.name}</span>
                                                <span className="habit-points">{h.points}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginTop: '1rem' }}>
                                    <label>Remarks (Optional)</label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Add any notes about this award..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <Button variant="outline" onClick={() => setShowAwardModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={awardPoints}
                                    disabled={!selectedHabit}
                                >
                                    {selectedHabit && (selectedHabit.points >= 0 ? '✨ Award' : '⚠️ Deduct')} {selectedHabit?.points || 0} Points
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default HabitBoard;
