/**
 * Settings Page - Redesigned with NucleiQ Design System
 * Modern settings interface with tabs and form controls
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { usePreferences, UserPreferences } from '../../contexts/PreferencesContext';
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
    Type,
    Clock
} from 'lucide-react';
import { Button, Card, Input, Select, Checkbox } from '@/design-system';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [schoolName, setSchoolName] = useState('Demo Government School');
    const [schoolEmail, setSchoolEmail] = useState('school@example.com');
    const [schoolPhone, setSchoolPhone] = useState('+91 1234567890');
    const [language, setLanguage] = useState('en');
    const [timezone, setTimezone] = useState('Asia/Kolkata');
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
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

    // Session Timeout state
    const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);
    const [refreshTimeoutDays, setRefreshTimeoutDays] = useState(7);
    const [adminSessionTimeoutMinutes, setAdminSessionTimeoutMinutes] = useState(120);
    const [loadingSessionTimeout, setLoadingSessionTimeout] = useState(true);

    // Sync font settings with preferences when loaded
    useEffect(() => {
        if (preferences.font_family) setFontFamily(preferences.font_family);
        if (preferences.font_size) setFontSize(preferences.font_size);
        if (preferences.font_color) setFontColor(preferences.font_color);
        if (preferences.heading_color) setHeadingColor(preferences.heading_color);
        if (preferences.link_color) setLinkColor(preferences.link_color);
    }, [preferences]);

    // Load session timeout settings
    useEffect(() => {
        const loadSessionTimeoutSettings = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) return;

                const response = await fetch('/api/tenants/session-timeout/', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setSessionTimeoutMinutes(data.session_timeout_minutes || 60);
                    setRefreshTimeoutDays(data.refresh_timeout_days || 7);
                    setAdminSessionTimeoutMinutes(data.admin_session_timeout_minutes || 120);
                }
            } catch (error) {
                console.error('Failed to load session timeout settings:', error);
            } finally {
                setLoadingSessionTimeout(false);
            }
        };

        loadSessionTimeoutSettings();
    }, []);

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

            const settingsToUpdate: Partial<UserPreferences> = {
                language,
                timezone,
                notification_channels: {
                    email: emailNotifications,
                    sms: smsNotifications
                },
                theme_mode: themeMode,
                font_family: fontFamily,
                font_size: fontSize,
                font_color: fontColor,
                heading_color: headingColor,
                link_color: linkColor
            };

            await updatePreferences(settingsToUpdate);

            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSavingSettings(false);
        }
    };
    const handleResetTypography = () => {
        setFontFamily('Inter, sans-serif');
        setFontSize('medium');
        setFontColor('#1a1a1a');
        setHeadingColor('#1a1a1a');
        setLinkColor('#0066cc');
    };

    const handleSaveSessionTimeout = async () => {
        try {
            // Validate inputs
            if (sessionTimeoutMinutes < 5 || sessionTimeoutMinutes > 1440) {
                alert('Session timeout must be between 5 and 1440 minutes');
                return;
            }
            if (refreshTimeoutDays < 1 || refreshTimeoutDays > 30) {
                alert('Refresh timeout must be between 1 and 30 days');
                return;
            }
            if (adminSessionTimeoutMinutes < 5 || adminSessionTimeoutMinutes > 1440) {
                alert('Admin session timeout must be between 5 and 1440 minutes');
                return;
            }

            const token = localStorage.getItem('access_token');
            if (!token) {
                alert('You must be logged in to save settings');
                return;
            }

            const response = await fetch('/api/tenants/session-timeout/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_timeout_minutes: sessionTimeoutMinutes,
                    refresh_timeout_days: refreshTimeoutDays,
                    admin_session_timeout_minutes: adminSessionTimeoutMinutes,
                }),
            });

            if (response.ok) {
                alert('Session timeout settings saved! Changes will apply to new login sessions.');
            } else {
                const error = await response.json();
                alert(`Failed to save: ${error.error || error.errors || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to save session timeout:', error);
            alert('Failed to save session timeout settings. Please try again.');
        }
    };

    const quickLinks = [
        {
            title: 'Academic Setup',
            description: 'Academic years, grades, sections, admission numbers',
            icon: School,
            path: '/settings/academic',
            color: 'var(--color-primary)',
            background: 'var(--color-primary-100)'
        },
        {
            title: 'Branding',
            description: 'Logo, colors, and visual identity',
            icon: Palette,
            path: '/settings/branding',
            color: 'var(--color-warning)',
            background: 'var(--color-warning-100)'
        },
        {
            title: 'Manage Users',
            description: 'Create, edit, and manage user accounts',
            icon: Users,
            path: '/users/manage',
            color: 'var(--color-primary)',
            background: 'var(--color-primary-100)'
        },
        {
            title: 'Roles & Permissions',
            description: 'Configure roles and assign permissions',
            icon: Shield,
            path: '/settings/roles',
            color: 'var(--color-success)',
            background: 'var(--color-success-100)'
        },
        {
            title: 'Permissions Matrix',
            description: 'Advanced permission matrix view',
            icon: UserCog,
            path: '/settings/permissions',
            color: 'var(--color-warning)',
            background: 'var(--color-warning-100)'
        },
        {
            title: 'System Settings',
            description: 'Configuration and maintenance',
            icon: Database,
            path: '/settings/system',
            color: 'var(--color-primary)',
            background: 'var(--color-primary-100)'
        },
        {
            title: 'Data Management',
            description: 'Import, export, and data tools',
            icon: Database,
            path: '/settings/data-management',
            color: 'var(--color-success)',
            background: 'var(--color-success-100)'
        }
    ];

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <School size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                School Profile
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Core identity details for the institution
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
                    </div>
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Globe size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Locale & Calendar
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Language and timezone defaults used across the system
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
                    </div>
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Bell size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Communication Defaults
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Set default notification channels for the institution
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                    </div>
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Palette size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Appearance
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Theme settings for your workspace
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Type size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Typography & Font Settings
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Personal display preferences for your account
                            </p>
                        </div>
                    </div>

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

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button variant="outline" onClick={handleResetTypography}>
                                Reset to Defaults
                            </Button>
                        </div>
                    </div>
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Lock size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Security Basics
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Essential security controls for your account
                            </p>
                        </div>
                    </div>
                    <Button variant="primary" iconLeft={Lock}>
                        Change Password
                    </Button>
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <Clock size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Session & Timeout Configuration
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Control how long users stay logged in across different areas
                            </p>
                        </div>
                    </div>

                    {loadingSessionTimeout ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                            Loading session timeout settings...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div>
                                <Input
                                    label="Session Timeout (Minutes)"
                                    type="number"
                                    value={sessionTimeoutMinutes}
                                    onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 60)}
                                    min={5}
                                    max={1440}
                                    fullWidth
                                    helperText="How long users stay logged in during active use (5-1440 minutes). Default: 60 minutes"
                                />
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    paddingLeft: '0.5rem'
                                }}>
                                    💡 Current: {sessionTimeoutMinutes} minutes ({Math.floor(sessionTimeoutMinutes / 60)}h {sessionTimeoutMinutes % 60}m)
                                </p>
                            </div>

                            <div>
                                <Input
                                    label="Stay Logged In (Days)"
                                    type="number"
                                    value={refreshTimeoutDays}
                                    onChange={(e) => setRefreshTimeoutDays(parseInt(e.target.value) || 7)}
                                    min={1}
                                    max={30}
                                    fullWidth
                                    helperText="Maximum days users can stay logged in without re-entering password (1-30 days). Default: 7 days"
                                />
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    paddingLeft: '0.5rem'
                                }}>
                                    💡 Current: {refreshTimeoutDays} {refreshTimeoutDays === 1 ? 'day' : 'days'}
                                </p>
                            </div>

                            <div>
                                <Input
                                    label="Admin Panel Timeout (Minutes)"
                                    type="number"
                                    value={adminSessionTimeoutMinutes}
                                    onChange={(e) => setAdminSessionTimeoutMinutes(parseInt(e.target.value) || 120)}
                                    min={5}
                                    max={1440}
                                    fullWidth
                                    helperText="Django admin panel session timeout (5-1440 minutes). Default: 120 minutes"
                                />
                                <p style={{
                                    margin: '0.5rem 0 0 0',
                                    fontSize: '0.875rem',
                                    color: 'var(--color-text-secondary)',
                                    paddingLeft: '0.5rem'
                                }}>
                                    💡 Current: {adminSessionTimeoutMinutes} minutes ({Math.floor(adminSessionTimeoutMinutes / 60)}h {adminSessionTimeoutMinutes % 60}m)
                                </p>
                            </div>

                            <div style={{
                                padding: '1rem',
                                background: 'var(--color-warning-100)',
                                border: '1px solid var(--color-warning-300)',
                                borderRadius: '8px',
                                display: 'flex',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                                <div>
                                    <strong style={{ color: 'var(--color-warning-600)' }}>Important:</strong>
                                    <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                                        Changes will only apply to new login sessions. Currently logged-in users will retain their existing timeout.
                                    </p>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                <Button
                                    variant="primary"
                                    iconLeft={Save}
                                    onClick={handleSaveSessionTimeout}
                                >
                                    Save Timeout Settings
                                </Button>
                            </div>
                        </div>
                    )}
                </Card>

                <Card padding="lg">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <SettingsIcon size={22} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                                Quick Links
                            </h2>
                            <p style={{ margin: '0.25rem 0 0 0', color: 'var(--color-text-secondary)' }}>
                                Jump to detailed configuration areas
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                        {quickLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <div
                                    key={link.title}
                                    onClick={() => navigate(link.path)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '12px',
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
                                        borderRadius: '10px',
                                        backgroundColor: link.background,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Icon size={24} style={{ color: link.color }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: 600 }}>
                                            {link.title}
                                        </h3>
                                        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                                            {link.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <div style={{
                    position: 'sticky',
                    bottom: '1rem',
                    zIndex: 1,
                    padding: '1rem',
                    borderRadius: '12px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    display: 'flex',
                    justifyContent: 'flex-end'
                }}>
                    <Button variant="primary" iconLeft={Save} onClick={handleSave} disabled={savingSettings}>
                        {savingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Settings;