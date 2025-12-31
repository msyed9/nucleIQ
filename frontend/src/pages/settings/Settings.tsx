import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import { usePreferences } from '../../contexts/PreferencesContext';
import './Settings.css';

const Settings: React.FC = () => {
    const { t } = useTranslation();
    const { preferences, updatePreferences } = usePreferences();

    const [schoolName, setSchoolName] = useState('Demo School');
    const [schoolEmail, setSchoolEmail] = useState('info@demoschool.com');
    const [schoolPhone, setSchoolPhone] = useState('+91 1234567890');
    const [address, setAddress] = useState('123 School Street, City');

    // User Preferences - Initialize from context
    const [language, setLanguage] = useState(preferences.language || 'en');
    const [themeMode, setThemeMode] = useState(preferences.theme_mode || 'system');
    const [timezone, setTimezone] = useState(preferences.timezone || 'UTC');
    const [dateFormat, setDateFormat] = useState(preferences.date_format || 'YYYY-MM-DD');
    const [timeFormat, setTimeFormat] = useState(preferences.time_format || '24h');
    const [saving, setSaving] = useState(false);

    // Update local state when preferences change
    useEffect(() => {
        setLanguage(preferences.language || 'en');
        setThemeMode(preferences.theme_mode || 'system');
        setTimezone(preferences.timezone || 'UTC');
        setDateFormat(preferences.date_format || 'YYYY-MM-DD');
        setTimeFormat(preferences.time_format || '24h');
    }, [preferences]);

    const handleSave = () => {
        alert(t('settings.settingsSaved'));
    };

    const handlePreferencesSave = async () => {
        setSaving(true);
        try {
            await updatePreferences({
                language,
                theme_mode: themeMode,
                timezone,
                date_format: dateFormat,
                time_format: timeFormat
            });
            alert(t('settings.preferencesSaved'));
        } catch (error) {
            console.error('Failed to save preferences:', error);
            alert(t('settings.saveFailed'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="settings-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">{t('settings.title')}</h1>
                    <p className="page-subtitle">{t('settings.subtitle')}</p>
                </div>
            </div>

            <div className="settings-grid">
                {/* School Profile */}
                <Card title={t('settings.schoolProfile')}>
                    <div className="form-group">
                        <label>{t('settings.schoolName')}</label>
                        <input
                            type="text"
                            value={schoolName}
                            onChange={(e) => setSchoolName(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.email')}</label>
                        <input
                            type="email"
                            value={schoolEmail}
                            onChange={(e) => setSchoolEmail(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.phone')}</label>
                        <input
                            type="tel"
                            value={schoolPhone}
                            onChange={(e) => setSchoolPhone(e.target.value)}
                            className="form-input"
                        />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.address')}</label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="form-input"
                            rows={3}
                        />
                    </div>
                    <Button variant="primary" onClick={handleSave}>
                        {t('settings.saveChanges')}
                    </Button>
                </Card>

                {/* Academic Year */}
                <Card title={t('settings.academicYear')}>
                    <div className="form-group">
                        <label>{t('settings.currentAcademicYear')}</label>
                        <select className="form-input">
                            <option>2024-2025</option>
                            <option>2025-2026</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.sessionStartDate')}</label>
                        <input type="date" className="form-input" />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.sessionEndDate')}</label>
                        <input type="date" className="form-input" />
                    </div>
                </Card>

                {/* Branding */}
                <Card title={t('settings.branding')}>
                    <div className="form-group">
                        <label>{t('settings.schoolLogo')}</label>
                        <input type="file" className="form-input" accept="image/*" />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.primaryColor')}</label>
                        <input type="color" className="form-input" defaultValue="#667eea" />
                    </div>
                    <div className="form-group">
                        <label>{t('settings.secondaryColor')}</label>
                        <input type="color" className="form-input" defaultValue="#764ba2" />
                    </div>
                </Card>

                {/* User Preferences */}
                <Card title={t('settings.preferences')}>
                    <div className="form-group">
                        <label>{t('settings.language')}</label>
                        <select
                            className="form-input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="en">{t('languages.en')}</option>
                            <option value="hi">{t('languages.hi')}</option>
                            <option value="ar">{t('languages.ar')}</option>
                            <option value="ur">{t('languages.ur')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.themeMode')}</label>
                        <select
                            className="form-input"
                            value={themeMode}
                            onChange={(e) => setThemeMode(e.target.value)}
                        >
                            <option value="light">{t('theme.light')}</option>
                            <option value="dark">{t('theme.dark')}</option>
                            <option value="system">{t('theme.system')}</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.timezone')}</label>
                        <select
                            className="form-input"
                            value={timezone}
                            onChange={(e) => setTimezone(e.target.value)}
                        >
                            <option value="UTC">UTC</option>
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.dateFormat')}</label>
                        <select
                            className="form-input"
                            value={dateFormat}
                            onChange={(e) => setDateFormat(e.target.value)}
                        >
                            <option value="YYYY-MM-DD">YYYY-MM-DD (2025-12-29)</option>
                            <option value="DD/MM/YYYY">DD/MM/YYYY (29/12/2025)</option>
                            <option value="MM/DD/YYYY">MM/DD/YYYY (12/29/2025)</option>
                            <option value="DD-MMM-YYYY">DD-MMM-YYYY (29-Dec-2025)</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label>{t('settings.timeFormat')}</label>
                        <select
                            className="form-input"
                            value={timeFormat}
                            onChange={(e) => setTimeFormat(e.target.value)}
                        >
                            <option value="24h">24 Hour (14:30)</option>
                            <option value="12h">12 Hour (2:30 PM)</option>
                        </select>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handlePreferencesSave}
                        disabled={saving}
                    >
                        {saving ? t('common.loading') : t('settings.savePreferences')}
                    </Button>
                </Card>
            </div>
        </div>
    );
};

export default Settings;