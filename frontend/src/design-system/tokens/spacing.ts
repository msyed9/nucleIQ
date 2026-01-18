/**
 * NucleiQ Design System - Spacing Tokens
 * 8px base grid system for consistent spacing
 */

export const spacing = {
    // Base spacing scale (8px grid)
    0: '0',
    0.5: '0.125rem',  // 2px
    1: '0.25rem',     // 4px
    1.5: '0.375rem',  // 6px
    2: '0.5rem',      // 8px
    2.5: '0.625rem',  // 10px
    3: '0.75rem',     // 12px
    3.5: '0.875rem',  // 14px
    4: '1rem',        // 16px
    5: '1.25rem',     // 20px
    6: '1.5rem',      // 24px
    7: '1.75rem',     // 28px
    8: '2rem',        // 32px
    9: '2.25rem',     // 36px
    10: '2.5rem',     // 40px
    11: '2.75rem',    // 44px
    12: '3rem',       // 48px
    14: '3.5rem',     // 56px
    16: '4rem',       // 64px
    20: '5rem',       // 80px
    24: '6rem',       // 96px
    28: '7rem',       // 112px
    32: '8rem',       // 128px
    36: '9rem',       // 144px
    40: '10rem',      // 160px
    44: '11rem',      // 176px
    48: '12rem',      // 192px
    52: '13rem',      // 208px
    56: '14rem',      // 224px
    60: '15rem',      // 240px
    64: '16rem',      // 256px
    72: '18rem',      // 288px
    80: '20rem',      // 320px
    96: '24rem',      // 384px
} as const;

// Semantic spacing for common use cases
export const semanticSpacing = {
    // Component padding
    componentPadding: {
        xs: spacing[2],   // 8px
        sm: spacing[3],   // 12px
        md: spacing[4],   // 16px
        lg: spacing[6],   // 24px
        xl: spacing[8],   // 32px
    },

    // Card padding
    cardPadding: {
        sm: spacing[4],   // 16px
        md: spacing[6],   // 24px
        lg: spacing[8],   // 32px
    },

    // Section spacing
    sectionSpacing: {
        sm: spacing[8],   // 32px
        md: spacing[12],  // 48px
        lg: spacing[16],  // 64px
        xl: spacing[24],  // 96px
    },

    // Gap between elements
    gap: {
        xs: spacing[1],   // 4px
        sm: spacing[2],   // 8px
        md: spacing[4],   // 16px
        lg: spacing[6],   // 24px
        xl: spacing[8],   // 32px
    },

    // Touch targets (minimum 44px for mobile accessibility)
    touchTarget: {
        min: spacing[11],  // 44px
        comfortable: spacing[12], // 48px
        large: spacing[14], // 56px
    },
} as const;

// Border Radius
export const borderRadius = {
    none: '0',
    sm: '0.25rem',    // 4px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem',     // 24px
    '2xl': '2rem',    // 32px
    full: '9999px',   // Fully rounded (pills, circles)
} as const;

// Export types
export type SpacingToken = typeof spacing;
export type SemanticSpacingToken = typeof semanticSpacing;
export type BorderRadiusToken = typeof borderRadius;
