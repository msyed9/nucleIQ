/**
 * NucleIQ Design System - Skeleton Component
 * Loading placeholder with shimmer animation
 */

import React from 'react';
import './Skeleton.css';

export interface SkeletonProps {
    /** Width of skeleton (CSS value) */
    width?: string | number;

    /** Height of skeleton (CSS value) */
    height?: string | number;

    /** Border radius variant */
    variant?: 'text' | 'circular' | 'rectangular' | 'rounded';

    /** Number of skeleton lines (for text variant) */
    count?: number;

    /** Additional CSS class */
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width,
    height,
    variant = 'text',
    count = 1,
    className = '',
}) => {
    const getStyle = () => {
        const style: React.CSSProperties = {};

        if (width) {
            style.width = typeof width === 'number' ? `${width}px` : width;
        }

        if (height) {
            style.height = typeof height === 'number' ? `${height}px` : height;
        }

        return style;
    };

    const classes = [
        'ds-skeleton',
        `ds-skeleton--${variant}`,
        className,
    ]
        .filter(Boolean)
        .join(' ');

    if (count > 1) {
        return (
            <div className="ds-skeleton-group">
                {Array.from({ length: count }).map((_, index) => (
                    <div
                        key={index}
                        className={classes}
                        style={getStyle()}
                        aria-busy="true"
                        aria-live="polite"
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={classes}
            style={getStyle()}
            aria-busy="true"
            aria-live="polite"
        />
    );
};

Skeleton.displayName = 'Skeleton';
