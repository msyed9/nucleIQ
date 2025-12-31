/**
 * Dashboard Page
 * Main dashboard with analytics and customizable widgets
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DashboardGrid } from '../components/dashboard/DashboardGrid';
import { WidgetLibrary } from '../components/dashboard/WidgetLibrary';
import './Dashboard.css';

interface DashboardStats {
    total_students: number;
    total_staff: number;
    active_classes: number;
    pending_fees: number;
    today_attendance_rate: number;
    upcoming_exams: number;
    recent_admissions: number;
    storage_used_gb: number;
}

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            const response = await axios.get<DashboardStats>('/api/dashboard/analytics/stats/');
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        setLoading(true);
        fetchDashboardStats();

        // Invalidate cache
        axios.post('/api/dashboard/analytics/invalidate_cache/').catch(console.error);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">⏳</div>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Dashboard</h1>
                    <p className="header-subtitle">Welcome back! Here's what's happening today.</p>
                </div>

                <div className="header-actions">
                    <button className="btn-secondary" onClick={handleRefresh}>
                        🔄 Refresh
                    </button>

                    <button
                        className={`btn-secondary ${editMode ? 'active' : ''}`}
                        onClick={() => setEditMode(!editMode)}
                    >
                        {editMode ? '✓ Done Editing' : '✏️ Customize'}
                    </button>

                    {editMode && (
                        <button
                            className="btn-primary"
                            onClick={() => setShowWidgetLibrary(true)}
                        >
                            ➕ Add Widget
                        </button>
                    )}
                </div>
            </div>

            {/* Quick Stats */}
            {stats && (
                <div className="quick-stats">
                    <div className="stat-card">
                        <div className="stat-icon student">👨‍🎓</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Students</div>
                            <div className="stat-value">{stats.total_students.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon staff">👨‍💼</div>
                        <div className="stat-content">
                            <div className="stat-label">Total Staff</div>
                            <div className="stat-value">{stats.total_staff.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon classes">📚</div>
                        <div className="stat-content">
                            <div className="stat-label">Active Classes</div>
                            <div className="stat-value">{stats.active_classes}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon fees">💰</div>
                        <div className="stat-content">
                            <div className="stat-label">Pending Fees</div>
                            <div className="stat-value">₹{stats.pending_fees.toLocaleString()}</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon attendance">✓</div>
                        <div className="stat-content">
                            <div className="stat-label">Today's Attendance</div>
                            <div className="stat-value">{stats.today_attendance_rate.toFixed(1)}%</div>
                        </div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-icon exams">📝</div>
                        <div className="stat-content">
                            <div className="stat-label">Upcoming Exams</div>
                            <div className="stat-value">{stats.upcoming_exams}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Grid */}
            <DashboardGrid editMode={editMode} />

            {/* Widget Library Modal */}
            {showWidgetLibrary && (
                <WidgetLibrary onClose={() => setShowWidgetLibrary(false)} />
            )}
        </div>
    );
};
