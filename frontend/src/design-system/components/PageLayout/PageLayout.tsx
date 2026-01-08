/**
 * NucleIQ Design System - Page Layout Component
 * Consistent page wrapper with header, actions, and content area
 */

import React from 'react';
import './PageLayout.css';

export interface PageLayoutProps {
    /** Page title */
    title: string;

    /** Page subtitle/description */
    subtitle?: string;

    /** Action buttons (rendered in header) */
    actions?: React.ReactNode;

    /** Page content */
    children: React.ReactNode;

    /** Maximum width of content */
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';

    /** Show back button */
    showBack?: boolean;

    /** Back button callback */
    onBack?: () => void;

    /** Additional CSS class */
    className?: string;
}

export const PageLayout: React.FC<PageLayoutProps> = ({
    title,
    subtitle,
    actions,
    children,
    maxWidth = 'xl',
    showBack = false,
    onBack,
    className = '',
}) => {
    const containerClasses = [
        'ds-page-layout',
        `ds-page-layout--${maxWidth}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className={containerClasses}>
            <div className="ds-page-layout__header">
                <div className="ds-page-layout__header-content">
                    {showBack && (
                        <button
                            className="ds-page-layout__back"
                            onClick={onBack}
                            aria-label="Go back"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M12.5 15L7.5 10L12.5 5"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>
                    )}

                    <div className="ds-page-layout__title-group">
                        <h1 className="ds-page-layout__title">{title}</h1>
                        {subtitle && (
                            <p className="ds-page-layout__subtitle">{subtitle}</p>
                        )}
                    </div>
                </div>

                {actions && (
                    <div className="ds-page-layout__actions">{actions}</div>
                )}
            </div>

            <div className="ds-page-layout__content">{children}</div>
        </div>
    );
};

PageLayout.displayName = 'PageLayout';
