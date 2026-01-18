/**
 * NucleiQ Design System - Card Component
 * Flexible container component with elevation and hover effects
 */

import React, { forwardRef } from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    /** Card variant */
    variant?: 'default' | 'outlined' | 'elevated';

    /** Padding size */
    padding?: 'none' | 'sm' | 'md' | 'lg';

    /** Enable hover effect */
    hoverable?: boolean;

    /** Enable click interaction */
    clickable?: boolean;

    /** Card header content */
    header?: React.ReactNode;

    /** Card footer content */
    footer?: React.ReactNode;

    /** Children (card body) */
    children?: React.ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    (
        {
            variant = 'default',
            padding = 'md',
            hoverable = false,
            clickable = false,
            header,
            footer,
            className = '',
            children,
            ...props
        },
        ref
    ) => {
        const classes = [
            'ds-card',
            `ds-card--${variant}`,
            `ds-card--padding-${padding}`,
            hoverable && 'ds-card--hoverable',
            clickable && 'ds-card--clickable',
            className,
        ]
            .filter(Boolean)
            .join(' ');

        return (
            <div
                ref={ref}
                className={classes}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                {...props}
            >
                {header && <div className="ds-card__header">{header}</div>}

                <div className="ds-card__body">{children}</div>

                {footer && <div className="ds-card__footer">{footer}</div>}
            </div>
        );
    }
);

Card.displayName = 'Card';
