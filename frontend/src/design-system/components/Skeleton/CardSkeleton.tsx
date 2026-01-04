/**
 * NucleIQ Design System - Card Skeleton
 * Loading placeholder for card components
 */

import React from 'react';
import { Skeleton } from './Skeleton';
import './CardSkeleton.css';

export interface CardSkeletonProps {
    /** Show avatar/image */
    showAvatar?: boolean;

    /** Show header */
    showHeader?: boolean;

    /** Number of content lines */
    lines?: number;

    /** Show footer */
    showFooter?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
    showAvatar = false,
    showHeader = true,
    lines = 3,
    showFooter = false,
}) => {
    return (
        <div className="ds-card-skeleton">
            {showHeader && (
                <div className="ds-card-skeleton__header">
                    {showAvatar && (
                        <Skeleton variant="circular" width={40} height={40} />
                    )}
                    <div className="ds-card-skeleton__header-text">
                        <Skeleton width="60%" height={20} />
                        <Skeleton width="40%" height={14} />
                    </div>
                </div>
            )}

            <div className="ds-card-skeleton__content">
                <Skeleton count={lines} />
            </div>

            {showFooter && (
                <div className="ds-card-skeleton__footer">
                    <Skeleton width={80} height={36} variant="rounded" />
                    <Skeleton width={80} height={36} variant="rounded" />
                </div>
            )}
        </div>
    );
};

CardSkeleton.displayName = 'CardSkeleton';
