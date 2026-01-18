import React, { useState, useEffect, useCallback } from 'react';
import { getUser, logout } from '../../utils/auth';
import { getInitials } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import GlobalSearch from '../search/GlobalSearch';
import './Layout.css';

const Header: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const user = getUser();
    const { t } = useTranslation();

    // Handle Ctrl+K / Cmd+K keyboard shortcut
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            setSearchOpen(true);
        }
        if (event.key === 'Escape') {
            setSearchOpen(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    const handleLogout = () => {
        logout();
    };

    return (
        <>
            <header className="header">
                <div className="header-content">
                    <div className="header-left">
                        <h2 className="header-title">{t('header.welcome', 'Welcome back, {{name}}!', { name: user?.first_name || '' })}</h2>
                    </div>

                    <div className="header-center">
                        {/* Search Bar */}
                        <button
                            className="search-trigger"
                            onClick={() => setSearchOpen(true)}
                        >
                            <span className="search-icon">🔍</span>
                            <span className="search-placeholder">Search...</span>
                            <span className="search-shortcut">
                                <kbd>Ctrl</kbd>
                                <span>+</span>
                                <kbd>K</kbd>
                            </span>
                        </button>
                    </div>

                    <div className="header-right">
                        {/* Notifications */}
                        <button className="header-icon-btn" title="Notifications">
                            🔔
                        </button>

                        {/* User Menu */}
                        <div className="user-menu">
                            <button
                                className="user-button"
                                onClick={() => setShowDropdown(!showDropdown)}
                            >
                                <div className="user-avatar">
                                    {user && getInitials(`${user.first_name} ${user.last_name}`)}
                                </div>
                                <div className="user-info">
                                    <span className="user-name">
                                        {user?.first_name} {user?.last_name}
                                    </span>
                                    <span className="user-email">{user?.email}</span>
                                </div>
                            </button>

                            {showDropdown && (
                                <div className="user-dropdown">
                                    <div className="dropdown-item">
                                        <span>👤</span>
                                        <span>{t('header.profile')}</span>
                                    </div>
                                    <div className="dropdown-item">
                                        <span>⚙️</span>
                                        <span>{t('header.settings')}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={handleLogout}>
                                        <span>🚪</span>
                                        <span>{t('header.logout')}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Global Search Dialog */}
            <GlobalSearch
                open={searchOpen}
                onClose={() => setSearchOpen(false)}
            />
        </>
    );
};

export default Header;
