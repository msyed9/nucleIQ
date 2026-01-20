/**
 * ConfigurableDashboard Component
 * Main dashboard with drag-and-drop widget customization
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import GridLayout, { Layout, WidthProvider } from 'react-grid-layout';
import {
    Settings,
    Plus,
    RefreshCw,
    LayoutGrid,
    Save,
    X,
    GripVertical,
    Trash2,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { Button, Card, Badge } from '@/design-system';
import { WidgetLibraryModal } from './WidgetLibraryModal';
import { WidgetRenderer } from './WidgetRenderer';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './ConfigurableDashboard.css';

const ResponsiveGridLayout = WidthProvider(GridLayout);

interface WidgetConfig {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
    config?: Record<string, any>;
}

interface WidgetDefinition {
    widget_id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
    default_width: number;
    default_height: number;
    min_width: number;
    min_height: number;
    max_width: number;
    max_height: number;
    is_system: boolean;
}

interface DashboardLayoutData {
    id: string;
    layout: WidgetConfig[];
    is_customized: boolean;
}

interface ConfigurableDashboardProps {
    isParent?: boolean;
    roleCode?: string;
}

export const ConfigurableDashboard: React.FC<ConfigurableDashboardProps> = ({
    isParent = false,
    roleCode
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [widgets, setWidgets] = useState<Record<string, WidgetDefinition>>({});
    const [editMode, setEditMode] = useState(false);
    const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
    const [widgetData, setWidgetData] = useState<Record<string, any>>({});

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch layout and available widgets in parallel
            const [layoutRes, widgetsRes] = await Promise.all([
                api.get<DashboardLayoutData>('/dashboard/layout/current/'),
                api.get<WidgetDefinition[]>('/dashboard/widgets/')
            ]);

            setLayout(layoutRes.data.layout || []);

            // Create widgets lookup
            const widgetMap: Record<string, WidgetDefinition> = {};
            widgetsRes.data.forEach(w => {
                widgetMap[w.widget_id] = w;
            });
            setWidgets(widgetMap);

            // Fetch widget data for all widgets in layout
            await fetchAllWidgetData(layoutRes.data.layout || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
            // Use default layout
            setLayout(getDefaultLayout());
        } finally {
            setLoading(false);
        }
    };

    const fetchAllWidgetData = async (currentLayout: WidgetConfig[]) => {
        const widgetIds = currentLayout.map(w => ({ id: w.i, config: w.config || {} }));

        if (widgetIds.length === 0) return;

        try {
            const res = await api.post('/dashboard/widget-data/batch/', {
                widgets: widgetIds
            });
            setWidgetData(res.data);
        } catch (error) {
            console.error('Failed to fetch widget data:', error);
        }
    };

    const getDefaultLayout = (): WidgetConfig[] => {
        return [
            { i: 'overview_stats', x: 0, y: 0, w: 12, h: 2, minW: 6, minH: 2 },
            { i: 'fee_trend_chart', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'attendance_heatmap', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'leaderboard_academic', x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'recent_activity', x: 4, y: 6, w: 8, h: 4, minW: 4, minH: 3 },
        ];
    };

    const handleLayoutChange = useCallback((newLayout: Layout[]) => {
        if (!editMode) return;

        const updatedLayout: WidgetConfig[] = newLayout.map(item => {
            const existing = layout.find(l => l.i === item.i);
            return {
                i: item.i,
                x: item.x,
                y: item.y,
                w: item.w,
                h: item.h,
                minW: existing?.minW,
                minH: existing?.minH,
                maxW: existing?.maxW,
                maxH: existing?.maxH,
                config: existing?.config
            };
        });

        setLayout(updatedLayout);
        setHasChanges(true);
    }, [editMode, layout]);

    const handleSaveLayout = async () => {
        try {
            setSaving(true);
            await api.post('/dashboard/layout/update_layout/', { layout });
            setHasChanges(false);
            setEditMode(false);
        } catch (error) {
            console.error('Failed to save layout:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleAddWidget = async (widgetId: string) => {
        try {
            const res = await api.post('/dashboard/layout/add_widget/', {
                widget_id: widgetId,
                x: 0,
                y: Math.max(...layout.map(w => w.y + w.h), 0)
            });

            setLayout(res.data.layout);
            setShowWidgetLibrary(false);
            setHasChanges(true);

            // Fetch data for new widget
            const widgetDataRes = await api.get(`/dashboard/widget-data/${widgetId}/`);
            setWidgetData(prev => ({ ...prev, [widgetId]: widgetDataRes.data }));
        } catch (error) {
            console.error('Failed to add widget:', error);
        }
    };

    const handleRemoveWidget = async (widgetId: string) => {
        const widget = widgets[widgetId];
        if (widget?.is_system) {
            alert('Cannot remove system widget');
            return;
        }

        try {
            await api.post('/dashboard/layout/remove_widget/', {
                widget_id: widgetId
            });

            setLayout(prev => prev.filter(w => w.i !== widgetId));
            setHasChanges(true);
        } catch (error) {
            console.error('Failed to remove widget:', error);
        }
    };

    const handleResetLayout = async () => {
        if (!confirm(t('dashboard.confirm_reset', { defaultValue: 'Reset dashboard to default layout?' }))) {
            return;
        }

        try {
            const res = await api.post('/dashboard/layout/reset_to_default/', {
                role_code: roleCode
            });

            setLayout(res.data.layout);
            await fetchAllWidgetData(res.data.layout);
            setHasChanges(false);
        } catch (error) {
            console.error('Failed to reset layout:', error);
        }
    };

    const handleRefreshWidget = async (widgetId: string) => {
        try {
            const config = layout.find(w => w.i === widgetId)?.config || {};
            const res = await api.get(`/dashboard/widget-data/${widgetId}/`, { params: config });
            setWidgetData(prev => ({ ...prev, [widgetId]: res.data }));
        } catch (error) {
            console.error(`Failed to refresh widget ${widgetId}:`, error);
        }
    };

    const handleRefreshAll = async () => {
        await fetchAllWidgetData(layout);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner">⏳</div>
                <p>{t('dashboard.loading', { defaultValue: 'Loading dashboard...' })}</p>
            </div>
        );
    }

    return (
        <div className="configurable-dashboard">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1 className="dashboard-title">
                        {t('dashboard.title', { defaultValue: 'Dashboard' })}
                    </h1>
                    <p className="dashboard-subtitle">
                        {t('dashboard.subtitle', { defaultValue: "Welcome back! Here's what's happening today." })}
                    </p>
                </div>

                <div className="header-actions">
                    <Button
                        variant="ghost"
                        iconLeft={RefreshCw}
                        onClick={handleRefreshAll}
                        size="sm"
                    >
                        {t('common.refresh', { defaultValue: 'Refresh' })}
                    </Button>

                    {!isParent && (
                        <>
                            {editMode ? (
                                <>
                                    <Button
                                        variant="ghost"
                                        iconLeft={X}
                                        onClick={() => {
                                            setEditMode(false);
                                            fetchDashboardData();
                                        }}
                                        size="sm"
                                    >
                                        {t('common.cancel', { defaultValue: 'Cancel' })}
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        iconLeft={LayoutGrid}
                                        onClick={handleResetLayout}
                                        size="sm"
                                    >
                                        {t('dashboard.reset', { defaultValue: 'Reset' })}
                                    </Button>

                                    <Button
                                        variant="primary"
                                        iconLeft={Plus}
                                        onClick={() => setShowWidgetLibrary(true)}
                                        size="sm"
                                    >
                                        {t('dashboard.add_widget', { defaultValue: 'Add Widget' })}
                                    </Button>

                                    {hasChanges && (
                                        <Button
                                            variant="primary"
                                            iconLeft={Save}
                                            onClick={handleSaveLayout}
                                            loading={saving}
                                            size="sm"
                                        >
                                            {t('common.save', { defaultValue: 'Save' })}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <Button
                                    variant="ghost"
                                    iconLeft={Settings}
                                    onClick={() => setEditMode(true)}
                                    size="sm"
                                >
                                    {t('dashboard.customize', { defaultValue: 'Customize' })}
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Edit Mode Banner */}
            {editMode && (
                <div className="edit-mode-banner">
                    <GripVertical size={16} />
                    <span>{t('dashboard.edit_mode_hint', { defaultValue: 'Drag widgets to rearrange • Resize from corners • Click widget menu for options' })}</span>
                </div>
            )}

            {/* Dashboard Grid */}
            <div className="dashboard-grid-container">
                {layout.length > 0 ? (
                    <ResponsiveGridLayout
                        layout={layout}
                        cols={12}
                        rowHeight={60}
                        onLayoutChange={handleLayoutChange}
                        isDraggable={editMode}
                        isResizable={editMode}
                        compactType="vertical"
                        preventCollision={false}
                        useCSSTransforms={true}
                        draggableHandle=".widget-drag-handle"
                    >
                        {layout.map(item => (
                            <div key={item.i} className={`grid-item ${selectedWidget === item.i ? 'selected' : ''}`}>
                                <div className="widget-container">
                                    {editMode && (
                                        <div className="widget-header">
                                            <div className="widget-drag-handle">
                                                <GripVertical size={14} />
                                            </div>
                                            <span className="widget-title">
                                                {widgets[item.i]?.name || item.i}
                                            </span>
                                            <div className="widget-actions">
                                                <button
                                                    className="widget-action-btn"
                                                    onClick={() => handleRefreshWidget(item.i)}
                                                    title="Refresh"
                                                >
                                                    <RefreshCw size={12} />
                                                </button>
                                                {!widgets[item.i]?.is_system && (
                                                    <button
                                                        className="widget-action-btn delete"
                                                        onClick={() => handleRemoveWidget(item.i)}
                                                        title="Remove"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    <div className="widget-content">
                                        <WidgetRenderer
                                            widgetId={item.i}
                                            config={item.config}
                                            data={widgetData[item.i]}
                                            onRefresh={() => handleRefreshWidget(item.i)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                ) : (
                    <div className="empty-dashboard">
                        <div className="empty-icon">📊</div>
                        <h3>{t('dashboard.empty_title', { defaultValue: 'No widgets added yet' })}</h3>
                        <p>{t('dashboard.empty_subtitle', { defaultValue: 'Click "Customize" to add widgets to your dashboard' })}</p>
                        {!isParent && (
                            <Button
                                variant="primary"
                                iconLeft={Plus}
                                onClick={() => {
                                    setEditMode(true);
                                    setShowWidgetLibrary(true);
                                }}
                            >
                                {t('dashboard.add_widget', { defaultValue: 'Add Widget' })}
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* Widget Library Modal */}
            {showWidgetLibrary && (
                <WidgetLibraryModal
                    currentWidgets={layout.map(w => w.i)}
                    onAdd={handleAddWidget}
                    onClose={() => setShowWidgetLibrary(false)}
                />
            )}
        </div>
    );
};

export default ConfigurableDashboard;
