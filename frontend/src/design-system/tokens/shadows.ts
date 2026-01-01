/**
 * NucleIQ Design System - Shadow Tokens
 * Elevation system for depth and hierarchy
 */

export const shadows = {
    // Elevation levels (Material Design inspired)
    none: 'none',

    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.06), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
    md: '0 8px 12px -2px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    lg: '0 12px 24px -4px rgba(0, 0, 0, 0.12), 0 6px 12px -2px rgba(0, 0, 0, 0.06)',
    xl: '0 20px 32px -8px rgba(0, 0, 0, 0.15), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
    '2xl': '0 24px 48px -12px rgba(0, 0, 0, 0.18), 0 12px 24px -6px rgba(0, 0, 0, 0.1)',

    // Semantic shadows
    card: '0 2px 8px rgba(0, 0, 0, 0.06)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.3)',
    dropdown: '0 8px 16px rgba(0, 0, 0, 0.15)',

    // Focus states
    focusRing: '0 0 0 3px rgba(33, 150, 243, 0.1)',
    focusRingError: '0 0 0 3px rgba(244, 67, 54, 0.1)',
    focusRingSuccess: '0 0 0 3px rgba(76, 175, 80, 0.1)',

    // Inner shadows
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    innerLg: 'inset 0 4px 8px 0 rgba(0, 0, 0, 0.1)',
} as const;

// Dark mode shadows (more pronounced)
export const darkShadows = {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    sm: '0 2px 4px 0 rgba(0, 0, 0, 0.4), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    base: '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
    md: '0 8px 12px -2px rgba(0, 0, 0, 0.6), 0 4px 6px -2px rgba(0, 0, 0, 0.4)',
    lg: '0 12px 24px -4px rgba(0, 0, 0, 0.7), 0 6px 12px -2px rgba(0, 0, 0, 0.5)',
    xl: '0 20px 32px -8px rgba(0, 0, 0, 0.8), 0 8px 16px -4px rgba(0, 0, 0, 0.6)',
    '2xl': '0 24px 48px -12px rgba(0, 0, 0, 0.9), 0 12px 24px -6px rgba(0, 0, 0, 0.7)',

    card: '0 2px 8px rgba(0, 0, 0, 0.4)',
    cardHover: '0 8px 24px rgba(0, 0, 0, 0.6)',
    modal: '0 20px 60px rgba(0, 0, 0, 0.8)',
} as const;

// Export types
export type ShadowToken = typeof shadows;
export type DarkShadowToken = typeof darkShadows;
