/**
 * NucleIQ Design System - Table Skeleton
 * Loading placeholder for data tables
 */

import React from 'react';
import { Skeleton } from './Skeleton';
import './TableSkeleton.css';

export interface TableSkeletonProps {
    /** Number of rows to show */
    rows?: number;

    /** Number of columns to show */
    columns?: number;

    /** Show header row */
    showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
    rows = 5,
    columns = 5,
    showHeader = true,
}) => {
    return (
        <div className="ds-table-skeleton">
            {showHeader && (
                <div className="ds-table-skeleton__header">
                    {Array.from({ length: columns }).map((_, index) => (
                        <Skeleton
                            key={`header-${index}`}
                            height={16}
                            variant="rounded"
                        />
                    ))}
                </div>
            )}

            <div className="ds-table-skeleton__body">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={`row-${rowIndex}`} className="ds-table-skeleton__row">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={`cell-${rowIndex}-${colIndex}`}
                                height={20}
                                variant="rounded"
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

TableSkeleton.displayName = 'TableSkeleton';
