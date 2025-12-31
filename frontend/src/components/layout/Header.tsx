import React, { useState } from 'react';
import { getUser, logout } from '../../utils/auth';
import { getInitials } from '../../utils/helpers';
import { useTranslation } from 'react-i18next';
import './Layout.css';

const Header: React.FC = () => {
    const [showDropdown, setShowDropdown] = useState(false);
    const user = getUser();
    const { t } = useTranslation();

    const handleLogout = () => {
        logout();
    };

    return (
        <header className="header">
            <div className="header-content">
                <div className="header-left">
                    <h2 className="header-title">{t('header.welcome', { name: user?.first_name || '' })}</h2>
                </div>

                <div className="header-right">
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
    );
};

export default Header;
