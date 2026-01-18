/**
 * NucleiQ Design System - Transition Tokens
 * Animation timing and easing functions
 */

export const transitions = {
    // Duration
    duration: {
        instant: '0ms',
        fast: '150ms',
        normal: '200ms',
        moderate: '300ms',
        slow: '500ms',
        slower: '700ms',
    },

    // Easing functions
    easing: {
        linear: 'linear',
        easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
        easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
        easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
        sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',

        // Custom easings for specific use cases
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    },

    // Predefined transitions
    presets: {
        // Default transition for most interactions
        default: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',

        // Fast transitions for micro-interactions
        fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',

        // Slow transitions for emphasis
        slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',

        // Specific property transitions
        color: 'color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        background: 'background-color 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',

        // Bounce effect for playful interactions
        bounce: 'transform 300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
} as const;

// Animation keyframes (for CSS-in-JS or styled-components)
export const animations = {
    // Fade animations
    fadeIn: {
        from: { opacity: 0 },
        to: { opacity: 1 },
    },
    fadeOut: {
        from: { opacity: 1 },
        to: { opacity: 0 },
    },

    // Slide animations
    slideInUp: {
        from: { transform: 'translateY(20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideInDown: {
        from: { transform: 'translateY(-20px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
    },
    slideInLeft: {
        from: { transform: 'translateX(-20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
    },
    slideInRight: {
        from: { transform: 'translateX(20px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
    },

    // Scale animations
    scaleIn: {
        from: { transform: 'scale(0.95)', opacity: 0 },
        to: { transform: 'scale(1)', opacity: 1 },
    },
    scaleOut: {
        from: { transform: 'scale(1)', opacity: 1 },
        to: { transform: 'scale(0.95)', opacity: 0 },
    },

    // Spin animation (for loading spinners)
    spin: {
        from: { transform: 'rotate(0deg)' },
        to: { transform: 'rotate(360deg)' },
    },

    // Pulse animation (for attention-grabbing)
    pulse: {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
    },

    // Bounce animation
    bounce: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
    },
} as const;

// Export types
export type TransitionToken = typeof transitions;
export type AnimationToken = typeof animations;
