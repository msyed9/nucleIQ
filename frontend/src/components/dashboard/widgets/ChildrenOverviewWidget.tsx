/**
 * Children Overview Widget (for parents)
 * Displays overview of parent's children
 */

import React from 'react';
import { User, GraduationCap } from 'lucide-react';
import './widgets.css';

interface Child {
    id: string;
    name: string;
    photo: string | null;
    class: string;
    roll_number: string | null;
}

interface ChildrenOverviewData {
    children: Child[];
}

interface ChildrenOverviewWidgetProps {
    widgetId: string;
    config?: Record<string, any>;
    data: ChildrenOverviewData;
    onRefresh?: () => void;
}

export const ChildrenOverviewWidget: React.FC<ChildrenOverviewWidgetProps> = ({
    data,
    onRefresh
}) => {
    const { children = [] } = data;

    if (children.length === 0) {
        return (
            <div className="children-overview-widget empty">
                <div className="empty-state">
                    <User size={32} />
                    <p>No children linked to this account</p>
                </div>
            </div>
        );
    }

    return (
        <div className="children-overview-widget">
            <div className="widget-header">
                <GraduationCap size={18} />
                <h3>My Children</h3>
            </div>

            <div className="children-grid">
                {children.map(child => (
                    <div key={child.id} className="child-card">
                        <div className="child-avatar">
                            {child.photo ? (
                                <img src={child.photo} alt={child.name} />
                            ) : (
                                <div className="avatar-placeholder">
                                    {child.name.charAt(0)}
                                </div>
                            )}
                        </div>
                        <div className="child-info">
                            <div className="child-name">{child.name}</div>
                            <div className="child-class">{child.class}</div>
                            {child.roll_number && (
                                <div className="child-roll">Roll: {child.roll_number}</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChildrenOverviewWidget;
