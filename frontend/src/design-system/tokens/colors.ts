/**
 * NucleIQ Design System - Color Tokens
 * Education-focused color palette optimized for government schools
 * WCAG 2.1 AA compliant for accessibility
 */

export const colors = {
    // Primary - Trust Blue (Education theme)
    primary: {
        50: '#E3F2FD',
        100: '#BBDEFB',
        200: '#90CAF9',
        300: '#64B5F6',
        400: '#42A5F5',
        500: '#2196F3', // Main primary color
        600: '#1E88E5',
        700: '#1976D2', // Darker variant for hover states
        800: '#1565C0',
        900: '#0D47A1',
    },

    // Secondary - Growth Green (Progress, success)
    secondary: {
        50: '#F1F8E9',
        100: '#DCEDC8',
        200: '#C5E1A5',
        300: '#AED581',
        400: '#9CCC65',
        500: '#8BC34A', // Main secondary color
        600: '#7CB342',
        700: '#689F38',
        800: '#558B2F',
        900: '#33691E',
    },

    // Accent - Warm Orange (CTAs, important actions)
    accent: {
        50: '#FFF3E0',
        100: '#FFE0B2',
        200: '#FFCC80',
        300: '#FFB74D',
        400: '#FFA726',
        500: '#FF9800', // Main accent color
        600: '#FB8C00',
        700: '#F57C00',
        800: '#EF6C00',
        900: '#E65100',
    },

    // Neutrals - Grays for text and backgrounds
    neutral: {
        0: '#FFFFFF',
        50: '#FAFAFA',
        100: '#F5F5F5',
        200: '#EEEEEE',
        300: '#E0E0E0',
        400: '#BDBDBD',
        500: '#9E9E9E',
        600: '#757575',
        700: '#616161',
        800: '#424242',
        900: '#212121',
        1000: '#000000',
    },

    // Semantic Colors
    success: {
        50: '#E8F5E9',
        100: '#C8E6C9',
        500: '#4CAF50', // Main success color
        700: '#388E3C',
        900: '#1B5E20',
    },

    warning: {
        50: '#FFF8E1',
        100: '#FFECB3',
        500: '#FFC107', // Main warning color
        700: '#FFA000',
        900: '#FF6F00',
    },

    error: {
        50: '#FFEBEE',
        100: '#FFCDD2',
        500: '#F44336', // Main error color
        700: '#D32F2F',
        900: '#B71C1C',
    },

    info: {
        50: '#E3F2FD',
        100: '#BBDEFB',
        500: '#2196F3', // Main info color
        700: '#1976D2',
        900: '#0D47A1',
    },

    // Text Colors (optimized for readability)
    text: {
        primary: '#1A237E', // Deep blue for headings
        secondary: '#546E7A', // Muted blue-gray for body text
        tertiary: '#78909C', // Light gray for meta text
        disabled: '#B0BEC5',
        inverse: '#FFFFFF',
    },

    // Background Colors
    background: {
        primary: '#FFFFFF',
        secondary: '#FAFAFA',
        tertiary: '#F5F5F5',
        elevated: '#FFFFFF', // For cards, modals
        overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Border Colors
    border: {
        light: '#E0E0E0',
        medium: '#BDBDBD',
        dark: '#9E9E9E',
        focus: '#2196F3',
    },

    // Gradient Presets
    gradients: {
        primary: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
        secondary: 'linear-gradient(135deg, #8BC34A 0%, #689F38 100%)',
        accent: 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)',
        success: 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)',
        subtle: 'linear-gradient(135deg, #E3F2FD 0%, #F1F8E9 100%)',
        card: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
    },
} as const;

// Dark Mode Colors
export const darkColors = {
    background: {
        primary: '#121212',
        secondary: '#1E1E1E',
        tertiary: '#2C2C2C',
        elevated: '#1E1E1E',
        overlay: 'rgba(0, 0, 0, 0.7)',
    },

    text: {
        primary: '#FFFFFF',
        secondary: '#B0BEC5',
        tertiary: '#78909C',
        disabled: '#546E7A',
        inverse: '#1A237E',
    },

    border: {
        light: '#424242',
        medium: '#616161',
        dark: '#757575',
        focus: '#42A5F5',
    },
} as const;

// Export type for TypeScript autocomplete
export type ColorToken = typeof colors;
export type DarkColorToken = typeof darkColors;
