import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Prevent parents from accessing admin layout
    const userType = localStorage.getItem('user_type');
    if (userType === 'parent') {
        return <Navigate to="/parent/portal" replace />;
    }

    return (
        <div className="layout">
            <Sidebar />
            <div className="layout-main">
                <Header />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
