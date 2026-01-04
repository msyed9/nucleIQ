/**
 * Settings Page - Redesigned with NucleIQ Design System
 * Modern settings interface with tabs and form controls
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
    Settings as SettingsIcon,
    School,
    Users,
    Bell,
    Lock,
    Globe,
    Palette,
    Database,
    Save,
    Shield,
    UserCog
} from 'lucide-react';
import { Button, Card, Input, Select, Checkbox } from '@/design-system';

type SettingsTab = 'general' | 'academic' | 'users' | 'notifications' | 'security' | 'appearance' | 'system';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');
    const [schoolName, setSchoolName] = useState('Demo Government School');
    const [schoolEmail, setSchoolEmail] = useState('school@example.com');
    const [schoolPhone, setSchoolPhone] = useState('+91 1234567890');
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('Asia/Kolkata');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);

    // Theme Context
    const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

    const tabs = [
        { id: 'general' as SettingsTab, label: 'General', icon: SettingsIcon },
        { id: 'academic' as SettingsTab, label: 'Academic', icon: School },
        { id: 'users' as SettingsTab, label: 'Users & Roles', icon: Users },
        { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
        { id: 'security' as SettingsTab, label: 'Security', icon: Lock },
        { id: 'appearance' as SettingsTab, label: 'Appearance', icon: Palette },
        { id: 'system' as SettingsTab, label: 'System', icon: Database },
    ];

    const languageOptions = [
        { value: 'en', label: 'English' },
        { value: 'te', label: 'Telugu (తెలుగు)' },
        { value: 'hi', label: 'Hindi (हिंदी)' },
    ];

    const timezoneOptions = [
        { value: 'Asia/Kolkata', label: 'India Standard Time (IST)' },
        { value: 'Asia/Dubai', label: 'Gulf Standard Time (GST)' },
        { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
    ];

    const handleSave = () => {
        console.log('Saving settings...');
        // TODO: Implement save functionality
    };

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <h1 style={{
                    fontFamily: 'var(--font-family-primary)',
                    fontSize: '2.25rem',
                    fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    margin: '0 0 0.5rem 0'
                }}>
                    Settings
                </h1>
                <p style={{
                    fontSize: '1rem',
                    color: 'var(--color-text-secondary)',
                    margin: 0
                }}>
                    Manage your school settings and preferences
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
                {/* Sidebar Tabs */}
                <div>
                    <Card padding="sm">
                        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                const isActive = activeTab === tab.id;

                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            background: isActive ? 'var(--color-primary-50)' : 'transparent',
                                            color: isActive ? 'var(--color-primary-700)' : 'var(--color-text-secondary)',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 200ms',
                                            fontFamily: 'var(--font-family-primary)',
                                            fontSize: '0.875rem',
                                            fontWeight: isActive ? 600 : 500,
                                            textAlign: 'left',
                                            width: '100%'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'var(--color-bg-secondary)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isActive) {
                                                e.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span>{tab.label}</span>
                                    </button>
                                );
                            })}
                        </nav>
                    </Card>
                </div>

                {/* Content Area */}
                <div>
                    {activeTab === 'general' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                General Settings
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <Input
                                    label="School Name"
                                    value={schoolName}
                                    onChange={(e) => setSchoolName(e.target.value)}
                                    required
                                    fullWidth
                                />

                                <Input
                                    label="School Email"
                                    type="email"
                                    value={schoolEmail}
                                    onChange={(e) => setSchoolEmail(e.target.value)}
                                    required
                                    fullWidth
                                />

                                <Input
                                    label="School Phone"
                                    type="tel"
                                    value={schoolPhone}
                                    onChange={(e) => setSchoolPhone(e.target.value)}
                                    required
                                    fullWidth
                                />

                                <Select
                                    label="Default Language"
                                    options={languageOptions}
                                    value={language}
                                    onChange={setLanguage}
                                    fullWidth
                                />

                                <Select
                                    label="Timezone"
                                    options={timezoneOptions}
                                    value={timezone}
                                    onChange={setTimezone}
                                    fullWidth
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" iconLeft={Save} onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'academic' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                Academic Settings
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <Input
                                    label="Academic Year"
                                    value="2024-2025"
                                    fullWidth
                                />

                                <Input
                                    label="Total Working Days"
                                    type="number"
                                    value="220"
                                    fullWidth
                                />

                                <Select
                                    label="Grading System"
                                    options={[
                                        { value: 'percentage', label: 'Percentage (0-100)' },
                                        { value: 'gpa', label: 'GPA (0-10)' },
                                        { value: 'letter', label: 'Letter Grades (A-F)' },
                                    ]}
                                    value="percentage"
                                    onChange={() => { }}
                                    fullWidth
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" iconLeft={Save} onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                Notification Settings
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <Checkbox
                                    label="Email Notifications"
                                    checked={emailNotifications}
                                    onChange={(e) => setEmailNotifications(e.target.checked)}
                                    helperText="Receive notifications via email"
                                />

                                <Checkbox
                                    label="SMS Notifications"
                                    checked={smsNotifications}
                                    onChange={(e) => setSmsNotifications(e.target.checked)}
                                    helperText="Receive notifications via SMS"
                                />

                                <Checkbox
                                    label="Fee Payment Reminders"
                                    checked={true}
                                    onChange={() => { }}
                                    helperText="Send automatic fee payment reminders"
                                />

                                <Checkbox
                                    label="Attendance Alerts"
                                    checked={true}
                                    onChange={() => { }}
                                    helperText="Alert when student attendance is low"
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" iconLeft={Save} onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'appearance' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                Appearance Settings
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <Checkbox
                                    label="Dark Mode"
                                    checked={themeMode === 'dark'}
                                    onChange={(e) => setThemeMode(e.target.checked ? 'dark' : 'light')}
                                    helperText="Enable dark mode theme"
                                />

                                <Select
                                    label="Theme Color"
                                    options={[
                                        { value: '#0b3b66', label: 'Blue (Default)' },
                                        { value: '#15803d', label: 'Green' },
                                        { value: '#7e22ce', label: 'Purple' },
                                        { value: '#c2410c', label: 'Orange' },
                                        { value: '#be123c', label: 'Red' },
                                    ]}
                                    value={themeColor} // Hex code
                                    onChange={(val) => setThemeColor(val)}
                                    fullWidth
                                />

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline">
                                        Cancel
                                    </Button>
                                    <Button variant="primary" iconLeft={Save} onClick={handleSave}>
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'users' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                Users & Roles
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                Manage user permissions and roles
                            </p>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
                                <div 
                                    onClick={() => navigate('/users/manage')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: 'var(--color-background)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--color-primary-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Users size={24} style={{ color: 'var(--color-primary)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                            Manage Users
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            View, create, and edit user accounts
                                        </p>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => navigate('/settings/roles')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: 'var(--color-background)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--color-success-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Shield size={24} style={{ color: 'var(--color-success)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                            Roles & Permissions
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            Configure roles and assign permissions
                                        </p>
                                    </div>
                                </div>

                                <div 
                                    onClick={() => navigate('/settings/permissions')}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        backgroundColor: 'var(--color-background)'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-primary-light)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.backgroundColor = 'var(--color-background)';
                                    }}
                                >
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '8px',
                                        backgroundColor: 'var(--color-warning-100)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <UserCog size={24} style={{ color: 'var(--color-warning)' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                            Permission Matrix
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            Advanced permission matrix view
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                Security Settings
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                Configure security and authentication settings
                            </p>
                            <Button variant="primary" iconLeft={Lock}>
                                Change Password
                            </Button>
                        </Card>
                    )}

                    {activeTab === 'system' && (
                        <Card padding="lg">
                            <h2 style={{
                                margin: '0 0 1rem 0',
                                fontSize: '1.5rem',
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                            }}>
                                System Settings
                            </h2>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                                System configuration and maintenance
                            </p>
                            <Button variant="primary" iconLeft={Database}>
                                System Info
                            </Button>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;