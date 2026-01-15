/**
 * Icon Theme Configuration
 * 
 * Provides 6 distinct UI/Icon themes that tenant admins can choose from.
 * Each theme defines colors, styles, and visual characteristics for icons.
 */

export interface IconTheme {
    id: string;
    name: string;
    description: string;
    preview: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        backgroundColor: string;
    };
    iconStyle: {
        strokeWidth: number;
        fill: 'none' | 'solid' | 'gradient' | 'duotone';
        cornerRadius: 'sharp' | 'rounded' | 'pill';
    };
    cssVariables: {
        '--icon-primary': string;
        '--icon-secondary': string;
        '--icon-accent': string;
        '--icon-stroke-width': string;
        '--icon-bg-opacity': string;
        '--icon-glow': string;
        '--icon-shadow': string;
        '--icon-hover-scale': string;
        '--button-radius': string;
        '--card-radius': string;
        '--menu-item-radius': string;
        '--gradient-start': string;
        '--gradient-end': string;
    };
}

export const iconThemes: Record<string, IconTheme> = {
    modern_gradient: {
        id: 'modern_gradient',
        name: 'Modern Gradient',
        description: 'Sleek gradient icons with vibrant colors and smooth transitions',
        preview: {
            primaryColor: '#6366F1',
            secondaryColor: '#8B5CF6',
            accentColor: '#EC4899',
            backgroundColor: '#F1F5F9'
        },
        iconStyle: {
            strokeWidth: 2,
            fill: 'gradient',
            cornerRadius: 'rounded'
        },
        cssVariables: {
            '--icon-primary': '#6366F1',
            '--icon-secondary': '#8B5CF6',
            '--icon-accent': '#EC4899',
            '--icon-stroke-width': '2px',
            '--icon-bg-opacity': '0.1',
            '--icon-glow': '0 0 20px rgba(99, 102, 241, 0.3)',
            '--icon-shadow': '0 4px 12px rgba(99, 102, 241, 0.2)',
            '--icon-hover-scale': '1.05',
            '--button-radius': '12px',
            '--card-radius': '16px',
            '--menu-item-radius': '10px',
            '--gradient-start': '#6366F1',
            '--gradient-end': '#EC4899'
        }
    },

    minimal_outline: {
        id: 'minimal_outline',
        name: 'Minimal Outline',
        description: 'Clean, thin-line icons with subtle elegance',
        preview: {
            primaryColor: '#374151',
            secondaryColor: '#6B7280',
            accentColor: '#3B82F6',
            backgroundColor: '#FFFFFF'
        },
        iconStyle: {
            strokeWidth: 1.5,
            fill: 'none',
            cornerRadius: 'sharp'
        },
        cssVariables: {
            '--icon-primary': '#374151',
            '--icon-secondary': '#6B7280',
            '--icon-accent': '#3B82F6',
            '--icon-stroke-width': '1.5px',
            '--icon-bg-opacity': '0',
            '--icon-glow': 'none',
            '--icon-shadow': 'none',
            '--icon-hover-scale': '1.02',
            '--button-radius': '4px',
            '--card-radius': '8px',
            '--menu-item-radius': '4px',
            '--gradient-start': '#374151',
            '--gradient-end': '#374151'
        }
    },

    duotone: {
        id: 'duotone',
        name: 'Duotone',
        description: 'Two-tone icons with depth and dimension',
        preview: {
            primaryColor: '#0EA5E9',
            secondaryColor: '#0284C7',
            accentColor: '#38BDF8',
            backgroundColor: '#F0F9FF'
        },
        iconStyle: {
            strokeWidth: 2,
            fill: 'duotone',
            cornerRadius: 'rounded'
        },
        cssVariables: {
            '--icon-primary': '#0EA5E9',
            '--icon-secondary': '#0284C7',
            '--icon-accent': '#38BDF8',
            '--icon-stroke-width': '2px',
            '--icon-bg-opacity': '0.15',
            '--icon-glow': 'none',
            '--icon-shadow': '0 2px 8px rgba(14, 165, 233, 0.15)',
            '--icon-hover-scale': '1.03',
            '--button-radius': '10px',
            '--card-radius': '14px',
            '--menu-item-radius': '8px',
            '--gradient-start': '#0EA5E9',
            '--gradient-end': '#38BDF8'
        }
    },

    retro_flat: {
        id: 'retro_flat',
        name: 'Retro Flat',
        description: 'Bold, flat-style icons with vintage charm',
        preview: {
            primaryColor: '#F59E0B',
            secondaryColor: '#D97706',
            accentColor: '#EF4444',
            backgroundColor: '#FFFBEB'
        },
        iconStyle: {
            strokeWidth: 2.5,
            fill: 'solid',
            cornerRadius: 'pill'
        },
        cssVariables: {
            '--icon-primary': '#F59E0B',
            '--icon-secondary': '#D97706',
            '--icon-accent': '#EF4444',
            '--icon-stroke-width': '2.5px',
            '--icon-bg-opacity': '0.2',
            '--icon-glow': 'none',
            '--icon-shadow': '3px 3px 0 rgba(0, 0, 0, 0.1)',
            '--icon-hover-scale': '1.08',
            '--button-radius': '20px',
            '--card-radius': '20px',
            '--menu-item-radius': '16px',
            '--gradient-start': '#F59E0B',
            '--gradient-end': '#F59E0B'
        }
    },

    neon_glow: {
        id: 'neon_glow',
        name: 'Neon Glow',
        description: 'Vibrant neon icons with glowing effects for dark mode',
        preview: {
            primaryColor: '#22D3EE',
            secondaryColor: '#A855F7',
            accentColor: '#F472B6',
            backgroundColor: '#0F172A'
        },
        iconStyle: {
            strokeWidth: 2,
            fill: 'none',
            cornerRadius: 'rounded'
        },
        cssVariables: {
            '--icon-primary': '#22D3EE',
            '--icon-secondary': '#A855F7',
            '--icon-accent': '#F472B6',
            '--icon-stroke-width': '2px',
            '--icon-bg-opacity': '0.1',
            '--icon-glow': '0 0 15px currentColor, 0 0 30px currentColor',
            '--icon-shadow': '0 0 20px rgba(34, 211, 238, 0.4)',
            '--icon-hover-scale': '1.1',
            '--button-radius': '12px',
            '--card-radius': '16px',
            '--menu-item-radius': '10px',
            '--gradient-start': '#22D3EE',
            '--gradient-end': '#A855F7'
        }
    },

    classic_solid: {
        id: 'classic_solid',
        name: 'Classic Solid',
        description: 'Traditional filled icons with timeless appeal',
        preview: {
            primaryColor: '#1E40AF',
            secondaryColor: '#1E3A8A',
            accentColor: '#3B82F6',
            backgroundColor: '#EFF6FF'
        },
        iconStyle: {
            strokeWidth: 0,
            fill: 'solid',
            cornerRadius: 'rounded'
        },
        cssVariables: {
            '--icon-primary': '#1E40AF',
            '--icon-secondary': '#1E3A8A',
            '--icon-accent': '#3B82F6',
            '--icon-stroke-width': '0px',
            '--icon-bg-opacity': '0.12',
            '--icon-glow': 'none',
            '--icon-shadow': '0 2px 4px rgba(30, 64, 175, 0.2)',
            '--icon-hover-scale': '1.04',
            '--button-radius': '8px',
            '--card-radius': '12px',
            '--menu-item-radius': '6px',
            '--gradient-start': '#1E40AF',
            '--gradient-end': '#3B82F6'
        }
    }
};

export const getIconTheme = (themeId: string): IconTheme => {
    return iconThemes[themeId] || iconThemes.modern_gradient;
};

export const applyIconTheme = (themeId: string): void => {
    const theme = getIconTheme(themeId);
    const root = document.documentElement;

    Object.entries(theme.cssVariables).forEach(([property, value]) => {
        root.style.setProperty(property, value);
    });

    // Set a data attribute for CSS selectors
    root.setAttribute('data-icon-theme', themeId);
};

export default iconThemes;
