/**
 * Parent Sidebar Navigation
 * 
 * Simplified navigation for parent portal with only relevant features:
 * - Dashboard
 * - My Children (student list)
 * - Attendance
 * - Fees
 * - Academic Performance
 * - Messages/Notifications
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    DollarSign,
    GraduationCap,
    MessageSquare,
    LogOut,
} from 'lucide-react';
import './Layout.css';

interface MenuItem {
    path: string;
    icon: React.ComponentType<any>;
    label: string;
}

const parentMenuItems: MenuItem[] = [
    { path: '/parent/portal', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/parent/students', icon: Users, label: 'My Children' },
    { path: '/parent/attendance', icon: Calendar, label: 'Attendance' },
    { path: '/parent/fees', icon: DollarSign, label: 'Fee Payments' },
    { path: '/parent/academics', icon: GraduationCap, label: 'Academic Reports' },
    { path: '/parent/messages', icon: MessageSquare, label: 'Messages' },
];

interface ParentSidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
}

const ParentSidebar: React.FC<ParentSidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/parent/login';
    };

    return (
        <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <h1 className="sidebar-logo">Parent Portal</h1>
            </div>

            <nav className="sidebar-nav">
                {parentMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                            onClick={onClose}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                <button
                    onClick={handleLogout}
                    className="sidebar-item logout-btn"
                    style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default ParentSidebar;