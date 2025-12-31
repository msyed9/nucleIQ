/**
 * Dashboard Grid Component
 * Drag-and-drop widget grid using react-grid-layout
 */

import React, { useState, useEffect } from 'react';
import GridLayout from 'react-grid-layout';
import axios from 'axios';
import { FeeTrendChart } from './widgets/FeeTrendChart';
import { StatCard } from './widgets/StatCard';
import { AbsenteeList } from './widgets/AbsenteeList';
import { NextClassCard } from './widgets/NextClassCard';
import 'react-grid-layout/css/styles.css';
import 'react-grid-layout/css/resizable.css';
import './DashboardGrid.css';

interface WidgetConfig {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    config?: Record<string, any>;
}

interface DashboardLayoutResponse {
    layout: WidgetConfig[];
}

export const DashboardGrid: React.FC<{ editMode: boolean }> = ({ editMode }) => {
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLayout();
    }, []);

    const fetchLayout = async () => {
        try {
            const response = await axios.get<DashboardLayoutResponse>('/api/dashboard/layout/current/');
            setLayout(response.data.layout || getDefaultLayout());
        } catch (error) {
            console.error('Failed to fetch layout:', error);
            setLayout(getDefaultLayout());
        } finally {
            setLoading(false);
        }
    };

    const getDefaultLayout = (): WidgetConfig[] => {
        return [
            { i: 'student_count', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
            { i: 'fee_trend_chart', x: 3, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'absentee_list', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 3 },
            { i: 'next_class_card', x: 0, y: 2, w: 3, h: 2, minW: 2, minH: 2 },
        ];
    };

    const handleLayoutChange = async (newLayout: any) => {
        if (!editMode) return;

        const updatedLayout: WidgetConfig[] = (newLayout as any[]).map((item: any) => {
            const existing = layout.find((l) => l.i === item.i);
            return {
                i: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
                minW: existing?.minW,
                minH: existing?.minH,
                config: existing?.config,
            };
        });

        setLayout(updatedLayout);

        // Save to backend
        try {
            await axios.post('/api/dashboard/layout/update_layout/', {
                layout: updatedLayout,
            });
        } catch (error) {
            console.error('Failed to save layout:', error);
        }
    };

    const renderWidget = (widgetId: string, config?: Record<string, any>) => {
        const widgets: Record<string, JSX.Element> = {
            student_count: <StatCard title="Total Students" value={450} icon="👨‍🎓" color="blue" />,
            staff_count: <StatCard title="Total Staff" value={45} icon="👨‍💼" color="green" />,
            fee_trend_chart: <FeeTrendChart config={config} />,
            absentee_list: <AbsenteeList />,
            next_class_card: <NextClassCard />,
        };

        return widgets[widgetId] || <div className="widget-placeholder">Widget: {widgetId}</div>;
    };

    if (loading) {
        return <div className="grid-loading">Loading widgets...</div>;
    }

    return (
        <div className="dashboard-grid-container">
            {editMode && (
                <div className="edit-mode-banner">
                    <span>🎨 Edit Mode Active - Drag and resize widgets</span>
                </div>
            )}

            <GridLayout
                {...({
                    className: 'dashboard-grid',
                    layout,
                    cols: 12,
                    rowHeight: 60,
                    width: 1200,
                    onLayoutChange: handleLayoutChange as any,
                    isDraggable: editMode,
                    isResizable: editMode,
                    compactType: 'vertical',
                    preventCollision: false,
                } as any)}
            >
                {layout.map((item) => (
                    <div key={item.i} className="grid-item">
                        <div className="widget-container">
                            {renderWidget(item.i, item.config)}
                        </div>
                        {editMode && (
                            <div className="widget-controls">
                                <button className="widget-remove" title="Remove widget">
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </GridLayout>

            {layout.length === 0 && (
                <div className="empty-grid">
                    <div className="empty-icon">📊</div>
                    <h3>No widgets added yet</h3>
                    <p>Click "Add Widget" to customize your dashboard</p>
                </div>
            )}
        </div>
    );
};
