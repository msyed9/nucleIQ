/**
 * NucleIQ Design System - Badge Component
 * Status indicators and labels
 */

import React from 'react';
import { LucideIcon } from 'lucide-react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    /** Badge variant */
    variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

    /** Badge size */
    size?: 'sm' | 'md' | 'lg';

    /** Icon to display */
    icon?: LucideIcon;

    /** Dot indicator instead of text */
    dot?: boolean;

    /** Children (badge text) */
    children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
    variant = 'neutral',
    size = 'md',
    icon: Icon,
    dot = false,
    className = '',
    children,
    ...props
}) => {
    const classes = [
        'ds-badge',
        `ds-badge--${variant}`,
        `ds-badge--${size}`,
        dot && 'ds-badge--dot',
        className,
    ]
        .filter(Boolean)
        .join(' ');

    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

    if (dot) {
        return <span className={classes} {...props} />;
    }

    return (
        <span className={classes} {...props}>
            {Icon && <Icon size={iconSize} className="ds-badge__icon" aria-hidden="true" />}
            {children}
        </span>
    );
};

Badge.displayName = 'Badge';
