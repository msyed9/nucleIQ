import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

export interface UserPreferences {
    language: string;
    theme_mode: string;
    timezone: string;
    date_format?: string;
    time_format?: string;
    density?: string;
    notification_channels?: Record<string, boolean>;
    sidebar_collapsed?: boolean;
    dashboard_widgets?: any[];
    // Font customization
    font_family?: string;
    font_size?: string;  // 'small' | 'medium' | 'large' | 'extra-large'
    font_color?: string; // Custom text color (hex)
    heading_color?: string; // Custom heading color (hex)
    link_color?: string; // Custom link color (hex)
}

interface PreferencesContextType {
    preferences: UserPreferences;
    loading: boolean;
    updatePreferences: (newPreferences: Partial<UserPreferences>) => Promise<void>;
    applyTheme: (theme: string) => void;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(undefined);

export const usePreferences = () => {
    const context = useContext(PreferencesContext);
    if (!context) {
        throw new Error('usePreferences must be used within PreferencesProvider');
    }
    return context;
};

interface PreferencesProviderProps {
    children: ReactNode;
}

export const PreferencesProvider: React.FC<PreferencesProviderProps> = ({ children }) => {
    const { i18n } = useTranslation();
    const [preferences, setPreferences] = useState<UserPreferences>({
        language: 'en',
        theme_mode: 'system',
        timezone: 'UTC',
    });
    const [loading, setLoading] = useState(true);

    // Apply theme to document
    const applyTheme = (theme: string) => {
        const root = document.documentElement;

        if (theme === 'dark') {
            root.classList.add('dark-mode');
            root.setAttribute('data-theme', 'dark');
        } else if (theme === 'light') {
            root.classList.remove('dark-mode');
            root.setAttribute('data-theme', 'light');
        } else {
            // System default
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.classList.toggle('dark-mode', prefersDark);
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        }
    };

    // Apply RTL for Arabic and Urdu
    const applyDirection = (language: string) => {
        const root = document.documentElement;
        const isRTL = ['ar', 'ur'].includes(language);
        root.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
        root.setAttribute('lang', language);
    };

    // Apply font customization styles
    const applyFontStyles = (prefs: Partial<UserPreferences>) => {
        const root = document.documentElement;

        // Font family
        if (prefs.font_family) {
            root.style.setProperty('--user-font-family', prefs.font_family);
            document.body.style.fontFamily = prefs.font_family;
        }

        // Font size mapping
        const fontSizeMap: Record<string, string> = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'extra-large': '20px'
        };
        if (prefs.font_size && fontSizeMap[prefs.font_size]) {
            root.style.setProperty('--user-font-size', fontSizeMap[prefs.font_size]);
            document.body.style.fontSize = fontSizeMap[prefs.font_size];
        }

        // Custom colors
        if (prefs.font_color) {
            root.style.setProperty('--user-text-color', prefs.font_color);
            root.style.setProperty('--color-text-primary', prefs.font_color);
        }
        if (prefs.heading_color) {
            root.style.setProperty('--user-heading-color', prefs.heading_color);
        }
        if (prefs.link_color) {
            root.style.setProperty('--user-link-color', prefs.link_color);
        }
    };

    // Load preferences from backend
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const token = localStorage.getItem('access_token');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const response = await api.get('/users/me/');
                const userPrefs = response.data.preference;

                if (userPrefs) {
                    setPreferences(userPrefs);

                    // Apply language
                    if (userPrefs.language) {
                        i18n.changeLanguage(userPrefs.language);
                        applyDirection(userPrefs.language);
                    }

                    // Apply theme
                    if (userPrefs.theme_mode) {
                        applyTheme(userPrefs.theme_mode);
                    }

                    // Apply font customization
                    applyFontStyles(userPrefs);
                }
            } catch (error) {
                console.error('Failed to load preferences:', error);
            } finally {
                setLoading(false);
            }
        };

        loadPreferences();
    }, [i18n]);

    // Listen for system theme changes
    useEffect(() => {
        if (preferences.theme_mode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => applyTheme('system');

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [preferences.theme_mode]);

    // Update preferences
    const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
        try {
            const response = await api.patch('/users/preferences/', newPreferences);
            const updatedPrefs = response.data;

            setPreferences(updatedPrefs);

            // Apply language if changed
            if (newPreferences.language && newPreferences.language !== preferences.language) {
                i18n.changeLanguage(newPreferences.language);
                applyDirection(newPreferences.language);
            }

            // Apply theme if changed
            if (newPreferences.theme_mode && newPreferences.theme_mode !== preferences.theme_mode) {
                applyTheme(newPreferences.theme_mode);
            }

            // Apply font styles if any font settings changed
            if (newPreferences.font_family || newPreferences.font_size ||
                newPreferences.font_color || newPreferences.heading_color || newPreferences.link_color) {
                applyFontStyles(updatedPrefs);
            }
        } catch (error) {
            console.error('Failed to update preferences:', error);
            throw error;
        }
    };

    return (
        <PreferencesContext.Provider
            value={{
                preferences,
                loading,
                updatePreferences,
                applyTheme,
            }}
        >
            {children}
        </PreferencesContext.Provider>
    );
};
