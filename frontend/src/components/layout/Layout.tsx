import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../../utils/auth';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Prevent parents from accessing admin layout
    const userType = localStorage.getItem('user_type');
    if (userType === 'parent') {
        return <Navigate to="/parent/portal" replace />;
    }

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    return (
        <div className="layout">
            <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />
            {isSidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}
            <div className={`layout-main ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <Header onMenuClick={toggleSidebar} />
                <main className="layout-content">{children}</main>
            </div>
        </div>
    );
};

export default Layout;
