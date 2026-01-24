/**
 * NucleiQ Design System - Card Component
 * Flexible container component with elevation and hover effects
 */

import React, { forwardRef } from 'react';
import './Card.css';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
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

    /** Card title */
    title?: React.ReactNode;

    /** Card subtitle */
    subtitle?: React.ReactNode;

    /** Card header actions */
    actions?: React.ReactNode;

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
            title,
            subtitle,
            actions,
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

        const showHeader = Boolean(header || title || subtitle || actions);
        const headerContent = header ?? (
            <div className="ds-card__header-content">
                {(title || subtitle) && (
                    <div className="ds-card__header-text">
                        {title && <div className="ds-card__title">{title}</div>}
                        {subtitle && <div className="ds-card__subtitle">{subtitle}</div>}
                    </div>
                )}
                {actions && <div className="ds-card__header-actions">{actions}</div>}
            </div>
        );

        return (
            <div
                ref={ref}
                className={classes}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                {...props}
            >
                {showHeader && <div className="ds-card__header">{headerContent}</div>}

                <div className="ds-card__body">{children}</div>

                {footer && <div className="ds-card__footer">{footer}</div>}
            </div>
        );
    }
);

Card.displayName = 'Card';
