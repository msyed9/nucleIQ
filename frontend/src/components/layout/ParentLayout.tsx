/**
 * Parent Portal Layout
 * 
 * Restricted layout for parent users with:
 * - Parent-specific navigation (no admin features)
 * - Student switcher if multiple children
 * - Read-only access
 */

import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import ParentSidebar from './ParentSidebar';
import ParentHeader from './ParentHeader';
import './Layout.css';

interface ParentLayoutProps {
    children: React.ReactNode;
}

const ParentLayout: React.FC<ParentLayoutProps> = ({ children }) => {
    const accessToken = localStorage.getItem('access_token');
    const userType = localStorage.getItem('user_type');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Redirect to parent login if not authenticated
    if (!accessToken) {
        return <Navigate to="/parent/login" replace />;
    }

    // Ensure only parents can access this layout
    if (userType !== 'parent') {
        return <Navigate to="/login" replace />;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="layout">
            <ParentSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
            <div className={`layout-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <ParentHeader onMenuClick={toggleSidebar} />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
};

export default ParentLayout;