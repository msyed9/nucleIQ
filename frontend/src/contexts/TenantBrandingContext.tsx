import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { applyIconTheme } from '../config/iconThemes';
import { setCurrentIconSet, IconSetType } from '../config/iconSets';

interface TenantBranding {
    id: number;
    tenant: number;
    tenant_name: string;
    logo_url: string;
    favicon_url: string;
    login_background_url: string;
    email_header_image: string;
    primary_color: string;
    secondary_color: string;
    sidebar_color: string;
    font_family: string;
    icon_theme: string;
    icon_set: string;
    gallery_images: string[];
    custom_css: string;
}

interface TenantBrandingContextType {
    branding: TenantBranding | null;
    loading: boolean;
    error: string | null;
    refreshBranding: () => Promise<void>;
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
                primary_color: '#1976D2',
                secondary_color: '#424242',
                sidebar_color: '#263238',
                font_family: 'Inter, sans-serif',
                icon_theme: 'modern_gradient',
                icon_set: 'lucide',
                gallery_images: [],
                custom_css: ''
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
        }

        if (brandingData.font_family) {
            root.style.setProperty('--font-family-primary', brandingData.font_family);
        }

        // Update favicon if provided
        if (brandingData.favicon_url) {
            const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
            if (favicon) {
                favicon.href = brandingData.favicon_url;
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

    return (
        <TenantBrandingContext.Provider value={{ branding, loading, error, refreshBranding }}>
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
