import React, { useState, useEffect, useCallback } from 'react';
import { getUser, logout } from '../../utils/auth';
import { getInitials } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import GlobalSearch from '../search/GlobalSearch';
import './Layout.css';
import { useTheme } from '../../contexts/ThemeContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon, faDesktop, faBars } from '@fortawesome/free-solid-svg-icons';

interface HeaderProps {
    onMenuClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const user = getUser();
    const { t } = useTranslation();
    const { theme, themeMode, setThemeMode } = useTheme();

    // Handle Ctrl+K / Cmd+K / Ctrl+/ keyboard shortcut
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        // Ctrl+K or Cmd+K
        if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
            event.preventDefault();
            setSearchOpen(true);
        }
        // Ctrl+/ (alternative shortcut)
        if ((event.ctrlKey || event.metaKey) && event.key === '/') {
            event.preventDefault();
            setSearchOpen(true);
        }
        // Note: ESC handling is done in GlobalSearch component itself
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
                        {onMenuClick && (
                            <button
                                className="mobile-menu-btn"
                                onClick={onMenuClick}
                                aria-label="Toggle menu"
                            >
                                <FontAwesomeIcon icon={faBars} />
                            </button>
                        )}
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

                        {/* Theme toggle */}
                        <button
                            className="header-icon-btn theme-toggle"
                            title={
                                themeMode === 'dark'
                                    ? 'Switch to system theme'
                                    : themeMode === 'system'
                                        ? 'Switch to light theme'
                                        : 'Switch to dark theme'
                            }
                            aria-label="Toggle theme"
                            onClick={() => {
                                // Cycle: light -> dark -> system -> light
                                const next = themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
                                setThemeMode(next);
                            }}
                        >
                            {themeMode === 'dark' && <FontAwesomeIcon icon={faMoon} style={{ fontSize: 16 }} />}
                            {themeMode === 'system' && <FontAwesomeIcon icon={faDesktop} style={{ fontSize: 16 }} />}
                            {themeMode === 'light' && <FontAwesomeIcon icon={faSun} style={{ fontSize: 16 }} />}
                            <span className="theme-label">{themeMode === 'system' ? 'System' : themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}</span>
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
                                        <span>{t('header.profile', 'Profile')}</span>
                                    </div>
                                    <div className="dropdown-item">
                                        <span>⚙️</span>
                                        <span>{t('header.settings', 'Settings')}</span>
                                    </div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={handleLogout}>
                                        <span>🚪</span>
                                        <span>{t('header.logout', 'Logout')}</span>
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
