/**
 * Dashboard Admin Page
 * For tenant admins to manage dashboard configurations, layouts, and leaderboards
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
    Settings,
    LayoutGrid,
    Trophy,
    Users,
    Save,
    RefreshCw,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    GripVertical,
    ChevronDown,
    ChevronRight
} from 'lucide-react';
import { Button, Card, Badge, Input, Select, Toggle } from '@/design-system';
import './DashboardAdmin.css';

interface RoleLayout {
    id: string;
    role_code: string;
    name: string;
    description: string;
    layout: any[];
    is_active: boolean;
    priority: number;
}

interface ParentConfig {
    id: string | null;
    name: string;
    layout: any[];
    visible_widgets: string[];
    hidden_widgets: string[];
    quick_links: any[];
    show_announcements: boolean;
    max_announcements: number;
    show_activity_feed: boolean;
    activity_feed_days: number;
    is_active: boolean;
}

interface Leaderboard {
    id: string;
    name: string;
    leaderboard_type: string;
    target: string;
    period: string;
    is_active: boolean;
    max_entries: number;
}

interface WidgetDef {
    id: string;
    widget_id: string;
    name: string;
    category: string;
    icon: string;
}

type TabType = 'role-layouts' | 'parent-config' | 'leaderboards' | 'widgets';

const ROLES = [
    { value: 'principal', label: 'Principal' },
    { value: 'teacher', label: 'Teacher' },
    { value: 'student', label: 'Student' },
    { value: 'parent', label: 'Parent' },
    { value: 'accountant', label: 'Accountant' },
    { value: 'admin', label: 'Admin' },
];

const LEADERBOARD_TYPES = [
    { value: 'ACADEMIC', label: 'Academic Performance' },
    { value: 'ATTENDANCE', label: 'Attendance' },
    { value: 'HOMEWORK', label: 'Homework Completion' },
    { value: 'BEHAVIOR', label: 'Behavior Points' },
    { value: 'TEACHER_PERFORMANCE', label: 'Teacher Performance' },
    { value: 'TEACHER_ATTENDANCE', label: 'Teacher Attendance' },
];

const PERIODS = [
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'QUARTERLY', label: 'Quarterly' },
    { value: 'YEARLY', label: 'Yearly' },
];

const DashboardAdmin: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('role-layouts');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Data
    const [roleLayouts, setRoleLayouts] = useState<RoleLayout[]>([]);
    const [parentConfig, setParentConfig] = useState<ParentConfig | null>(null);
    const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
    const [widgets, setWidgets] = useState<WidgetDef[]>([]);

    // UI State
    const [selectedRole, setSelectedRole] = useState<string>('principal');
    const [editingLayout, setEditingLayout] = useState<RoleLayout | null>(null);
    const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
    const [editingLeaderboard, setEditingLeaderboard] = useState<Leaderboard | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [layoutsRes, parentRes, leaderboardsRes, widgetsRes] = await Promise.all([
                axios.get('/api/dashboard/role-layouts/'),
                axios.get('/api/dashboard/parent-config/current/'),
                axios.get('/api/dashboard/leaderboards/'),
                axios.get('/api/dashboard/widgets/')
            ]);

            setRoleLayouts(layoutsRes.data);
            setParentConfig(parentRes.data);
            setLeaderboards(leaderboardsRes.data);
            setWidgets(widgetsRes.data);
        } catch (error) {
            console.error('Failed to fetch dashboard admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRoleLayout = async (layout: RoleLayout) => {
        try {
            setSaving(true);
            if (layout.id) {
                await axios.put(`/api/dashboard/role-layouts/${layout.id}/`, layout);
            } else {
                await axios.post('/api/dashboard/role-layouts/', layout);
            }
            await fetchData();
            setEditingLayout(null);
        } catch (error) {
            console.error('Failed to save layout:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveParentConfig = async () => {
        if (!parentConfig) return;

        try {
            setSaving(true);
            if (parentConfig.id) {
                await axios.put(`/api/dashboard/parent-config/${parentConfig.id}/`, parentConfig);
            } else {
                await axios.post('/api/dashboard/parent-config/', parentConfig);
            }
            await fetchData();
        } catch (error) {
            console.error('Failed to save parent config:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveLeaderboard = async (leaderboard: Partial<Leaderboard>) => {
        try {
            setSaving(true);
            if (leaderboard.id) {
                await axios.put(`/api/dashboard/leaderboards/${leaderboard.id}/`, leaderboard);
            } else {
                await axios.post('/api/dashboard/leaderboards/', leaderboard);
            }
            await fetchData();
            setShowLeaderboardModal(false);
            setEditingLeaderboard(null);
        } catch (error) {
            console.error('Failed to save leaderboard:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLeaderboard = async (id: string) => {
        if (!confirm('Are you sure you want to delete this leaderboard?')) return;

        try {
            await axios.delete(`/api/dashboard/leaderboards/${id}/`);
            await fetchData();
        } catch (error) {
            console.error('Failed to delete leaderboard:', error);
        }
    };

    const handleRefreshLeaderboards = async () => {
        try {
            setSaving(true);
            await axios.post('/api/dashboard/leaderboards/refresh_all/');
            alert('All leaderboards refreshed successfully!');
        } catch (error) {
            console.error('Failed to refresh leaderboards:', error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-admin loading">
                <div className="loading-spinner">
                    <Settings size={32} className="spin" />
                    <p>Loading dashboard settings...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-admin">
            {/* Header */}
            <div className="admin-header">
                <div className="header-content">
                    <h1>
                        <Settings size={28} />
                        {t('dashboard_admin.title', { defaultValue: 'Dashboard Settings' })}
                    </h1>
                    <p>{t('dashboard_admin.subtitle', { defaultValue: 'Configure dashboards, layouts, and leaderboards' })}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="admin-tabs">
                <button
                    className={`tab ${activeTab === 'role-layouts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('role-layouts')}
                >
                    <LayoutGrid size={18} />
                    Role Layouts
                </button>
                <button
                    className={`tab ${activeTab === 'parent-config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('parent-config')}
                >
                    <Users size={18} />
                    Parent Dashboard
                </button>
                <button
                    className={`tab ${activeTab === 'leaderboards' ? 'active' : ''}`}
                    onClick={() => setActiveTab('leaderboards')}
                >
                    <Trophy size={18} />
                    Leaderboards
                </button>
            </div>

            {/* Tab Content */}
            <div className="admin-content">
                {/* Role Layouts Tab */}
                {activeTab === 'role-layouts' && (
                    <div className="role-layouts-section">
                        <div className="section-header">
                            <h2>Default Layouts by Role</h2>
                            <p>Configure default dashboard layouts for each user role</p>
                        </div>

                        <div className="role-selector">
                            {ROLES.map(role => (
                                <button
                                    key={role.value}
                                    className={`role-btn ${selectedRole === role.value ? 'active' : ''}`}
                                    onClick={() => setSelectedRole(role.value)}
                                >
                                    {role.label}
                                    {roleLayouts.find(l => l.role_code === role.value && l.is_active) && (
                                        <Badge variant="success" size="sm">Active</Badge>
                                    )}
                                </button>
                            ))}
                        </div>

                        <Card className="layout-editor">
                            {roleLayouts.filter(l => l.role_code === selectedRole).length > 0 ? (
                                <>
                                    {roleLayouts.filter(l => l.role_code === selectedRole).map(layout => (
                                        <div key={layout.id} className="layout-item">
                                            <div className="layout-info">
                                                <h4>{layout.name}</h4>
                                                <p>{layout.description || 'No description'}</p>
                                                <div className="layout-meta">
                                                    <Badge variant={layout.is_active ? 'success' : 'secondary'}>
                                                        {layout.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    <span>{layout.layout.length} widgets</span>
                                                </div>
                                            </div>
                                            <div className="layout-actions">
                                                <Button variant="ghost" size="sm" onClick={() => setEditingLayout(layout)}>
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <div className="empty-state">
                                    <LayoutGrid size={32} />
                                    <p>No custom layout configured for {ROLES.find(r => r.value === selectedRole)?.label}</p>
                                    <Button
                                        variant="primary"
                                        iconLeft={Plus}
                                        onClick={() => setEditingLayout({
                                            id: '',
                                            role_code: selectedRole,
                                            name: `${ROLES.find(r => r.value === selectedRole)?.label} Default Layout`,
                                            description: '',
                                            layout: [],
                                            is_active: true,
                                            priority: 0
                                        })}
                                    >
                                        Create Layout
                                    </Button>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {/* Parent Config Tab */}
                {activeTab === 'parent-config' && parentConfig && (
                    <div className="parent-config-section">
                        <div className="section-header">
                            <h2>Parent Dashboard Configuration</h2>
                            <p>Configure what parents can see on their dashboard</p>
                        </div>

                        <Card className="config-form">
                            <div className="form-group">
                                <label>Configuration Name</label>
                                <Input
                                    value={parentConfig.name}
                                    onChange={e => setParentConfig({ ...parentConfig, name: e.target.value })}
                                    placeholder="Parent Dashboard"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Show Announcements</label>
                                    <Toggle
                                        checked={parentConfig.show_announcements}
                                        onChange={checked => setParentConfig({ ...parentConfig, show_announcements: checked })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Max Announcements</label>
                                    <Input
                                        type="number"
                                        value={parentConfig.max_announcements}
                                        onChange={e => setParentConfig({ ...parentConfig, max_announcements: parseInt(e.target.value) })}
                                        min={1}
                                        max={20}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Show Activity Feed</label>
                                    <Toggle
                                        checked={parentConfig.show_activity_feed}
                                        onChange={checked => setParentConfig({ ...parentConfig, show_activity_feed: checked })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Activity Feed Days</label>
                                    <Input
                                        type="number"
                                        value={parentConfig.activity_feed_days}
                                        onChange={e => setParentConfig({ ...parentConfig, activity_feed_days: parseInt(e.target.value) })}
                                        min={1}
                                        max={30}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Visible Widgets</label>
                                <div className="widget-list">
                                    {widgets.filter(w => ['parent', 'academic', 'finance', 'attendance'].includes(w.category)).map(widget => (
                                        <div key={widget.widget_id} className="widget-toggle">
                                            <Toggle
                                                checked={!parentConfig.hidden_widgets.includes(widget.widget_id)}
                                                onChange={checked => {
                                                    const hidden = new Set(parentConfig.hidden_widgets);
                                                    if (checked) {
                                                        hidden.delete(widget.widget_id);
                                                    } else {
                                                        hidden.add(widget.widget_id);
                                                    }
                                                    setParentConfig({ ...parentConfig, hidden_widgets: Array.from(hidden) });
                                                }}
                                            />
                                            <span className="widget-icon">{widget.icon}</span>
                                            <span className="widget-name">{widget.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="form-actions">
                                <Button
                                    variant="primary"
                                    iconLeft={Save}
                                    onClick={handleSaveParentConfig}
                                    loading={saving}
                                >
                                    Save Configuration
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Leaderboards Tab */}
                {activeTab === 'leaderboards' && (
                    <div className="leaderboards-section">
                        <div className="section-header">
                            <h2>Leaderboard Management</h2>
                            <p>Configure and manage leaderboards</p>
                            <div className="header-actions">
                                <Button
                                    variant="ghost"
                                    iconLeft={RefreshCw}
                                    onClick={handleRefreshLeaderboards}
                                    loading={saving}
                                >
                                    Refresh All
                                </Button>
                                <Button
                                    variant="primary"
                                    iconLeft={Plus}
                                    onClick={() => {
                                        setEditingLeaderboard(null);
                                        setShowLeaderboardModal(true);
                                    }}
                                >
                                    Add Leaderboard
                                </Button>
                            </div>
                        </div>

                        <div className="leaderboards-list">
                            {leaderboards.map(lb => (
                                <Card key={lb.id} className="leaderboard-item">
                                    <div className="lb-info">
                                        <h4>{lb.name}</h4>
                                        <div className="lb-meta">
                                            <Badge variant="secondary">{lb.leaderboard_type}</Badge>
                                            <Badge variant="secondary">{lb.target}</Badge>
                                            <Badge variant="secondary">{lb.period}</Badge>
                                        </div>
                                    </div>
                                    <div className="lb-status">
                                        <Badge variant={lb.is_active ? 'success' : 'warning'}>
                                            {lb.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <span className="max-entries">{lb.max_entries} entries</span>
                                    </div>
                                    <div className="lb-actions">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setEditingLeaderboard(lb);
                                                setShowLeaderboardModal(true);
                                            }}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteLeaderboard(lb.id)}
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                </Card>
                            ))}

                            {leaderboards.length === 0 && (
                                <div className="empty-state">
                                    <Trophy size={32} />
                                    <p>No leaderboards configured yet</p>
                                    <Button
                                        variant="primary"
                                        iconLeft={Plus}
                                        onClick={() => setShowLeaderboardModal(true)}
                                    >
                                        Create First Leaderboard
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Leaderboard Modal */}
            {showLeaderboardModal && (
                <LeaderboardModal
                    leaderboard={editingLeaderboard}
                    onSave={handleSaveLeaderboard}
                    onClose={() => {
                        setShowLeaderboardModal(false);
                        setEditingLeaderboard(null);
                    }}
                    saving={saving}
                />
            )}
        </div>
    );
};

// Leaderboard Modal Component
interface LeaderboardModalProps {
    leaderboard: Leaderboard | null;
    onSave: (lb: Partial<Leaderboard>) => void;
    onClose: () => void;
    saving: boolean;
}

const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ leaderboard, onSave, onClose, saving }) => {
    const [form, setForm] = useState({
        name: leaderboard?.name || '',
        leaderboard_type: leaderboard?.leaderboard_type || 'ACADEMIC',
        target: leaderboard?.target || 'STUDENT',
        period: leaderboard?.period || 'MONTHLY',
        max_entries: leaderboard?.max_entries || 10,
        is_active: leaderboard?.is_active ?? true,
    });

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{leaderboard ? 'Edit Leaderboard' : 'Create Leaderboard'}</h3>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="form-group">
                        <label>Name</label>
                        <Input
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            placeholder="Academic Excellence"
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Type</label>
                            <Select
                                value={form.leaderboard_type}
                                onChange={value => setForm({ ...form, leaderboard_type: value })}
                                options={LEADERBOARD_TYPES}
                            />
                        </div>
                        <div className="form-group">
                            <label>Target</label>
                            <Select
                                value={form.target}
                                onChange={value => setForm({ ...form, target: value })}
                                options={[
                                    { value: 'STUDENT', label: 'Student' },
                                    { value: 'TEACHER', label: 'Teacher' },
                                    { value: 'CLASS', label: 'Class' },
                                ]}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Period</label>
                            <Select
                                value={form.period}
                                onChange={value => setForm({ ...form, period: value })}
                                options={PERIODS}
                            />
                        </div>
                        <div className="form-group">
                            <label>Max Entries</label>
                            <Input
                                type="number"
                                value={form.max_entries}
                                onChange={e => setForm({ ...form, max_entries: parseInt(e.target.value) })}
                                min={5}
                                max={50}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Active</label>
                        <Toggle
                            checked={form.is_active}
                            onChange={checked => setForm({ ...form, is_active: checked })}
                        />
                    </div>
                </div>
                <div className="modal-footer">
                    <Button variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button
                        variant="primary"
                        onClick={() => onSave({ ...leaderboard, ...form })}
                        loading={saving}
                    >
                        Save
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default DashboardAdmin;
