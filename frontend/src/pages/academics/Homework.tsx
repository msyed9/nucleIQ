/**
 * Homework Management Page
 * Display and manage daily homework for students
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, isToday, isTomorrow, isPast, addDays } from 'date-fns';
import api from '../../services/api';
import './Homework.css';

interface Homework {
    id: number;
    title: string;
    description: string;
    subject_id: number;
    subject_name: string;
    section_id: number;
    section_name: string;
    teacher_name: string;
    assigned_date: string;
    due_date: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    attachment?: string;
    is_completed?: boolean;
}

const PRIORITY_COLORS = {
    'LOW': '#10B981',
    'MEDIUM': '#F59E0B',
    'HIGH': '#EF4444',
};

const getMockHomework = (): Homework[] => {
    const today = new Date();
    return [
        { id: 1, title: 'Complete Chapter 5 Exercises', description: 'Solve problems 1-20 from the textbook', subject_id: 1, subject_name: 'Mathematics', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Dr. Smith', assigned_date: format(today, 'yyyy-MM-dd'), due_date: format(addDays(today, 1), 'yyyy-MM-dd'), priority: 'HIGH', is_completed: false },
        { id: 2, title: 'Essay on Climate Change', description: 'Write a 500-word essay on the effects of climate change', subject_id: 2, subject_name: 'English', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Ms. Johnson', assigned_date: format(today, 'yyyy-MM-dd'), due_date: format(addDays(today, 2), 'yyyy-MM-dd'), priority: 'MEDIUM', is_completed: false },
        { id: 3, title: 'Lab Report - Pendulum Experiment', description: 'Complete the lab report for the simple pendulum experiment', subject_id: 3, subject_name: 'Physics', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Mr. Brown', assigned_date: format(addDays(today, -1), 'yyyy-MM-dd'), due_date: format(today, 'yyyy-MM-dd'), priority: 'HIGH', is_completed: true },
        { id: 4, title: 'Read Chapter 12', description: 'Read and summarize the chapter on Chemical Reactions', subject_id: 4, subject_name: 'Chemistry', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Dr. Lee', assigned_date: format(today, 'yyyy-MM-dd'), due_date: format(addDays(today, 3), 'yyyy-MM-dd'), priority: 'LOW', is_completed: false },
        { id: 5, title: 'History Project Research', description: 'Research on World War II for the upcoming project', subject_id: 6, subject_name: 'History', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Mr. White', assigned_date: format(addDays(today, -2), 'yyyy-MM-dd'), due_date: format(addDays(today, -1), 'yyyy-MM-dd'), priority: 'MEDIUM', is_completed: false },
        { id: 6, title: 'Programming Assignment', description: 'Complete the Python coding exercises on loops', subject_id: 7, subject_name: 'Computer Science', section_id: 1, section_name: 'Class 10-A', teacher_name: 'Ms. Tech', assigned_date: format(today, 'yyyy-MM-dd'), due_date: format(addDays(today, 4), 'yyyy-MM-dd'), priority: 'MEDIUM', is_completed: false },
    ];
};

const Homework: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
    const [showModal, setShowModal] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

    const { data: homeworkList = getMockHomework(), isLoading } = useQuery<Homework[]>({
        queryKey: ['homework'],
        queryFn: async () => {
            try {
                const response = await api.get('/academics/homework/');
                return response.data.results || response.data || getMockHomework();
            } catch {
                return getMockHomework();
            }
        },
    });

    const getDueDateLabel = (dueDate: string) => {
        const date = new Date(dueDate);
        if (isToday(date)) return { text: 'Today', color: '#EF4444', bg: '#FEE2E2' };
        if (isTomorrow(date)) return { text: 'Tomorrow', color: '#F59E0B', bg: '#FEF3C7' };
        if (isPast(date)) return { text: 'Overdue', color: '#DC2626', bg: '#FEE2E2' };
        return { text: format(date, 'MMM dd'), color: '#10B981', bg: '#D1FAE5' };
    };

    const filteredHomework = homeworkList.filter((hw: Homework) => {
        const matchesSearch = hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            hw.subject_name.toLowerCase().includes(searchQuery.toLowerCase());

        if (filterTab === 'pending') return matchesSearch && !hw.is_completed && !isPast(new Date(hw.due_date));
        if (filterTab === 'completed') return matchesSearch && hw.is_completed;
        if (filterTab === 'overdue') return matchesSearch && !hw.is_completed && isPast(new Date(hw.due_date));
        return matchesSearch;
    });

    const stats = {
        total: homeworkList.length,
        pending: homeworkList.filter((hw: Homework) => !hw.is_completed && !isPast(new Date(hw.due_date))).length,
        completed: homeworkList.filter((hw: Homework) => hw.is_completed).length,
        overdue: homeworkList.filter((hw: Homework) => !hw.is_completed && isPast(new Date(hw.due_date))).length,
    };

    const handleToggleComplete = (hw: Homework) => {
        // In a real app, this would call an API
        console.log('Toggle complete for:', hw.id);
    };

    const openDetail = (hw: Homework) => {
        setSelectedHomework(hw);
        setShowModal(true);
    };

    if (isLoading) {
        return (
            <div className="homework-loading">
                <div className="loading-spinner"></div>
                <p>Loading homework...</p>
            </div>
        );
    }

    return (
        <div className="homework-container">
            <div className="homework-header">
                <div className="header-content">
                    <h1>Homework</h1>
                    <p className="header-subtitle">Track and manage daily homework assignments</p>
                </div>
                <button className="btn-primary">
                    <span className="icon">+</span>
                    Assign Homework
                </button>
            </div>

            {/* Stats Cards */}
            <div className="homework-stats">
                <div className="stat-card stat-total">
                    <div className="stat-icon">📚</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.total}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
                <div className="stat-card stat-pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.pending}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                </div>
                <div className="stat-card stat-completed">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.completed}</span>
                        <span className="stat-label">Completed</span>
                    </div>
                </div>
                <div className="stat-card stat-overdue">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <span className="stat-value">{stats.overdue}</span>
                        <span className="stat-label">Overdue</span>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="homework-filters">
                <div className="filter-tabs">
                    {(['all', 'pending', 'completed', 'overdue'] as const).map((tab) => (
                        <button
                            key={tab}
                            className={`filter-tab ${filterTab === tab ? 'active' : ''}`}
                            onClick={() => setFilterTab(tab)}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Search homework..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Homework List */}
            <div className="homework-list">
                {filteredHomework.length === 0 ? (
                    <div className="empty-state">
                        <span className="empty-icon">📝</span>
                        <p>No homework found</p>
                    </div>
                ) : (
                    filteredHomework.map((hw: Homework) => {
                        const dueLabel = getDueDateLabel(hw.due_date);
                        return (
                            <div
                                key={hw.id}
                                className={`homework-card ${hw.is_completed ? 'completed' : ''}`}
                                onClick={() => openDetail(hw)}
                            >
                                <div
                                    className="priority-strip"
                                    style={{ backgroundColor: PRIORITY_COLORS[hw.priority] }}
                                ></div>
                                <div className="homework-content">
                                    <div className="homework-main">
                                        <div className="checkbox-wrapper">
                                            <input
                                                type="checkbox"
                                                checked={hw.is_completed}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleComplete(hw);
                                                }}
                                            />
                                        </div>
                                        <div className="homework-info">
                                            <h3 className={hw.is_completed ? 'strikethrough' : ''}>{hw.title}</h3>
                                            <p className="homework-desc">{hw.description}</p>
                                            <div className="homework-meta">
                                                <span className="subject-tag">{hw.subject_name}</span>
                                                <span className="teacher">by {hw.teacher_name}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="homework-right">
                                        <div
                                            className="due-badge"
                                            style={{ backgroundColor: dueLabel.bg, color: dueLabel.color }}
                                        >
                                            {dueLabel.text}
                                        </div>
                                        <span className="priority-label" style={{ color: PRIORITY_COLORS[hw.priority] }}>
                                            {hw.priority} Priority
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Detail Modal */}
            {showModal && selectedHomework && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content homework-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedHomework.title}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="hw-detail-subject">
                                <span className="subject-tag large">{selectedHomework.subject_name}</span>
                                <span className="section-tag">{selectedHomework.section_name}</span>
                            </div>
                            <p className="hw-description">{selectedHomework.description}</p>
                            <div className="hw-dates">
                                <div className="date-item">
                                    <label>Assigned</label>
                                    <span>{format(new Date(selectedHomework.assigned_date), 'MMMM dd, yyyy')}</span>
                                </div>
                                <div className="date-item">
                                    <label>Due Date</label>
                                    <span style={{ color: PRIORITY_COLORS[selectedHomework.priority] }}>
                                        {format(new Date(selectedHomework.due_date), 'MMMM dd, yyyy')}
                                    </span>
                                </div>
                            </div>
                            <div className="hw-teacher">
                                <label>Assigned by</label>
                                <span>{selectedHomework.teacher_name}</span>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                            <button className="btn-primary">
                                {selectedHomework.is_completed ? 'Mark Incomplete' : 'Mark Complete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Homework;
