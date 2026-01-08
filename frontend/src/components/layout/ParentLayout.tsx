/**
 * Parent Portal Layout
 * 
 * Restricted layout for parent users with:
 * - Parent-specific navigation (no admin features)
 * - Student switcher if multiple children
 * - Read-only access
 */

import React from 'react';
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
    
    // Redirect to parent login if not authenticated
    if (!accessToken) {
        return <Navigate to="/parent/login" replace />;
    }
    
    // Ensure only parents can access this layout
    if (userType !== 'parent') {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="layout">
            <ParentSidebar />
            <div className="layout-main">
                <ParentHeader />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
};

export default ParentLayout;