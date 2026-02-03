import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { applyIconTheme } from '../config/iconThemes';
import { setCurrentIconSet, IconSetType } from '../config/iconSets';

interface TenantBranding {
    id: number;
    tenant: number;
    tenant_name: string;
    // Legacy URL fields (kept for backward compatibility)
    logo_url: string;
    favicon_url: string;
    login_background_url: string;
    email_header_image: string;
    // New computed URL fields (with fallback logic from backend)
    small_logo_url: string | null;
    large_logo_url: string | null;
    square_logo_url: string | null;
    login_banner_url: string | null;
    dashboard_banner_url: string | null;
    report_header_url: string | null;
    // Colors
    primary_color: string;
    secondary_color: string;
    sidebar_color: string;
    // Typography
    font_family: string;
    // Icon/UI Theme
    icon_theme: string;
    icon_set: string;
    // Gallery
    gallery_images: string[];
    // Other settings
    custom_css: string;
    enabled_modules: string[];
}

// Basic modules that are always enabled
const BASIC_MODULES = ['dashboard', 'settings', 'users', 'students'];

interface TenantBrandingContextType {
    branding: TenantBranding | null;
    loading: boolean;
    error: string | null;
    refreshBranding: () => Promise<void>;
    isModuleEnabled: (moduleKey: string) => boolean;
    enabledModules: string[];
    // Helper methods for getting logo URLs with fallback
    getSmallLogoUrl: () => string | null;
    getLargeLogoUrl: () => string | null;
    getSquareLogoUrl: () => string | null;
    getLoginBannerUrl: () => string | null;
    getDashboardBannerUrl: () => string | null;
    getReportHeaderUrl: () => string | null;
}

const TenantBrandingContext = createContext<TenantBrandingContextType | undefined>(undefined);

export const TenantBrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [branding, setBranding] = useState<TenantBranding | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchBranding = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get('/tenants/branding/');
            setBranding(response.data);

            // Apply branding to CSS variables
            if (response.data) {
                applyBrandingToDOM(response.data);
            }
        } catch (err: any) {
            console.error('Error fetching tenant branding:', err);
            setError(err.message || 'Failed to load branding');
            // Set default branding if fetch fails
            const defaultBranding: TenantBranding = {
                id: 0,
                tenant: 0,
                tenant_name: 'NucleiQ',
                logo_url: '',
                favicon_url: '',
                login_background_url: '',
                email_header_image: '',
                small_logo_url: null,
                large_logo_url: null,
                square_logo_url: null,
                login_banner_url: null,
                dashboard_banner_url: null,
                report_header_url: null,
                primary_color: '#1976D2',
                secondary_color: '#424242',
                sidebar_color: '#263238',
                font_family: 'Inter, sans-serif',
                icon_theme: 'modern_gradient',
                icon_set: 'lucide',
                gallery_images: [],
                custom_css: '',
                enabled_modules: BASIC_MODULES
            };
            setBranding(defaultBranding);
            applyBrandingToDOM(defaultBranding);
        } finally {
            setLoading(false);
        }
    };

    const applyBrandingToDOM = (brandingData: TenantBranding) => {
        const root = document.documentElement;

        // Apply colors as CSS variables
        if (brandingData.primary_color) {
            root.style.setProperty('--color-primary', brandingData.primary_color);
            root.style.setProperty('--color-primary-600', brandingData.primary_color);
        }

        if (brandingData.secondary_color) {
            root.style.setProperty('--color-secondary', brandingData.secondary_color);
        }

        if (brandingData.sidebar_color) {
            root.style.setProperty('--sidebar-bg', brandingData.sidebar_color);
            // Keep layout CSS variable in sync so components using --color-bg-primary update correctly
            root.style.setProperty('--color-bg-primary', brandingData.sidebar_color);
        }

        if (brandingData.font_family) {
            root.style.setProperty('--font-family-primary', brandingData.font_family);
        }

        // Set login banner as CSS variable for use in Login page
        const loginBannerUrl = brandingData.login_banner_url || brandingData.login_background_url;
        if (loginBannerUrl) {
            root.style.setProperty('--login-bg-image', `url(${loginBannerUrl})`);
        } else {
            root.style.setProperty('--login-bg-image', 'none');
        }

        // Set dashboard banner as CSS variable for use in Dashboard
        if (brandingData.dashboard_banner_url) {
            root.style.setProperty('--dashboard-banner-image', `url(${brandingData.dashboard_banner_url})`);
        } else {
            root.style.setProperty('--dashboard-banner-image', 'none');
        }

        // Update favicon if provided (prefer square_logo_url, fallback to favicon_url)
        const faviconUrl = brandingData.square_logo_url || brandingData.favicon_url;
        if (faviconUrl) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
                favicon.href = faviconUrl;
            }
        }

        // Update page title with tenant name
        if (brandingData.tenant_name) {
            document.title = `${brandingData.tenant_name} - NucleiQ`;
        }

        // Apply icon theme
        if (brandingData.icon_theme) {
            applyIconTheme(brandingData.icon_theme);
        }

        if (brandingData.icon_set) {
            setCurrentIconSet(brandingData.icon_set as IconSetType);
        }
    };

    useEffect(() => {
        // Only fetch branding if user is authenticated
        const token = localStorage.getItem('token');
        if (token) {
            fetchBranding();
        } else {
            setLoading(false);
        }
    }, []);

    const refreshBranding = async () => {
        await fetchBranding();
    };

    // Check if a module is enabled for the current tenant
    const isModuleEnabled = (moduleKey: string): boolean => {
        if (!moduleKey) return true; // Items without a moduleKey are always visible
        const modules = branding?.enabled_modules || BASIC_MODULES;
        return modules.includes(moduleKey);
    };

    // Get the list of enabled modules
    const enabledModules = branding?.enabled_modules || BASIC_MODULES;

    // Helper methods for getting logo/banner URLs with fallback
    const getSmallLogoUrl = (): string | null => {
        if (!branding) return null;
        return branding.small_logo_url || branding.logo_url || null;
    };

    const getLargeLogoUrl = (): string | null => {
        if (!branding) return null;
        return branding.large_logo_url || branding.small_logo_url || branding.logo_url || null;
    };

    const getSquareLogoUrl = (): string | null => {
        if (!branding) return null;
        return branding.square_logo_url || branding.favicon_url || null;
    };

    const getLoginBannerUrl = (): string | null => {
        if (!branding) return null;
        return branding.login_banner_url || branding.login_background_url || null;
    };

    const getDashboardBannerUrl = (): string | null => {
        if (!branding) return null;
        return branding.dashboard_banner_url || null;
    };

    const getReportHeaderUrl = (): string | null => {
        if (!branding) return null;
        return branding.report_header_url || branding.large_logo_url || branding.logo_url || null;
    };

    return (
        <TenantBrandingContext.Provider value={{
            branding,
            loading,
            error,
            refreshBranding,
            isModuleEnabled,
            enabledModules,
            getSmallLogoUrl,
            getLargeLogoUrl,
            getSquareLogoUrl,
            getLoginBannerUrl,
            getDashboardBannerUrl,
            getReportHeaderUrl
        }}>
            {children}
        </TenantBrandingContext.Provider>
    );
};

export const useTenantBranding = () => {
    const context = useContext(TenantBrandingContext);
    if (context === undefined) {
        throw new Error('useTenantBranding must be used within a TenantBrandingProvider');
    }
    return context;
};
