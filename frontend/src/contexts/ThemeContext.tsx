/**
 * Theme Context Provider
 * Manages theme mode, tenant branding, language, and RTL support
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ThemeContextType } from '../types/auth';
import { useAuth } from './AuthContext';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

interface ThemeProviderProps {
    children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const { user, updatePreferences } = useAuth();

    // Initialize from localStorage for immediate application
    const getInitialThemeMode = (): 'light' | 'dark' | 'system' => {
        const savedMode = localStorage.getItem('nucleiq_theme_mode');
        if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
            return savedMode;
        }
        return 'system';
    };

    const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>(getInitialThemeMode);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [customColor, setCustomColorState] = useState<string>(localStorage.getItem('theme_color') || '');

    // Get user preference or default
    const userThemeMode = user?.preference?.theme_mode || null;
    const userLanguage = user?.preference?.language || 'en';
    const branding = user?.tenant_branding || null;

    // Update theme mode when user preference loads (but only if not already set in localStorage)
    useEffect(() => {
        if (userThemeMode && !localStorage.getItem('nucleiq_theme_mode')) {
            setThemeModeState(userThemeMode);
        }
    }, [userThemeMode]);

    // Determine actual theme based on mode
    useEffect(() => {
        const determineTheme = () => {
            if (themeMode === 'system') {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                return prefersDark ? 'dark' : 'light';
            }
            return themeMode;
        };

        const actualTheme = determineTheme();
        setTheme(actualTheme);

        // Apply theme to document
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(actualTheme);

        // Listen for system theme changes if in system mode
        if (themeMode === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e: MediaQueryListEvent) => {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(newTheme);
            };

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [themeMode]);

    // Apply tenant branding and custom colors
    useEffect(() => {
        const root = document.documentElement;

        // Determine primary color: custom > branding > default
        const primaryColor = customColor || branding?.primary_color || '#0b3b66'; // Default NucleiQ blue

        root.style.setProperty('--color-primary', primaryColor);

        // If using branding secondary, or derive it? For now use branding or default
        if (branding) {
            root.style.setProperty('--color-secondary', branding.secondary_color);
            root.style.setProperty('--color-sidebar', branding.sidebar_color);
            if (branding.font_family) root.style.setProperty('--font-family', branding.font_family);
            if (branding.favicon_url) {
                const favicon = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
                if (favicon) favicon.href = branding.favicon_url;
            }
        }
    }, [branding, customColor]);

    // Apply RTL direction
    const isRTL = useMemo(() => {
        return ['ar', 'ur'].includes(userLanguage);
    }, [userLanguage]);

    useEffect(() => {
        document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
        document.documentElement.lang = userLanguage;
    }, [isRTL, userLanguage]);

    const setThemeMode = async (mode: 'light' | 'dark' | 'system') => {
        setThemeModeState(mode);

        // Save to localStorage for immediate persistence
        localStorage.setItem('nucleiq_theme_mode', mode);

        // Update user preference if authenticated
        if (user) {
            try {
                await updatePreferences({ theme_mode: mode });
            } catch (error) {
                console.error('Failed to update theme preference:', error);
                // Theme is still applied locally via localStorage
            }
        }
    };

    const setLanguage = async (lang: string) => {
        // Update user preference if authenticated
        if (user) {
            try {
                await updatePreferences({ language: lang as any });
            } catch (error) {
                console.error('Failed to update language preference:', error);
            }
        }
    };

    const themeColor = customColor || branding?.primary_color || 'blue'; // Fallback to blue/default

    const setThemeColor = (color: string) => {
        setCustomColorState(color);
        localStorage.setItem('theme_color', color);
    };

    const value: ThemeContextType = {
        theme,
        themeMode,
        setThemeMode,
        branding,
        language: userLanguage,
        isRTL,
        setLanguage,
        themeColor,
        setThemeColor
    };

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
