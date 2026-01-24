/**
 * Frontend Integration Guide - Session Timeout Configuration
 * 
 * This file contains TypeScript interfaces and example code for integrating
 * the session timeout configuration feature in the React frontend.
 */

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Session timeout settings for a tenant
 */
export interface SessionTimeoutSettings {
    /** Session timeout in minutes (JWT access token lifetime) */
    session_timeout_minutes: number;

    /** Refresh token lifetime in days (how long users stay logged in) */
    refresh_timeout_days: number;

    /** Django admin session timeout in minutes */
    admin_session_timeout_minutes: number;

    /** Optional success message after update */
    message?: string;
}

/**
 * Validation constraints for session timeout settings
 */
export const SessionTimeoutConstraints = {
    session_timeout_minutes: {
        min: 5,
        max: 1440, // 24 hours
        default: 60
    },
    refresh_timeout_days: {
        min: 1,
        max: 30,
        default: 7
    },
    admin_session_timeout_minutes: {
        min: 5,
        max: 1440, // 24 hours
        default: 120
    }
} as const;


// ============================================================================
// API Service
// ============================================================================

/**
 * Session Timeout API Service
 * 
 * Handles all API calls related to session timeout configuration.
 */
export class SessionTimeoutService {
    private baseUrl = '/api/tenants/session-timeout/';

    /**
     * Get current session timeout settings for the tenant
     */
    async getSettings(): Promise<SessionTimeoutSettings> {
        const response = await fetch(this.baseUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Update session timeout settings
     * 
     * @param settings - Partial or full settings object to update
     */
    async updateSettings(
        settings: Partial<SessionTimeoutSettings>
    ): Promise<SessionTimeoutSettings> {
        const response = await fetch(this.baseUrl, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || error.errors || 'Failed to update settings');
        }

        return await response.json();
    }
}


// ============================================================================
// React Component Example
// ============================================================================

import React, { useState, useEffect } from 'react';

/**
 * Example React component for session timeout configuration
 */
export const SessionTimeoutSettings: React.FC = () => {
    const [settings, setSettings] = useState<SessionTimeoutSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const service = new SessionTimeoutService();

    // Load settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await service.getSettings();
            setSettings(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const updated = await service.updateSettings(settings);
            setSettings(updated);
            setSuccess('Session timeout settings updated successfully');

            // Clear success message after 5 seconds
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const formatDuration = (minutes: number): string => {
        if (minutes < 60) return `${minutes} minutes`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours}h ${mins}m` : `${hours} hours`;
    };

    if (loading) return <div>Loading...</div>;
    if (!settings) return <div>No settings available</div>;

    return (
        <div className="session-timeout-settings">
            <h2>Session & Security Settings</h2>

            {error && (
                <div className="alert alert-error">
                    {error}
                </div>
            )}

            {success && (
                <div className="alert alert-success">
                    {success}
                </div>
            )}

            <div className="settings-form">
                {/* Session Timeout */}
                <div className="form-group">
                    <label htmlFor="session-timeout">
                        Session Timeout (Active Session)
                    </label>
                    <input
                        id="session-timeout"
                        type="number"
                        min={SessionTimeoutConstraints.session_timeout_minutes.min}
                        max={SessionTimeoutConstraints.session_timeout_minutes.max}
                        value={settings.session_timeout_minutes}
                        onChange={(e) => setSettings({
                            ...settings,
                            session_timeout_minutes: parseInt(e.target.value)
                        })}
                    />
                    <small>
                        Users will be logged out after {formatDuration(settings.session_timeout_minutes)} of inactivity.
                        <br />
                        Range: {SessionTimeoutConstraints.session_timeout_minutes.min} - {SessionTimeoutConstraints.session_timeout_minutes.max} minutes
                    </small>
                </div>

                {/* Refresh Timeout */}
                <div className="form-group">
                    <label htmlFor="refresh-timeout">
                        Remember Me Duration (Days)
                    </label>
                    <input
                        id="refresh-timeout"
                        type="number"
                        min={SessionTimeoutConstraints.refresh_timeout_days.min}
                        max={SessionTimeoutConstraints.refresh_timeout_days.max}
                        value={settings.refresh_timeout_days}
                        onChange={(e) => setSettings({
                            ...settings,
                            refresh_timeout_days: parseInt(e.target.value)
                        })}
                    />
                    <small>
                        Users can stay logged in for up to {settings.refresh_timeout_days} days.
                        <br />
                        Range: {SessionTimeoutConstraints.refresh_timeout_days.min} - {SessionTimeoutConstraints.refresh_timeout_days.max} days
                    </small>
                </div>

                {/* Admin Session Timeout */}
                <div className="form-group">
                    <label htmlFor="admin-timeout">
                        Admin Panel Timeout
                    </label>
                    <input
                        id="admin-timeout"
                        type="number"
                        min={SessionTimeoutConstraints.admin_session_timeout_minutes.min}
                        max={SessionTimeoutConstraints.admin_session_timeout_minutes.max}
                        value={settings.admin_session_timeout_minutes}
                        onChange={(e) => setSettings({
                            ...settings,
                            admin_session_timeout_minutes: parseInt(e.target.value)
                        })}
                    />
                    <small>
                        Django admin sessions expire after {formatDuration(settings.admin_session_timeout_minutes)}.
                        <br />
                        Range: {SessionTimeoutConstraints.admin_session_timeout_minutes.min} - {SessionTimeoutConstraints.admin_session_timeout_minutes.max} minutes
                    </small>
                </div>

                <div className="form-actions">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn btn-primary"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                <div className="info-box">
                    <strong>⚠️ Important:</strong> Changes will only apply to new login sessions.
                    Existing logged-in users will keep their current session timeout.
                </div>
            </div>
        </div>
    );
};


// ============================================================================
// Form Validation Helper
// ============================================================================

/**
 * Validates session timeout settings
 * 
 * @returns Array of validation error messages, empty if valid
 */
export const validateSessionTimeoutSettings = (
    settings: Partial<SessionTimeoutSettings>
): string[] => {
    const errors: string[] = [];

    if (settings.session_timeout_minutes !== undefined) {
        const { min, max } = SessionTimeoutConstraints.session_timeout_minutes;
        if (settings.session_timeout_minutes < min || settings.session_timeout_minutes > max) {
            errors.push(`Session timeout must be between ${min} and ${max} minutes`);
        }
    }

    if (settings.refresh_timeout_days !== undefined) {
        const { min, max } = SessionTimeoutConstraints.refresh_timeout_days;
        if (settings.refresh_timeout_days < min || settings.refresh_timeout_days > max) {
            errors.push(`Refresh timeout must be between ${min} and ${max} days`);
        }
    }

    if (settings.admin_session_timeout_minutes !== undefined) {
        const { min, max } = SessionTimeoutConstraints.admin_session_timeout_minutes;
        if (settings.admin_session_timeout_minutes < min || settings.admin_session_timeout_minutes > max) {
            errors.push(`Admin session timeout must be between ${min} and ${max} minutes`);
        }
    }

    return errors;
};


// ============================================================================
// Redux/State Management Example
// ============================================================================

/**
 * Example Redux actions for session timeout settings
 */
export const sessionTimeoutActions = {
    // Action types
    FETCH_SETTINGS_REQUEST: 'SESSION_TIMEOUT/FETCH_SETTINGS_REQUEST',
    FETCH_SETTINGS_SUCCESS: 'SESSION_TIMEOUT/FETCH_SETTINGS_SUCCESS',
    FETCH_SETTINGS_FAILURE: 'SESSION_TIMEOUT/FETCH_SETTINGS_FAILURE',

    UPDATE_SETTINGS_REQUEST: 'SESSION_TIMEOUT/UPDATE_SETTINGS_REQUEST',
    UPDATE_SETTINGS_SUCCESS: 'SESSION_TIMEOUT/UPDATE_SETTINGS_SUCCESS',
    UPDATE_SETTINGS_FAILURE: 'SESSION_TIMEOUT/UPDATE_SETTINGS_FAILURE',

    // Action creators
    fetchSettings: () => async (dispatch: any) => {
        dispatch({ type: sessionTimeoutActions.FETCH_SETTINGS_REQUEST });

        try {
            const service = new SessionTimeoutService();
            const settings = await service.getSettings();
            dispatch({
                type: sessionTimeoutActions.FETCH_SETTINGS_SUCCESS,
                payload: settings
            });
        } catch (error) {
            dispatch({
                type: sessionTimeoutActions.FETCH_SETTINGS_FAILURE,
                payload: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },

    updateSettings: (settings: Partial<SessionTimeoutSettings>) => async (dispatch: any) => {
        dispatch({ type: sessionTimeoutActions.UPDATE_SETTINGS_REQUEST });

        try {
            const service = new SessionTimeoutService();
            const updated = await service.updateSettings(settings);
            dispatch({
                type: sessionTimeoutActions.UPDATE_SETTINGS_SUCCESS,
                payload: updated
            });
        } catch (error) {
            dispatch({
                type: sessionTimeoutActions.UPDATE_SETTINGS_FAILURE,
                payload: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    },
};


// ============================================================================
// Usage in Settings Page
// ============================================================================

/**
 * Add to your existing Settings page navigation:
 * 
 * const settingsSections = [
 *   { id: 'general', label: 'General', icon: 'settings' },
 *   { id: 'security', label: 'Session & Security', icon: 'lock' },  // <-- Add this
 *   { id: 'branding', label: 'Branding', icon: 'palette' },
 *   // ... other sections
 * ];
 * 
 * Then render the SessionTimeoutSettings component when 'security' section is active:
 * 
 * {activeSection === 'security' && <SessionTimeoutSettings />}
 */
