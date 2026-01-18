/**
 * NucleiQ Design System - Typography Tokens
 * Inter font family with Telugu support
 * Responsive type scale for mobile-first design
 */

export const typography = {
    // Font Families
    fontFamily: {
        primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        secondary: "'Inter', sans-serif",
        mono: "'Fira Code', 'Courier New', monospace",
        telugu: "'Noto Sans Telugu', 'Inter', sans-serif", // For Telugu language support
    },

    // Font Sizes (using rem for accessibility)
    fontSize: {
        xs: '0.75rem',    // 12px
        sm: '0.875rem',   // 14px
        base: '1rem',     // 16px (default)
        lg: '1.125rem',   // 18px
        xl: '1.25rem',    // 20px
        '2xl': '1.5rem',  // 24px
        '3xl': '1.875rem', // 30px
        '4xl': '2.25rem', // 36px
        '5xl': '3rem',    // 48px
        '6xl': '3.75rem', // 60px
    },

    // Font Weights
    fontWeight: {
        light: 300,
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
    },

    // Line Heights
    lineHeight: {
        none: 1,
        tight: 1.25,
        snug: 1.375,
        normal: 1.5,
        relaxed: 1.625,
        loose: 2,
    },

    // Letter Spacing
    letterSpacing: {
        tighter: '-0.05em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
    },

    // Text Styles (Predefined combinations)
    textStyles: {
        // Headings
        h1: {
            fontSize: '3rem', // 48px
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.025em',
        },
        h2: {
            fontSize: '2.25rem', // 36px
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.025em',
        },
        h3: {
            fontSize: '1.875rem', // 30px
            fontWeight: 600,
            lineHeight: 1.3,
            letterSpacing: '-0.025em',
        },
        h4: {
            fontSize: '1.5rem', // 24px
            fontWeight: 600,
            lineHeight: 1.35,
            letterSpacing: '0',
        },
        h5: {
            fontSize: '1.25rem', // 20px
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '0',
        },
        h6: {
            fontSize: '1.125rem', // 18px
            fontWeight: 600,
            lineHeight: 1.4,
            letterSpacing: '0',
        },

        // Body Text
        bodyLarge: {
            fontSize: '1.125rem', // 18px
            fontWeight: 400,
            lineHeight: 1.625,
            letterSpacing: '0',
        },
        body: {
            fontSize: '1rem', // 16px
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: '0',
        },
        bodySmall: {
            fontSize: '0.875rem', // 14px
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: '0',
        },

        // UI Text
        label: {
            fontSize: '0.875rem', // 14px
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
        },
        caption: {
            fontSize: '0.75rem', // 12px
            fontWeight: 400,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
        },
        overline: {
            fontSize: '0.75rem', // 12px
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.1em',
            textTransform: 'uppercase' as const,
        },

        // Buttons
        buttonLarge: {
            fontSize: '1rem', // 16px
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
        },
        button: {
            fontSize: '0.875rem', // 14px
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
        },
        buttonSmall: {
            fontSize: '0.75rem', // 12px
            fontWeight: 600,
            lineHeight: 1.5,
            letterSpacing: '0.025em',
        },
    },

    // Mobile Responsive Overrides (for screens < 768px)
    mobileTextStyles: {
        h1: {
            fontSize: '2.25rem', // 36px
            fontWeight: 700,
            lineHeight: 1.2,
        },
        h2: {
            fontSize: '1.875rem', // 30px
            fontWeight: 700,
            lineHeight: 1.25,
        },
        h3: {
            fontSize: '1.5rem', // 24px
            fontWeight: 600,
            lineHeight: 1.3,
        },
        h4: {
            fontSize: '1.25rem', // 20px
            fontWeight: 600,
            lineHeight: 1.35,
        },
    },
} as const;

// Export type for TypeScript autocomplete
export type TypographyToken = typeof typography;
