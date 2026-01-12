/**
 * Settings Page - Redesigned with NucleIQ Design System
 * Modern settings interface with tabs and form controls
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { usePreferences } from '../../contexts/PreferencesContext';
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
    UserCog,
    Type
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
    const [savingFontSettings, setSavingFontSettings] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);

    // Theme Context
    const { themeMode, setThemeMode, themeColor, setThemeColor } = useTheme();

    // Preferences Context for font customization
    const { preferences, updatePreferences } = usePreferences();

    // Font customization state
    const [fontFamily, setFontFamily] = useState(preferences.font_family || 'Inter, sans-serif');
    const [fontSize, setFontSize] = useState(preferences.font_size || 'medium');
    const [fontColor, setFontColor] = useState(preferences.font_color || '#1a1a1a');
    const [headingColor, setHeadingColor] = useState(preferences.heading_color || '#1a1a1a');
    const [linkColor, setLinkColor] = useState(preferences.link_color || '#0066cc');

    // Sync font settings with preferences when loaded
    useEffect(() => {
        if (preferences.font_family) setFontFamily(preferences.font_family);
        if (preferences.font_size) setFontSize(preferences.font_size);
        if (preferences.font_color) setFontColor(preferences.font_color);
        if (preferences.heading_color) setHeadingColor(preferences.heading_color);
        if (preferences.link_color) setLinkColor(preferences.link_color);
    }, [preferences]);

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

    // Font customization options
    const fontFamilyOptions = [
        { value: 'Inter, sans-serif', label: 'Inter (Default)' },
        { value: 'Roboto, sans-serif', label: 'Roboto' },
        { value: 'Poppins, sans-serif', label: 'Poppins' },
        { value: 'Outfit, sans-serif', label: 'Outfit' },
        { value: 'Open Sans, sans-serif', label: 'Open Sans' },
        { value: 'Lato, sans-serif', label: 'Lato' },
        { value: 'Source Sans Pro, sans-serif', label: 'Source Sans Pro' },
        { value: 'Nunito, sans-serif', label: 'Nunito' },
        { value: 'Montserrat, sans-serif', label: 'Montserrat' },
        { value: 'Georgia, serif', label: 'Georgia (Serif)' },
        { value: 'Times New Roman, serif', label: 'Times New Roman (Serif)' },
    ];

    const fontSizeOptions = [
        { value: 'small', label: 'Small (14px)' },
        { value: 'medium', label: 'Medium (16px - Default)' },
        { value: 'large', label: 'Large (18px)' },
        { value: 'extra-large', label: 'Extra Large (20px)' },
    ];

    const handleSave = async () => {
        try {
            setSavingSettings(true);
            
            // Prepare settings based on active tab
            const settingsToUpdate: Partial<UserPreferences> = {};
            
            if (activeTab === 'general') {
                settingsToUpdate.language = language;
                settingsToUpdate.timezone = timezone;
            } else if (activeTab === 'notifications') {
                settingsToUpdate.notification_channels = {
                    email: emailNotifications,
                    sms: smsNotifications
                };
            } else if (activeTab === 'appearance') {
                settingsToUpdate.theme_mode = themeMode;
            }
            
            // Save to backend
            await updatePreferences(settingsToUpdate);
            
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSavingSettings(false);
        }
    };

    const handleSaveFontSettings = async () => {
        try {
            setSavingFontSettings(true);
            await updatePreferences({
                font_family: fontFamily,
                font_size: fontSize,
                font_color: fontColor,
                heading_color: headingColor,
                link_color: linkColor
            });
            alert('Font settings saved successfully!');
        } catch (error) {
            console.error('Failed to save font settings:', error);
            alert('Failed to save font settings. Please try again.');
        } finally {
            setSavingFontSettings(false);
        }
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

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Theme Section */}
                                <div>
                                    <h3 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        margin: '0 0 1rem 0',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        <Palette size={20} /> Theme
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                                            value={themeColor}
                                            onChange={(val) => setThemeColor(val)}
                                            fullWidth
                                        />
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ borderTop: '1px solid var(--color-border)', margin: '0.5rem 0' }} />

                                {/* Typography Section */}
                                <div>
                                    <h3 style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        margin: '0 0 1rem 0',
                                        fontSize: '1.1rem',
                                        fontWeight: 600,
                                        color: 'var(--color-text-primary)'
                                    }}>
                                        <Type size={20} /> Typography & Font Settings
                                    </h3>
                                    <p style={{
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: '1rem',
                                        fontSize: '0.9rem'
                                    }}>
                                        Customize fonts and colors for your personal view. These settings only affect your account.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        <Select
                                            label="Font Family"
                                            options={fontFamilyOptions}
                                            value={fontFamily}
                                            onChange={(val) => setFontFamily(val)}
                                            fullWidth
                                        />

                                        <Select
                                            label="Font Size"
                                            options={fontSizeOptions}
                                            value={fontSize}
                                            onChange={(val) => setFontSize(val)}
                                            fullWidth
                                        />

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'var(--color-text-primary)'
                                                }}>
                                                    Text Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="color"
                                                        value={fontColor}
                                                        onChange={(e) => setFontColor(e.target.value)}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            border: '2px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    />
                                                    <Input
                                                        value={fontColor}
                                                        onChange={(e) => setFontColor(e.target.value)}
                                                        style={{ width: '120px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'var(--color-text-primary)'
                                                }}>
                                                    Heading Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="color"
                                                        value={headingColor}
                                                        onChange={(e) => setHeadingColor(e.target.value)}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            border: '2px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    />
                                                    <Input
                                                        value={headingColor}
                                                        onChange={(e) => setHeadingColor(e.target.value)}
                                                        style={{ width: '120px' }}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{
                                                    display: 'block',
                                                    marginBottom: '0.5rem',
                                                    fontSize: '0.875rem',
                                                    fontWeight: 500,
                                                    color: 'var(--color-text-primary)'
                                                }}>
                                                    Link Color
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <input
                                                        type="color"
                                                        value={linkColor}
                                                        onChange={(e) => setLinkColor(e.target.value)}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            border: '2px solid var(--color-border)',
                                                            borderRadius: '8px',
                                                            cursor: 'pointer',
                                                            padding: 0
                                                        }}
                                                    />
                                                    <Input
                                                        value={linkColor}
                                                        onChange={(e) => setLinkColor(e.target.value)}
                                                        style={{ width: '120px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Preview */}
                                        <div style={{
                                            marginTop: '1rem',
                                            padding: '1.5rem',
                                            background: 'var(--color-bg-secondary)',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)'
                                        }}>
                                            <h4 style={{
                                                margin: '0 0 0.5rem 0',
                                                fontFamily: fontFamily,
                                                color: headingColor,
                                                fontSize: fontSize === 'small' ? '1rem' : fontSize === 'large' ? '1.4rem' : fontSize === 'extra-large' ? '1.6rem' : '1.2rem'
                                            }}>
                                                Preview: Sample Heading
                                            </h4>
                                            <p style={{
                                                margin: '0 0 0.5rem 0',
                                                fontFamily: fontFamily,
                                                color: fontColor,
                                                fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'extra-large' ? '20px' : '16px'
                                            }}>
                                                This is sample text showing how your font settings will appear throughout the application.
                                            </p>
                                            <a href="#" style={{
                                                fontFamily: fontFamily,
                                                color: linkColor,
                                                fontSize: fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : fontSize === 'extra-large' ? '20px' : '16px'
                                            }} onClick={(e) => e.preventDefault()}>
                                                Sample Link Text
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <Button variant="outline">
                                        Reset to Defaults
                                    </Button>
                                    <Button
                                        variant="primary"
                                        iconLeft={Save}
                                        onClick={handleSaveFontSettings}
                                        disabled={savingFontSettings}
                                    >
                                        {savingFontSettings ? 'Saving...' : 'Save Font Settings'}
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